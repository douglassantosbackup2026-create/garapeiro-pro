import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type Dispatch,
  type ReactNode,
} from "react";
import { questions, type CategoryId } from "@/funil/data/questions";
import {
  pickStrategies,
  profiles,
  resolveProfile,
  weakCategoriesFromScores,
  type Profile,
  type StrategySnippet,
} from "@/funil/data/profiles";
import { mainOffer, type OfferId } from "@/funil/data/offers";
import {
  clearPersisted,
  loadPersisted,
  maybeInsertLead,
  normalizeFunnelStep,
  savePersisted,
  touchLeadStep,
  type FunnelStep,
  type StoredLead,
} from "@/funil/lib/storage";
import { backgroundMusic } from "@/funil/lib/backgroundMusic";
import { trackMetaEventDual } from "@/funil/lib/metaPixel";
import {
  buildMoneyByAnswer,
  createSessionSeed,
  pickSenderName,
  pickTimeLabel,
  toastTitleFor,
  type MoneyByAnswer,
} from "@/funil/lib/sessionMoney";

export type Step = FunnelStep;

type Answers = Record<string, string>;

export type MoneyToastPayload = {
  id: string;
  cents: number;
  title: string;
  fromName: string;
  timeLabel: string;
};

type State = {
  step: Step;
  questionIndex: number;
  answers: Answers;
  earningsCents: number;
  sessionSeed: number;
  moneyByAnswer: MoneyByAnswer;
  pendingToast: MoneyToastPayload | null;
  lead: StoredLead | null;
  selectedBumps: OfferId[];
  hydrated: boolean;
};

type Action =
  | { type: "HYDRATE"; state: Partial<State> }
  | { type: "START" }
  | { type: "ANSWER"; questionId: string; optionId: string }
  | { type: "CLEAR_TOAST" }
  | { type: "BACK_QUESTION" }
  | { type: "BACK_STEP" }
  | { type: "TO_OFFER" }
  | { type: "SET_LEAD"; lead: StoredLead }
  | { type: "PATCH_LEAD"; lead: Partial<StoredLead> }
  | { type: "TOGGLE_BUMP"; id: OfferId }
  | { type: "TO_CHECKOUT" }
  | { type: "COMPLETE_CHECKOUT" }
  | { type: "GO_STEP"; step: Step; questionIndex?: number }
  | { type: "RESET" };

const emptyMoney: MoneyByAnswer = {};

export const initialState: State = {
  step: "landing",
  questionIndex: 0,
  answers: {},
  earningsCents: 0,
  sessionSeed: 0,
  moneyByAnswer: emptyMoney,
  pendingToast: null,
  lead: null,
  selectedBumps: [],
  hydrated: false,
};

const STEP_ORDER: Step[] = [
  "landing",
  "quiz",
  "result",
  "offer",
  "checkout",
  "thanks",
];

export function isFunnelStep(v: unknown): v is Step {
  return normalizeFunnelStep(typeof v === "string" ? v : undefined) != null;
}

export function parseFunnelStep(v: unknown): Step | undefined {
  return normalizeFunnelStep(typeof v === "string" ? v : undefined) ?? undefined;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, ...action.state, hydrated: true, pendingToast: null };
    case "START": {
      const sessionSeed = createSessionSeed();
      return {
        ...initialState,
        step: "quiz",
        sessionSeed,
        moneyByAnswer: buildMoneyByAnswer(sessionSeed),
        hydrated: true,
      };
    }
    case "ANSWER": {
      const already = state.answers[action.questionId];
      const answers = {
        ...state.answers,
        [action.questionId]: action.optionId,
      };
      const nextIndex = state.questionIndex + 1;
      const done = nextIndex >= questions.length;
      const gain = already
        ? 0
        : (state.moneyByAnswer[action.questionId]?.[action.optionId] ?? 0);

      const fromName = pickSenderName(state.sessionSeed, state.questionIndex);
      const title = toastTitleFor(
        state.sessionSeed,
        state.questionIndex,
        fromName,
      );
      const timeLabel = pickTimeLabel(state.sessionSeed, state.questionIndex);

      return {
        ...state,
        answers,
        earningsCents: state.earningsCents + gain,
        questionIndex: done ? state.questionIndex : nextIndex,
        step: done ? "result" : "quiz",
        pendingToast:
          gain > 0
            ? {
                id: `${action.questionId}-${action.optionId}-${Date.now()}`,
                cents: gain,
                title,
                fromName,
                timeLabel,
              }
            : null,
      };
    }
    case "CLEAR_TOAST":
      return { ...state, pendingToast: null };
    case "BACK_QUESTION":
      if (state.questionIndex <= 0) {
        return { ...state, step: "landing", pendingToast: null };
      }
      return {
        ...state,
        questionIndex: state.questionIndex - 1,
        pendingToast: null,
      };
    case "BACK_STEP": {
      const idx = STEP_ORDER.indexOf(state.step);
      if (idx <= 0) return state;
      const prev = STEP_ORDER[idx - 1];
      if (prev === "quiz" && state.step === "result") {
        return {
          ...state,
          step: "quiz",
          questionIndex: Math.max(0, questions.length - 1),
          pendingToast: null,
        };
      }
      return { ...state, step: prev, pendingToast: null };
    }
    case "TO_OFFER":
      return { ...state, step: "offer" };
    case "SET_LEAD":
      return { ...state, lead: action.lead };
    case "PATCH_LEAD":
      if (!state.lead) return state;
      return { ...state, lead: { ...state.lead, ...action.lead } };
    case "TOGGLE_BUMP": {
      const has = state.selectedBumps.includes(action.id);
      return {
        ...state,
        selectedBumps: has
          ? state.selectedBumps.filter((x) => x !== action.id)
          : [...state.selectedBumps, action.id],
      };
    }
    case "TO_CHECKOUT":
      return { ...state, step: "checkout" };
    case "COMPLETE_CHECKOUT":
      return { ...state, step: "thanks" };
    case "GO_STEP": {
      const step = normalizeFunnelStep(action.step) ?? state.step;
      return {
        ...state,
        step,
        questionIndex:
          action.questionIndex ??
          (step === "quiz" ? state.questionIndex : state.questionIndex),
        pendingToast: null,
      };
    }
    case "RESET":
      clearPersisted();
      return { ...initialState, hydrated: true };
    default:
      return state;
  }
}

export type Diagnosis = {
  profile: Profile;
  strategies: StrategySnippet[];
  totalScore: number;
  maxScore: number;
  categoryAvgs: Record<CategoryId, number>;
  weakCategories: CategoryId[];
};

function computeDiagnosis(answers: Answers): Diagnosis {
  const categoryAgg: Record<CategoryId, { sum: number; count: number }> = {
    clientes: { sum: 0, count: 0 },
    orcamentos: { sum: 0, count: 0 },
    ticket: { sum: 0, count: 0 },
    retorno: { sum: 0, count: 0 },
    organizacao: { sum: 0, count: 0 },
    tempo: { sum: 0, count: 0 },
  };

  let totalScore = 0;
  let maxScore = 0;

  for (const q of questions) {
    maxScore += 2;
    const optId = answers[q.id];
    const opt = q.options.find((o) => o.id === optId);
    const score = opt?.score ?? 0;
    totalScore += score;
    categoryAgg[q.category].sum += score;
    categoryAgg[q.category].count += 1;
  }

  const categoryScores = Object.fromEntries(
    Object.entries(categoryAgg).map(([k, v]) => [
      k,
      v.count === 0 ? 0 : Math.round((v.sum / v.count) * 10) / 10,
    ]),
  ) as Record<CategoryId, number>;

  const categoryForProfile = Object.fromEntries(
    Object.entries(categoryAgg).map(([k, v]) => [
      k,
      v.count === 0 ? 0 : v.sum / v.count,
    ]),
  ) as Record<CategoryId, number>;

  const weak = weakCategoriesFromScores(categoryAgg);
  const profileId = resolveProfile(totalScore, maxScore, categoryForProfile);

  return {
    profile: profiles[profileId],
    strategies: pickStrategies(weak, 4),
    totalScore,
    maxScore,
    categoryAvgs: categoryScores,
    weakCategories: weak,
  };
}

type FunnelContextValue = {
  state: State;
  dispatch: Dispatch<Action>;
  diagnosis: Diagnosis;
  selectedOfferIds: OfferId[];
  persistAndComplete: () => Promise<void>;
  submitLead: (lead: StoredLead, lastStep?: string) => Promise<void>;
  goToCheckout: () => void;
};

const FunnelContext = createContext<FunnelContextValue | null>(null);

function bumpIds(raw: string[] | undefined): OfferId[] {
  const allowed = new Set(["recuperador", "kit-templates", "metodo-3km"]);
  return (raw ?? []).filter((id): id is OfferId => allowed.has(id));
}

export function FunnelProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const diagnosis = computeDiagnosis(state.answers);
  const selectedOfferIds: OfferId[] = [mainOffer.id, ...state.selectedBumps];
  const skipNextPersist = useRef(false);

  // Hydrate from localStorage once
  useEffect(() => {
    const saved = loadPersisted();
    if (!saved) {
      dispatch({ type: "HYDRATE", state: { hydrated: true } });
      return;
    }
    const seed = saved.sessionSeed || createSessionSeed();
    skipNextPersist.current = true;
    const step =
      normalizeFunnelStep(saved.step) ??
      (saved.step === "thanks" ? "thanks" : "landing");
    dispatch({
      type: "HYDRATE",
      state: {
        step,
        questionIndex: Math.min(
          Math.max(0, saved.questionIndex),
          Math.max(0, questions.length - 1),
        ),
        answers: saved.answers ?? {},
        earningsCents: saved.earningsCents ?? 0,
        sessionSeed: seed,
        moneyByAnswer: buildMoneyByAnswer(seed),
        lead: saved.lead,
        selectedBumps: bumpIds(saved.selectedBumps),
      },
    });
  }, []);

  useEffect(() => {
    if (state.step === "landing") {
      backgroundMusic.stop();
    }
  }, [state.step]);

  // Persist session for resume
  useEffect(() => {
    if (!state.hydrated) return;
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }
    if (state.step === "landing" && Object.keys(state.answers).length === 0) {
      return;
    }
    savePersisted({
      version: 3,
      step: state.step,
      questionIndex: state.questionIndex,
      answers: state.answers,
      earningsCents: state.earningsCents,
      sessionSeed: state.sessionSeed,
      lead: state.lead,
      selectedBumps: state.selectedBumps,
      profileId: diagnosis.profile.id,
      totalScore: diagnosis.totalScore,
      savedAt: new Date().toISOString(),
    });
  }, [
    state.hydrated,
    state.step,
    state.questionIndex,
    state.answers,
    state.earningsCents,
    state.sessionSeed,
    state.lead,
    state.selectedBumps,
    diagnosis.profile.id,
    diagnosis.totalScore,
  ]);

  // CRM: last_step on result/offer/checkout
  useEffect(() => {
    if (!state.lead?.whatsapp) return;
    if (state.step !== "result" && state.step !== "offer" && state.step !== "checkout") return;
    void touchLeadStep(state.lead.whatsapp, state.step, {
      profileId: diagnosis.profile.id,
      selectedOffers: selectedOfferIds,
      recoveryHint: "whatsapp",
    });
  }, [state.step, state.lead?.whatsapp, diagnosis.profile.id, selectedOfferIds]);

  async function submitLead(lead: StoredLead, lastStep: string = "checkout") {
    dispatch({ type: "SET_LEAD", lead });
    trackMetaEventDual(
      "Lead",
      {
        content_name: "funil-quiz",
        content_category: diagnosis.profile.id,
      },
      {
        email: lead.email ?? null,
        phone: lead.whatsapp,
        external_id: lead.whatsapp,
      },
    );
    await maybeInsertLead(
      lead,
      {
        profileId: diagnosis.profile.id,
        selectedOffers: selectedOfferIds,
        totalScore: diagnosis.totalScore,
        earningsCents: state.earningsCents,
        sessionSeed: state.sessionSeed,
        softLead: !lead.email,
      },
      lastStep,
    );
  }

  function goToCheckout() {
    const bumpCents = state.selectedBumps.reduce((sum, id) => {
      const map: Record<string, number> = {
        recuperador: 2700,
        "kit-templates": 3700,
        "metodo-3km": 2700,
      };
      return sum + (map[id] ?? 0);
    }, 0);
    trackMetaEventDual(
      "InitiateCheckout",
      {
        currency: "BRL",
        value: (mainOffer.priceCents + bumpCents) / 100,
        content_ids: selectedOfferIds,
        num_items: selectedOfferIds.length,
      },
      state.lead
        ? {
            email: state.lead.email ?? null,
            phone: state.lead.whatsapp,
            external_id: state.lead.whatsapp,
          }
        : undefined,
    );
    dispatch({ type: "TO_CHECKOUT" });
  }

  async function persistAndComplete() {
    if (!state.lead) {
      dispatch({ type: "COMPLETE_CHECKOUT" });
      return;
    }
    savePersisted({
      version: 3,
      step: "thanks",
      questionIndex: state.questionIndex,
      answers: state.answers,
      earningsCents: state.earningsCents,
      sessionSeed: state.sessionSeed,
      lead: state.lead,
      selectedBumps: state.selectedBumps,
      profileId: diagnosis.profile.id,
      totalScore: diagnosis.totalScore,
      savedAt: new Date().toISOString(),
    });
    await touchLeadStep(state.lead.whatsapp, "thanks", {
      profileId: diagnosis.profile.id,
      purchased: true,
    });
    dispatch({ type: "COMPLETE_CHECKOUT" });
  }

  return (
    <FunnelContext.Provider
      value={{
        state,
        dispatch,
        diagnosis,
        selectedOfferIds,
        persistAndComplete,
        submitLead,
        goToCheckout,
      }}
    >
      {children}
    </FunnelContext.Provider>
  );
}

export function useFunnel() {
  const ctx = useContext(FunnelContext);
  if (!ctx) throw new Error("useFunnel must be used within FunnelProvider");
  return ctx;
}
