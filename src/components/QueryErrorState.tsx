import { Button } from "@/components/ui/button";

type QueryErrorStateProps = {
  message?: string;
  onRetry?: () => void;
};

export function QueryErrorState({
  message = "Não foi possível carregar os dados.",
  onRetry,
}: QueryErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
