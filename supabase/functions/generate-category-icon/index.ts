import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============= SECURITY: Authentication & Authorization =============

async function authenticateRequest(
  req: Request,
  requiredRoles: string[] = ["admin"]
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
        JSON.stringify({ error: "Brak wymaganych uprawnień (wymagana rola: admin)" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      ),
    };
  }

  console.log(`User ${userId} authenticated with roles: ${userRoles.join(", ")}`);
  return { user: { id: userId, roles: userRoles } };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ============= SECURITY: Authenticate user (admin only) =============
    const { user, error: authError } = await authenticateRequest(req, ["admin"]);
    if (authError) return authError;

    const { categoryName } = await req.json();

    if (!categoryName || typeof categoryName !== "string") {
      return new Response(
        JSON.stringify({ error: "Nazwa kategorii jest wymagana" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Brak konfiguracji API" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build strict style prompt for consistent Lucide-like icons
    const prompt = `Generate a simple icon for the sport/activity: "${categoryName}"

CRITICAL REQUIREMENTS - MUST FOLLOW EXACTLY:
1. TRANSPARENT BACKGROUND - The background MUST be completely transparent (alpha = 0). No colored background, no white background, no gray background. ONLY transparency.

2. WHITE COLOR ONLY - Use ONLY pure white color (#FFFFFF) for all lines and shapes. No other colors allowed.

3. LINE ART STYLE - Draw using thin strokes/outlines only (like SVG stroke), NOT filled shapes. Similar to Lucide icons or Feather icons.

4. STROKE WIDTH - Use consistent 2px stroke width throughout the icon.

5. SIMPLE GEOMETRY - Use basic geometric shapes: circles, lines, rectangles, arcs. Maximum 5-10 shapes total.

6. SIZE - Design for 64x64 pixel display. Keep the icon centered with small padding.

7. SINGLE OBJECT - Show only ONE recognizable symbol representing the sport. No text, no multiple objects, no decorative elements.

DO NOT:
- Add any background color
- Use gradients or shadows
- Use filled shapes (use outlines only)
- Add text or labels
- Use colors other than white
- Make complex detailed illustrations

EXAMPLES OF CORRECT STYLE:
- Football/Soccer: Simple circle outline
- Tennis: Circle with crossed lines
- Basketball: Circle with curved lines
- Boxing: Two rectangular glove outlines

OUTPUT: PNG image with transparent background and white stroke-based icon.`;

    console.log(`User ${user.id} generating icon for category: ${categoryName}`);

    // Call Lovable AI Gateway with image generation model
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      console.error(`AI Gateway error: ${status}`);

      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Zbyt wiele żądań. Spróbuj ponownie za chwilę." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "Brak kredytów AI. Doładuj konto aby kontynuować." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const errorText = await aiResponse.text();
      console.error("AI Gateway error response:", errorText);
      return new Response(
        JSON.stringify({ error: "Błąd generowania ikony" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    console.log("AI response received");

    // Extract base64 image from response
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      console.error("No image in AI response:", JSON.stringify(aiData));
      return new Response(
        JSON.stringify({ error: "AI nie wygenerowało obrazu. Spróbuj ponownie." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract base64 data (remove data:image/png;base64, prefix if present)
    const base64Match = imageData.match(/^data:image\/\w+;base64,(.+)$/);
    const base64Data = base64Match ? base64Match[1] : imageData;

    // Decode base64 to Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate filename with slug and timestamp
    const slug = categoryName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const timestamp = Date.now();
    const fileName = `ai-generated/${slug}-${timestamp}.png`;

    console.log(`Uploading to: ${fileName}`);

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("category-icons")
      .upload(fileName, bytes, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Nie udało się zapisać ikony. Spróbuj ponownie." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("category-icons")
      .getPublicUrl(fileName);

    console.log(`Icon generated successfully: ${publicUrlData.publicUrl}`);

    return new Response(
      JSON.stringify({ iconUrl: publicUrlData.publicUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Wystąpił nieoczekiwany błąd" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
