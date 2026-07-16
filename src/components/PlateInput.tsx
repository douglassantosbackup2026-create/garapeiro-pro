import { Input } from "@/components/ui/input";
import { formatPlate, normalizePlate } from "@/lib/plate";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
};

export function PlateInput({ value, onChange, placeholder = "AAA-0000", className }: Props) {
  return (
    <Input
      value={formatPlate(value)}
      onChange={(e) => onChange(normalizePlate(e.target.value))}
      placeholder={placeholder}
      className={`uppercase tracking-widest font-mono font-bold ${className ?? ""}`}
      maxLength={8}
    />
  );
}
