# Changelog — Food Optimizer

**Versionamento**: `v0.0.0` (desenvolvimento)  
**Próxima versão**: `v1.0.0` (MVP completo — Fase 5)

> Este arquivo documenta todas as mudanças no código. Mudanças devem ser adicionadas em ordem cronológica (mais recente no topo). Cada agente de IA deve registrar suas alterações aqui antes de finalizar.

---
## [Desenvolvimento] - 2026-04-08

### 🎯 Funcionalidades

- `src/app/(app)/dieta/page.tsx`, `src/app/(app)/log/page.tsx`, `src/app/(app)/perfil/page.tsx` e `src/app/(app)/chat/page.tsx`: adicionadas rotas em português para a navegação principal e criada a tela placeholder de chat.
- `src/lib/navigation.test.ts`: adicionados testes unitários para garantir a ordem da navegação e o mapeamento correto das rotas canônicas e legadas.

### 🎨 Melhorias

- `src/components/ui/bottom-nav.tsx` e `src/lib/navigation.ts`: navbar inferior expandida para `Dieta`, `Chat`, `Dashboard`, `Log` e `Perfil`, com rotas canônicas em português e compatibilidade de estado ativo com os caminhos antigos.

## [Desenvolvimento] - 2026-04-08

### 🎨 Melhorias

- `src/lib/calculators/index.ts` e `src/lib/calculators/adapters.ts`: centralizada a montagem de `CalculatorInput` e restauradas no fluxo principal as notas explícitas de micronutrientes climáticos, incluindo clima frio e exercício intenso.
- `src/lib/diets.ts`, `src/app/api/diet/generate/route.ts` e `src/app/api/diet/latest/route.ts`: extraídos helpers compartilhados de totais, normalização, custo e formatação da dieta para reduzir duplicação entre rotas.

### 🎯 Funcionalidades

- `src/lib/calculators/adapters.test.ts` e `src/lib/diets.test.ts`: adicionados testes unitários para os novos adapters e helpers de dieta, mantendo cobertura sobre a refatoração estrutural.

## [Desenvolvimento] - 2026-04-08

### 🎯 Funcionalidades

- `src/app/(app)/dashboard/page.tsx`: dashboard agora mostra a refeição correspondente ao horário atual, permite marcar a refeição como feita ou pulada, recalcula os cards de calorias/macros restantes e persiste esse estado por dia com reset automático à meia-noite.
- `src/app/(app)/dashboard/page.tsx`: ações de `Pular refeição` e `Refeição feita` agora pedem confirmação em dialog e, após confirmar, o card avança imediatamente para a próxima refeição pendente do dia.

## [Desenvolvimento] - 2026-04-08

### 🎨 Melhorias

- `src/lib/calculators/index.ts`, `src/lib/calculators/macros.ts`, `src/lib/calculators/micronutrients.ts` e `src/lib/calculators/climate.ts`: consolidada a orquestração das calculadoras para reutilizar os módulos especializados já existentes, remover lógica duplicada e usar o cálculo real de micronutrientes no fluxo principal.
- `src/lib/meal-planning.ts`, `src/lib/diet-builder.ts` e `src/lib/optimizer.ts`: extraída a lógica compartilhada de distribuição de calorias/macros por refeição e simplificados os módulos de dieta para reduzir drift entre o montador guloso e o otimizador.
- `src/lib/diet-builder.ts`: reforçado o parsing de preferências alimentares e corrigido o filtro de restrições vegetarianas/veganas para ficar mais previsível e menos frágil a precedência de operadores.
- `eslint.config.mjs`: adicionado ignore para `coverage/` para manter o lint limpo mesmo após geração local de relatórios de teste.

## [Desenvolvimento] - 2026-04-08

### 🎯 Funcionalidades

- `src/lib/calculators/index.test.ts`, `src/lib/calculators/micronutrients.test.ts`, `src/lib/diet-builder.test.ts` e `src/lib/optimizer.test.ts`: adicionada suíte inicial de testes unitários cobrindo cálculo nutricional, micronutrientes, geração gulosa de dieta e otimização por custo.
- `src/lib/optimizer.ts`: adicionados suporte a `priceMap` e resolução de preferências/aversões por nome ou ID para permitir testes reais de otimização por custo e alinhar o comportamento com os dados vindos do perfil do usuário.

### ⚙️ Configuração

- `package.json` e `vitest.config.ts`: configurado `Vitest` com scripts `test`, `test:watch` e `test:coverage` para tornar a execução de testes parte do fluxo padrão do projeto.

### 📦 Estrutura

- `src/test/factories.ts`: criado conjunto de factories tipadas para montar fixtures consistentes de `Food`, `UserProfile` e `TasteProfile` nos testes.

### 🎨 Melhorias

- `src/app/api/diet/generate/route.ts`, `src/app/(app)/dashboard/page.tsx`, `src/lib/diet-builder.ts` e `prisma/seed-prices.js`: removidos pontos de atrito de lint/type safety para manter a base coerente com o novo fluxo orientado a testes.
- `AGENTS.md`, `README.md` e `PROJECT_SPEC.md`: documentado o processo TDD como padrão de desenvolvimento do projeto.

## [Desenvolvimento] - 2026-04-08

### 🐛 Correções

- `src/app/api/diet/generate/route.ts`: adicionada a importação de `distributeCaloriesBySlot` para corrigir o `ReferenceError` no `POST /api/diet/generate` ao otimizar a dieta por custo.
- `src/app/(app)/diet/page.tsx`: corrigida a renderização da tela `/diet` para consumir o payload real da API com tipagem explícita, sem acessar `item.food` inexistente.
- `src/app/api/diet/generate/route.ts` e `src/app/api/diet/latest/route.ts`: incluído `mealSlot` nos alimentos retornados e persistido `estimatedCost` ao salvar a dieta gerada.
- `src/app/api/diet/generate/route.ts`: normalizados campos opcionais do perfil (`null` → `undefined`) para compatibilizar a chamada de `calculateNutrition` com o tipo `CalculatorInput`.
- `src/app/api/diet/generate/route.ts`: adicionada uma normalização final dos alimentos gerados para aproximar os macros da dieta às metas calculadas do perfil antes de salvar e retornar o resultado.
- `src/lib/optimizer.ts`: separado o tipo interno de seleção de alimentos do tipo final com `mealSlot` para corrigir a tipagem do build sem alterar a lógica do otimizador.
- `prisma/seed.ts`: corrigido o `catch` com `Prisma.PrismaClientKnownRequestError` para eliminar a falha de typecheck no build.

## [Desenvolvimento] - 2026-04-07

### 🎯 Fase 2.2 - Montador de Dieta (Passo 2)

**Algoritmo guloso para montagem automática de dietas:**

- **Módulo `src/lib/diet-builder.ts`**:
  - `generateDietGreedy()`: função principal que monta dieta
  - Filtra alimentos por restrições (VEGAN, VEGETARIAN, LACTOSE_FREE, GLUTEN_FREE, LOW_CARB, KETO)
  - Exclui aversões do usuário (de `TasteProfile`)
  - Prioriza `stapleFoods` (alimentos do dia-a-dia) quando disponíveis
  - Distribui calorias por `mealSlot`:
    * Café da manhã: 25% do total
    * Almoço: 35%
    * Jantar: 30%
    * Lanches: 10% (5% cada)
  - Distribuição de macros por refeição:
    * Café: 25% P, 25% G, 50% C
    * Almoço: 30% P, 30% G, 40% C
    * Jantar: 35% P, 35% G, 30% C
    * Lanches: 20% P, 20% G, 60% C
  - Seleciona alimentos por categoria:
    * Proteínas: categoria "proteina" ou "lacteo"
    * Carboidratos: "carboidrato" ou "fruta"
    * Gorduras: "gordura"
    * Vegetais: "verdura"
  - Ajusta scaling para bater meta calórica (±50 kcal tolerance)
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
    * Retorna dieta mais recente do usuário
    * Inclui alimentos formatados com valores nutricionais por porção

- **Página `src/app/(app)/diet/page.tsx`**:
  * Exibe refeições agrupadas por mealSlot
  * Cards com totais nutricionais (cal, P, C, G)
  * Botão "Gerar Dieta Agora" se não houver dieta
  * Botão "Gerar Nova Dieta" para substituir atual
  * Design mobile-first, dark mode

**Otimização por custo (Passo 3):**
- **Módulo `src/lib/optimizer.ts`**:
  - `optimizeDietCost()`: refina dieta buscando menor custo total
  - Heurística: prioriza alimentos com melhor custo por nutriente (proteína, carboidrato)
  - Usa preços de `FoodPrice` (preço por 100g)
  - Garante constraints de macros (±5% das metas)
  - Garante variedade mínima (3 categorias diferentes)
  - Considera preferências (staple foods) e aversões
  - Retorna `OptimizedDiet` com custo total calculado

- **Seed de preços** (`prisma/seed-prices.js`):
  - 27 preços simulados baseados em mercado brasileiro
  - Preços por kg variam: arroz R$8-12, frango R$35, whey R$120, azeite R$80, etc.
  - Executar: `node prisma/seed-prices.js`
  - Armazenado em `FoodPrice` (modelo já existente no schema)

- **Integração na API** (`/api/diet/generate`):
  - Gera dieta inicial com `generateDietGreedy()`
  - Busca preços do banco (`FoodPrice`)
  - Se houver preços para ≥3 alimentos, aplica `optimizeDietCost()`
  - Substitui dieta pela versão otimizada com `estimatedCost` preenchido
  - Adiciona nota: "Otimizado por custo com base nos preços disponíveis."

**Resultado:** Dieta agora possui custo estimado (R$/dia) e prioriza alimentos mais econômicos quando nutricionalmente adequados.

**Próximas melhorias (Fase 2.3+):**
- Integrar solver simplex para ótimo global (ex: biblioteca `linear-programming`)
- Scraper de preços reais (supermercados online)
- Ajuste fino por micronutrientes (ex: "aumentar ferro")
- Considerar disponibilidade regional (alimentos da época, região)

### 🎯 Fase 2.2 - Tabela Nutricional (Passo 1)

**Adicionada tabela nutricional de alimentos com seed inicial:**

- **Modelo Food (Prisma)**: expandido com campos de minerais adicionais:
  - `phosphorus_MG`, `choline_MG`, `manganese_MG` (todos @default(0))
- **Seed completo** (`prisma/seed.ts`): 27 alimentos básicos
  - Categorias: carboidrato, proteina, verdura, fruta, lacteo, gordura, suplemento
  - Valores nutricionais por 100g: calorias, macros, fibras, açúcares
  - Vitaminas: A, C, D, E, K, B1, B2, B3, B5, B6, B9 (folate), B12
  - Minerais: cálcio, ferro, magnésio, zinco, potássio, sódio, selênio, fósforo, colina, manganês
  - Fontes: TACO (Tabela Brasileira) e USDA
  - Alimentos incluídos: arroz branco/integral, aveia, batata, pão integral, frango, ovo, carne bovina, atum, feijão preto, lentilha, brócolis, espinafre, tomate, cenoura, alface, banana, maçã, laranja, morango, leite, queijo minas, iogurte, azeite, manteiga, abacate, whey protein
- **Configuração**: `package.json` adiciona `"prisma.seed": "tsx prisma/seed.ts"`
- **Execução**: `npx tsx prisma/seed.ts` cria 27 registros (skip de duplicatas automático)

### 🎯 Fase 2.1 - Sistema de Calculadoras Nutricionais

**Implementado sistema modular de cálculo nutricional com base em evidências científicas:**

- **`src/lib/calculators/`**: Nova pasta com sistema de calculadoras modulares
  - `types.ts`: Tipos compartilhados (UserProfile, CalculatorInput, CalculatorResult, etc.)
  - `bmr.ts`: Cálculo de Taxa Metabólica Basal (Mifflin-St Jeor, 2005)
  - `exercise.ts`: Ajustes por exercício físico (gasto calórico, proteína extra por tipo de treino)
  - `work.ts`: Ajustes por tipo de trabalho (NEAT - Non-Exercise Activity Thermogenesis)
  - `climate.ts`: Ajustes geográficos/climáticos (vitamina D, eletrólitos)
  - `macros.ts`: Distribuição de macronutrientes (proteína, gordura, carboidrato, fibra)
  - `micronutrients.ts`: Necessidades de vitaminas e minerais (DRI, WHO, EFSA)
  - `index.ts`: Função principal `calculateNutrition()` que combina todos os ajustes

**Características científicas:**
- Fórmulas baseadas em literatura revisada (Mifflin-St Jeor, ISSN, Dietary Guidelines, DRI)
- Ajuste por exercício de resistência vs endurance (diferentes necessidades proteicas)
- Consideração de clima/geografia: vit D multiplicador para países frios, eletrólitos para climas quentes
- Ajuste por tipo de trabalho (CLT 9-5, home office, turnos, etc.) via NEAT
- Meta calórica com déficit/superávit baseada no objetivo
- Cálculo de água considerando peso, exercício e clima
- Modulares: cada calculadora independente, facilitando ajustes futuros e integração com tracking

**Integração com formulário de onboarding:**
- Adicionado campo "Tipo de exercício principal" no passo de Exercício (StepExercicio) para coletar `primaryExerciseType`
- Isso permite identificar exercícios de resistência (musculação, crossfit, HIIT, calistenia) e ajustar a proteína adequadamente
- Anteriormente, `primaryExerciseType` permanecia undefined, fazendo com que `hasResistanceExercise` fosse sempre false

**Melhoria no cálculo de proteína** (src/lib/calculators/index.ts:136-157):
- Lógica de detecção de exercício de resistência aprimorada:
  - Tipos de resistência direta: WEIGHTLIFTING, CROSSFIT, HIIT, CALISTHENICS (qualquer frequência)
  - Tipos de endurance com alta intensidade: RUNNING, CYCLING, SWIMMING, MARTIAL_ARTS apenas se `exerciseIntensity = INTENSE` **e** `exerciseFrequencyDays >= 2`
- Considera agora frequência e intensidade, não apenas o tipo

**Melhoria de UX no onboarding:**
- Adicionada explicação ao lado do campo "Tipo de exercício principal" descrevendo como a escolha afeta as necessidades de proteína (src/app/(app)/onboarding/page.tsx:491-498)
- Texto de ajuda: "Exercícios de resistência (musculação, HIIT, etc.) requerem mais proteína para construção/recuperação muscular."

**Integração com API:**
- `src/app/api/onboarding/route.ts` atualizado para usar `calculateNutrition()` em vez da lógica antiga
- Retorna agora: métricas completas, micronutrientes, ajustes aplicados e notas explicativas
- Todas as validações Zod mantidas

### 🐛 Correções de Bugs

- **Codificação de caracteres**: Corrigidas sequências de escape Latin-1 (`\xED`, `\xE7`, `\xE3`, etc.) em `src/app/(app)/tracking/page.tsx`. Todos os acentos agora usam UTF-8 correto.
- **Sintaxe TypeScript**: Removida função `StepLabel` não utilizada que causava erro de fechamento em `src/app/(app)/onboarding/page.tsx`.
- **Error handling**: Melhorado tratamento de erros no dashboard (`src/app/(app)/dashboard/page.tsx`) com async/await e try-catch.
- **Onboarding complete**: Endpoint `/api/onboarding/complete` corrigido — agora verifica existência do perfil em vez de criar `OnboardingAnswer` (src/app/api/onboarding/complete/route.ts).
- **Parsing de refeições**: Mensagem de erro mais clara no formulário de refeições (`tracking/page.tsx`).

### 🎨 Melhorias de Acessibilidade

- Garantido `min-h-[44px]` em todos os botões interativos
- Elementos semânticos mantidos (`<button>`, `<label>`, `<nav>`)
- Contraste de cores conforme design system (foreground/background)

### 📦 Estrutura e Configuração

- Schema Prisma revisado com todos os modelos necessários para Fase 1-6
- API routes configuradas com NextResponse e validação Zod
- Autenticação com next-auth v5 (credentials provider)
- Rotas protegidas com redirecionamento para onboarding quando necessário

### 📄 Documentação

- Criada memória persistente em `memory/` com contexto do projeto
- Revisados e validados todos os arquivos .md da raiz (AGENTS.md, DESIGN_SYSTEM.md, NUTRITIONIST_IA.md, PROJECT_SPEC.md, README.md)
- **Adicionado CHANGELOG.md** para rastrear todas as mudanças
- **Atualizado AGENTS.md** com seção obrigatória de registro no changelog para todos os agentes

---

### 🐛 Correções de Bugs

- **API profile**: endpoint `/api/profile` agora retorna `profile` com todos os dados calculados (tdee, targetCalories, macros) para que o dashboard possa exibir as métricas nutricionais (src/app/api/profile/route.ts:25-27)
- **Dashboard**: atualizado para consumir `profile` da API e exibir valores de calorias, proteína, carbos e gordura nos cards (src/app/(app)/dashboard/page.tsx:12, 75-82)
- **Calculadoras**: removida referência a `input.profile.latitude` que não existe no tipo `UserProfile` — agora usa fallback baseado em país (src/lib/calculators/index.ts:107-108)

---

## [ Pré-Fase 1 ] - Commit Inicial

### 🎯 Funcionalidades Implementadas

- **Autenticação**: Registro e login com bcrypt
- **Onboarding**: Formulário em 6 passos com validação Zod
  - Dados Pessoais (idade, sexo, país, estado, cidade)
  - Dados Corporais (altura, peso, % gordura)
  - Exercício Físico (nível de atividade, frequência, duração, intensidade)
  - Hábitos e Rotina (refeições/dia, rotina de trabalho, restrições alimentares, orçamento)
  - Sabor e Preferências (alimentos do dia-a-dia, aversões)
  - Objetivo (FAT_LOSS, MUSCLE_GAIN, MAINTENANCE, PERFORMANCE)
- **Profile API**: Cálculo automático de TDEE, macros (proteína, gordura, carboidratos) baseado no objetivo
- **Taste Profile**: Armazenamento de preferências alimentares
- **Tracking**: Registro de peso, exercícios e refeições
- **Dashboard**: Página inicial com redirecionamento para onboarding se necessário

### 🗄️ Banco de Dados

- Modelos: User, UserProfile, TasteProfile, OnboardingAnswer, BodyRecord, ExerciseLog, MealLog, MealLogItem
- Enums: Sex, ActivityLevel, Goal, WorkRoutine, DietaryRestriction, ExerciseType, IntensityLevel
- Relacionamentos e constraints configurados

### 🎨 Design System

- Dark mode first (#121212 background)
- Paleta de cores: accent verde (142 70% 45%), ai-accent roxo (260 60% 55%)
- Tipografia: Inter (sans) + JetBrains Mono (números)
- Componentes shadcn/ui-style customizados
- Mobile-first (min-h-[44px] para toque)

### ⚙️ Configuração Técnica

- Next.js 15+ com App Router
- TypeScript strict mode
- Tailwind CSS com CSS variables
- Prisma ORM (SQLite dev)
- next-auth v5
- Validação de inputs com Zod
- API routes com NextResponse
- Server Components por padrão

---

## Convenções do Changelog

- **Categorias**: 🎯 Funcionalidades, 🐛 Correções, 🎨 Melhorias, 📦 Estrutura, 📄 Documentação, ⚙️ Configuração, 🔧 Refatoração
- **Formato**: `[Version] - YYYY-MM-DD` (ou `[Desenvolvimento]` para commits entre versões)
- **Responsabilidade**: Todo agente de IA deve adicionar suas mudanças aqui antes de concluir a tarefa
- **Versionamento**: `v0.0.0` durante desenvolvimento; `v1.0.0` quando MVP (Fase 5) estiver funcional
