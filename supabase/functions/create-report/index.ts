import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PHI_PATTERNS = [
  /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}/,
  /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/,
  /\d{3}-\d{2}-\d{4}/,
  /MRN\s*[:#]?\s*\d+/i,
  /DOB\s*[:#]?\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/i,
];

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

    const body = await req.json();

    // PHI check on short_text
    if (body.short_text) {
      for (const pattern of PHI_PATTERNS) {
        if (pattern.test(body.short_text)) {
          return new Response(JSON.stringify({ error: "Text contains potential personal health information. Please remove it." }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      if (body.short_text.length > 280) {
        return new Response(JSON.stringify({ error: "Text exceeds 280 characters." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { error } = await supabase.from("reports").insert({
      user_id: user.id,
      kit_id: body.kit_id || null,
      care_setting: body.care_setting,
      tags: body.tags,
      place_id: body.place_id || null,
      place_name: body.place_name || null,
      location_bucket: body.location_bucket || null,
      visibility: body.visibility,
      short_text: body.short_text || null,
    });

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
