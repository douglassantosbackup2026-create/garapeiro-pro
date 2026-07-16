import { describe, expect, it } from "vitest";
import { daysBetween, formatBRL, formatOSNumber, formatPhone } from "./format";

describe("formatBRL", () => {
  it("formata valores em reais", () => {
    expect(formatBRL(1234.5)).toMatch(/1\.234,50/);
    expect(formatBRL(0)).toMatch(/0,00/);
  });

  it("trata null como zero", () => {
    expect(formatBRL(null)).toMatch(/0,00/);
  });
});

describe("formatOSNumber", () => {
  it("preenche com zeros à esquerda", () => {
    expect(formatOSNumber(1)).toBe("#0001");
    expect(formatOSNumber(42)).toBe("#0042");
    expect(formatOSNumber(12345)).toBe("#12345");
  });
});

describe("formatPhone", () => {
  it("formata celular com 11 dígitos", () => {
    expect(formatPhone("11987654321")).toBe("(11) 98765-4321");
  });

  it("formata fixo com 10 dígitos", () => {
    expect(formatPhone("1133334444")).toBe("(11) 3333-4444");
  });
});

describe("daysBetween", () => {
  it("calcula dias entre datas", () => {
    const from = new Date("2026-01-01");
    const to = new Date("2026-01-11");
    expect(daysBetween(from, to)).toBe(10);
  });
});
