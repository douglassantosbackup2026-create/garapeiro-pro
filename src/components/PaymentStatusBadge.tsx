import { cn } from "@/lib/utils";

export type PaymentStatus = "pago" | "parcial" | "aberto";

type PaymentStatusBadgeProps = {
  status: PaymentStatus;
  className?: string;
};

const STATUS_CLASS: Record<PaymentStatus, string> = {
  pago: "bg-status-delivered text-status-delivered-foreground",
  parcial: "bg-status-progress text-status-progress-foreground",
  aberto: "bg-status-cancel text-status-cancel-foreground",
};

const STATUS_LABEL: Record<PaymentStatus, string> = {
  pago: "Pago",
  parcial: "Parcial",
  aberto: "Em aberto",
};

export function PaymentStatusBadge({ status, className }: PaymentStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
        STATUS_CLASS[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
