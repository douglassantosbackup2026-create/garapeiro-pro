import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildWhatsappUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

type Props = {
  phone: string;
  message?: string;
  variant?: "ghost" | "outline" | "default" | "secondary";
  size?: "icon" | "default" | "sm" | "lg";
  label?: string;
  className?: string;
};

export function WhatsAppButton({
  phone,
  message,
  variant = "ghost",
  size = "icon",
  label,
  className,
}: Props) {
  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    window.open(buildWhatsappUrl(phone, message ?? ""), "_blank");
  };
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={onClick}
      className={cn("text-[#25D366] hover:text-[#1ea952]", className)}
    >
      <MessageCircle className="h-5 w-5" />
      {label && <span className="ml-1.5">{label}</span>}
    </Button>
  );
}
