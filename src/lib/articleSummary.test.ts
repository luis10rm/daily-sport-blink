import { describe, expect, it } from "bun:test";
import { splitLeadingSummary } from "./articleSummary";

describe("splitLeadingSummary", () => {
  it("extracts heading and bullets at article start", () => {
    const r = splitLeadingSummary(
      "<p><strong>Najważniejsze w skrócie:</strong></p><ul><li>A</li></ul><p>Body</p>",
    );
    expect(r.heading).toBe("Najważniejsze w skrócie");
    expect(r.summaryHtml).toBe("<ul><li>A</li></ul>");
    expect(r.bodyHtml).toBe("<p>Body</p>");
  });
  it("leaves articles starting with a paragraph unchanged", () => {
    const html = "<p>Lead</p><ul><li>A</li></ul>";
    expect(splitLeadingSummary(html).summaryHtml).toBeNull();
  });
  it("does not treat 'Przeczytaj również' as summary", () => {
    const html = "<p><strong>Przeczytaj również:</strong></p><ul><li>A</li></ul>";
    expect(splitLeadingSummary(html).summaryHtml).toBeNull();
  });
});
