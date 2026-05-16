import { describe, expect, it } from "vitest";
import { buildWhatsappUrl } from "./whatsapp";

describe("buildWhatsappUrl", () => {
  it("adiciona código 55 quando ausente", () => {
    const url = buildWhatsappUrl("11987654321", "Olá");
    expect(url).toContain("wa.me/5511987654321");
    expect(url).toContain(encodeURIComponent("Olá"));
  });

  it("preserva código 55 existente", () => {
    const url = buildWhatsappUrl("5511987654321", "Teste");
    expect(url).toContain("wa.me/5511987654321");
  });
});
