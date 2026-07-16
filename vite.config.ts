/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";

/** CSP compartilhada — Mercado Pago/Libre Bricks + Supabase + gpteng */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.gpteng.co https://sdk.mercadopago.com https://www.mercadopago.com https://http2.mlstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.mlstatic.com https://*.mercadopago.com",
  "font-src 'self' data: https://fonts.gstatic.com https://cdn.gpteng.co https://*.mlstatic.com",
  "img-src 'self' data: blob: https://*.supabase.co https://cdn.gpteng.co https://*.mlstatic.com https://*.mercadopago.com https://*.mercadopago.com.br https://*.mercadolibre.com https://*.mercadolivre.com",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://cdn.gpteng.co https://api.mercadopago.com https://*.mercadopago.com https://*.mercadopago.com.br https://*.mlstatic.com https://*.mercadolibre.com https://*.mercadolivre.com ws://localhost:* http://localhost:*",
  "frame-src 'self' https://*.mercadopago.com https://*.mercadopago.com.br https://*.mlstatic.com https://*.mercadolibre.com https://*.mercadolivre.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action *",
].join("; ");

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  server: {
    headers: {
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      "Content-Security-Policy": CSP,
    },
  },
});
