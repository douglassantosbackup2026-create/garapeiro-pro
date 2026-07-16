const OLD_RE = /^[A-Z]{3}[0-9]{4}$/;
const MERCOSUL_RE = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

export function normalizePlate(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 7);
}

export function formatPlate(value: string): string {
  const v = normalizePlate(value);
  if (v.length <= 3) return v;
  return `${v.slice(0, 3)}-${v.slice(3)}`;
}

export function isValidPlate(value: string): boolean {
  const v = normalizePlate(value);
  return OLD_RE.test(v) || MERCOSUL_RE.test(v);
}

const MOCK_VEHICLES: Record<string, { marca: string; modelo: string; ano: number }> = {
  XYZ4E56: { marca: "VW", modelo: "GOL", ano: 2018 },
  ABC1D23: { marca: "FIAT", modelo: "PALIO", ano: 2015 },
  HJK1L23: { marca: "HYUNDAI", modelo: "HB20", ano: 2021 },
  MNO5P78: { marca: "RENAULT", modelo: "KWID", ano: 2022 },
  QRS9T01: { marca: "FORD", modelo: "KA", ano: 2019 },
};

export async function lookupPlateMock(plate: string) {
  const v = normalizePlate(plate);
  await new Promise((r) => setTimeout(r, 700));
  return MOCK_VEHICLES[v] ?? null;
}
