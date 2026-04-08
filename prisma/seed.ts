import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Dados nutricionais por 100g (fontes: TACO, USDA)
const foods = [
  // 🍚 CARBOIDRATOS
  {
    name: "Arroz branco cozido",
    category: "carboidrato",
    caloriesKcal: 130,
    proteinG: 2.7,
    fatG: 0.3,
    carbsG: 28.2,
    fiberG: 0.4,
    sugarG: 0.1,
    vitaminB1_MG: 0.02,
    vitaminB3_MG: 0.4,
    magnesium_MG: 12,
    phosphorus_MG: 43,
  },
  {
    name: "Arroz integral cozido",
    category: "carboidrato",
    caloriesKcal: 123,
    proteinG: 2.6,
    fatG: 1.0,
    carbsG: 25.8,
    fiberG: 1.8,
    sugarG: 0.4,
    vitaminB1_MG: 0.07,
    vitaminB3_MG: 1.5,
    magnesium_MG: 39,
    phosphorus_MG: 83,
    manganese_MG: 1.1,
  },
  {
    name: "Aveia em flocos",
    category: "carboidrato",
    caloriesKcal: 389,
    proteinG: 16.9,
    fatG: 6.9,
    carbsG: 66.3,
    fiberG: 10.6,
    sugarG: 1.0,
    vitaminB1_MG: 0.76,
    vitaminB5_MG: 1.1,
    magnesium_MG: 177,
    phosphorus_MG: 523,
    iron_MG: 4.7,
    zinc_MG: 4.0,
  },
  {
    name: "Batata inglesa cozida",
    category: "carboidrato",
    caloriesKcal: 87,
    proteinG: 1.9,
    fatG: 0.1,
    carbsG: 20.1,
    fiberG: 1.8,
    sugarG: 0.8,
    vitaminC_MG: 9.1,
    vitaminB6_MG: 0.2,
    potassium_MG: 429,
  },
  {
    name: "Pão integral",
    category: "carboidrato",
    caloriesKcal: 246,
    proteinG: 13.0,
    fatG: 3.2,
    carbsG: 41.5,
    fiberG: 7.0,
    sugarG: 4.0,
    vitaminB1_MG: 0.3,
    vitaminB2_MG: 0.1,
    magnesium_MG: 63,
    phosphorus_MG: 188,
  },

  // 🥩 PROTEÍNAS
  {
    name: "Peito de frango grelhado",
    category: "proteina",
    caloriesKcal: 165,
    proteinG: 31.0,
    fatG: 3.6,
    carbsG: 0,
    fiberG: 0,
    vitaminB3_MG: 9.8,
    vitaminB6_MG: 0.6,
    magnesium_MG: 29,
    phosphorus_MG: 210,
    zinc_MG: 1.0,
  },
  {
    name: "Ovo cozido",
    category: "proteina",
    caloriesKcal: 155,
    proteinG: 13.0,
    fatG: 11.0,
    carbsG: 1.1,
    fiberG: 0,
    vitaminA_UG: 149,
    vitaminD_UG: 1.1,
    vitaminB12_UG: 1.1,
    vitaminB2_MG: 0.5,
    phosphorus_MG: 198,
    selenium_UG: 15.8,
    choline_MG: 147,
  },
  {
    name: "Carne bovina magra grelhada",
    category: "proteina",
    caloriesKcal: 250,
    proteinG: 26.0,
    fatG: 15.0,
    carbsG: 0,
    fiberG: 0,
    vitaminB12_UG: 2.6,
    vitaminB3_MG: 5.8,
    iron_MG: 2.6,
    zinc_MG: 4.4,
    phosphorus_MG: 194,
  },
  {
    name: "Atum enlatado em água",
    category: "proteina",
    caloriesKcal: 116,
    proteinG: 25.5,
    fatG: 0.8,
    carbsG: 0,
    fiberG: 0,
    vitaminD_UG: 2.7,
    vitaminB12_UG: 2.5,
    selenium_UG: 70,
  },
  {
    name: "Feijão preto cozido",
    category: "proteina",
    caloriesKcal: 132,
    proteinG: 8.6,
    fatG: 0.5,
    carbsG: 24.0,
    fiberG: 8.5,
    sugarG: 0.3,
    iron_MG: 2.1,
    magnesium_MG: 50,
    phosphorus_MG: 140,
    vitaminB9_UG: 149,
  },
  {
    name: "Lentilha cozida",
    category: "proteina",
    caloriesKcal: 116,
    proteinG: 9.0,
    fatG: 0.4,
    carbsG: 20.1,
    fiberG: 7.9,
    sugarG: 1.8,
    iron_MG: 3.3,
    magnesium_MG: 36,
    phosphorus_MG: 180,
    vitaminB9_UG: 181,
  },

  // 🥬 VEGETAIS
  {
    name: "Brócolis cozido",
    category: "verdura",
    caloriesKcal: 35,
    proteinG: 2.4,
    fatG: 0.4,
    carbsG: 7.2,
    fiberG: 3.3,
    sugarG: 1.2,
    vitaminC_MG: 64,
    vitaminK_UG: 101,
    vitaminA_UG: 31,
    vitaminB9_UG: 63,
    potassium_MG: 230,
  },
  {
    name: "Espinafre cru",
    category: "verdura",
    caloriesKcal: 23,
    proteinG: 2.9,
    fatG: 0.4,
    carbsG: 3.6,
    fiberG: 2.2,
    sugarG: 0.4,
    vitaminA_UG: 469,
    vitaminC_MG: 28,
    vitaminK_UG: 483,
    vitaminB9_UG: 194,
    iron_MG: 2.7,
    magnesium_MG: 79,
  },
  {
    name: "Tomate cru",
    category: "verdura",
    caloriesKcal: 18,
    proteinG: 0.9,
    fatG: 0.2,
    carbsG: 3.9,
    fiberG: 1.2,
    sugarG: 2.6,
    vitaminC_MG: 14,
    vitaminA_UG: 42,
    potassium_MG: 237,
  },
  {
    name: "Cenoura crua",
    category: "verdura",
    caloriesKcal: 41,
    proteinG: 0.9,
    fatG: 0.2,
    carbsG: 9.6,
    fiberG: 2.8,
    sugarG: 4.7,
    vitaminA_UG: 835,
    vitaminK_UG: 13,
    potassium_MG: 320,
  },
  {
    name: "Alface crespa crua",
    category: "verdura",
    caloriesKcal: 15,
    proteinG: 1.4,
    fatG: 0.2,
    carbsG: 2.9,
    fiberG: 1.3,
    sugarG: 0.8,
    vitaminA_UG: 125,
    vitaminC_MG: 13,
    vitaminK_UG: 126,
    vitaminB9_UG: 38,
  },

  // 🍌 FRUTAS
  {
    name: "Banana prata",
    category: "fruta",
    caloriesKcal: 89,
    proteinG: 1.1,
    fatG: 0.3,
    carbsG: 22.8,
    fiberG: 2.6,
    sugarG: 12.2,
    vitaminC_MG: 8.7,
    vitaminB6_MG: 0.4,
    potassium_MG: 358,
  },
  {
    name: "Maçã com casca",
    category: "fruta",
    caloriesKcal: 52,
    proteinG: 0.3,
    fatG: 0.2,
    carbsG: 13.8,
    fiberG: 2.4,
    sugarG: 10.4,
    vitaminC_MG: 4.6,
    potassium_MG: 107,
  },
  {
    name: "Laranja",
    category: "fruta",
    caloriesKcal: 47,
    proteinG: 0.9,
    fatG: 0.1,
    carbsG: 11.8,
    fiberG: 2.4,
    sugarG: 9.4,
    vitaminC_MG: 53,
    potassium_MG: 181,
  },
  {
    name: "Morango",
    category: "fruta",
    caloriesKcal: 32,
    proteinG: 0.7,
    fatG: 0.3,
    carbsG: 7.7,
    fiberG: 2.0,
    sugarG: 4.9,
    vitaminC_MG: 59,
    manganese_MG: 0.4,
    potassium_MG: 153,
  },

  // 🥛 LÁCTEOS
  {
    name: "Leite integral",
    category: "lacteo",
    caloriesKcal: 61,
    proteinG: 3.2,
    fatG: 3.3,
    carbsG: 4.8,
    fiberG: 0,
    sugarG: 4.8,
    vitaminD_UG: 0.1,
    calcium_MG: 125,
    vitaminB2_MG: 0.14,
  },
  {
    name: "Queijo minas frescal",
    category: "lacteo",
    caloriesKcal: 200,
    proteinG: 15.0,
    fatG: 13.0,
    carbsG: 2.0,
    fiberG: 0,
    calcium_MG: 250,
    sodium_MG: 300,
  },
  {
    name: "Iogurte natural integral",
    category: "lacteo",
    caloriesKcal: 61,
    proteinG: 3.5,
    fatG: 3.3,
    carbsG: 4.7,
    fiberG: 0,
    calcium_MG: 121,
    vitaminB12_UG: 0.5,
  },

  // 🥑 GORDURAS
  {
    name: "Azeite de oliva",
    category: "gordura",
    caloriesKcal: 884,
    proteinG: 0,
    fatG: 100,
    carbsG: 0,
    fiberG: 0,
    vitaminE_MG: 14.4,
    vitaminK_UG: 60.2,
  },
  {
    name: "Manteiga",
    category: "gordura",
    caloriesKcal: 717,
    proteinG: 0.9,
    fatG: 81.0,
    carbsG: 0.1,
    fiberG: 0,
    vitaminA_UG: 684,
    vitaminD_UG: 1.5,
  },
  {
    name: "Abacate",
    category: "gordura",
    caloriesKcal: 160,
    proteinG: 2.0,
    fatG: 15.0,
    carbsG: 8.5,
    fiberG: 7.0,
    sugarG: 0.4,
    vitaminK_UG: 21,
    vitaminB9_UG: 81,
    potassium_MG: 485,
  },

  // OUTROS
  {
    name: "Whey protein concentrado",
    category: "suplemento",
    caloriesKcal: 363,
    proteinG: 79.0,
    fatG: 1.5,
    carbsG: 7.5,
    fiberG: 0,
    calcium_MG: 450,
    sodium_MG: 200,
  },
];

async function main() {
  console.log("🌱 Iniciando seed...");

  try {
    // Criar alimentos um por um (skipDuplicates manual)
    let createdCount = 0;
    let skippedCount = 0;

    for (const food of foods) {
      try {
        await prisma.food.create({
          data: food,
        });
        createdCount++;
      } catch (error) {
        // Se já existir (unique constraint), ignora
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          skippedCount++;
        } else {
          throw error;
        }
      }
    }

    console.log(`✅ ${createdCount} alimentos criados, ${skippedCount} ignorados`);

    // Opcional: criar alguns preços de exemplo (simulados)
    // Em produção, isso viria do scraper
    const allFoods = await prisma.food.findMany();
    console.log(`📊 Total de alimentos no banco: ${allFoods.length}`);

    // Exibir alguns alimentos como exemplo
    console.log("\n📋 Amostra de alimentos:");
    const sample = allFoods.slice(0, 5);
    sample.forEach((f) => {
      console.log(`  - ${f.name}: ${f.caloriesKcal} kcal, P:${f.proteinG}g, C:${f.carbsG}g, G:${f.fatG}g`);
    });

    console.log("\n✅ Seed concluído com sucesso!");
  } catch (error) {
    console.error("❌ Erro no seed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
