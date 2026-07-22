/** Meta Pixel — eventos de funil OficinaPRO. */
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
) {
  const fbq = getFbq();
  if (!fbq) return;
  if (params) fbq("track", event, params);
  else fbq("track", event);
}
