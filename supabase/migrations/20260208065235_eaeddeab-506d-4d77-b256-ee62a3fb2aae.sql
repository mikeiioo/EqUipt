
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role helper
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Kits table
CREATE TABLE public.kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_slug TEXT NOT NULL,
  audience TEXT NOT NULL,
  tone TEXT NOT NULL,
  role TEXT NOT NULL,
  care_setting TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  letter_text TEXT NOT NULL DEFAULT '',
  checklist_json JSONB NOT NULL DEFAULT '[]',
  explainer_text TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.kits ENABLE ROW LEVEL SECURITY;

-- Shared kits table
CREATE TABLE public.shared_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id UUID NOT NULL REFERENCES public.kits(id) ON DELETE CASCADE,
  shared_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_mode TEXT NOT NULL DEFAULT 'anonymous' CHECK (display_mode IN ('anonymous', 'username')),
  public_tags TEXT[] NOT NULL DEFAULT '{}',
  care_setting TEXT NOT NULL,
  location_bucket TEXT,
  shared_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (kit_id)
);
ALTER TABLE public.shared_kits ENABLE ROW LEVEL SECURITY;

-- Reports table
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  kit_id UUID REFERENCES public.kits(id) ON DELETE SET NULL,
  care_setting TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  place_id TEXT,
  place_name TEXT,
  location_bucket TEXT,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'shared_anonymous', 'shared_username')),
  short_text TEXT CHECK (char_length(short_text) <= 280),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: Profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS: User roles (admin only manage, users read own)
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- RLS: Kits (owner-only)
CREATE POLICY "Kit owner can select" ON public.kits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Kit owner can insert" ON public.kits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Kit owner can update" ON public.kits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Kit owner can delete" ON public.kits FOR DELETE USING (auth.uid() = user_id);

-- RLS: Shared kits (public read, owner insert/delete)
CREATE POLICY "Anyone can view shared kits" ON public.shared_kits FOR SELECT USING (true);
CREATE POLICY "Kit owner can share" ON public.shared_kits FOR INSERT WITH CHECK (
  auth.uid() = shared_by_user_id AND
  EXISTS (SELECT 1 FROM public.kits WHERE id = kit_id AND user_id = auth.uid())
);
CREATE POLICY "Kit owner can unshare" ON public.shared_kits FOR DELETE USING (
  auth.uid() = shared_by_user_id
);

-- RLS: Reports (authenticated insert, owner read)
CREATE POLICY "Users can insert reports" ON public.reports FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL)
);
CREATE POLICY "Users can read own reports" ON public.reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reports" ON public.reports FOR DELETE USING (auth.uid() = user_id);
