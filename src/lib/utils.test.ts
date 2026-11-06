import { describe, expect, it } from "bun:test";
import { generateSlug } from "./utils";

describe("generateSlug Polish transliteration", () => {
  it("maps every Polish diacritic in lowercase and uppercase", () => {
    expect(generateSlug("ąćęłńóśźż ĄĆĘŁŃÓŚŹŻ")).toBe("acelnoszz-acelnoszz");
  });

  it("keeps all letters in porażka and żegna", () => {
    expect(generateSlug("Porażka")).toBe("porazka");
    expect(generateSlug("Żegna")).toBe("zegna");
  });

  it("creates a readable slug from a full Polish title", () => {
    expect(generateSlug("Łódź: Świątek żegna Ćwiąkałę")).toBe("lodz-swiatek-zegna-cwiakale");
  });
});
