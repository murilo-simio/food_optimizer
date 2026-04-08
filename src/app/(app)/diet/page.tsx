"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Plus, ChefHat, DollarSign } from "lucide-react";

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

async function requestDiet(userId: string): Promise<DietResponse> {
  const res = await fetch("/api/diet/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });

  if (!res.ok) {
    throw new Error("Erro ao gerar dieta");
  }

  return res.json();
}

export default function DietPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [diet, setDiet] = useState<DietResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading" || !session?.user?.id) return;

    const fetchDiet = async () => {
      try {
        const res = await fetch(`/api/diet/latest?userId=${session.user.id}`);
        if (!res.ok) {
          if (res.status === 404) {
            setDiet(null);
            return;
          }

          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data: DietResponse = await res.json();
        setDiet(data);
      } catch (error) {
        console.error("Error fetching diet:", error);
        setDiet(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchDiet();
  }, [session, status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!session?.user) {
    router.push("/login");
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

  const formatMealName = (slot: string) => {
    const names: Record<string, string> = {
      cafe_manha: "Café da Manhã",
      almoco: "Almoço",
      jantar: "Jantar",
      lanche1: "Lanche 1",
      lanche2: "Lanche 2",
    };

    return names[slot] || slot;
  };

  const handleGenerateDiet = async () => {
    try {
      const generatedDiet = await requestDiet(session.user.id);
      setDiet(generatedDiet);
    } catch (error) {
      console.error("Error generating diet:", error);
      alert("Erro ao gerar dieta");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <h1 className="text-xl font-bold">Minha Dieta</h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-accent hover:underline"
          >
            Voltar
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 pb-24">
        {!diet ? (
          <div className="py-12 text-center">
            <ChefHat className="mx-auto mb-4 h-16 w-16 text-foreground-muted" />
            <h2 className="mb-2 text-lg font-semibold">Nenhuma dieta gerada</h2>
            <p className="mb-6 text-sm text-foreground-muted">
              Clique no botão abaixo para gerar uma dieta personalizada baseada no seu perfil.
            </p>
            <button
              onClick={() => void handleGenerateDiet()}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-sm bg-accent px-6 py-3 text-sm font-medium text-foreground-inverse transition-colors hover:brightness-110"
            >
              <Plus className="h-4 w-4" />
              Gerar Dieta Agora
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-2 gap-4">
              <div className="rounded-md border border-border bg-background-elevated p-4">
                <p className="text-xs text-foreground-muted">Calorias</p>
                <p className="text-2xl font-bold text-accent">
                  <span className="font-mono">{diet.summary.totalCalories}</span>
                  <span className="ml-1 text-xs font-normal">kcal</span>
                </p>
              </div>
              <div className="rounded-md border border-border bg-background-elevated p-4">
                <p className="text-xs text-foreground-muted">Proteína</p>
                <p className="text-2xl font-bold text-accent">
                  <span className="font-mono">{diet.summary.totalProteinG}</span>
                  <span className="ml-1 text-xs font-normal">g</span>
                </p>
              </div>
              <div className="rounded-md border border-border bg-background-elevated p-4">
                <p className="text-xs text-foreground-muted">Carboidratos</p>
                <p className="text-2xl font-bold text-accent">
                  <span className="font-mono">{diet.summary.totalCarbsG}</span>
                  <span className="ml-1 text-xs font-normal">g</span>
                </p>
              </div>
              <div className="rounded-md border border-border bg-background-elevated p-4">
                <p className="text-xs text-foreground-muted">Gordura</p>
                <p className="text-2xl font-bold text-accent">
                  <span className="font-mono">{diet.summary.totalFatG}</span>
                  <span className="ml-1 text-xs font-normal">g</span>
                </p>
              </div>
            </div>

            <div className="mb-6 rounded-md border border-border bg-background-elevated p-4">
              <div className="mb-2 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-foreground-muted" />
                <p className="text-sm font-medium">Custo Estimado</p>
              </div>
              <p className="text-lg font-mono">
                {diet.diet.estimatedCost !== null
                  ? `R$ ${diet.diet.estimatedCost.toFixed(2)}/dia`
                  : "Calculando..."}
              </p>
            </div>

            {diet.notes.length > 0 && (
              <div className="mb-6 rounded-md border border-accent/30 bg-accent/10 p-4">
                <p className="mb-2 text-sm font-medium text-accent">Notas</p>
                <ul className="space-y-1 text-sm text-foreground-muted">
                  {diet.notes.map((note, idx) => (
                    <li key={`${idx}-${note}`}>• {note}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-6">
              {Object.entries(meals).map(([slot, items]) => (
                <div key={slot}>
                  <h2 className="mb-3 text-lg font-semibold">{formatMealName(slot)}</h2>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={`${item.mealSlot}-${item.foodId}`}
                        className="rounded-md border border-border bg-background-elevated p-4"
                      >
                        <div className="mb-2 flex items-start justify-between">
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
                        <div className="flex gap-4 text-xs text-foreground-muted">
                          <span>P: {Math.round(item.protein)}g</span>
                          <span>C: {Math.round(item.carbs)}g</span>
                          <span>G: {Math.round(item.fat)}g</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  if (confirm("Gerar nova dieta? A dieta atual será arquivada.")) {
                    void handleGenerateDiet();
                  }
                }}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-sm bg-accent px-6 py-3 text-sm font-medium text-foreground-inverse transition-colors hover:brightness-110"
              >
                <Plus className="h-4 w-4" />
                Gerar Nova Dieta
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
