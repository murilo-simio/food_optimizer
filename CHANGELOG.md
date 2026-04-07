# Changelog — Food Optimizer

**Versionamento**: `v0.0.0` (desenvolvimento)  
**Próxima versão**: `v1.0.0` (MVP completo — Fase 5)

> Este arquivo documenta todas as mudanças no código. Mudanças devem ser adicionadas em ordem cronológica (mais recente no topo). Cada agente de IA deve registrar suas alterações aqui antes de finalizar.

---

## [Desenvolvimento] - 2026-04-07

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
