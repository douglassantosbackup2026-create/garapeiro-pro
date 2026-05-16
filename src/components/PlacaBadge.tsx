import { cn } from "@/lib/utils";
import { formatPlate } from "@/lib/plate";

type PlacaSize = "sm" | "md" | "lg" | "xl";

type Props = {
  placa: string;
  size?: PlacaSize;
  className?: string;
};

const SIZES: Record<PlacaSize, string> = {
  sm: "text-[10px] px-1.5 py-0.5",
  md: "text-xs px-2 py-0.5",
  lg: "text-base px-3 py-1",
  xl: "text-2xl px-4 py-2",
};

export function PlacaBadge({ placa, size = "md", className }: Props) {
  return (
    <span className={cn("plate-badge", SIZES[size], className)}>{formatPlate(placa)}</span>
  );
}
