import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { AUDIENCES, CARE_SETTINGS } from "@/lib/constants";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface SharedKit {
  id: string;
  kit_id: string;
  display_mode: string;
  public_tags: string[];
  care_setting: string;
  shared_at: string;
  kits: {
    letter_text: string;
    audience: string;
    explainer_text: string;
  };
  profiles: {
    display_name: string;
  } | null;
}

export default function Library() {
  const [kits, setKits] = useState<SharedKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCare, setFilterCare] = useState("all");
  const [filterAudience, setFilterAudience] = useState("all");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadLibrary();
  }, []);

  async function loadLibrary() {
    const { data, error } = await supabase
      .from("shared_kits")
      .select("id, kit_id, display_mode, public_tags, care_setting, shared_at, kits(letter_text, audience, explainer_text), profiles:shared_by_user_id(display_name)")
      .order("shared_at", { ascending: false });
    if (data) setKits(data as unknown as SharedKit[]);
    setLoading(false);
  }

  const filtered = kits.filter((k) => {
    if (filterCare !== "all" && k.care_setting !== filterCare) return false;
    if (filterAudience !== "all" && k.kits?.audience !== filterAudience) return false;
    return true;
  });

  async function handleUseTemplate(kit: SharedKit) {
    if (!user) {
      navigate("/auth");
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("duplicate-kit", { body: { kitId: kit.kit_id } });
      if (error) throw error;
      toast({ title: "Template copied to your kits" });
      navigate(`/kit/${data.id}`);
    } catch {
      toast({ title: "Failed to use template", variant: "destructive" });
    }
  }

  if (loading) {
    return (
      <div className="container py-12 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container py-12 max-w-5xl">
      <h1 className="text-3xl font-bold text-foreground mb-2">Community Library</h1>
      <p className="text-muted-foreground mb-8">Browse advocacy kits shared by the community.</p>

      {/* Filters */}
      <div className="flex gap-4 mb-8 flex-wrap">
        <div className="space-y-1">
          <Label className="text-xs">Care Setting</Label>
          <Select value={filterCare} onValueChange={setFilterCare}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Settings</SelectItem>
              {CARE_SETTINGS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Audience</Label>
          <Select value={filterAudience} onValueChange={setFilterAudience}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Audiences</SelectItem>
              {AUDIENCES.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No shared kits found matching your filters.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((kit) => (
            <Card key={kit.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{kit.care_setting}</CardTitle>
                    <CardDescription className="text-xs">
                      {kit.display_mode === "username" && kit.profiles?.display_name
                        ? `Shared by ${kit.profiles.display_name}`
                        : "Shared anonymously"}
                      {" · "}{new Date(kit.shared_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                  {kit.kits?.letter_text?.slice(0, 200)}...
                </p>
                <div className="flex gap-1 flex-wrap mb-4">
                  {kit.public_tags.map((t) => (
                    <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => navigate(`/kit/${kit.kit_id}`)}>
                    View Kit
                  </Button>
                  <Button size="sm" onClick={() => handleUseTemplate(kit)}>
                    Use as Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
