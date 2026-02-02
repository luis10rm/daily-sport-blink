import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Base64URL encoding (RFC 4648)
function base64UrlEncode(data: Uint8Array | string): string {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function safeJsonParse(input: string): unknown {
  return JSON.parse(input);
}

function stripOuterQuotes(value: string): string {
  const v = value.trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

function looksLikeBase64(value: string): boolean {
  // very loose heuristic + length guard to avoid false positives
  return (
    value.length > 200 &&
    /^[A-Za-z0-9+/=]+$/.test(value) &&
    value.length % 4 === 0
  );
}

function decodeBase64ToString(b64: string): string {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function repairMultilinePrivateKeyJson(raw: string): string | null {
  // Common mistake: pasting JSON where private_key contains real newlines instead of \n.
  // Try to escape them so JSON.parse can succeed.
  if (!raw.trim().startsWith("{")) return null;
  if (!raw.includes('"private_key"')) return null;

  const re = /"private_key"\s*:\s*"([\s\S]*?)"\s*,/m;
  const match = raw.match(re);
  if (!match) return null;
  const pk = match[1];
  if (!pk.includes("\n")) return null;

  const escaped = pk.replace(/\r?\n/g, "\\n");
  return raw.replace(re, `"private_key": "${escaped}",`);
}

function parseServiceAccountKeyValue(raw: string): Record<string, string> | null {
  // Handles copy-pastes that look like TSV/lines: `type\t"service_account"` etc.
  const text = raw.trim();
  if (!text) return null;
  if (text.startsWith("{") || text.startsWith("[")) return null;
  if (!text.includes("service_account")) return null;

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const obj: Record<string, string> = {};
  for (const line of lines) {
    const idx = line.search(/\s/);
    if (idx <= 0) continue;
    const key = stripOuterQuotes(line.slice(0, idx).trim());
    let value = stripOuterQuotes(line.slice(idx).trim());
    // Normalize escaped newlines in private key if present
    value = value.replace(/\\n/g, "\n");
    obj[key] = value;
  }

  if (obj.type !== "service_account") return null;
  return obj;
}

function parseServiceAccount(raw: string): { client_email: string; private_key: string } {
  const trimmed = raw.trim();
  const candidates: string[] = [];

  // 1) as-is
  candidates.push(trimmed);

  // 2) repaired JSON with multiline private_key
  const repaired = repairMultilinePrivateKeyJson(trimmed);
  if (repaired) candidates.unshift(repaired);

  // 3) base64 encoded JSON
  const b64 = trimmed.replace(/\s/g, "");
  if (looksLikeBase64(b64)) {
    try {
      candidates.unshift(decodeBase64ToString(b64));
    } catch {
      // ignore
    }
  }

  // 4) JSON parse attempts (including JSON string containing JSON)
  for (const cand of candidates) {
    try {
      const parsed = safeJsonParse(cand);
      if (typeof parsed === "string") {
        const nested = safeJsonParse(parsed);
        if (nested && typeof nested === "object") {
          const sa = nested as any;
          if (sa.client_email && sa.private_key) return sa;
        }
      }
      if (parsed && typeof parsed === "object") {
        const sa = parsed as any;
        if (sa.client_email && sa.private_key) return sa;
      }
    } catch {
      // continue
    }
  }

  // 5) key-value fallback
  const kv = parseServiceAccountKeyValue(trimmed);
  if (kv && kv.client_email && kv.private_key) {
    return { client_email: kv.client_email, private_key: kv.private_key };
  }

  throw new Error(
    "Invalid GOOGLE_SERVICE_ACCOUNT_JSON: expected the full Google service-account JSON key (with braces)."
  );
}

// Convert PEM private key to CryptoKey for signing
async function importPrivateKey(pemKey: string): Promise<CryptoKey> {
  // Remove PEM header/footer and newlines
  const pemContents = pemKey
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "");
  
  // Decode base64 to ArrayBuffer
  const binaryString = atob(pemContents);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return await crypto.subtle.importKey(
    "pkcs8",
    bytes.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

// Generate JWT signed with RS256
async function createJWT(
  serviceAccountEmail: string,
  privateKey: string,
  scope: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  
  const header = {
    alg: "RS256",
    typ: "JWT",
  };
  
  const payload = {
    iss: serviceAccountEmail,
    scope: scope,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600, // 1 hour
  };
  
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  
  const key = await importPrivateKey(privateKey);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signatureInput)
  );
  
  const encodedSignature = base64UrlEncode(new Uint8Array(signature));
  
  return `${signatureInput}.${encodedSignature}`;
}

// Exchange JWT for Google OAuth access token
async function getAccessToken(jwt: string): Promise<string> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("OAuth error:", errorText);
    throw new Error(`Failed to get access token: ${response.status}`);
  }
  
  const data = await response.json();
  return data.access_token;
}

// Call Google Indexing API
async function notifyGoogleIndexing(
  accessToken: string,
  url: string,
  type: "URL_UPDATED" | "URL_DELETED"
): Promise<{ success: boolean; response?: any; error?: string }> {
  const response = await fetch(
    "https://indexing.googleapis.com/v3/urlNotifications:publish",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: url,
        type: type,
      }),
    }
  );
  
  const data = await response.json();
  
  if (!response.ok) {
    console.error("Indexing API error:", data);
    return {
      success: false,
      error: data.error?.message || `HTTP ${response.status}`,
    };
  }
  
  console.log("Indexing API response:", data);
  return { success: true, response: data };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claims?.claims) {
      console.error("JWT verification failed:", claimsError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claims.claims.sub as string;

    // Check if user is admin or editor
    const { data: hasRole, error: roleError } = await supabase.rpc("is_admin_or_editor", {
      _user_id: userId,
    });

    if (roleError || !hasRole) {
      console.error("Role check failed:", roleError);
      return new Response(
        JSON.stringify({ error: "Forbidden: Admin or Editor role required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { url, type = "URL_UPDATED" } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "Missing 'url' parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid URL format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate type
    if (type !== "URL_UPDATED" && type !== "URL_DELETED") {
      return new Response(
        JSON.stringify({ error: "Invalid type. Must be 'URL_UPDATED' or 'URL_DELETED'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Service Account credentials
    const serviceAccountJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
    if (!serviceAccountJson) {
      console.error("GOOGLE_SERVICE_ACCOUNT_JSON secret not configured");
      return new Response(
        JSON.stringify({ error: "Google Service Account not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let serviceAccount;
    try {
      serviceAccount = parseServiceAccount(serviceAccountJson);
    } catch (e) {
      console.error("Invalid Google service account secret:", e);
      return new Response(
        JSON.stringify({
          error:
            "Invalid service account configuration. Please paste the full JSON key file into the GOOGLE_SERVICE_ACCOUNT_JSON secret (not a table/copy).",
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing indexing request for URL: ${url}, type: ${type}`);
    console.log(`Using service account: ${serviceAccount.client_email}`);

    // Generate JWT and exchange for access token
    const jwt = await createJWT(
      serviceAccount.client_email,
      serviceAccount.private_key,
      "https://www.googleapis.com/auth/indexing"
    );

    const accessToken = await getAccessToken(jwt);
    console.log("Successfully obtained Google access token");

    // Call Indexing API
    const result = await notifyGoogleIndexing(accessToken, url, type);

    if (!result.success) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.error,
          message: `Failed to notify Google about ${url}` 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully notified Google Indexing API for: ${url}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Google has been notified about: ${url}`,
        details: result.response,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("notify-google-index error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
