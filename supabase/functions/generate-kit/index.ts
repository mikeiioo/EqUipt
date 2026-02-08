import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { checklist, audience, tone, role, careSetting } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const checklistText = checklist.map((c: string) => c.replace(/_/g, " ")).join(", ");

    const systemPrompt = `You are an expert healthcare advocacy assistant. You help patients, caregivers, and advocates write professional, non-accusatory communications about algorithmic decision-making in healthcare.

RULES:
- Never name specific institutions, vendors, or individuals
- Never claim wrongdoing or discrimination
- Focus on requesting transparency and audit of algorithmic processes
- Be professional and constructive
- Use plain language accessible to non-experts

You must return a JSON object with exactly these fields:
- "letter": A professional audit request letter (500-800 words)
- "checklist": An array of objects with "section" (string) and "items" (string array) — grouped action steps
- "explainer": A plain-language one-page explainer about algorithmic risk stratification (300-500 words)`;

    const userPrompt = `Generate an advocacy kit for:
- What happened: ${checklistText}
- Audience: ${audience.replace(/_/g, " ")}
- Tone: ${tone}
- Role: ${role}
- Care setting: ${careSetting.replace(/_/g, " ")}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_advocacy_kit",
              description: "Generate a complete advocacy kit with letter, checklist, and explainer",
              parameters: {
                type: "object",
                properties: {
                  letter: { type: "string", description: "Professional audit request letter" },
                  checklist: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        section: { type: "string" },
                        items: { type: "array", items: { type: "string" } },
                      },
                      required: ["section", "items"],
                    },
                  },
                  explainer: { type: "string", description: "Plain-language explainer" },
                },
                required: ["letter", "checklist", "explainer"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_advocacy_kit" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI generation failed");
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-kit error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
