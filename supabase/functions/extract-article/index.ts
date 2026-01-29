import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple HTML text extraction - removes tags and gets text content
function extractTextFromHtml(html: string): string {
  // Remove script and style elements
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "");
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "");
  text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "");
  text = text.replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "");
  
  // Try to extract article content if available
  const articleMatch = text.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch) {
    text = articleMatch[1];
  } else {
    // Try main content
    const mainMatch = text.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    if (mainMatch) {
      text = mainMatch[1];
    }
  }
  
  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, " ");
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  
  // Clean up whitespace
  text = text.replace(/\s+/g, " ").trim();
  
  // Limit to first ~6000 characters to allow for content generation
  return text.slice(0, 6000);
}

// Extract Open Graph image from HTML
function extractOgImage(html: string): string | null {
  const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
  if (ogImageMatch) {
    return ogImageMatch[1];
  }
  
  // Try alternative format
  const altMatch = html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  if (altMatch) {
    return altMatch[1];
  }
  
  return null;
}

// Default prompts
const DEFAULT_EXTRACTION_PROMPT = `Jesteś asystentem redakcji sportowej Daily Sport Blink. Na podstawie podanego artykułu wygeneruj dane do publikacji.

ZASADY:
1. Tytuł: max 80 znaków, chwytliwy, po polsku, bez clickbaitu
2. Excerpt: max 200 znaków, zachęcający do kliknięcia, streszczający główną myśl
3. Kategoria: wybierz JEDNĄ z: football, basketball, tennis, f1, mma, other
4. Tagi: 3-5 krótkich słów kluczowych (bez #), po polsku

Odpowiedz w formacie JSON zgodnym ze schematem.`;

const DEFAULT_CONTENT_PROMPT = `Na podstawie oryginalnego artykułu napisz unikatową, skróconą wersję newsa sportowego w języku polskim.

ZASADY TREŚCI:
- 300-500 słów
- Prosty, angażujący język
- Wszystkie kluczowe fakty z oryginału
- Dynamiczny, dziennikarski ton
- 3-5 akapitów (każdy 2-4 zdania)
- Bez powtarzania tytułu na początku

FORMATOWANIE (OBOWIĄZKOWE):
- Używaj TYLKO tagów HTML, NIE składni Markdown!
- <strong>tekst</strong> dla pogrubienia (NIE ** **)
- <em>tekst</em> dla kursywy (NIE * *)
- Każdy akapit otocz tagiem <p>...</p>
- Oddzielaj akapity pustą linią dla czytelności`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Extracting article from URL:", url);

    // Fetch the article HTML
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; DailySportBot/1.0)",
        "Accept": "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch URL:", response.status);
      return new Response(
        JSON.stringify({ error: `Failed to fetch URL: ${response.status}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const html = await response.text();
    const articleText = extractTextFromHtml(html);
    const ogImage = extractOgImage(html);

    console.log("Extracted text length:", articleText.length);
    console.log("Found OG image:", ogImage);

    // Get prompts from database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch both prompts in parallel
    const [extractionPromptResult, contentPromptResult] = await Promise.all([
      supabase.from("settings").select("value").eq("key", "article_extraction_prompt").single(),
      supabase.from("settings").select("value").eq("key", "article_content_prompt").single(),
    ]);

    const extractionPrompt = extractionPromptResult.data?.value || DEFAULT_EXTRACTION_PROMPT;
    
    // For content prompt, always enforce HTML formatting rules
    let contentPrompt = contentPromptResult.data?.value || DEFAULT_CONTENT_PROMPT;
    
    // If custom prompt doesn't mention HTML formatting rules, append them
    const hasHtmlRules = contentPrompt.includes("<strong>") || 
                         contentPrompt.includes("NIE używaj Markdown") ||
                         contentPrompt.includes("NIE składni Markdown") ||
                         contentPrompt.includes("TYLKO tagów HTML");
    
    if (!hasHtmlRules) {
      const htmlFormattingRules = `

FORMATOWANIE (OBOWIĄZKOWE):
- Używaj TYLKO tagów HTML, NIE składni Markdown!
- <strong>tekst</strong> dla pogrubienia (NIE ** **)
- <em>tekst</em> dla kursywy (NIE * *)
- Każdy akapit otocz tagiem <p>...</p>`;
      
      contentPrompt = contentPrompt + htmlFormattingRules;
      console.log("Appended HTML formatting rules to content prompt");
    }

    console.log("Using prompts from settings");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Step 1: Extract metadata (title, excerpt, category, tags)
    const metadataResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: extractionPrompt },
          { role: "user", content: `Przeanalizuj ten artykuł i wygeneruj dane:\n\n${articleText}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_article_data",
              description: "Ekstraktuj dane z artykułu sportowego",
              parameters: {
                type: "object",
                properties: {
                  title: { 
                    type: "string", 
                    description: "Tytuł artykułu (max 80 znaków, po polsku)" 
                  },
                  excerpt: { 
                    type: "string", 
                    description: "Krótki opis (max 200 znaków, zachęcający)" 
                  },
                  category: { 
                    type: "string", 
                    enum: ["football", "basketball", "tennis", "f1", "mma", "other"],
                    description: "Kategoria sportowa"
                  },
                  tags: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "3-5 tagów (krótkie słowa kluczowe)"
                  },
                },
                required: ["title", "excerpt", "category", "tags"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_article_data" } },
      }),
    });

    if (!metadataResponse.ok) {
      if (metadataResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (metadataResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await metadataResponse.text();
      console.error("AI Gateway error (metadata):", metadataResponse.status, errorText);
      throw new Error(`AI Gateway error: ${metadataResponse.status}`);
    }

    const metadataData = await metadataResponse.json();
    const metadataToolCall = metadataData.choices?.[0]?.message?.tool_calls?.[0];
    if (!metadataToolCall || metadataToolCall.function.name !== "extract_article_data") {
      throw new Error("Invalid AI response format for metadata");
    }

    const extractedMetadata = JSON.parse(metadataToolCall.function.arguments);
    console.log("Extracted metadata:", extractedMetadata);

    // Step 2: Generate full article content
    const contentResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: contentPrompt },
          { 
            role: "user", 
            content: `Tytuł: ${extractedMetadata.title}\n\nOryginalny artykuł:\n${articleText}` 
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_article_content",
              description: "Wygeneruj pełną treść artykułu sportowego",
              parameters: {
                type: "object",
                properties: {
                  content: { 
                    type: "string", 
                    description: "Pełna treść artykułu (300-500 słów, po polsku, podzielona na akapity)" 
                  },
                },
                required: ["content"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_article_content" } },
      }),
    });

    let generatedContent = "";
    
    if (contentResponse.ok) {
      const contentData = await contentResponse.json();
      const contentToolCall = contentData.choices?.[0]?.message?.tool_calls?.[0];
      if (contentToolCall && contentToolCall.function.name === "generate_article_content") {
        const contentResult = JSON.parse(contentToolCall.function.arguments);
        generatedContent = contentResult.content || "";
        console.log("Generated content length:", generatedContent.length);
        
        // Safety check: if AI still used Markdown despite instructions, convert it
        if (generatedContent.includes("**")) {
          console.warn("AI used Markdown despite HTML instructions, converting...");
          // Convert **text** to <strong>text</strong>
          generatedContent = generatedContent.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
          generatedContent = generatedContent.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
          generatedContent = generatedContent.replace(/(?<![a-zA-Z0-9])\*([^*]+)\*(?![a-zA-Z0-9])/g, '<em>$1</em>');
        }
      }
    } else {
      console.error("Content generation failed, continuing without content");
    }

    // Combine results
    const result = {
      ...extractedMetadata,
      content: generatedContent,
      og_image: ogImage,
    };

    console.log("Extraction complete:", {
      ...result,
      content: result.content ? `${result.content.substring(0, 100)}...` : null,
    });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in extract-article:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
