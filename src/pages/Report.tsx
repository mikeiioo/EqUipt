import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CARE_SETTINGS, REPORT_TAGS, VISIBILITIES, containsPHI } from "@/lib/constants";
import { Loader2, AlertTriangle } from "lucide-react";

export default function Report() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const prefillKitId = searchParams.get("kitId") || "";
  const prefillPlaceId = searchParams.get("placeId") || "";
  const prefillPlaceName = searchParams.get("placeName") || "";

  const [careSetting, setCareSetting] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState("private");
  const [shortText, setShortText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [phiWarning, setPhiWarning] = useState(false);

  function handleTextChange(value: string) {
    if (value.length > 280) return;
    setShortText(value);
    setPhiWarning(containsPHI(value));
  }

  async function handleSubmit() {
    if (!careSetting || tags.length === 0) {
      toast({ title: "Please fill required fields", variant: "destructive" });
      return;
    }
    if (phiWarning) {
      toast({ title: "Please remove personal health information", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("create-report", {
        body: {
          care_setting: careSetting,
          tags,
          visibility,
          short_text: shortText || null,
          kit_id: prefillKitId || null,
          place_id: prefillPlaceId || null,
          place_name: prefillPlaceName || null,
        },
      });
      if (error) throw error;
      toast({ title: "Report submitted. Thank you." });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Submit failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container py-12 max-w-2xl">
      <h1 className="text-3xl font-bold text-foreground mb-2">Report an Experience</h1>
      <p className="text-muted-foreground mb-8">
        Your report helps identify patterns. All reports are structured — no personal names or accusations.
      </p>

      {prefillPlaceName && (
        <Card className="mb-6 bg-accent/30">
          <CardContent className="py-3 text-sm">
            Reporting about: <strong>{prefillPlaceName}</strong>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Report Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Care Setting *</Label>
            <Select value={careSetting} onValueChange={setCareSetting}>
              <SelectTrigger><SelectValue placeholder="Select care setting" /></SelectTrigger>
              <SelectContent>
                {CARE_SETTINGS.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>What happened? (select all that apply) *</Label>
            {REPORT_TAGS.map((tag) => (
              <div key={tag} className="flex items-center gap-3">
                <Checkbox
                  id={`tag-${tag}`}
                  checked={tags.includes(tag)}
                  onCheckedChange={(checked) =>
                    setTags((prev) => checked ? [...prev, tag] : prev.filter((t) => t !== tag))
                  }
                />
                <Label htmlFor={`tag-${tag}`} className="text-sm cursor-pointer">
                  {tag.replace(/_/g, " ")}
                </Label>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select value={visibility} onValueChange={setVisibility}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {VISIBILITIES.map((v) => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Additional context (optional, max 280 characters)</Label>
            <Textarea
              value={shortText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Brief description of your experience..."
              maxLength={280}
              rows={3}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">{shortText.length}/280</p>
              {phiWarning && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Potential personal information detected. Please remove it.
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
              ⚠️ Do not include names of individuals, email addresses, phone numbers, medical record numbers, or dates of birth.
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSubmit} disabled={submitting} className="w-full" size="lg">
        {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : "Submit Report"}
      </Button>
    </div>
  );
}
