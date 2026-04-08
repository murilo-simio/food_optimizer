/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Preços médios por kg (R$) - valores simulados para demo
// Fonte: estimativas de supermercado brasileiro (2025)
const foodPrices = [
  { foodName: "Arroz branco cozido", pricePerKg: 8.0 },
  { foodName: "Arroz integral cozido", pricePerKg: 12.0 },
  { foodName: "Aveia em flocos", pricePerKg: 15.0 },
  { foodName: "Batata inglesa cozida", pricePerKg: 6.0 },
  { foodName: "Pão integral", pricePerKg: 20.0 },
  { foodName: "Peito de frango grelhado", pricePerKg: 35.0 },
  { foodName: "Ovo cozido", pricePerKg: 25.0 }, // ~R$25/kg
  { foodName: "Carne bovina magra grelhada", pricePerKg: 60.0 },
  { foodName: "Atum enlatado em água", pricePerKg: 40.0 }, // lata ~R$8 (200g)
  { foodName: "Feijão preto cozido", pricePerKg: 12.0 },
  { foodName: "Lentilha cozida", pricePerKg: 10.0 },
  { foodName: "Brócolis cozido", pricePerKg: 15.0 },
  { foodName: "Espinafre cru", pricePerKg: 12.0 },
  { foodName: "Tomate cru", pricePerKg: 8.0 },
  { foodName: "Cenoura crua", pricePerKg: 6.0 },
  { foodName: "Alface crespa crua", pricePerKg: 5.0 },
  { foodName: "Banana prata", pricePerKg: 6.0 },
  { foodName: "Maçã com casca", pricePerKg: 8.0 },
  { foodName: "Laranja", pricePerKg: 5.0 },
  { foodName: "Morango", pricePerKg: 20.0 },
  { foodName: "Leite integral", pricePerKg: 6.0 }, // R$6/L (perto de 1kg)
  { foodName: "Queijo minas frescal", pricePerKg: 40.0 },
  { foodName: "Iogurte natural integral", pricePerKg: 12.0 },
  { foodName: "Azeite de oliva", pricePerKg: 80.0 },
  { foodName: "Manteiga", pricePerKg: 60.0 },
  { foodName: "Abacate", pricePerKg: 15.0 },
  { foodName: "Whey protein concentrado", pricePerKg: 120.0 },
];

async function main() {
  console.log("💰 Iniciando seed de preços...");

  let created = 0;
  let skipped = 0;

  for (const priceInfo of foodPrices) {
    // Buscar alimento
    const food = await prisma.food.findFirst({
      where: { name: priceInfo.foodName },
    });

    if (!food) {
      console.log(`⚠️  Alimento não encontrado: ${priceInfo.foodName}`);
      skipped++;
      continue;
    }

    try {
      await prisma.foodPrice.create({
        data: {
          foodId: food.id,
          site: "simulado",
          price: priceInfo.pricePerKg / 2, // Preço por 500g médio (simulação)
          weightG: 500,
          pricePerKg: priceInfo.pricePerKg,
          collectedAt: new Date(),
        },
      });
      created++;
      console.log(`  ✓ ${food.name}: R$ ${priceInfo.pricePerKg.toFixed(2)}/kg`);
    } catch (error) {
      if (error.code === "P2002") {
        skipped++;
      } else {
        throw error;
      }
    }
  }

  console.log(`✅ ${created} preços criados, ${skipped} ignorados`);

  // Verificar preços cadastrados
  const allPrices = await prisma.foodPrice.count();
  console.log(`📊 Total de preços no banco: ${allPrices}`);
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed de preços:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
