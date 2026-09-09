import { supabase } from "@/integrations/supabase/client";

type AdClickInput = {
  adType: "patron" | "banner" | "wallpaper";
  adId?: string | null;
  variant?: string | null;
  targetUrl?: string | null;
};

/**
 * Fire-and-forget click logging for sponsored placements.
 * Never blocks or delays the actual navigation.
 */
export const logAdClick = ({ adType, adId, variant, targetUrl }: AdClickInput) => {
  try {
    const device =
      typeof window !== "undefined" && window.innerWidth < 768 ? "mobile" : "desktop";

    void supabase
      .from("ad_clicks")
      .insert({
        ad_type: adType,
        ad_id: adId ?? null,
        variant: variant ?? null,
        target_url: targetUrl ?? null,
        path: typeof window !== "undefined" ? window.location.pathname : null,
        device,
      })
      .then(({ error }) => {
        if (error) console.warn("ad click log failed", error.message);
      });
  } catch {
    // never break a sponsored click because of analytics
  }
};
