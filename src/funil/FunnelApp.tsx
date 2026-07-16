import { useEffect, useRef } from "react";
import {
  FunnelProvider,
  useFunnel,
  type Step,
} from "@/funil/funnel/FunnelContext";
import { Landing } from "@/funil/components/Landing";
import { QuizShell } from "@/funil/components/QuizShell";
import { ResultScreen } from "@/funil/components/ResultScreen";
import { OfferScreen } from "@/funil/components/OfferScreen";
import { MercadoPagoCheckout } from "@/funil/components/MercadoPagoCheckout";
import { ThankYou } from "@/funil/components/ThankYou";
import { MusicToggle } from "@/funil/components/MusicToggle";
import { questions } from "@/funil/data/questions";

type UrlSync = {
  step?: Step;
  q?: number;
};

type FunnelAppProps = {
  urlStep?: Step;
  urlQ?: number;
  onSyncUrl?: (next: { step: Step; q?: number }) => void;
  onUrlChange?: UrlSync;
};

function FunnelRouter({ onSyncUrl, onUrlChange }: FunnelAppProps) {
  const { state, dispatch } = useFunnel();
  const applyingUrl = useRef(false);
  const urlBootstrapped = useRef(false);
  const prevSearch = useRef<UrlSync | undefined>(undefined);
  const showFloatingMute =
    state.step !== "landing" && state.step !== "quiz";

  // Bootstrap: deep link na URL tem prioridade na 1ª hidratação
  useEffect(() => {
    if (!state.hydrated || urlBootstrapped.current) return;
    urlBootstrapped.current = true;
    prevSearch.current = {
      step: onUrlChange?.step,
      q: onUrlChange?.q,
    };

    const nextStep = onUrlChange?.step;
    if (!nextStep) return;
    if (
      nextStep === state.step &&
      (nextStep !== "quiz" ||
        onUrlChange?.q == null ||
        onUrlChange.q === state.questionIndex)
    ) {
      return;
    }
    applyingUrl.current = true;
    dispatch({
      type: "GO_STEP",
      step: nextStep,
      questionIndex:
        nextStep === "quiz"
          ? Math.min(
              onUrlChange?.q ?? state.questionIndex,
              Math.max(0, questions.length - 1),
            )
          : undefined,
    });
    queueMicrotask(() => {
      applyingUrl.current = false;
    });
  }, [state.hydrated, onUrlChange, state.step, state.questionIndex, dispatch]);

  // Push state → URL (após bootstrap)
  useEffect(() => {
    if (!state.hydrated || !onSyncUrl || !urlBootstrapped.current) return;
    if (applyingUrl.current) return;
    onSyncUrl({
      step: state.step,
      q: state.step === "quiz" ? state.questionIndex : undefined,
    });
  }, [state.hydrated, state.step, state.questionIndex, onSyncUrl]);

  // URL → state: só quando search muda de fato (back/forward / deep link)
  useEffect(() => {
    if (!state.hydrated || !urlBootstrapped.current) return;

    const nextStep = onUrlChange?.step;
    const nextQ = onUrlChange?.q;
    const prev = prevSearch.current;

    if (prev && prev.step === nextStep && prev.q === nextQ) {
      return;
    }

    const hadStep = Boolean(prev?.step);
    prevSearch.current = { step: nextStep, q: nextQ };

    // Search ainda igual ao bootstrap inicial sem step — state → URL ainda pendente
    if (!prev && !nextStep) return;

    applyingUrl.current = true;

    if (!nextStep) {
      // Só landing se o search anterior tinha step (histórico de volta)
      if (hadStep) {
        dispatch({ type: "GO_STEP", step: "landing", questionIndex: 0 });
      }
      queueMicrotask(() => {
        applyingUrl.current = false;
      });
      return;
    }

    dispatch({
      type: "GO_STEP",
      step: nextStep,
      questionIndex:
        nextStep === "quiz"
          ? Math.min(nextQ ?? 0, Math.max(0, questions.length - 1))
          : undefined,
    });
    queueMicrotask(() => {
      applyingUrl.current = false;
    });
  }, [onUrlChange?.step, onUrlChange?.q, state.hydrated, dispatch, onUrlChange]);

  let screen;
  switch (state.step) {
    case "landing":
      screen = <Landing />;
      break;
    case "quiz":
      screen = <QuizShell />;
      break;
    case "result":
      screen = <ResultScreen />;
      break;
    case "offer":
      screen = <OfferScreen />;
      break;
    case "checkout":
      screen = <MercadoPagoCheckout />;
      break;
    case "thanks":
      screen = <ThankYou />;
      break;
    default:
      screen = <Landing />;
  }

  return (
    <>
      {screen}
      {showFloatingMute && (
        <div className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6">
          <MusicToggle className="shadow-md" />
        </div>
      )}
    </>
  );
}

export function FunnelApp(props: FunnelAppProps) {
  return (
    <FunnelProvider>
      <FunnelRouter {...props} />
    </FunnelProvider>
  );
}
