import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { placeId } = await req.json();

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let query = serviceClient
      .from("reports")
      .select("tags, care_setting")
      .in("visibility", ["shared_anonymous", "shared_username"]);

    if (placeId) {
      query = query.eq("place_id", placeId);
    }

    const { data: reports, error } = await query;
    if (error) throw error;

    const tags: Record<string, number> = {};
    const care_settings: Record<string, number> = {};

    for (const r of reports || []) {
      for (const t of (r.tags as string[]) || []) {
        tags[t] = (tags[t] || 0) + 1;
      }
      care_settings[r.care_setting] = (care_settings[r.care_setting] || 0) + 1;
    }

    return new Response(JSON.stringify({
      tags,
      care_settings,
      total: reports?.length || 0,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("get-patterns error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
