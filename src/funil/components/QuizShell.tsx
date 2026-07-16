import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { questions } from "@/funil/data/questions";
import { useFunnel } from "@/funil/funnel/FunnelContext";
import { formatBRL } from "@/funil/lib/sessionMoney";
import { BrandHeader, Shell } from "./BrandHeader";
import { DecisionMomentModal } from "./DecisionMomentModal";
import { MoneyToastStack } from "./MoneyToastStack";
import { MusicToggle } from "./MusicToggle";
import { PhaseUnlockModal } from "./PhaseUnlockModal";
import { cn } from "@/lib/utils";

export function QuizShell() {
  const { state, dispatch } = useFunnel();
  const [showPhaseModal, setShowPhaseModal] = useState(true);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const decisionShown = useRef(false);
  const question = questions[state.questionIndex];
  const progress = ((state.questionIndex + 1) / questions.length) * 100;

  const clearToast = useCallback(() => {
    dispatch({ type: "CLEAR_TOAST" });
  }, [dispatch]);

  useEffect(() => {
    if (state.questionIndex === 2 && !decisionShown.current) {
      decisionShown.current = true;
      setShowDecisionModal(true);
    }
  }, [state.questionIndex]);

  if (!question) return null;

  return (
    <Shell>
      <MoneyToastStack pending={state.pendingToast} onConsumed={clearToast} />

      <PhaseUnlockModal
        open={showPhaseModal}
        onClose={() => setShowPhaseModal(false)}
      />

      <DecisionMomentModal
        open={showDecisionModal}
        onClose={() => setShowDecisionModal(false)}
      />

      <div className="mb-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => dispatch({ type: "BACK_QUESTION" })}
          className="flex size-10 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:bg-muted"
          aria-label="Voltar"
        >
          <ChevronLeft className="size-5" />
        </button>
        <BrandHeader compact />
        <div className="flex items-center gap-2">
          <MusicToggle />
          <div className="rounded-full bg-money/15 px-2.5 py-1 text-center text-xs font-bold text-money">
            + {formatBRL(state.earningsCents)}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>
            Pergunta {state.questionIndex + 1} de {questions.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            key={state.questionIndex}
            className="animate-progress h-full rounded-full bg-primary"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div key={question.id} className="animate-pop">
        {question.subtitle && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary">
            {question.subtitle}
          </p>
        )}
        <h2 className="font-display mb-6 text-2xl font-bold leading-snug tracking-tight">
          {question.title}
        </h2>

        <ul className="flex flex-col gap-3">
          {question.options.map((opt) => {
            const selected = state.answers[question.id] === opt.id;
            return (
              <li key={opt.id}>
                <button
                  type="button"
                  onClick={() =>
                    dispatch({
                      type: "ANSWER",
                      questionId: question.id,
                      optionId: opt.id,
                    })
                  }
                  className={cn(
                    "w-full rounded-xl border px-4 py-4 text-left text-sm font-medium leading-snug transition",
                    selected
                      ? "border-primary bg-accent text-foreground shadow-sm"
                      : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/60",
                  )}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Shell>
  );
}
