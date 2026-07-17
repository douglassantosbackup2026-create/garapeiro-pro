/** Centralized error reporting — swap for Sentry later without touching call sites. */
export function reportError(error: unknown, context?: string) {
  if (context) {
    console.error(`[${context}]`, error);
  } else {
    console.error(error);
  }
}

export function mutationErrorMessage(
  err: unknown,
  fallback = "Algo deu errado. Tente de novo.",
): string {
  if (err instanceof Error && err.message) return err.message;
  if (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string"
  ) {
    return (err as { message: string }).message;
  }
  return fallback;
}
