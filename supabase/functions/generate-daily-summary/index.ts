import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============= SECURITY: Authentication & Authorization =============

async function authenticateRequest(
  req: Request,
  requiredRoles: string[] = ["admin", "editor"]
): Promise<{ user: any; error?: Response }> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("Missing or invalid authorization header");
    return {
      user: null,
      error: new Response(
        JSON.stringify({ error: "Brak autoryzacji" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data, error: authError } = await supabase.auth.getClaims(token);

  if (authError || !data?.claims) {
    console.error("Invalid JWT token:", authError?.message);
    return {
      user: null,
      error: new Response(
        JSON.stringify({ error: "Nieprawidłowy token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }

  const userId = data.claims.sub;

  // Check user roles
  const { data: roles, error: rolesError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (rolesError) {
    console.error("Error fetching user roles:", rolesError.message);
    return {
      user: null,
      error: new Response(
        JSON.stringify({ error: "Błąd weryfikacji uprawnień" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }

  const userRoles = roles?.map((r) => r.role) || [];
  const hasAccess = userRoles.some((role) => requiredRoles.includes(role));

  if (!hasAccess) {
    console.error(`User ${userId} lacks required roles: ${requiredRoles.join(", ")}`);
    return {
      user: null,
      error: new Response(
        JSON.stringify({ error: "Brak wymaganych uprawnień (wymagana rola: admin lub editor)" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }

  console.log(`User ${userId} authenticated with roles: ${userRoles.join(", ")}`);
  return { user: { id: userId, roles: userRoles } };
}

const DEFAULT_SUMMARY_PROMPT = `Jesteś redaktorem sportowym Daily Sport Blink. Napisz profesjonalne podsumowanie dnia sportowego w języku polskim.

DANE WEJŚCIOWE:
Otrzymasz listę newsów opublikowanych danego dnia w formacie JSON (title, excerpt, category, id).

WYMAGANIA TREŚCI:
- Napisz artykuł o długości 1500-2500 słów
- Podziel na sekcje według kategorii sportowych (każda kategoria to osobny nagłówek H2)
- Każda sekcja: 2-4 akapity streszczające i analizujące newsy z tej kategorii
- Dodaj kontekst, analizę i opinie eksperta sportowego
- Ton: profesjonalny, angażujący, dziennikarski
- Rozpocznij od krótkiego wprowadzenia witającego czytelników
- Zakończ krótkim podsumowaniem i zapowiedzią kolejnego dnia

SEO:
- Tytuł: max 60 znaków, musi zawierać datę i główne sporty dnia
- Meta description (excerpt): max 155 znaków, zachęcający do przeczytania
- Naturalne użycie słów kluczowych sportowych
- Dla każdego wspomnianego newsa dodaj wewnętrzny link używając DOKŁADNEGO slugu z danych wejściowych (pole "slug"), w formacie: <a href="/blink/SLUG">tekst linku</a>
- NIGDY nie wymyślaj własnych slugów ani nie modyfikuj podanych — kopiuj slug dokładnie tak, jak pojawia się w danych

FORMATOWANIE (OBOWIĄZKOWE):
- Używaj TYLKO tagów HTML: <h2>, <p>, <strong>, <em>, <a href="/blink/SLUG">
- NIE używaj składni Markdown (**, *, #, ## itp.)
- Pogrubienia: <strong>tekst</strong>
- Kursywa: <em>tekst</em>
- Nagłówki sekcji: <h2>Nazwa kategorii</h2>
- Akapity: <p>treść</p>

STRUKTURA ODPOWIEDZI:
Odpowiedz w formacie JSON:
{
  "title": "Tytuł SEO (max 60 znaków)",
  "excerpt": "Meta description (max 155 znaków)",
  "content": "<p>Wprowadzenie...</p><h2>Piłka nożna</h2><p>Treść...</p>...",
  "suggested_tags": ["tag1", "tag2", "podsumowanie dnia"]
}`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ============= SECURITY: Authenticate user =============
    const { user, error: authError } = await authenticateRequest(req, ["admin", "editor"]);
    if (authError) return authError;

    const { date } = await req.json();

    if (!date) {
      return new Response(
        JSON.stringify({ error: "Date is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`User ${user.id} generating daily summary for date: ${date}`);

    // Initialize Supabase client with service role for data access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Calculate start and end of the selected day
    const selectedDate = new Date(date);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`Fetching posts between ${startOfDay.toISOString()} and ${endOfDay.toISOString()}`);

    // Fetch posts for the selected day
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select(`
        id,
        slug,
        title,
        excerpt,
        sport_category:category_id (
          name,
          slug
        )
      `)
      .gte("published_at", startOfDay.toISOString())
      .lte("published_at", endOfDay.toISOString())
      .order("published_at", { ascending: true });

    if (postsError) {
      console.error("Error fetching posts:", postsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch posts" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!posts || posts.length === 0) {
      return new Response(
        JSON.stringify({ error: "No posts found for this date", posts_count: 0 }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${posts.length} posts for the day`);

    // Try to fetch custom prompt from settings
    let summaryPrompt = DEFAULT_SUMMARY_PROMPT;
    const { data: promptSetting } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "daily_summary_prompt")
      .single();

    if (promptSetting?.value) {
      summaryPrompt = promptSetting.value;
      console.log("Using custom prompt from settings");

      // Ensure HTML formatting rules are present
      if (!summaryPrompt.includes("<strong>") && !summaryPrompt.includes("NIE używaj Markdown")) {
        summaryPrompt += `

FORMATOWANIE (OBOWIĄZKOWE):
- Używaj TYLKO tagów HTML: <h2>, <p>, <strong>, <em>, <a href="/blink/SLUG">
- NIE używaj składni Markdown (**, *, #, ## itp.)
- Pogrubienia: <strong>tekst</strong>
- Kursywa: <em>tekst</em>
- Linki wewnętrzne: używaj DOKŁADNEGO slugu z danych wejściowych, nie wymyślaj własnych`;
      }
    }

    // Prepare context for AI
    const postsContext = posts.map((p: any) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      category: p.sport_category?.name || "Inne",
    }));

    // Group posts by category for better context
    const postsByCategory: Record<string, any[]> = {};
    for (const post of postsContext) {
      const cat = post.category;
      if (!postsByCategory[cat]) {
        postsByCategory[cat] = [];
      }
      postsByCategory[cat].push(post);
    }

    const formattedDate = new Date(date).toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const userMessage = `Data: ${formattedDate}
Liczba newsów: ${posts.length}
Kategorie: ${Object.keys(postsByCategory).join(", ")}

NEWSY DO PODSUMOWANIA:
${JSON.stringify(postsContext, null, 2)}`;

    console.log("Calling Lovable AI...");

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: summaryPrompt },
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Zbyt wiele zapytań AI. Spróbuj ponownie za chwilę." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Brak kredytów AI. Doładuj konto w ustawieniach." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "AI generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;

    if (!aiContent) {
      console.error("No content in AI response");
      return new Response(
        JSON.stringify({ error: "AI returned empty response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("AI response received, parsing...");

    // Parse JSON from AI response
    let result;
    try {
      let jsonString = aiContent;
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonString = jsonMatch[1].trim();
      }
      // Remove control characters that break JSON parsing
      jsonString = jsonString.replace(/[\x00-\x1F\x7F]/g, (ch: string) => {
        if (ch === '\n' || ch === '\r' || ch === '\t') return ch;
        return '';
      });
      result = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      console.error("Raw response:", aiContent);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Safety check: convert any remaining Markdown to HTML
    if (result.content) {
      result.content = result.content
        .replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(?<![a-zA-Z0-9])\*([^*]+)\*(?![a-zA-Z0-9])/g, '<em>$1</em>');
    }

    // Add footer with generation info
    const footer = `<p style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid currentColor; opacity: 0.7; font-size: 0.875rem;"><em>Artykuł wygenerowany automatycznie na podstawie ${posts.length} newsów z dnia ${formattedDate}.</em></p>`;
    result.content = (result.content || "") + footer;

    // Ensure suggested_tags includes "podsumowanie dnia"
    if (!result.suggested_tags) {
      result.suggested_tags = [];
    }
    if (!result.suggested_tags.includes("podsumowanie dnia")) {
      result.suggested_tags.push("podsumowanie dnia");
    }

    console.log("Successfully generated daily summary");

    return new Response(
      JSON.stringify({
        ...result,
        posts_count: posts.length,
        date: date,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in generate-daily-summary:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
