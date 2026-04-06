# Especificação do Projeto — Food Optimizer

## Visão Geral

Food Optimizer é uma aplicação web mobile-first voltada para "devs fitness" — pessoas da área de tecnologia que buscam otimizar sua alimentação com base em dados. O app calcula necessidades nutricionais personalizadas, sugere dietas baseadas em custo-benefício usando preços reais de mercados, e permite tracking diário de progresso. A partir da Fase 5, o sistema integra IA via OpenRouter para montar e revisar dietas de forma inteligente, considerando hábitos, região, exames de sangue e literatura científica.

## Funcionalidades

### 1. Cadastro e Onboarding

Ao criar uma conta, o usuário responde um questionário com:

**Dados Pessoais:**
- Idade, sexo biológico, altura (cm)
- Peso atual (kg), % de gordura (estimado ou medido)
- Nível de atividade sedentária (trabalho de escritório, home office, etc.)
- Região geográfica (estado/cidade) — para considerar alimentos regionais e preços locais

**Exercício Físico:**
- Frequência semanal (dias/semana)
- Tipo predominante (musculação, corrida, crossfit, etc.)
- Duração média por sessão (minutos)
- Intensidade percebida (leve, moderada, intenso)

**Hábitos, Rotina e Sabor:**
- Número de refeições por dia
- Restrições alimentares (vegano, vegetariano, intolerâncias)
- **Alimentos do dia-a-dia** (lista de alimentos que o usuário costuma comer regularmente — ex: "como feijão todo dia", "tom aveia no café")
- **Aversões** (alimentos que odeia, não abre mão de não ver na dieta)
- **Perfil de sabor** (doce/salgado, preferências de culinária, temperos favoritos)
- Horário de trabalho (CLT, home office, turnos)
- Orçamento semanal para alimentação (R$)

**Objetivo:**
- Perda de gordura
- Ganho de massa muscular
- Manutenção / recomposição
- Performance esportiva

### 2. Cálculo Nutricional

Com base no questionário, o sistema calcula:

- **TDEE** (Total Daily Energy Expenditure) via fórmula Mifflin-St Jeor + coeficiente de atividade
- **Macronutrientes:**
  - Proteína: 1.6-2.2g/kg peso magro (ajustado por objetivo)
  - Gordura: 0.8-1.0g/kg peso total
  - Carboidrato: restante das calorias
- **Micronutrientes mínimos (VDs):**
  - Vitaminas: A, C, D, E, K, B1, B2, B3, B5, B6, B9, B12
  - Minerais: Cálcio, Ferro, Magnésio, Zinco, Potássio, Sódio, Selênio
- **Ajustes por objetivo:** déficit ou superávit calórico baseado no objetivo

### 3. Montador de Dieta (algorítmico)

- Algoritmo que seleciona alimentos para bater as metas de macro/micronutrientes
- **Otimização por custo**: alimentos são ranqueados pelo preço por grama de nutriente
- **Consideração de sabor**: alimentos do perfil de sabor têm prioridade; aversões são excluídas
- **Alimentos do dia-a-dia**: mantidos como base fixa na dieta
- Fontes de preço via scraping de sites de mercado configurados em lista
- Dietas "ultra baratas" como opção de escolha do usuário
- Substituições sugeridas mantendo perfil nutricional similar

### 4. Rebalanceamento de Nutrientes

- O usuário pode ajustar a meta de um nutriente específico (ex: "quero mais ferro")
- O sistema recalcula a dieta:
  - Aumenta/ diminui quantidades de alimentos ricos naquele nutriente
  - Mantém as calorias totais próximas do target
  - Considera o impacto no custo total
  - Respeita aversões e perfil de sabor do usuário
- Feedback visual: "para +10mg de ferro, seu custo sobe R$ X/semana"

### 5. Nutrição Inteligente — NutrIA

**Integração com IA:**
- **Provider**: OpenRouter API (acesso multiprovedor: Claude, GPT, etc.)
- Configuração via `env`: `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` (default: melhor disponível)
- Fallback: se a API falhar, volta para o montador algorítmico
- Streaming de respostas para melhor UX no chat

**Funcionalidades da NutrIA:**

a) **Montar dieta do zero**
- A IA recebe: perfil do usuário, onboarding, tracking histórico, preços disponíveis, região geográfica
- Acessa base de estudos científicos via RAG ou system prompts com referências
- Monta uma dieta completa com justificativa nutricional
- Considera cultura regional, costumes e alimentos sazônicos

b) **Revisar dieta existente**
- A IA analisa a dieta atual vs metas de nutrientes
- Sugere melhorias com referências a estudos
- Identifica gaps de micronutrientes

c) **Chat contínuo**
- Usuário pergunta: "posso trocar arroz por batata?", "por que preciso de tanto magnésio?"
- A IA responde com contexto do perfil e dieta do usuário
- Pode modificar a dieta diretamente pelo chat ("aumenta minha proteína em 10g")

d) **Ajustes incrementais baseados em tracking**
- A IA analisa o log de peso e refeições das últimas 2-4 semanas
- Detecta tendências (peso estagnado, subindo/descendo rápido)
- Sugere ajustes graduais (100-200 kcal) — nada drástico, considera flutuações diárias
- Se o peso está flat por 2+ semanas, sugere modificação calórica
- Se o peso oscila muito, sugere maior consistência nas refeições

### 6. Exames de Sangue (Fase Futura)

- Usuário pode adicionar resultados de exames laboratoriais:
  - Input manual (formulário por campo)
  - OCR de PDF/foto do exame (futura feature)
- **Dados rastreados:** hemoglobina, hematócrito, ferritina, vitamina D, B12, colesterol total, HDL, LDL, triglicerídeos, glicemia, insulina, TSH, T3/T4, ferro sérico, zinco, magnésio eritrocitário
- **Ação automática:** quando exames são adicionados, a NutrIA é notificada e sugere ajustes na dieta
  - Ex: ferritina baixa → aumentar ferro heme (carnes) + vitamina C para absorção
  - Ex: vitamina D baixa → sugerir suplementação + alimentos ricos
- **Histórico de exames:** comparação temporal para ver se a dieta está resolvendo as deficiências

### 7. Tracking Diário

Input diário do usuário:
- **Peso** (kg)
- **% de gordura** (opcional)
- **Exercício**: tipo, duração, intensidade
- **Refeições**: alimentos consumidos + quantidades

Visualização:
- Progresso de peso ao longo do tempo com média móvel (7 dias) para suavizar flutuações
- Aderência às metas de macros/micros
- Histórico de treinos
- Alertas da NutrIA quando detecta padrões问题icos

### 8. Scraping de Preços

- Lista de sites configurada em arquivo de ambiente
- Scrapers executados periodicamente (cron job)
- Cache de preços com TTL
- Schema de preços: `site`, `alimento`, `preço`, `peso`, `preço_por_kg`, `data_coleta`
- Preços usados tanto pelo algoritmo quanto pela IA (via system prompt)

## Stack Técnica

| Camada | Tecnologia | Razão |
|--------|-----------|-------|
| Frontend + Backend | Next.js (App Router) | SSR, API routes, PWA |
| Linguagem | TypeScript | Type safety |
| Estilização | Tailwind CSS | Utility-first, mobile-first |
| UI Components | shadcn/ui | Acessíveis, customizáveis sem dependência pesada |
| ORM | Prisma | Type-safe, fácil swap de SQLite → PostgreSQL |
| Banco (dev) | SQLite | Zero configuração, arquivo local |
| Banco (prod) | Supabase (PostgreSQL) | Gratuito, escalável |
| Autenticação | next-auth v5 | Open source, flexível |
| IA | OpenRouter SDK | Acesso multiprovedor a Claude, GPT, etc. |
| Scraping | Puppeteer/Playwright + Cheerio | Flexível para diferentes sites |
| Otimização | solver linear (simplex) | Dietas de menor custo (fallback sem IA) |
| Charts | Recharts | Leve, funciona bem em mobile |
| Ícones | Lucide React | Minimalista, consistente |

## Estrutura de Diretórios (prevista)

```
food_optimizer/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/login/
│   │   ├── (auth)/register/
│   │   ├── (app)/
│   │   │   ├── dashboard/
│   │   │   ├── onboarding/
│   │   │   ├── diet/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── rebalance/
│   │   │   │   └── ai/
│   │   │   ├── tracking/
│   │   │   ├── exams/
│   │   │   ├── chat/           # Chat com NutrIA
│   │   │   └── profile/
│   │   ├── api/                # API routes
│   │   │   ├── diet/
│   │   │   │   ├── generate/   # POST — gerar dieta (algorítmico ou IA)
│   │   │   │   └── rebalance/  # POST — rebalancear por nutriente
│   │   │   ├── chat/           # POST — stream de chat com IA
│   │   │   └── scraper/        # POST — trigger scraping
│   │   └── layout.tsx
│   ├── components/             # UI components
│   │   ├── ui/                 # shadcn primitives
│   │   ├── tracking/
│   │   ├── diet/
│   │   ├── chat/               # Chat da NutrIA
│   │   ├── exams/
│   │   └── onboarding/
│   ├── lib/
│   │   ├── nutrition.ts        # Cálculos nutricionais
│   │   ├── optimizer.ts        # Otimizador de dieta (simplex)
│   │   ├── ai.ts               # OpenRouter client
│   │   └── utils.ts
│   ├── server/
│   │   ├── scraper/            # Scrapers de preço
│   │   ├── ai/
│   │   │   ├── prompts.ts      # System prompts para a NutrIA
│   │   │   └── nutritionist.ts # Agent de IA nutricionista
│   │   └── db.ts
│   └── types/
├── prisma/
│   └── schema.prisma           # Schema do banco
├── public/
├── docs/
│   ├── PROJECT_SPEC.md
│   ├── AGENTS.md
│   ├── NUTRITIONIST_IA.md
│   └── DESIGN_SYSTEM.md
└── DESIGN_SYSTEM.md
```
