import { MutationCache, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { mutationErrorMessage } from "./lib/reportError";
import { routeTree } from "./routeTree.gen";

/** Toast de erro para mutations — use em onError de mutate/mutateAsync. */
export function toastMutationError(
  err: unknown,
  fallback = "Algo deu errado. Tente de novo.",
) {
  toast.error(mutationErrorMessage(err, fallback));
}

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 1,
      },
    },
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        // Call sites com onError próprio (toast customizado) não duplicam.
        // mutateAsync + try/catch sem onError ainda recebe este toast —
        // preferir passar onError ou usar toastMutationError no catch.
        if (mutation.options.onError) return;
        toastMutationError(error);
      },
    }),
  });
}

export function createAppRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;
