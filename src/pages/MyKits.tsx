import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Eye, Copy, Trash2, Share2, Loader2 } from "lucide-react";

interface Kit {
  id: string;
  category_slug: string;
  audience: string;
  care_setting: string;
  tags: string[];
  created_at: string;
}

export default function MyKits() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharedKitIds, setSharedKitIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadKits();
  }, [user]);

  async function loadKits() {
    if (!user) return;
    const { data, error } = await supabase
      .from("kits")
      .select("id, category_slug, audience, care_setting, tags, created_at")
      .order("created_at", { ascending: false });
    if (data) setKits(data as unknown as Kit[]);

    const { data: shared } = await supabase.from("shared_kits").select("kit_id");
    if (shared) setSharedKitIds(new Set(shared.map((s: any) => s.kit_id)));
    setLoading(false);
  }

  async function handleDelete(kitId: string) {
    if (!confirm("Delete this kit?")) return;
    const { error } = await supabase.from("kits").delete().eq("id", kitId);
    if (error) {
      toast({ title: "Delete failed", variant: "destructive" });
    } else {
      setKits((prev) => prev.filter((k) => k.id !== kitId));
      toast({ title: "Kit deleted" });
    }
  }

  async function handleDuplicate(kitId: string) {
    try {
      const { data, error } = await supabase.functions.invoke("duplicate-kit", { body: { kitId } });
      if (error) throw error;
      toast({ title: "Kit duplicated" });
      loadKits();
    } catch {
      toast({ title: "Duplicate failed", variant: "destructive" });
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-foreground">My Kits</h1>
        <Link to="/kit/new">
          <Button>Generate New Kit</Button>
        </Link>
      </div>

      {kits.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>You haven't created any kits yet.</p>
            <Link to="/kit/new" className="text-primary underline mt-2 inline-block">Generate your first kit</Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Care Setting</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kits.map((kit) => (
                <TableRow key={kit.id}>
                  <TableCell className="text-sm">{new Date(kit.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-sm">{kit.category_slug}</TableCell>
                  <TableCell className="text-sm">{kit.audience}</TableCell>
                  <TableCell className="text-sm">{kit.care_setting}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {kit.tags.slice(0, 2).map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                      ))}
                      {kit.tags.length > 2 && <Badge variant="secondary" className="text-xs">+{kit.tags.length - 2}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button size="icon" variant="ghost" onClick={() => navigate(`/kit/${kit.id}`)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDuplicate(kit.id)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(kit.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {sharedKitIds.has(kit.id) && (
                        <Share2 className="h-4 w-4 text-primary mt-2" />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
