import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Copy, Printer, Copy as Duplicate, Loader2 } from "lucide-react";

interface Kit {
  id: string;
  category_slug: string;
  audience: string;
  tone: string;
  role: string;
  care_setting: string;
  tags: string[];
  letter_text: string;
  checklist_json: { section: string; items: string[] }[];
  explainer_text: string;
  created_at: string;
}

export default function KitViewer() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [kit, setKit] = useState<Kit | null>(null);
  const [loading, setLoading] = useState(true);
  const [shared, setShared] = useState(false);
  const [sharingLoading, setSharingLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function load() {
      const { data, error } = await supabase.from("kits").select("*").eq("id", id).single();
      if (error) {
        toast({ title: "Kit not found", variant: "destructive" });
        navigate("/me/kits");
        return;
      }
      setKit(data as unknown as Kit);

      const { data: sharedData } = await supabase.from("shared_kits").select("id").eq("kit_id", id).maybeSingle();
      setShared(!!sharedData);
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  }

  async function handlePrint() {
    window.print();
  }

  async function handleDuplicate() {
    if (!kit) return;
    try {
      const { data, error } = await supabase.functions.invoke("duplicate-kit", { body: { kitId: kit.id } });
      if (error) throw error;
      toast({ title: "Kit duplicated" });
      navigate(`/kit/${data.id}`);
    } catch (err: any) {
      toast({ title: "Failed to duplicate", description: err.message, variant: "destructive" });
    }
  }

  async function handleShareToggle(checked: boolean) {
    if (!kit) return;
    setSharingLoading(true);
    try {
      const { error } = await supabase.functions.invoke("share-kit", {
        body: { kitId: kit.id, share: checked, displayMode: "anonymous" },
      });
      if (error) throw error;
      setShared(checked);
      toast({ title: checked ? "Kit shared to community" : "Kit removed from community" });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setSharingLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="container py-12 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!kit) return null;

  return (
    <div className="container py-12 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Advocacy Kit</h1>
          <p className="text-sm text-muted-foreground">
            {kit.care_setting} · {kit.audience} · {new Date(kit.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={shared}
              onCheckedChange={handleShareToggle}
              disabled={sharingLoading}
            />
            <Label className="text-sm">Share to Community</Label>
          </div>
        </div>
      </div>

      <Tabs defaultValue="letter">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="letter">Letter</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="explainer">Explainer</TabsTrigger>
        </TabsList>
        <TabsContent value="letter">
          <Card>
            <CardContent className="pt-6 whitespace-pre-wrap text-sm">{kit.letter_text}</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="checklist">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {(kit.checklist_json as { section: string; items: string[] }[]).map((section, i) => (
                <div key={i}>
                  <h4 className="font-semibold text-sm mb-2">{section.section}</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    {section.items.map((item, j) => <li key={j}>{item}</li>)}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="explainer">
          <Card>
            <CardContent className="pt-6 whitespace-pre-wrap text-sm">{kit.explainer_text}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3 mt-6">
        <Button variant="outline" className="gap-2" onClick={() => handleCopy(kit.letter_text)}>
          <Copy className="h-4 w-4" /> Copy Letter
        </Button>
        <Button variant="outline" className="gap-2" onClick={handlePrint}>
          <Printer className="h-4 w-4" /> Print
        </Button>
        <Button variant="outline" className="gap-2" onClick={handleDuplicate}>
          <Duplicate className="h-4 w-4" /> Duplicate
        </Button>
      </div>
    </div>
  );
}
