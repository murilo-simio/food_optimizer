# Changelog â€” Food Optimizer

**Versionamento**: `v0.0.0` (desenvolvimento)  
**PrÃ³xima versÃ£o**: `v1.0.0` (MVP completo â€” Fase 5)

> Este arquivo documenta todas as mudanÃ§as no cÃ³digo. MudanÃ§as devem ser adicionadas em ordem cronolÃ³gica (mais recente no topo). Cada agente de IA deve registrar suas alteraÃ§Ãµes aqui antes de finalizar.

---
## [Desenvolvimento] - 2026-04-09

### ðŸ› CorreÃ§Ãµes

- `src/lib/auth-redirect.ts`, `src/lib/auth-redirect.test.ts`, `src/app/(app)/diet/page.tsx`, `src/app/(app)/chat/page.tsx` e `src/app/(app)/dashboard/page.tsx`: redirects para `/login` foram movidos para `useEffect`, evitando o warning de navegaÃ§Ã£o disparada durante o render.
- `src/lib/diet-customization.ts` e `src/lib/diet-customization.test.ts`: a troca manual de alimentos agora rebalanceia os pesos do alimento substituído e dos demais itens da refeição para manter calorias e macros do slot próximos ao alvo original.

### ðŸŽ¯ Funcionalidades

- `src/app/(app)/diet/page.tsx`: a tela de dieta agora abre uma geraÃ§Ã£o automÃ¡tica configurÃ¡vel com escolha de algoritmo, faixa de custo diÃ¡rio por slider e troca manual de alimentos por refeiÃ§Ã£o.
- `src/app/api/diet/generate/route.ts`: a geraÃ§Ã£o da dieta passou a aceitar algoritmo (`GREEDY` ou `LOW_COST`) e faixa de custo diÃ¡rio, usando tuning de custo com alimentos similares quando necessÃ¡rio.
- `src/app/api/foods/route.ts`, `src/app/api/foods/similar/route.ts` e `src/app/api/diet/item/route.ts`: adicionadas APIs para pesquisar/ordenar alimentos, sugerir substituiÃ§Ãµes nutricionalmente parecidas e persistir trocas manuais na dieta salva.

### ðŸŽ¨ Melhorias

- `src/lib/diet-customization.ts`: criada a camada de catÃ¡logo com preÃ§o, ordenaÃ§Ã£o, cÃ¡lculo de gramas para substituiÃ§Ã£o, sugestÃ£o de similares e ajuste fino de custo da dieta.

### ðŸŽ¯ Funcionalidades

- `src/lib/diet-customization.test.ts`: adicionados testes cobrindo ordenaÃ§Ã£o do catÃ¡logo, cÃ¡lculo de substituiÃ§Ã£o, sugestÃ£o de similares e tuning de custo.

### Ã°Å¸Ââ€º CorreÃƒÂ§ÃƒÂµes

- `prisma/seed.ts`: ajustados o tratamento de `P2002` e a tipagem da amostra final do seed para corrigir erros de TypeScript que quebravam o build no deploy da Vercel.
- `src/lib/diet-customization.ts`: adicionadas anotaÃƒÂ§ÃƒÂµes explÃƒÂ­citas em valores numÃƒÂ©ricos derivados do tuning de custo para eliminar erros de inferÃƒÂªncia do TypeScript que tambÃƒÂ©m bloqueavam o build de produÃƒÂ§ÃƒÂ£o.

- `prisma/schema.prisma`: normalizado o nome do schema principal para o caminho padrÃƒÂ£o em minÃƒÂºsculas, garantindo que o Prisma gere o client correto no ambiente Linux da Vercel.

## [Desenvolvimento] - 2026-04-08

### ðŸŽ¯ Funcionalidades

- `src/app/(app)/dieta/page.tsx`, `src/app/(app)/log/page.tsx`, `src/app/(app)/perfil/page.tsx` e `src/app/(app)/chat/page.tsx`: adicionadas rotas em portuguÃªs para a navegaÃ§Ã£o principal e criada a tela placeholder de chat.
- `src/lib/navigation.test.ts`: adicionados testes unitÃ¡rios para garantir a ordem da navegaÃ§Ã£o e o mapeamento correto das rotas canÃ´nicas e legadas.

### ðŸŽ¨ Melhorias

- `src/components/ui/bottom-nav.tsx` e `src/lib/navigation.ts`: navbar inferior expandida para `Dieta`, `Chat`, `Dashboard`, `Log` e `Perfil`, com rotas canÃ´nicas em portuguÃªs e compatibilidade de estado ativo com os caminhos antigos.

### ðŸ› CorreÃ§Ãµes

- `src/app/layout.tsx` e `src/app/layout.test.ts`: `RootLayout` agora suprime hydration mismatch no `<body>` para tolerar atributos injetados pelo cliente antes da hidrataÃ§Ã£o, como extensÃµes que adicionam `data-rm-theme`.

## [Desenvolvimento] - 2026-04-08

### ðŸŽ¨ Melhorias

- `src/lib/calculators/index.ts` e `src/lib/calculators/adapters.ts`: centralizada a montagem de `CalculatorInput` e restauradas no fluxo principal as notas explÃ­citas de micronutrientes climÃ¡ticos, incluindo clima frio e exercÃ­cio intenso.
- `src/lib/diets.ts`, `src/app/api/diet/generate/route.ts` e `src/app/api/diet/latest/route.ts`: extraÃ­dos helpers compartilhados de totais, normalizaÃ§Ã£o, custo e formataÃ§Ã£o da dieta para reduzir duplicaÃ§Ã£o entre rotas.

### ðŸŽ¯ Funcionalidades

- `src/lib/calculators/adapters.test.ts` e `src/lib/diets.test.ts`: adicionados testes unitÃ¡rios para os novos adapters e helpers de dieta, mantendo cobertura sobre a refatoraÃ§Ã£o estrutural.

## [Desenvolvimento] - 2026-04-08

### ðŸŽ¯ Funcionalidades

- `src/app/(app)/dashboard/page.tsx`: dashboard agora mostra a refeiÃ§Ã£o correspondente ao horÃ¡rio atual, permite marcar a refeiÃ§Ã£o como feita ou pulada, recalcula os cards de calorias/macros restantes e persiste esse estado por dia com reset automÃ¡tico Ã  meia-noite.
- `src/app/(app)/dashboard/page.tsx`: aÃ§Ãµes de `Pular refeiÃ§Ã£o` e `RefeiÃ§Ã£o feita` agora pedem confirmaÃ§Ã£o em dialog e, apÃ³s confirmar, o card avanÃ§a imediatamente para a prÃ³xima refeiÃ§Ã£o pendente do dia.

## [Desenvolvimento] - 2026-04-08

### ðŸŽ¨ Melhorias

- `src/lib/calculators/index.ts`, `src/lib/calculators/macros.ts`, `src/lib/calculators/micronutrients.ts` e `src/lib/calculators/climate.ts`: consolidada a orquestraÃ§Ã£o das calculadoras para reutilizar os mÃ³dulos especializados jÃ¡ existentes, remover lÃ³gica duplicada e usar o cÃ¡lculo real de micronutrientes no fluxo principal.
- `src/lib/meal-planning.ts`, `src/lib/diet-builder.ts` e `src/lib/optimizer.ts`: extraÃ­da a lÃ³gica compartilhada de distribuiÃ§Ã£o de calorias/macros por refeiÃ§Ã£o e simplificados os mÃ³dulos de dieta para reduzir drift entre o montador guloso e o otimizador.
- `src/lib/diet-builder.ts`: reforÃ§ado o parsing de preferÃªncias alimentares e corrigido o filtro de restriÃ§Ãµes vegetarianas/veganas para ficar mais previsÃ­vel e menos frÃ¡gil a precedÃªncia de operadores.
- `eslint.config.mjs`: adicionado ignore para `coverage/` para manter o lint limpo mesmo apÃ³s geraÃ§Ã£o local de relatÃ³rios de teste.

## [Desenvolvimento] - 2026-04-08

### ðŸŽ¯ Funcionalidades

- `src/lib/calculators/index.test.ts`, `src/lib/calculators/micronutrients.test.ts`, `src/lib/diet-builder.test.ts` e `src/lib/optimizer.test.ts`: adicionada suÃ­te inicial de testes unitÃ¡rios cobrindo cÃ¡lculo nutricional, micronutrientes, geraÃ§Ã£o gulosa de dieta e otimizaÃ§Ã£o por custo.
- `src/lib/optimizer.ts`: adicionados suporte a `priceMap` e resoluÃ§Ã£o de preferÃªncias/aversÃµes por nome ou ID para permitir testes reais de otimizaÃ§Ã£o por custo e alinhar o comportamento com os dados vindos do perfil do usuÃ¡rio.

### âš™ï¸ ConfiguraÃ§Ã£o

- `package.json` e `vitest.config.ts`: configurado `Vitest` com scripts `test`, `test:watch` e `test:coverage` para tornar a execuÃ§Ã£o de testes parte do fluxo padrÃ£o do projeto.

### ðŸ“¦ Estrutura

- `src/test/factories.ts`: criado conjunto de factories tipadas para montar fixtures consistentes de `Food`, `UserProfile` e `TasteProfile` nos testes.

### ðŸŽ¨ Melhorias

- `src/app/api/diet/generate/route.ts`, `src/app/(app)/dashboard/page.tsx`, `src/lib/diet-builder.ts` e `prisma/seed-prices.js`: removidos pontos de atrito de lint/type safety para manter a base coerente com o novo fluxo orientado a testes.
- `AGENTS.md`, `README.md` e `PROJECT_SPEC.md`: documentado o processo TDD como padrÃ£o de desenvolvimento do projeto.

## [Desenvolvimento] - 2026-04-08

### ðŸ› CorreÃ§Ãµes

- `src/app/api/diet/generate/route.ts`: adicionada a importaÃ§Ã£o de `distributeCaloriesBySlot` para corrigir o `ReferenceError` no `POST /api/diet/generate` ao otimizar a dieta por custo.
- `src/app/(app)/diet/page.tsx`: corrigida a renderizaÃ§Ã£o da tela `/diet` para consumir o payload real da API com tipagem explÃ­cita, sem acessar `item.food` inexistente.
- `src/app/api/diet/generate/route.ts` e `src/app/api/diet/latest/route.ts`: incluÃ­do `mealSlot` nos alimentos retornados e persistido `estimatedCost` ao salvar a dieta gerada.
- `src/app/api/diet/generate/route.ts`: normalizados campos opcionais do perfil (`null` â†’ `undefined`) para compatibilizar a chamada de `calculateNutrition` com o tipo `CalculatorInput`.
- `src/app/api/diet/generate/route.ts`: adicionada uma normalizaÃ§Ã£o final dos alimentos gerados para aproximar os macros da dieta Ã s metas calculadas do perfil antes de salvar e retornar o resultado.
- `src/lib/optimizer.ts`: separado o tipo interno de seleÃ§Ã£o de alimentos do tipo final com `mealSlot` para corrigir a tipagem do build sem alterar a lÃ³gica do otimizador.
- `prisma/seed.ts`: corrigido o `catch` com `Prisma.PrismaClientKnownRequestError` para eliminar a falha de typecheck no build.

## [Desenvolvimento] - 2026-04-07

### ðŸŽ¯ Fase 2.2 - Montador de Dieta (Passo 2)

**Algoritmo guloso para montagem automÃ¡tica de dietas:**

- **MÃ³dulo `src/lib/diet-builder.ts`**:
  - `generateDietGreedy()`: funÃ§Ã£o principal que monta dieta
  - Filtra alimentos por restriÃ§Ãµes (VEGAN, VEGETARIAN, LACTOSE_FREE, GLUTEN_FREE, LOW_CARB, KETO)
  - Exclui aversÃµes do usuÃ¡rio (de `TasteProfile`)
  - Prioriza `stapleFoods` (alimentos do dia-a-dia) quando disponÃ­veis
  - Distribui calorias por `mealSlot`:
    * CafÃ© da manhÃ£: 25% do total
    * AlmoÃ§o: 35%
    * Jantar: 30%
    * Lanches: 10% (5% cada)
  - DistribuiÃ§Ã£o de macros por refeiÃ§Ã£o:
    * CafÃ©: 25% P, 25% G, 50% C
    * AlmoÃ§o: 30% P, 30% G, 40% C
    * Jantar: 35% P, 35% G, 30% C
    * Lanches: 20% P, 20% G, 60% C
  - Seleciona alimentos por categoria:
    * ProteÃ­nas: categoria "proteina" ou "lacteo"
    * Carboidratos: "carboidrato" ou "fruta"
    * Gorduras: "gordura"
    * Vegetais: "verdura"
  - Ajusta scaling para bater meta calÃ³rica (Â±50 kcal tolerance)
  - Retorna: `DietFood[]`, totais nutricionais, notas

- **API routes**:
  - `POST /api/diet/generate`:
    * Recebe `{ userId }`
    * Busca perfil, tasteProfile, alimentos
    * Chama `calculateNutrition()` para metas
    * Chama `generateDietGreedy()`
    * Salva no banco: `Diet` + `FoodInDiet`
    * Retorna dieta completa com resumo
  - `GET /api/diet/latest?userId=...`:
    * Retorna dieta mais recente do usuÃ¡rio
    * Inclui alimentos formatados com valores nutricionais por porÃ§Ã£o

- **PÃ¡gina `src/app/(app)/diet/page.tsx`**:
  * Exibe refeiÃ§Ãµes agrupadas por mealSlot
  * Cards com totais nutricionais (cal, P, C, G)
  * BotÃ£o "Gerar Dieta Agora" se nÃ£o houver dieta
  * BotÃ£o "Gerar Nova Dieta" para substituir atual
  * Design mobile-first, dark mode

**OtimizaÃ§Ã£o por custo (Passo 3):**
- **MÃ³dulo `src/lib/optimizer.ts`**:
  - `optimizeDietCost()`: refina dieta buscando menor custo total
  - HeurÃ­stica: prioriza alimentos com melhor custo por nutriente (proteÃ­na, carboidrato)
  - Usa preÃ§os de `FoodPrice` (preÃ§o por 100g)
  - Garante constraints de macros (Â±5% das metas)
  - Garante variedade mÃ­nima (3 categorias diferentes)
  - Considera preferÃªncias (staple foods) e aversÃµes
  - Retorna `OptimizedDiet` com custo total calculado

- **Seed de preÃ§os** (`prisma/seed-prices.js`):
  - 27 preÃ§os simulados baseados em mercado brasileiro
  - PreÃ§os por kg variam: arroz R$8-12, frango R$35, whey R$120, azeite R$80, etc.
  - Executar: `node prisma/seed-prices.js`
  - Armazenado em `FoodPrice` (modelo jÃ¡ existente no schema)

- **IntegraÃ§Ã£o na API** (`/api/diet/generate`):
  - Gera dieta inicial com `generateDietGreedy()`
  - Busca preÃ§os do banco (`FoodPrice`)
  - Se houver preÃ§os para â‰¥3 alimentos, aplica `optimizeDietCost()`
  - Substitui dieta pela versÃ£o otimizada com `estimatedCost` preenchido
  - Adiciona nota: "Otimizado por custo com base nos preÃ§os disponÃ­veis."

**Resultado:** Dieta agora possui custo estimado (R$/dia) e prioriza alimentos mais econÃ´micos quando nutricionalmente adequados.

**PrÃ³ximas melhorias (Fase 2.3+):**
- Integrar solver simplex para Ã³timo global (ex: biblioteca `linear-programming`)
- Scraper de preÃ§os reais (supermercados online)
- Ajuste fino por micronutrientes (ex: "aumentar ferro")
- Considerar disponibilidade regional (alimentos da Ã©poca, regiÃ£o)

### ðŸŽ¯ Fase 2.2 - Tabela Nutricional (Passo 1)

**Adicionada tabela nutricional de alimentos com seed inicial:**

- **Modelo Food (Prisma)**: expandido com campos de minerais adicionais:
  - `phosphorus_MG`, `choline_MG`, `manganese_MG` (todos @default(0))
- **Seed completo** (`prisma/seed.ts`): 27 alimentos bÃ¡sicos
  - Categorias: carboidrato, proteina, verdura, fruta, lacteo, gordura, suplemento
  - Valores nutricionais por 100g: calorias, macros, fibras, aÃ§Ãºcares
  - Vitaminas: A, C, D, E, K, B1, B2, B3, B5, B6, B9 (folate), B12
  - Minerais: cÃ¡lcio, ferro, magnÃ©sio, zinco, potÃ¡ssio, sÃ³dio, selÃªnio, fÃ³sforo, colina, manganÃªs
  - Fontes: TACO (Tabela Brasileira) e USDA
  - Alimentos incluÃ­dos: arroz branco/integral, aveia, batata, pÃ£o integral, frango, ovo, carne bovina, atum, feijÃ£o preto, lentilha, brÃ³colis, espinafre, tomate, cenoura, alface, banana, maÃ§Ã£, laranja, morango, leite, queijo minas, iogurte, azeite, manteiga, abacate, whey protein
- **ConfiguraÃ§Ã£o**: `package.json` adiciona `"prisma.seed": "tsx prisma/seed.ts"`
- **ExecuÃ§Ã£o**: `npx tsx prisma/seed.ts` cria 27 registros (skip de duplicatas automÃ¡tico)

### ðŸŽ¯ Fase 2.1 - Sistema de Calculadoras Nutricionais

**Implementado sistema modular de cÃ¡lculo nutricional com base em evidÃªncias cientÃ­ficas:**

- **`src/lib/calculators/`**: Nova pasta com sistema de calculadoras modulares
  - `types.ts`: Tipos compartilhados (UserProfile, CalculatorInput, CalculatorResult, etc.)
  - `bmr.ts`: CÃ¡lculo de Taxa MetabÃ³lica Basal (Mifflin-St Jeor, 2005)
  - `exercise.ts`: Ajustes por exercÃ­cio fÃ­sico (gasto calÃ³rico, proteÃ­na extra por tipo de treino)
  - `work.ts`: Ajustes por tipo de trabalho (NEAT - Non-Exercise Activity Thermogenesis)
  - `climate.ts`: Ajustes geogrÃ¡ficos/climÃ¡ticos (vitamina D, eletrÃ³litos)
  - `macros.ts`: DistribuiÃ§Ã£o de macronutrientes (proteÃ­na, gordura, carboidrato, fibra)
  - `micronutrients.ts`: Necessidades de vitaminas e minerais (DRI, WHO, EFSA)
  - `index.ts`: FunÃ§Ã£o principal `calculateNutrition()` que combina todos os ajustes

**CaracterÃ­sticas cientÃ­ficas:**
- FÃ³rmulas baseadas em literatura revisada (Mifflin-St Jeor, ISSN, Dietary Guidelines, DRI)
- Ajuste por exercÃ­cio de resistÃªncia vs endurance (diferentes necessidades proteicas)
- ConsideraÃ§Ã£o de clima/geografia: vit D multiplicador para paÃ­ses frios, eletrÃ³litos para climas quentes
- Ajuste por tipo de trabalho (CLT 9-5, home office, turnos, etc.) via NEAT
- Meta calÃ³rica com dÃ©ficit/superÃ¡vit baseada no objetivo
- CÃ¡lculo de Ã¡gua considerando peso, exercÃ­cio e clima
- Modulares: cada calculadora independente, facilitando ajustes futuros e integraÃ§Ã£o com tracking

**IntegraÃ§Ã£o com formulÃ¡rio de onboarding:**
- Adicionado campo "Tipo de exercÃ­cio principal" no passo de ExercÃ­cio (StepExercicio) para coletar `primaryExerciseType`
- Isso permite identificar exercÃ­cios de resistÃªncia (musculaÃ§Ã£o, crossfit, HIIT, calistenia) e ajustar a proteÃ­na adequadamente
- Anteriormente, `primaryExerciseType` permanecia undefined, fazendo com que `hasResistanceExercise` fosse sempre false

**Melhoria no cÃ¡lculo de proteÃ­na** (src/lib/calculators/index.ts:136-157):
- LÃ³gica de detecÃ§Ã£o de exercÃ­cio de resistÃªncia aprimorada:
  - Tipos de resistÃªncia direta: WEIGHTLIFTING, CROSSFIT, HIIT, CALISTHENICS (qualquer frequÃªncia)
  - Tipos de endurance com alta intensidade: RUNNING, CYCLING, SWIMMING, MARTIAL_ARTS apenas se `exerciseIntensity = INTENSE` **e** `exerciseFrequencyDays >= 2`
- Considera agora frequÃªncia e intensidade, nÃ£o apenas o tipo

**Melhoria de UX no onboarding:**
- Adicionada explicaÃ§Ã£o ao lado do campo "Tipo de exercÃ­cio principal" descrevendo como a escolha afeta as necessidades de proteÃ­na (src/app/(app)/onboarding/page.tsx:491-498)
- Texto de ajuda: "ExercÃ­cios de resistÃªncia (musculaÃ§Ã£o, HIIT, etc.) requerem mais proteÃ­na para construÃ§Ã£o/recuperaÃ§Ã£o muscular."

**IntegraÃ§Ã£o com API:**
- `src/app/api/onboarding/route.ts` atualizado para usar `calculateNutrition()` em vez da lÃ³gica antiga
- Retorna agora: mÃ©tricas completas, micronutrientes, ajustes aplicados e notas explicativas
- Todas as validaÃ§Ãµes Zod mantidas

### ðŸ› CorreÃ§Ãµes de Bugs

- **CodificaÃ§Ã£o de caracteres**: Corrigidas sequÃªncias de escape Latin-1 (`\xED`, `\xE7`, `\xE3`, etc.) em `src/app/(app)/tracking/page.tsx`. Todos os acentos agora usam UTF-8 correto.
- **Sintaxe TypeScript**: Removida funÃ§Ã£o `StepLabel` nÃ£o utilizada que causava erro de fechamento em `src/app/(app)/onboarding/page.tsx`.
- **Error handling**: Melhorado tratamento de erros no dashboard (`src/app/(app)/dashboard/page.tsx`) com async/await e try-catch.
- **Onboarding complete**: Endpoint `/api/onboarding/complete` corrigido â€” agora verifica existÃªncia do perfil em vez de criar `OnboardingAnswer` (src/app/api/onboarding/complete/route.ts).
- **Parsing de refeiÃ§Ãµes**: Mensagem de erro mais clara no formulÃ¡rio de refeiÃ§Ãµes (`tracking/page.tsx`).

### ðŸŽ¨ Melhorias de Acessibilidade

- Garantido `min-h-[44px]` em todos os botÃµes interativos
- Elementos semÃ¢nticos mantidos (`<button>`, `<label>`, `<nav>`)
- Contraste de cores conforme design system (foreground/background)

### ðŸ“¦ Estrutura e ConfiguraÃ§Ã£o

- Schema Prisma revisado com todos os modelos necessÃ¡rios para Fase 1-6
- API routes configuradas com NextResponse e validaÃ§Ã£o Zod
- AutenticaÃ§Ã£o com next-auth v5 (credentials provider)
- Rotas protegidas com redirecionamento para onboarding quando necessÃ¡rio

### ðŸ“„ DocumentaÃ§Ã£o

- Criada memÃ³ria persistente em `memory/` com contexto do projeto
- Revisados e validados todos os arquivos .md da raiz (AGENTS.md, DESIGN_SYSTEM.md, NUTRITIONIST_IA.md, PROJECT_SPEC.md, README.md)
- **Adicionado CHANGELOG.md** para rastrear todas as mudanÃ§as
- **Atualizado AGENTS.md** com seÃ§Ã£o obrigatÃ³ria de registro no changelog para todos os agentes

---

### ðŸ› CorreÃ§Ãµes de Bugs

- **API profile**: endpoint `/api/profile` agora retorna `profile` com todos os dados calculados (tdee, targetCalories, macros) para que o dashboard possa exibir as mÃ©tricas nutricionais (src/app/api/profile/route.ts:25-27)
- **Dashboard**: atualizado para consumir `profile` da API e exibir valores de calorias, proteÃ­na, carbos e gordura nos cards (src/app/(app)/dashboard/page.tsx:12, 75-82)
- **Calculadoras**: removida referÃªncia a `input.profile.latitude` que nÃ£o existe no tipo `UserProfile` â€” agora usa fallback baseado em paÃ­s (src/lib/calculators/index.ts:107-108)

---

## [ PrÃ©-Fase 1 ] - Commit Inicial

### ðŸŽ¯ Funcionalidades Implementadas

- **AutenticaÃ§Ã£o**: Registro e login com bcrypt
- **Onboarding**: FormulÃ¡rio em 6 passos com validaÃ§Ã£o Zod
  - Dados Pessoais (idade, sexo, paÃ­s, estado, cidade)
  - Dados Corporais (altura, peso, % gordura)
  - ExercÃ­cio FÃ­sico (nÃ­vel de atividade, frequÃªncia, duraÃ§Ã£o, intensidade)
  - HÃ¡bitos e Rotina (refeiÃ§Ãµes/dia, rotina de trabalho, restriÃ§Ãµes alimentares, orÃ§amento)
  - Sabor e PreferÃªncias (alimentos do dia-a-dia, aversÃµes)
  - Objetivo (FAT_LOSS, MUSCLE_GAIN, MAINTENANCE, PERFORMANCE)
- **Profile API**: CÃ¡lculo automÃ¡tico de TDEE, macros (proteÃ­na, gordura, carboidratos) baseado no objetivo
- **Taste Profile**: Armazenamento de preferÃªncias alimentares
- **Tracking**: Registro de peso, exercÃ­cios e refeiÃ§Ãµes
- **Dashboard**: PÃ¡gina inicial com redirecionamento para onboarding se necessÃ¡rio

### ðŸ—„ï¸ Banco de Dados

- Modelos: User, UserProfile, TasteProfile, OnboardingAnswer, BodyRecord, ExerciseLog, MealLog, MealLogItem
- Enums: Sex, ActivityLevel, Goal, WorkRoutine, DietaryRestriction, ExerciseType, IntensityLevel
- Relacionamentos e constraints configurados

### ðŸŽ¨ Design System

- Dark mode first (#121212 background)
- Paleta de cores: accent verde (142 70% 45%), ai-accent roxo (260 60% 55%)
- Tipografia: Inter (sans) + JetBrains Mono (nÃºmeros)
- Componentes shadcn/ui-style customizados
- Mobile-first (min-h-[44px] para toque)

### âš™ï¸ ConfiguraÃ§Ã£o TÃ©cnica

- Next.js 15+ com App Router
- TypeScript strict mode
- Tailwind CSS com CSS variables
- Prisma ORM (SQLite dev)
- next-auth v5
- ValidaÃ§Ã£o de inputs com Zod
- API routes com NextResponse
- Server Components por padrÃ£o

---

## ConvenÃ§Ãµes do Changelog

- **Categorias**: ðŸŽ¯ Funcionalidades, ðŸ› CorreÃ§Ãµes, ðŸŽ¨ Melhorias, ðŸ“¦ Estrutura, ðŸ“„ DocumentaÃ§Ã£o, âš™ï¸ ConfiguraÃ§Ã£o, ðŸ”§ RefatoraÃ§Ã£o
- **Formato**: `[Version] - YYYY-MM-DD` (ou `[Desenvolvimento]` para commits entre versÃµes)
- **Responsabilidade**: Todo agente de IA deve adicionar suas mudanÃ§as aqui antes de concluir a tarefa
- **Versionamento**: `v0.0.0` durante desenvolvimento; `v1.0.0` quando MVP (Fase 5) estiver funcional
