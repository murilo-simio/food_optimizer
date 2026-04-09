"use client";

import type { ReactNode } from "react";
import type { UserProfile } from "@prisma/client";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChefHat,
  Clock3,
  LogOut,
  PencilLine,
  SkipForward,
} from "lucide-react";
import { getProtectedPageState } from "@/lib/auth-redirect";
import { cn } from "@/lib/utils";

type MealSlot = "cafe_manha" | "almoco" | "lanche1" | "jantar" | "lanche2";
type MealStatus = "pending" | "done" | "skipped";

interface DietFoodItem {
  foodId: string;
  mealSlot: MealSlot;
  name: string;
  category: string;
  grams: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
}

interface DietSummary {
  totalCalories: number;
  totalProteinG: number;
  totalFatG: number;
  totalCarbsG: number;
  totalFiberG: number;
}

interface DietRecord {
  id: string;
  name: string;
  source: string;
  status: string;
  totalCalories: number;
  totalProteinG: number;
  totalFatG: number;
  totalCarbsG: number;
  estimatedCost: number | null;
  createdAt: string;
}

interface DietResponse {
  diet: DietRecord;
  foods: DietFoodItem[];
  summary: DietSummary;
  notes: string[];
}

interface ProfileResponse {
  profile: UserProfile | null;
  onboardingComplete: boolean;
}

interface MealWindow {
  slot: MealSlot;
  label: string;
  startMinutes: number;
  endMinutes: number;
}

interface MealCardData {
  slot: MealSlot;
  label: string;
  windowLabel: string;
  items: DietFoodItem[];
  totals: DietSummary;
}

type MealStatusMap = Partial<Record<MealSlot, MealStatus>>;
type PendingAction =
  | {
      slot: MealSlot;
      status: Exclude<MealStatus, "pending">;
      label: string;
    }
  | null;

const MEAL_WINDOWS: MealWindow[] = [
  { slot: "cafe_manha", label: "Café da Manhã", startMinutes: 300, endMinutes: 629 },
  { slot: "almoco", label: "Almoço", startMinutes: 630, endMinutes: 839 },
  { slot: "lanche1", label: "Lanche da Tarde", startMinutes: 840, endMinutes: 1079 },
  { slot: "jantar", label: "Jantar", startMinutes: 1080, endMinutes: 1289 },
  { slot: "lanche2", label: "Ceia", startMinutes: 1290, endMinutes: 299 },
];

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMinutesOfDay(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function formatWindowLabel(startMinutes: number, endMinutes: number): string {
  const formatTime = (minutes: number) => {
    const hours = String(Math.floor(minutes / 60) % 24).padStart(2, "0");
    const mins = String(minutes % 60).padStart(2, "0");
    return `${hours}:${mins}`;
  };

  return `${formatTime(startMinutes)} - ${formatTime(endMinutes)}`;
}

function getCurrentMealWindow(date: Date): MealWindow {
  const currentMinutes = getMinutesOfDay(date);

  return (
    MEAL_WINDOWS.find((window) => {
      if (window.startMinutes <= window.endMinutes) {
        return (
          currentMinutes >= window.startMinutes && currentMinutes <= window.endMinutes
        );
      }

      return (
        currentMinutes >= window.startMinutes || currentMinutes <= window.endMinutes
      );
    }) || MEAL_WINDOWS[0]
  );
}

function getDisplayedMealWindow(
  currentWindow: MealWindow,
  statuses: MealStatusMap
): MealWindow {
  const currentIndex = MEAL_WINDOWS.findIndex(
    (window) => window.slot === currentWindow.slot
  );

  for (let index = currentIndex; index < MEAL_WINDOWS.length; index++) {
    const window = MEAL_WINDOWS[index];
    if ((statuses[window.slot] ?? "pending") === "pending") {
      return window;
    }
  }

  for (let index = 0; index < currentIndex; index++) {
    const window = MEAL_WINDOWS[index];
    if ((statuses[window.slot] ?? "pending") === "pending") {
      return window;
    }
  }

  return currentWindow;
}

function getStorageKey(userId: string): string {
  return `food-optimizer:dashboard-meals:${userId}`;
}

function getStatStatus(value: number): "empty" | "below" | "on-track" | "over" | "over-budget" {
  if (value <= 0) return "over";
  return "on-track";
}

function getMealStatusLabel(status: MealStatus): string {
  if (status === "done") return "Refeição feita";
  if (status === "skipped") return "Refeição pulada";
  return "Pendente";
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [diet, setDiet] = useState<DietResponse | null>(null);
  const [mealStatuses, setMealStatuses] = useState<MealStatusMap>({});
  const [storageReady, setStorageReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const protectedPageState = getProtectedPageState(status, !!session?.user);

  const dayKey = getLocalDateKey(currentTime);
  const currentMealWindow = getCurrentMealWindow(currentTime);
  const displayedMealWindow = getDisplayedMealWindow(currentMealWindow, mealStatuses);

  useEffect(() => {
    if (protectedPageState === "redirect") {
      router.push("/login");
    }
  }, [protectedPageState, router]);

  useEffect(() => {
    if (protectedPageState !== "ready" || !session?.user?.id) return;

    const loadDashboard = async () => {
      try {
        const [profileRes, dietRes] = await Promise.all([
          fetch(`/api/profile?userId=${session.user.id}`),
          fetch(`/api/diet/latest?userId=${session.user.id}`),
        ]);

        if (!profileRes.ok) {
          throw new Error(`HTTP error! status: ${profileRes.status}`);
        }

        const profileData: ProfileResponse = await profileRes.json();

        if (!profileData.onboardingComplete) {
          router.push("/onboarding");
          return;
        }

        setOnboardingComplete(true);
        setProfile(profileData.profile);

        if (dietRes.ok) {
          const dietData: DietResponse = await dietRes.json();
          setDiet(dietData);
        } else if (dietRes.status === 404) {
          setDiet(null);
        } else {
          throw new Error(`HTTP error! status: ${dietRes.status}`);
        }
      } catch (error) {
        console.error("Error loading dashboard:", error);
        setOnboardingComplete(false);
      }
    };

    void loadDashboard();
  }, [protectedPageState, router, session?.user?.id]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!session?.user?.id) return;

    const storageKey = getStorageKey(session.user.id);
    const rawState = window.localStorage.getItem(storageKey);

    if (!rawState) {
      setMealStatuses({});
      setStorageReady(true);
      return;
    }

    try {
      const parsedState = JSON.parse(rawState) as {
        date?: string;
        statuses?: MealStatusMap;
      };

      if (parsedState.date !== dayKey) {
        setMealStatuses({});
      } else {
        setMealStatuses(parsedState.statuses ?? {});
      }
    } catch {
      setMealStatuses({});
    } finally {
      setStorageReady(true);
    }
  }, [dayKey, session?.user?.id]);

  useEffect(() => {
    if (!storageReady || !session?.user?.id) return;

    window.localStorage.setItem(
      getStorageKey(session.user.id),
      JSON.stringify({
        date: dayKey,
        statuses: mealStatuses,
      })
    );
  }, [dayKey, mealStatuses, session?.user?.id, storageReady]);

  if (protectedPageState === "loading" || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (protectedPageState === "redirect" || !session.user) {
    return null;
  }

  if (!onboardingComplete) return null;

  const mealsBySlot = diet?.foods.reduce<Record<MealSlot, DietFoodItem[]>>(
    (acc, item) => {
      acc[item.mealSlot].push(item);
      return acc;
    },
    {
      cafe_manha: [],
      almoco: [],
      lanche1: [],
      jantar: [],
      lanche2: [],
    }
  );

  const mealCards = MEAL_WINDOWS.reduce<Record<MealSlot, MealCardData>>((acc, window) => {
    const items = mealsBySlot?.[window.slot] ?? [];
    const totals = items.reduce<DietSummary>(
      (summary, item) => ({
        totalCalories: summary.totalCalories + item.calories,
        totalProteinG: summary.totalProteinG + item.protein,
        totalFatG: summary.totalFatG + item.fat,
        totalCarbsG: summary.totalCarbsG + item.carbs,
        totalFiberG: summary.totalFiberG + item.fiber,
      }),
      {
        totalCalories: 0,
        totalProteinG: 0,
        totalFatG: 0,
        totalCarbsG: 0,
        totalFiberG: 0,
      }
    );

    acc[window.slot] = {
      slot: window.slot,
      label: window.label,
      windowLabel: formatWindowLabel(window.startMinutes, window.endMinutes),
      items,
      totals,
    };

    return acc;
  }, {} as Record<MealSlot, MealCardData>);

  const currentMeal = mealCards[displayedMealWindow.slot];
  const currentMealStatus = mealStatuses[currentMeal.slot] ?? "pending";

  const baseTotals = {
    calories:
      diet?.summary.totalCalories ?? Math.round(profile?.targetCalories ?? 0),
    protein:
      diet?.summary.totalProteinG ?? Math.round(profile?.targetProteinG ?? 0),
    carbs:
      diet?.summary.totalCarbsG ?? Math.round(profile?.targetCarbsG ?? 0),
    fat: diet?.summary.totalFatG ?? Math.round(profile?.targetFatG ?? 0),
  };

  const remainingTotals = MEAL_WINDOWS.reduce(
    (totals, window) => {
      if (mealStatuses[window.slot] !== "done") {
        return totals;
      }

      const meal = mealCards[window.slot];
      return {
        calories: totals.calories - Math.round(meal.totals.totalCalories),
        protein: totals.protein - Math.round(meal.totals.totalProteinG),
        carbs: totals.carbs - Math.round(meal.totals.totalCarbsG),
        fat: totals.fat - Math.round(meal.totals.totalFatG),
      };
    },
    { ...baseTotals }
  );

  const updateMealStatus = (
    slot: MealSlot,
    nextStatus: Exclude<MealStatus, "pending">
  ) => {
    setMealStatuses((currentStatuses) => ({
      ...currentStatuses,
      [slot]: nextStatus,
    }));
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Olá, {session.user.name.split(" ")[0]}</h1>
          <p className="text-sm text-foreground-muted">Seu resumo de hoje</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center p-2 text-foreground-muted transition-colors hover:text-foreground"
          aria-label="Sair"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <StatCard
          label="Calorias restantes"
          value={remainingTotals.calories.toString()}
          unit="kcal"
          status={getStatStatus(remainingTotals.calories)}
        />
        <StatCard
          label="Proteína restante"
          value={remainingTotals.protein.toString()}
          unit="g"
          status={getStatStatus(remainingTotals.protein)}
        />
        <StatCard
          label="Carbos restantes"
          value={remainingTotals.carbs.toString()}
          unit="g"
          status={getStatStatus(remainingTotals.carbs)}
        />
        <StatCard
          label="Gordura restante"
          value={remainingTotals.fat.toString()}
          unit="g"
          status={getStatStatus(remainingTotals.fat)}
        />
      </div>

      {!diet ? (
        <div className="rounded-md border border-border bg-background-elevated p-6 text-center">
          <ChefHat className="mx-auto mb-3 h-10 w-10 text-foreground-muted" />
          <p className="text-sm text-foreground-muted">Nenhuma dieta montada ainda.</p>
          <p className="mt-1 text-xs text-foreground-muted">
            Gere uma dieta para acompanhar a refeição do horário atual por aqui.
          </p>
        </div>
      ) : (
        <section className="rounded-md border border-border bg-background-elevated p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-foreground-muted">
                Refeição atual
              </p>
              <h2 className="mt-1 text-lg font-semibold">{currentMeal.label}</h2>
              <p className="mt-1 flex items-center gap-2 text-sm text-foreground-muted">
                <Clock3 className="h-4 w-4" />
                <span>{currentMeal.windowLabel}</span>
              </p>
            </div>
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                currentMealStatus === "done" && "bg-accent/15 text-accent",
                currentMealStatus === "skipped" && "bg-warning/15 text-warning",
                currentMealStatus === "pending" &&
                  "bg-background text-foreground-muted"
              )}
            >
              {getMealStatusLabel(currentMealStatus)}
            </span>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MealMetric
              label="Calorias"
              value={Math.round(currentMeal.totals.totalCalories)}
              unit="kcal"
            />
            <MealMetric
              label="Proteína"
              value={Math.round(currentMeal.totals.totalProteinG)}
              unit="g"
            />
            <MealMetric
              label="Carbos"
              value={Math.round(currentMeal.totals.totalCarbsG)}
              unit="g"
            />
            <MealMetric
              label="Gordura"
              value={Math.round(currentMeal.totals.totalFatG)}
              unit="g"
            />
          </div>

          <div className="mb-5 space-y-3">
            {currentMeal.items.length === 0 ? (
              <div className="rounded-md border border-dashed border-border p-4 text-sm text-foreground-muted">
                Não há itens planejados para esta refeição na dieta atual.
              </div>
            ) : (
              currentMeal.items.map((item) => (
                <div
                  key={`${item.mealSlot}-${item.foodId}`}
                  className="rounded-md border border-border bg-background p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-foreground-muted">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm">{item.grams}g</p>
                      <p className="text-xs text-foreground-muted">
                        {Math.round(item.calories)} kcal
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <ActionButton
              label="Pular refeição"
              icon={<SkipForward className="h-4 w-4" />}
              variant={currentMealStatus === "skipped" ? "warning" : "muted"}
              onClick={() =>
                setPendingAction({
                  slot: currentMeal.slot,
                  status: "skipped",
                  label: currentMeal.label,
                })
              }
            />
            <ActionButton
              label="Refeição feita"
              icon={<Check className="h-4 w-4" />}
              variant={currentMealStatus === "done" ? "accent" : "muted"}
              onClick={() =>
                setPendingAction({
                  slot: currentMeal.slot,
                  status: "done",
                  label: currentMeal.label,
                })
              }
            />
            <ActionButton
              label="Alterar refeição"
              icon={<PencilLine className="h-4 w-4" />}
              variant="muted"
              onClick={() => {}}
            />
          </div>
        </section>
      )}

      <ConfirmMealDialog
        action={pendingAction}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          if (!pendingAction) return;
          updateMealStatus(pendingAction.slot, pendingAction.status);
          setPendingAction(null);
        }}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  status,
}: {
  label: string;
  value: string;
  unit: string;
  status: "empty" | "below" | "on-track" | "over" | "over-budget";
}) {
  const statusColor = {
    empty: "text-foreground-muted",
    below: "text-warning",
    "on-track": "text-accent",
    over: "text-warning",
    "over-budget": "text-error",
  };

  return (
    <div className="rounded-md border border-border bg-background-elevated p-4 shadow-sm">
      <p className="text-xs text-foreground-muted">{label}</p>
      <p className={cn("mt-1 text-2xl font-mono font-bold", statusColor[status])}>
        {value}
      </p>
      <p className="text-xs text-foreground-muted">{unit}</p>
    </div>
  );
}

function MealMetric({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-foreground-muted">
        {label}
      </p>
      <p className="mt-1 font-mono text-lg font-semibold">{value}</p>
      <p className="text-xs text-foreground-muted">{unit}</p>
    </div>
  );
}

function ActionButton({
  label,
  icon,
  variant,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  variant: "accent" | "warning" | "muted";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[44px] items-center justify-center gap-2 rounded-sm border px-4 py-3 text-sm font-medium transition-colors",
        variant === "accent" &&
          "border-accent/30 bg-accent/15 text-accent hover:bg-accent/20",
        variant === "warning" &&
          "border-warning/30 bg-warning/15 text-warning hover:bg-warning/20",
        variant === "muted" &&
          "border-border bg-background text-foreground hover:bg-background-subtle"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function ConfirmMealDialog({
  action,
  onCancel,
  onConfirm,
}: {
  action: PendingAction;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!action) return null;

  const actionText =
    action.status === "done" ? "marcar como feita" : "pular";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-background-elevated p-5 shadow-lg">
        <h3 className="text-lg font-semibold">Confirmar ação</h3>
        <p className="mt-2 text-sm text-foreground-muted">
          Deseja {actionText} a refeição <span className="text-foreground">{action.label}</span>?
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] rounded-sm border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-background-subtle"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-[44px] rounded-sm bg-accent px-4 py-3 text-sm font-medium text-foreground-inverse transition-colors hover:brightness-110"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
