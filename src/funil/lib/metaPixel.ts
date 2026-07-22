/** Meta Pixel — eventos de funil OficinaPRO. */
import { supabase } from "@/integrations/supabase/client";

type Fbq = (...args: unknown[]) => void;

function getFbq(): Fbq | null {
  if (typeof window === "undefined") return null;
  return (window as Window & { fbq?: Fbq }).fbq ?? null;
}

const DEFAULT_META_PIXEL_ID = "4269485799969770";

export function initMetaPixel() {
  const id = import.meta.env.VITE_META_PIXEL_ID?.trim() || DEFAULT_META_PIXEL_ID;
  if (!id || typeof window === "undefined") return;

  const w = window as Window & { fbq?: Fbq };
  if (w.fbq) return;

  const n = function (...args: unknown[]) {
    const fn = n as typeof n & { queue?: unknown[][]; callMethod?: Fbq; push?: Fbq };
    if (fn.callMethod) {
      fn.callMethod(...args);
    } else {
      (fn.queue = fn.queue || []).push(args);
    }
  } as Fbq & { queue?: unknown[][]; loaded?: boolean; version?: string; push?: Fbq };
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];
  w.fbq = n;

  if (!document.getElementById("meta-pixel")) {
    const s = document.createElement("script");
    s.id = "meta-pixel";
    s.async = true;
    s.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(s);
  }
  w.fbq("init", id);
  w.fbq("track", "PageView");
}

export function trackMetaEvent(
  event: "Lead" | "InitiateCheckout" | "Purchase" | "ViewContent" | "CompleteRegistration",
  params?: Record<string, unknown>,
  options?: { eventID?: string },
) {
  const fbq = getFbq();
  if (!fbq) return;
  const opts = options?.eventID ? { eventID: options.eventID } : undefined;
  if (params && opts) fbq("track", event, params, opts);
  else if (params) fbq("track", event, params);
  else if (opts) fbq("track", event, {}, opts);
  else fbq("track", event);
}

export type CapiUserData = {
  email?: string | null;
  phone?: string | null;
  external_id?: string | null;
};

/**
 * Dispara o mesmo evento no Pixel (browser) e na CAPI (edge function),
 * compartilhando um event_id para a Meta deduplicar.
 */
export function trackMetaEventDual(
  event: "Lead" | "InitiateCheckout" | "Purchase" | "ViewContent" | "CompleteRegistration",
  params?: Record<string, unknown>,
  userData?: CapiUserData,
) {
  const eventId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${event}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  trackMetaEvent(event, params, { eventID: eventId });

  // Fire-and-forget: CAPI é redundância, não bloqueia UX
  void supabase.functions
    .invoke("meta-capi", {
      body: {
        event_name: event,
        event_id: eventId,
        event_source_url: typeof window !== "undefined" ? window.location.href : undefined,
        event_time: Math.floor(Date.now() / 1000),
        user_data: userData ?? {},
        custom_data: params ?? {},
      },
    })
    .catch(() => {
      /* silencioso — Pixel já cobriu o evento */
    });
}
