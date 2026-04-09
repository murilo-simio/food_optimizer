"use client";

import { useDeferredValue, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowUpDown,
  ChefHat,
  DollarSign,
  Plus,
  RefreshCcw,
  Search,
  Sparkles,
} from "lucide-react";
import { getProtectedPageState } from "@/lib/auth-redirect";

type DietAlgorithm = "GREEDY" | "LOW_COST";
type FoodSortKey = "name" | "price" | "protein" | "carbs" | "fat" | "calories";

interface DietFoodItem {
  foodId: string;
  mealSlot: string;
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

interface ProfileData {
  weeklyFoodBudget: number | null;
}

interface ProfileResponse {
  profile: ProfileData | null;
  onboardingComplete: boolean;
}

interface FoodCatalogItem {
  id: string;
  name: string;
  category: string;
  caloriesKcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  fiberG: number;
  pricePer100g: number | null;
}

interface SimilarFoodItem extends FoodCatalogItem {
  suggestedGrams: number;
  similarityScore: number;
}

interface GenerationSettings {
  algorithm: DietAlgorithm;
  minDailyCost: number;
  maxDailyCost: number;
}

interface ReplaceFoodDialogProps {
  currentItem: DietFoodItem | null;
  onClose: () => void;
  onReplace: (currentItem: DietFoodItem, replacementFoodId: string) => Promise<void>;
}

async function requestDiet(
  userId: string,
  settings?: GenerationSettings
): Promise<DietResponse> {
  const res = await fetch("/api/diet/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      settings
        ? {
            userId,
            algorithm: settings.algorithm,
            minDailyCost: settings.minDailyCost,
            maxDailyCost: settings.maxDailyCost,
          }
        : { userId }
    ),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Erro ao gerar dieta");
  }

  return res.json();
}

async function fetchFoodCatalog(
  query: string,
  sortBy: FoodSortKey
): Promise<FoodCatalogItem[]> {
  const searchParams = new URLSearchParams();
  if (query.trim()) {
    searchParams.set("query", query.trim());
  }
  searchParams.set("sortBy", sortBy);

  const res = await fetch(`/api/foods?${searchParams.toString()}`);
  if (!res.ok) {
    throw new Error("Erro ao buscar alimentos.");
  }

  const data = (await res.json()) as { foods: FoodCatalogItem[] };
  return data.foods;
}

async function fetchSimilarFoods(currentItem: DietFoodItem): Promise<SimilarFoodItem[]> {
  const searchParams = new URLSearchParams({
    foodId: currentItem.foodId,
    grams: String(currentItem.grams),
    limit: "5",
  });
  const res = await fetch(`/api/foods/similar?${searchParams.toString()}`);
  if (!res.ok) {
    throw new Error("Erro ao sugerir alimentos.");
  }

  const data = (await res.json()) as { foods: SimilarFoodItem[] };
  return data.foods;
}

async function replaceDietFood(
  dietId: string,
  currentItem: DietFoodItem,
  replacementFoodId: string
): Promise<DietResponse> {
  const res = await fetch("/api/diet/item", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dietId,
      foodId: currentItem.foodId,
      mealSlot: currentItem.mealSlot,
      replacementFoodId,
    }),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Erro ao trocar alimento.");
  }

  return res.json();
}

function formatMealName(slot: string) {
  const names: Record<string, string> = {
    cafe_manha: "Café da Manhã",
    almoco: "Almoço",
    jantar: "Jantar",
    lanche1: "Lanche 1",
    lanche2: "Lanche 2",
  };

  return names[slot] || slot;
}

function formatCurrency(value: number | null) {
  if (value === null) {
    return "Sem preço";
  }

  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function getDailyBudgetBaseline(profile: ProfileData | null) {
  if (!profile?.weeklyFoodBudget || profile.weeklyFoodBudget <= 0) {
    return 14;
  }

  return Math.max(profile.weeklyFoodBudget / 7, 6);
}

export default function DietPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [diet, setDiet] = useState<DietResponse | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [replacementTarget, setReplacementTarget] = useState<DietFoodItem | null>(null);
  const generationSettingsInitializedRef = useRef(false);
  const [generationSettings, setGenerationSettings] = useState<GenerationSettings>({
    algorithm: "LOW_COST",
    minDailyCost: 8,
    maxDailyCost: 18,
  });
  const protectedPageState = getProtectedPageState(status, !!session?.user);

  useEffect(() => {
    if (protectedPageState === "redirect") {
      router.push("/login");
    }
  }, [protectedPageState, router]);

  useEffect(() => {
    if (protectedPageState !== "ready" || !session?.user?.id) {
      return;
    }

    const loadDietPage = async () => {
      try {
        const [dietRes, profileRes] = await Promise.all([
          fetch(`/api/diet/latest?userId=${session.user.id}`),
          fetch(`/api/profile?userId=${session.user.id}`),
        ]);

        if (profileRes.ok) {
          const profileData = (await profileRes.json()) as ProfileResponse;
          setProfile(profileData.profile);

          if (!generationSettingsInitializedRef.current) {
            const baseline = getDailyBudgetBaseline(profileData.profile);
            setGenerationSettings({
              algorithm: "LOW_COST",
              minDailyCost: Math.max(Number((baseline * 0.75).toFixed(2)), 4),
              maxDailyCost: Number((baseline * 1.15).toFixed(2)),
            });
            generationSettingsInitializedRef.current = true;
          }
        }

        if (!dietRes.ok) {
          if (dietRes.status === 404) {
            setDiet(null);
            return;
          }

          throw new Error(`HTTP error! status: ${dietRes.status}`);
        }

        const dietData: DietResponse = await dietRes.json();
        setDiet(dietData);
      } catch (error) {
        console.error("Error fetching diet page:", error);
        setPageError("Não foi possível carregar a dieta agora.");
        setDiet(null);
      } finally {
        setLoading(false);
      }
    };

    void loadDietPage();
  }, [protectedPageState, session?.user?.id]);

  if (protectedPageState === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (protectedPageState === "redirect" || !session?.user) {
    return null;
  }

  const meals =
    diet?.foods.reduce<Record<string, DietFoodItem[]>>((acc, item) => {
      if (!acc[item.mealSlot]) {
        acc[item.mealSlot] = [];
      }

      acc[item.mealSlot].push(item);
      return acc;
    }, {}) ?? {};

  const dailyBudgetBaseline = getDailyBudgetBaseline(profile);
  const budgetSliderMax = Math.max(Math.ceil(dailyBudgetBaseline * 2), 24);

  const handleGenerateDiet = async () => {
    setIsGenerating(true);
    setPageError(null);

    try {
      const generatedDiet = await requestDiet(session.user.id, generationSettings);
      setDiet(generatedDiet);
      setIsGenerateDialogOpen(false);
    } catch (error) {
      console.error("Error generating diet:", error);
      setPageError(
        error instanceof Error ? error.message : "Erro ao gerar dieta."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReplaceFood = async (
    currentItem: DietFoodItem,
    replacementFoodId: string
  ) => {
    if (!diet) {
      return;
    }

    const updatedDiet = await replaceDietFood(
      diet.diet.id,
      currentItem,
      replacementFoodId
    );

    setDiet(updatedDiet);
    setReplacementTarget(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Minha Dieta</h1>
            <p className="text-xs text-foreground-muted">
              Gere automaticamente e ajuste refeição por refeição.
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-accent hover:underline"
          >
            Voltar
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 pb-24">
        {pageError && (
          <div className="mb-6 rounded-md border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            {pageError}
          </div>
        )}

        {!diet ? (
          <div className="py-12 text-center">
            <ChefHat className="mx-auto mb-4 h-16 w-16 text-foreground-muted" />
            <h2 className="mb-2 text-lg font-semibold">Nenhuma dieta gerada</h2>
            <p className="mb-6 text-sm text-foreground-muted">
              Abra a geração automática para escolher faixa de custo diário e algoritmo.
            </p>
            <button
              onClick={() => setIsGenerateDialogOpen(true)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-sm bg-accent px-6 py-3 text-sm font-medium text-foreground-inverse transition-colors hover:brightness-110"
            >
              <Plus className="h-4 w-4" />
              Configurar e Gerar Dieta
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-2 gap-4">
              <SummaryCard label="Calorias" value={diet.summary.totalCalories} unit="kcal" />
              <SummaryCard label="Proteína" value={diet.summary.totalProteinG} unit="g" />
              <SummaryCard label="Carboidratos" value={diet.summary.totalCarbsG} unit="g" />
              <SummaryCard label="Gordura" value={diet.summary.totalFatG} unit="g" />
            </div>

            <div className="mb-6 rounded-md border border-border bg-background-elevated p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-foreground-muted" />
                    <p className="text-sm font-medium">Custo Estimado</p>
                  </div>
                  <p className="text-lg font-mono">
                    {diet.diet.estimatedCost !== null
                      ? `${formatCurrency(diet.diet.estimatedCost)}/dia`
                      : "Calculando..."}
                  </p>
                </div>
                <button
                  onClick={() => setIsGenerateDialogOpen(true)}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-sm border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-background-subtle"
                >
                  <RefreshCcw className="h-4 w-4" />
                  Gerar Nova Dieta
                </button>
              </div>
            </div>

            {diet.notes.length > 0 && (
              <div className="mb-6 rounded-md border border-accent/30 bg-accent/10 p-4">
                <p className="mb-2 text-sm font-medium text-accent">Notas</p>
                <ul className="space-y-1 text-sm text-foreground-muted">
                  {diet.notes.map((note, index) => (
                    <li key={`${index}-${note}`}>• {note}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-6">
              {Object.entries(meals).map(([slot, items]) => (
                <div key={slot}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold">{formatMealName(slot)}</h2>
                    <span className="text-xs text-foreground-muted">
                      {items.length} alimento{items.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={`${item.mealSlot}-${item.foodId}`}
                        className="rounded-md border border-border bg-background-elevated p-4"
                      >
                        <div className="mb-3 flex items-start justify-between gap-4">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-foreground-muted">{item.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-mono">{item.grams}g</p>
                            <p className="text-xs text-foreground-muted">
                              {Math.round(item.calories)} kcal
                            </p>
                          </div>
                        </div>

                        <div className="mb-4 flex flex-wrap gap-4 text-xs text-foreground-muted">
                          <span>P: {Math.round(item.protein)}g</span>
                          <span>C: {Math.round(item.carbs)}g</span>
                          <span>G: {Math.round(item.fat)}g</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setReplacementTarget(item)}
                          className="inline-flex min-h-[44px] items-center gap-2 rounded-sm border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-background-subtle"
                        >
                          <RefreshCcw className="h-4 w-4" />
                          Trocar alimento
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <GenerateDietDialog
        isOpen={isGenerateDialogOpen}
        settings={generationSettings}
        sliderMax={budgetSliderMax}
        isGenerating={isGenerating}
        onClose={() => setIsGenerateDialogOpen(false)}
        onGenerate={() => void handleGenerateDiet()}
        onChange={setGenerationSettings}
      />

      <ReplaceFoodDialog
        currentItem={replacementTarget}
        onClose={() => setReplacementTarget(null)}
        onReplace={handleReplaceFood}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  return (
    <div className="rounded-md border border-border bg-background-elevated p-4">
      <p className="text-xs text-foreground-muted">{label}</p>
      <p className="text-2xl font-bold text-accent">
        <span className="font-mono">{value}</span>
        <span className="ml-1 text-xs font-normal">{unit}</span>
      </p>
    </div>
  );
}

function GenerateDietDialog({
  isOpen,
  settings,
  sliderMax,
  isGenerating,
  onClose,
  onGenerate,
  onChange,
}: {
  isOpen: boolean;
  settings: GenerationSettings;
  sliderMax: number;
  isGenerating: boolean;
  onClose: () => void;
  onGenerate: () => void;
  onChange: (settings: GenerationSettings) => void;
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 py-6 sm:items-center">
      <div className="w-full max-w-lg rounded-lg border border-border bg-background-elevated p-5 shadow-lg">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">Gerar dieta automática</h2>
          <p className="mt-1 text-sm text-foreground-muted">
            O sistema usa seu onboarding, suas restrições e os alimentos disponíveis no banco.
          </p>
        </div>

        <div className="mb-6 space-y-5">
          <div className="space-y-3">
            <p className="text-sm font-medium">Algoritmo</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...settings,
                    algorithm: "LOW_COST",
                  })
                }
                className={`min-h-[44px] rounded-sm border px-4 py-3 text-left text-sm transition-colors ${
                  settings.algorithm === "LOW_COST"
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-border bg-background text-foreground-muted hover:bg-background-subtle"
                }`}
              >
                <p className="font-medium">Menor custo</p>
                <p className="mt-1 text-xs text-foreground-muted">
                  Prioriza alimentos com melhor custo-benefício.
                </p>
              </button>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...settings,
                    algorithm: "GREEDY",
                  })
                }
                className={`min-h-[44px] rounded-sm border px-4 py-3 text-left text-sm transition-colors ${
                  settings.algorithm === "GREEDY"
                    ? "border-accent bg-accent/10 text-foreground"
                    : "border-border bg-background text-foreground-muted hover:bg-background-subtle"
                }`}
              >
                <p className="font-medium">Guloso</p>
                <p className="mt-1 text-xs text-foreground-muted">
                  Monta rápido e depois ajusta os macros.
                </p>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Faixa de custo diário</p>
                <p className="text-xs text-foreground-muted">
                  Escolha o mínimo e o máximo aceitos para a dieta automática.
                </p>
              </div>
              <span className="text-xs font-mono text-foreground-muted">
                {formatCurrency(settings.minDailyCost)} - {formatCurrency(settings.maxDailyCost)}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-foreground-muted">
                <span>Mínimo</span>
                <span>{formatCurrency(settings.minDailyCost)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={sliderMax}
                step={0.5}
                value={settings.minDailyCost}
                onChange={(event) => {
                  const nextMin = Number(event.target.value);
                  onChange({
                    ...settings,
                    minDailyCost: nextMin,
                    maxDailyCost: Math.max(settings.maxDailyCost, nextMin),
                  });
                }}
                className="w-full accent-[hsl(var(--accent))]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-foreground-muted">
                <span>Máximo</span>
                <span>{formatCurrency(settings.maxDailyCost)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={sliderMax}
                step={0.5}
                value={settings.maxDailyCost}
                onChange={(event) => {
                  const nextMax = Number(event.target.value);
                  onChange({
                    ...settings,
                    maxDailyCost: nextMax,
                    minDailyCost: Math.min(settings.minDailyCost, nextMax),
                  });
                }}
                className="w-full accent-[hsl(var(--accent))]"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-sm border border-border bg-background px-4 py-3 text-sm font-medium transition-colors hover:bg-background-subtle"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-sm bg-accent px-4 py-3 text-sm font-medium text-foreground-inverse transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Sparkles className="h-4 w-4" />
            {isGenerating ? "Gerando..." : "Gerar Dieta Completa"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ReplaceFoodDialog({
  currentItem,
  onClose,
  onReplace,
}: ReplaceFoodDialogProps) {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [sortBy, setSortBy] = useState<FoodSortKey>("price");
  const [foods, setFoods] = useState<FoodCatalogItem[]>([]);
  const [suggestions, setSuggestions] = useState<SimilarFoodItem[]>([]);
  const [loadingFoods, setLoadingFoods] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [submittingFoodId, setSubmittingFoodId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentItem) {
      setSearch("");
      setSortBy("price");
      setFoods([]);
      setSuggestions([]);
      setError(null);
      setSubmittingFoodId(null);
      return;
    }

    const loadSuggestions = async () => {
      setLoadingSuggestions(true);
      setError(null);

      try {
        const data = await fetchSimilarFoods(currentItem);
        setSuggestions(data);
      } catch (requestError) {
        console.error("Error fetching similar foods:", requestError);
        setError("Não foi possível buscar alimentos parecidos.");
      } finally {
        setLoadingSuggestions(false);
      }
    };

    void loadSuggestions();
  }, [currentItem]);

  useEffect(() => {
    if (!currentItem) {
      return;
    }

    const loadCatalog = async () => {
      setLoadingFoods(true);

      try {
        const data = await fetchFoodCatalog(deferredSearch, sortBy);
        setFoods(data.filter((food) => food.id !== currentItem.foodId));
      } catch (requestError) {
        console.error("Error fetching food catalog:", requestError);
        setError("Não foi possível carregar o catálogo de alimentos.");
      } finally {
        setLoadingFoods(false);
      }
    };

    void loadCatalog();
  }, [currentItem, deferredSearch, sortBy]);

  if (!currentItem) {
    return null;
  }

  const handleReplace = async (replacementFoodId: string) => {
    setSubmittingFoodId(replacementFoodId);
    setError(null);

    try {
      await onReplace(currentItem, replacementFoodId);
    } catch (requestError) {
      console.error("Error replacing food:", requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Erro ao trocar alimento."
      );
    } finally {
      setSubmittingFoodId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 py-6 sm:items-center">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-lg border border-border bg-background-elevated shadow-lg">
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Trocar alimento</h2>
              <p className="mt-1 text-sm text-foreground-muted">
                {currentItem.name} • {currentItem.grams}g • {Math.round(currentItem.calories)} kcal
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] rounded-sm border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-background-subtle"
            >
              Fechar
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {error && (
            <div className="rounded-md border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <p className="text-sm font-medium">Sugestões parecidas nutricionalmente</p>
            </div>

            {loadingSuggestions ? (
              <div className="rounded-md border border-border bg-background p-4 text-sm text-foreground-muted">
                Buscando sugestões...
              </div>
            ) : (
              <div className="grid gap-3">
                {suggestions.map((food) => (
                  <FoodOptionCard
                    key={`suggestion-${food.id}`}
                    food={food}
                    secondaryLabel={`Similaridade ${(food.similarityScore * 100).toFixed(0)}%`}
                    ctaLabel="Trocar por esta opção"
                    isSubmitting={submittingFoodId === food.id}
                    onSelect={() => void handleReplace(food.id)}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <label className="flex items-center gap-2 rounded-sm border border-border bg-background px-3">
                <Search className="h-4 w-4 text-foreground-muted" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Pesquisar alimentos"
                  className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-foreground-muted"
                />
              </label>

              <label className="flex items-center gap-2 rounded-sm border border-border bg-background px-3">
                <ArrowUpDown className="h-4 w-4 text-foreground-muted" />
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as FoodSortKey)}
                  className="h-11 bg-transparent pr-2 text-sm outline-none"
                >
                  <option value="price">Ordenar por preço</option>
                  <option value="protein">Ordenar por proteína</option>
                  <option value="carbs">Ordenar por carbos</option>
                  <option value="fat">Ordenar por gordura</option>
                  <option value="calories">Ordenar por calorias</option>
                  <option value="name">Ordenar por nome</option>
                </select>
              </label>
            </div>

            {loadingFoods ? (
              <div className="rounded-md border border-border bg-background p-4 text-sm text-foreground-muted">
                Carregando catálogo...
              </div>
            ) : (
              <div className="space-y-3">
                {foods.map((food) => (
                  <FoodOptionCard
                    key={food.id}
                    food={food}
                    secondaryLabel={`Categoria ${food.category}`}
                    ctaLabel="Trocar alimento"
                    isSubmitting={submittingFoodId === food.id}
                    onSelect={() => void handleReplace(food.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function FoodOptionCard({
  food,
  secondaryLabel,
  ctaLabel,
  isSubmitting,
  onSelect,
}: {
  food: FoodCatalogItem | SimilarFoodItem;
  secondaryLabel: string;
  ctaLabel: string;
  isSubmitting: boolean;
  onSelect: () => void;
}) {
  const suggestedGrams =
    "suggestedGrams" in food ? `${food.suggestedGrams}g sugeridos` : null;

  return (
    <div className="rounded-md border border-border bg-background p-4">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <p className="font-medium">{food.name}</p>
          <p className="text-xs text-foreground-muted">{secondaryLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-mono">{formatCurrency(food.pricePer100g)}</p>
          <p className="text-xs text-foreground-muted">por 100g</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-4 text-xs text-foreground-muted">
        <span>{Math.round(food.caloriesKcal)} kcal</span>
        <span>P {Math.round(food.proteinG)}g</span>
        <span>C {Math.round(food.carbsG)}g</span>
        <span>G {Math.round(food.fatG)}g</span>
        {suggestedGrams && <span>{suggestedGrams}</span>}
      </div>

      <button
        type="button"
        onClick={onSelect}
        disabled={isSubmitting}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-sm bg-accent px-4 py-2 text-sm font-medium text-foreground-inverse transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <RefreshCcw className="h-4 w-4" />
        {isSubmitting ? "Trocando..." : ctaLabel}
      </button>
    </div>
  );
}
