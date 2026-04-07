"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Plus, ChefHat, DollarSign } from "lucide-react";

export default function DietPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [diet, setDiet] = useState<any>(null);
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
        const data = await res.json();
        setDiet(data);
      } catch (error) {
        console.error("Error fetching diet:", error);
        setDiet(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDiet();
  }, [session, status, router]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session?.user) {
    router.push("/login");
    return null;
  }

  // Agrupar alimentos por mealSlot
  const meals = diet?.foods?.reduce((acc: any, item: any) => {
    if (!acc[item.mealSlot]) {
      acc[item.mealSlot] = [];
    }
    acc[item.mealSlot].push(item);
    return acc;
  }, {}) || {};

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

  const formatCalories = (cal: number) => Math.round(cal);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <h1 className="text-xl font-bold">Minha Dieta</h1>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm text-accent hover:underline"
          >
            Voltar
          </button>
        </div>
      </header>

      <main className="px-4 py-6 pb-24 max-w-2xl mx-auto">
        {!diet ? (
          <div className="text-center py-12">
            <ChefHat className="w-16 h-16 mx-auto mb-4 text-foreground-muted" />
            <h2 className="text-lg font-semibold mb-2">Nenhuma dieta gerada</h2>
            <p className="text-sm text-foreground-muted mb-6">
              Clique no botão abaixo para gerar uma dieta personalizada baseada no seu perfil.
            </p>
            <button
              onClick={async () => {
                const res = await fetch("/api/diet/generate", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ userId: session.user.id }),
                });
                if (res.ok) {
                  const data = await res.json();
                  setDiet(data);
                } else {
                  alert("Erro ao gerar dieta");
                }
              }}
              className="bg-accent text-foreground-inverse font-medium rounded-sm px-6 py-3 text-sm hover:brightness-110 transition-colors min-h-[44px] inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Gerar Dieta Agora
            </button>
          </div>
        ) : (
          <>
            {/* Resumo nutricional */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-background-elevated border border-border rounded-md p-4">
                <p className="text-xs text-foreground-muted">Calorias</p>
                <p className="text-2xl font-mono font-bold text-accent">
                  {diet.summary?.totalCalories || 0}
                  <span className="text-xs font-normal ml-1">kcal</span>
                </p>
              </div>
              <div className="bg-background-elevated border border-border rounded-md p-4">
                <p className="text-xs text-foreground-muted">Proteína</p>
                <p className="text-2xl font-mono font-bold text-accent">
                  {diet.summary?.totalProteinG || 0}
                  <span className="text-xs font-normal ml-1">g</span>
                </p>
              </div>
              <div className="bg-background-elevated border border-border rounded-md p-4">
                <p className="text-xs text-foreground-muted">Carboidratos</p>
                <p className="text-2xl font-mono font-bold text-accent">
                  {diet.summary?.totalCarbsG || 0}
                  <span className="text-xs font-normal ml-1">g</span>
                </p>
              </div>
              <div className="bg-background-elevated border border-border rounded-md p-4">
                <p className="text-xs text-foreground-muted">Gordura</p>
                <p className="text-2xl font-mono font-bold text-accent">
                  {diet.summary?.totalFatG || 0}
                  <span className="text-xs font-normal ml-1">g</span>
                </p>
              </div>
            </div>

            {/* Custo estimado (placeholder) */}
            <div className="bg-background-elevated border border-border rounded-md p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-foreground-muted" />
                <p className="text-sm font-medium">Custo Estimado</p>
              </div>
              <p className="text-lg font-mono">
                {diet.estimatedCost
                  ? `R$ ${diet.estimatedCost.toFixed(2)}/dia`
                  : "Calculando..."}
              </p>
            </div>

            {/* Notas */}
            {diet.notes && diet.notes.length > 0 && (
              <div className="bg-accent/10 border border-accent/30 rounded-md p-4 mb-6">
                <p className="text-sm font-medium text-accent mb-2">Notas</p>
                <ul className="text-sm text-foreground-muted space-y-1">
                  {diet.notes.map((note: string, idx: number) => (
                    <li key={idx}>• {note}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Refeições */}
            <div className="space-y-6">
              {Object.entries(meals).map(([slot, items]: [string, any[]]) => (
                <div key={slot}>
                  <h2 className="text-lg font-semibold mb-3">{formatMealName(slot)}</h2>
                  <div className="space-y-3">
                    {items.map((item: any) => {
                      const cal = (item.grams / 100) * item.food.caloriesKcal;
                      const protein = (item.grams / 100) * item.food.proteinG;
                      const fat = (item.grams / 100) * item.food.fatG;
                      const carbs = (item.grams / 100) * item.food.carbsG;
                      return (
                        <div
                          key={item.foodId}
                          className="bg-background-elevated border border-border rounded-md p-4"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">{item.food.name}</p>
                              <p className="text-xs text-foreground-muted">
                                {item.food.category}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-mono">{item.grams}g</p>
                              <p className="text-xs text-foreground-muted">
                                {formatCalories(cal)} kcal
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-4 text-xs text-foreground-muted">
                            <span>P: {Math.round(protein)}g</span>
                            <span>C: {Math.round(carbs)}g</span>
                            <span>G: {Math.round(fat)}g</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Botão para gerar nova dieta */}
            <div className="mt-8 text-center">
              <button
                onClick={async () => {
                  if (confirm("Gerar nova dieta? A dieta atual será arquivada.")) {
                    const res = await fetch("/api/diet/generate", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ userId: session.user.id }),
                    });
                    if (res.ok) {
                      const data = await res.json();
                      setDiet(data);
                    } else {
                      alert("Erro ao gerar nova dieta");
                    }
                  }
                }}
                className="bg-accent text-foreground-inverse font-medium rounded-sm px-6 py-3 text-sm hover:brightness-110 transition-colors min-h-[44px] inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Gerar Nova Dieta
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}