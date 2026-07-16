import { useCallback, useEffect, useRef } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FunnelApp } from "@/funil/FunnelApp";
import { initMetaPixel } from "@/funil/lib/metaPixel";
import { parseFunnelStep, type Step } from "@/funil/funnel/FunnelContext";

export type QuizSearch = {
  step?: Step;
  q?: number;
};

export const Route = createFileRoute("/quiz")({
  component: QuizPage,
  validateSearch: (search: Record<string, unknown>): QuizSearch => {
    const step = parseFunnelStep(search.step);
    const qRaw = search.q;
    const q =
      typeof qRaw === "number"
        ? qRaw
        : typeof qRaw === "string" && qRaw !== "" && !Number.isNaN(Number(qRaw))
          ? Number(qRaw)
          : undefined;
    return {
      step,
      q: q != null && q >= 0 ? Math.floor(q) : undefined,
    };
  },
  head: () => ({
    meta: [
      {
        title: "Diagnóstico da Oficina | OficinaPRO",
      },
      {
        name: "description",
        content:
          "Diagnóstico gratuito: descubra quanto sua oficina deixa de faturar e receba o Playbook OficinaPRO com 50 estratégias.",
      },
    ],
  }),
});

function QuizPage() {
  const navigate = useNavigate({ from: "/quiz" });
  const search = Route.useSearch();
  const hydratedOnce = useRef(false);

  useEffect(() => {
    initMetaPixel();
  }, []);

  const onSyncUrl = useCallback(
    (next: { step: Step; q?: number }) => {
      if (
        next.step === search.step &&
        (next.q ?? undefined) === (search.q ?? undefined)
      ) {
        return;
      }
      const replace = !hydratedOnce.current;
      hydratedOnce.current = true;
      void navigate({
        search: {
          step: next.step === "landing" ? undefined : next.step,
          q: next.step === "quiz" ? next.q : undefined,
        },
        replace,
      });
    },
    [navigate, search.step, search.q],
  );

  return (
    <FunnelApp
      urlStep={search.step}
      urlQ={search.q}
      onSyncUrl={onSyncUrl}
      onUrlChange={search}
    />
  );
}
