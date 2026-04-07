# Changelog — Food Optimizer

**Versionamento**: `v0.0.0` (desenvolvimento)  
**Próxima versão**: `v1.0.0` (MVP completo — Fase 5)

> Este arquivo documenta todas as mudanças no código. Mudanças devem ser adicionadas em ordem cronológica (mais recente no topo). Cada agente de IA deve registrar suas alterações aqui antes de finalizar.

---

## [Desenvolvimento] - 2026-04-07

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
