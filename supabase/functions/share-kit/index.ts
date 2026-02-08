import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Not authenticated");

    const { kitId, share, displayMode } = await req.json();

    // Verify ownership
    const { data: kit, error: kitError } = await supabase
      .from("kits")
      .select("id, care_setting, tags")
      .eq("id", kitId)
      .single();

    if (kitError || !kit) throw new Error("Kit not found");

    if (share) {
      const { error } = await supabase.from("shared_kits").insert({
        kit_id: kitId,
        shared_by_user_id: user.id,
        display_mode: displayMode || "anonymous",
        public_tags: kit.tags || [],
        care_setting: kit.care_setting,
      });
      if (error) throw error;
    } else {
      const { error } = await supabase.from("shared_kits").delete().eq("kit_id", kitId);
      if (error) throw error;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("share-kit error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
