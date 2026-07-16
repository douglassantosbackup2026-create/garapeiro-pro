export function buildCadastroUrl(params: {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  trialDays?: number;
  orderId?: string;
}): string {
  const raw =
    import.meta.env.VITE_APP_CADASTRO_URL?.trim() || "/cadastro";
  const url = raw.startsWith("http")
    ? new URL(raw)
    : new URL(raw, window.location.origin);
  url.searchParams.set("utm_source", params.source ?? "funil-quiz");
  url.searchParams.set("utm_medium", params.medium ?? "thankyou");
  url.searchParams.set(
    "utm_campaign",
    params.campaign ?? "playbook-trial-14d",
  );
  if (params.content) url.searchParams.set("utm_content", params.content);
  const trial = params.trialDays ?? 7;
  url.searchParams.set("trial", String(trial));
  if (params.orderId) url.searchParams.set("order", params.orderId);
  return url.toString();
}
