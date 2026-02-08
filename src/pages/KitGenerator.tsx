import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AUDIENCES, TONES, ROLES, CARE_SETTINGS, CHECKLIST_ITEMS } from "@/lib/constants";
import { Loader2, Save, FileWarning } from "lucide-react";

interface GeneratedKit {
  letter: string;
  checklist: { section: string; items: string[] }[];
  explainer: string;
}

export default function KitGenerator() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("");
  const [role, setRole] = useState("");
  const [careSetting, setCareSetting] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generated, setGenerated] = useState<GeneratedKit | null>(null);
  const [savedKitId, setSavedKitId] = useState<string | null>(null);

  const canGenerate = checkedItems.length > 0 && audience && tone && role && careSetting;

  async function handleGenerate() {
    if (!canGenerate) return;
    setGenerating(true);
    setGenerated(null);
    try {
      const { data, error } = await supabase.functions.invoke("generate-kit", {
        body: { checklist: checkedItems, audience, tone, role, careSetting },
      });
      if (error) throw error;
      setGenerated(data as GeneratedKit);
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!generated || !user) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("save-kit", {
        body: {
          category_slug: "risk_stratification",
          audience,
          tone,
          role,
          care_setting: careSetting,
          tags: checkedItems,
          letter_text: generated.letter,
          checklist_json: generated.checklist,
          explainer_text: generated.explainer,
        },
      });
      if (error) throw error;
      setSavedKitId(data.id);
      toast({ title: "Kit saved!" });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container py-12 max-w-3xl">
      <h1 className="text-3xl font-bold text-foreground mb-2">Generate Advocacy Kit</h1>
      <p className="text-muted-foreground mb-8">Tell us what happened and we'll create a personalized advocacy toolkit.</p>

      {/* Step 1: Checklist */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">What happened?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {CHECKLIST_ITEMS.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <Checkbox
                id={item.id}
                checked={checkedItems.includes(item.id)}
                onCheckedChange={(checked) =>
                  setCheckedItems((prev) =>
                    checked ? [...prev, item.id] : prev.filter((i) => i !== item.id)
                  )
                }
              />
              <Label htmlFor={item.id} className="text-sm cursor-pointer">{item.label}</Label>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Step 2: Options */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Customize your kit</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Audience</Label>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger><SelectValue placeholder="Select audience" /></SelectTrigger>
              <SelectContent>
                {AUDIENCES.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger><SelectValue placeholder="Select tone" /></SelectTrigger>
              <SelectContent>
                {TONES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Your Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Care Setting</Label>
            <Select value={careSetting} onValueChange={setCareSetting}>
              <SelectTrigger><SelectValue placeholder="Select setting" /></SelectTrigger>
              <SelectContent>
                {CARE_SETTINGS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleGenerate} disabled={!canGenerate || generating} className="w-full mb-8" size="lg">
        {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : "Generate Kit"}
      </Button>

      {/* Generated content */}
      {generated && (
        <div className="space-y-6">
          <Tabs defaultValue="letter">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="letter">Letter</TabsTrigger>
              <TabsTrigger value="checklist">Checklist</TabsTrigger>
              <TabsTrigger value="explainer">Explainer</TabsTrigger>
            </TabsList>
            <TabsContent value="letter">
              <Card>
                <CardContent className="pt-6 whitespace-pre-wrap text-sm">{generated.letter}</CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="checklist">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {generated.checklist.map((section, i) => (
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
                <CardContent className="pt-6 whitespace-pre-wrap text-sm">{generated.explainer}</CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving || !!savedKitId} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {savedKitId ? "Saved!" : "Save Kit"}
            </Button>
            {savedKitId && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => navigate(`/report?kitId=${savedKitId}`)}
              >
                <FileWarning className="h-4 w-4" />
                Report This Experience
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
