import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { createAppQueryClient, createAppRouter } from "./router";
import { initMetaPixel } from "./funil/lib/metaPixel";
import "./styles.css";

const queryClient = createAppQueryClient();
const router = createAppRouter(queryClient);

initMetaPixel();

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppErrorBoundary>
      <RouterProvider router={router} context={{ queryClient }} />
    </AppErrorBoundary>
  </StrictMode>,
);
