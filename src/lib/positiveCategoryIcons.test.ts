import { describe, expect, test } from "bun:test";
import { positiveCategoryIconName } from "./positiveCategoryIcons";

describe("positive category icons", () => {
  test("uses the editor's saved choice rather than the category default", () => {
    expect(positiveCategoryIconName({ slug: "nauka", icon_name: "Heart" })).toBe("Heart");
  });
  test("assigns distinct icons to categories without saved icons", () => {
    expect(positiveCategoryIconName({ slug: "nauka", icon_name: "" })).toBe("FlaskConical");
    expect(positiveCategoryIconName({ slug: "ekologia", icon_name: null })).toBe("Sprout");
    expect(positiveCategoryIconName({ slug: "technologia" })).toBe("Cpu");
    expect(positiveCategoryIconName({ slug: "tech" })).toBe("Cpu");
  });
  test("supports existing kebab-case icon names", () => {
    expect(positiveCategoryIconName({ icon_name: "hand-heart" })).toBe("HandHeart");
  });
  test("unknown categories have a positive fallback, not a sports trophy", () => {
    expect(positiveCategoryIconName(null)).toBe("Sun");
  });
});