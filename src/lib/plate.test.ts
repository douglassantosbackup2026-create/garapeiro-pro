import { describe, expect, it } from "vitest";
import { formatPlate, isValidPlate, normalizePlate } from "./plate";

describe("normalizePlate", () => {
  it("remove caracteres inválidos e limita a 7", () => {
    expect(normalizePlate("abc-1d23")).toBe("ABC1D23");
    expect(normalizePlate("xyz-9999")).toBe("XYZ9999");
  });
});

describe("formatPlate", () => {
  it("insere hífen após 3 caracteres", () => {
    expect(formatPlate("ABC1D23")).toBe("ABC-1D23");
    expect(formatPlate("AB")).toBe("AB");
  });
});

describe("isValidPlate", () => {
  it("aceita padrão antigo e Mercosul", () => {
    expect(isValidPlate("ABC1234")).toBe(true);
    expect(isValidPlate("ABC1D23")).toBe(true);
    expect(isValidPlate("AB")).toBe(false);
    expect(isValidPlate("INVALID")).toBe(false);
  });
});
