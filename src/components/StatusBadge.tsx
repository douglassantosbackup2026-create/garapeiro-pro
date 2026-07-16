import { cn } from "@/lib/utils";
import { STATUS_LABEL } from "@/lib/whatsapp";
import type { OSStatus } from "@/hooks/useServiceOrders";

type Props = {
  status: OSStatus;
  className?: string;
};

const MAP: Record<OSStatus, string> = {
  aguardando_aprovacao: "bg-status-waiting text-status-waiting-foreground",
  em_andamento: "bg-status-progress text-status-progress-foreground",
  aguardando_peca: "bg-status-part text-status-part-foreground",
  concluido: "bg-status-done text-status-done-foreground",
  entregue: "bg-status-delivered text-status-delivered-foreground",
  cancelado: "bg-status-cancel text-status-cancel-foreground",
};

export function StatusBadge({ status, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        MAP[status] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
