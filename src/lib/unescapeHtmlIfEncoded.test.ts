import { describe, expect, it } from "bun:test";
import { sanitizePastedHtml, stripLeadingSeoTitle } from "./unescapeHtmlIfEncoded";

describe("stripLeadingSeoTitle", () => {
  it("removes the SEO title but preserves the real lead in the same paragraph", () => {
    const input = "<p>[Piłka nożna] Ronaldo: Koniec w kadrze Portugalii | Szortsy.pl Ronaldo pożegnał się z kibicami.</p><p>Następny akapit.</p>";
    expect(stripLeadingSeoTitle(input)).toBe("<p>Ronaldo pożegnał się z kibicami.</p><p>Następny akapit.</p>");
  });

  it("removes a standalone SEO title paragraph", () => {
    const input = "<p>[Tenis] Świątek: Finał w Paryżu | Szortsy.pl</p><p>Iga Świątek wygrała półfinał.</p>";
    expect(stripLeadingSeoTitle(input)).toBe("<p>Iga Świątek wygrała półfinał.</p>");
  });

  it("does not remove a similar line later in the article", () => {
    const input = "<p>Właściwy lead.</p><p>[Piłka nożna] Ronaldo: Koniec w kadrze Portugalii | Szortsy.pl</p>";
    expect(stripLeadingSeoTitle(input)).toBe(input);
  });

  it("cleans encoded HTML during the normal display pipeline", () => {
    const input = "&lt;p&gt;[Piłka nożna] Ronaldo: Koniec w kadrze Portugalii | Szortsy.pl Właściwy lead.&lt;/p&gt;";
    expect(sanitizePastedHtml(input)).toBe("<p>Właściwy lead.</p>");
  });
});
