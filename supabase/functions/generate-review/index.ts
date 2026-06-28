import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function authenticate(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: new Response(JSON.stringify({ error: "Brak autoryzacji" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }) };
  }
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data, error } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
  if (error || !data?.claims) {
    return { error: new Response(JSON.stringify({ error: "Nieprawidłowy token" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }) };
  }
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.claims.sub);
  const hasAccess = (roles ?? []).some((r: any) => ["admin", "editor"].includes(r.role));
  if (!hasAccess) {
    return { error: new Response(JSON.stringify({ error: "Brak uprawnień" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }) };
  }
  return { ok: true };
}

const SYSTEM_PROMPT = `Jesteś doświadczonym recenzentem technologii dla polskiego portalu "Szortsy Recki". Piszesz uczciwe, konkretne i rzeczowe recenzje produktów (sprzęt, gadżety, aplikacje, gry).

Zawsze zwracaj WYŁĄCZNIE poprawny JSON o strukturze:
{
  "title": "Tytuł recenzji (max 80 zn., konkretny, z nazwą produktu)",
  "product_brand": "Marka",
  "product_name": "Nazwa produktu",
  "excerpt": "1-2 zdania wprowadzenia (max 200 zn.)",
  "verdict": "2-4 zdania werdyktu — komu polecasz, komu nie",
  "score": 7.5,
  "pros": ["3-6 konkretnych plusów"],
  "cons": ["2-5 konkretnych minusów"],
  "content": "<p>HTML treści recenzji 600-1200 słów. Używaj <h2>, <h3>, <p>, <ul>, <li>, <strong>. Sekcje: Wprowadzenie, Wykonanie, Wydajność, Codzienne użytkowanie, Cena. NIE dodawaj nagłówków 'Plusy', 'Minusy', 'Werdykt' — to osobne pola.</strong>"
}

Reguły:
- Pisz po polsku, naturalnie, bez marketingowego bełkotu.
- Ocena 1-10 (krok 0.5). Skala: 9+ wybitny, 8 świetny, 7 dobry, 6 średni, 5 słaby.
- Bez halucynacji cen — pisz "około X zł" tylko jeśli to znany produkt.
- Nie używaj emoji w polu content.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = await authenticate(req);
    if (auth.error) return auth.error;

    const { product, category } = await req.json();
    if (!product || typeof product !== "string") {
      return new Response(JSON.stringify({ error: "Brak parametru 'product'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `Napisz recenzję: ${product}${category ? ` (kategoria: ${category})` : ""}.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      const text = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, text);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limit zapytań AI — spróbuj za chwilę." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Brak środków na AI w workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error ${aiResponse.status}`);
    }

    const aiJson = await aiResponse.json();
    const raw = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try {
      parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch (e) {
      console.error("Failed to parse AI JSON:", raw);
      throw new Error("AI zwróciło niepoprawny JSON");
    }

    // Sanity defaults
    parsed.pros = Array.isArray(parsed.pros) ? parsed.pros : [];
    parsed.cons = Array.isArray(parsed.cons) ? parsed.cons : [];
    if (typeof parsed.score === "string") parsed.score = parseFloat(parsed.score);
    if (typeof parsed.score === "number") parsed.score = Math.max(0, Math.min(10, parsed.score));

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-review error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
