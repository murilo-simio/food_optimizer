# Especificação do Projeto — Food Optimizer

## Visão Geral

Food Optimizer é uma aplicação web mobile-first voltada para "devs fitness" — pessoas da área de tecnologia que buscam otimizar sua alimentação com base em dados. O app calcula necessidades nutricionais personalizadas, sugere dietas baseadas em custo-benefício usando preços reais de mercados, e permite tracking diário de progresso.

## Funcionalidades

### 1. Cadastro e Onboarding

Ao criar uma conta, o usuário responde um questionário com:

**Dados Pessoais:**
- Idade, sexo biológico, altura (cm)
- Peso atual (kg), % de gordura (estimado ou medido)
- Nível de atividade sedentária (trabalho de escritório, home office, etc.)

**Exercício Físico:**
- Frequência semanal (dias/semana)
- Tipo predominante (musculação, corrida, crossfit, etc.)
- Duração média por sessão (minutos)
- Intensidade percebida (leve, moderada, intenso)

**Hábitos e Rotina:**
- Número de refeições por dia
- Restrições alimentares (vegano, vegetariano, intolerâncias)
- Alimentos que não come
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
- **Micronutrientes mínimos:**
  - Vitaminas: A, C, D, E, K, B1, B2, B3, B5, B6, B9, B12
  - Minerais: Cálcio, Ferro, Magnésio, Zinco, Potássio, Sódio, Selênio
- **Ajustes por objetivo:** déficit ou superávit calórico baseado no objetivo

### 3. Montador de Dieta

- Algoritmo que seleciona alimentos para bater as metas de macro/micronutrientes
- **Otimização por custo**: alimentos são ranqueados pelo preço por grama de nutriente
- Fontes de preço via scraping de sites de mercado configurados em lista
- Dietas "ultra baratas" como opção de escolha do usuário
- Substituições sugeridas mantendo perfil nutricional similar

### 4. Tracking Diário

Input diário do usuário:
- **Peso** (kg)
- **% de gordura** (opcional)
- **Exercício**: tipo, duração, intensidade
- **Refeições**: alimentos consumidos + quantidades

Visualização:
- Progresso de peso ao longo do tempo
- Aderência às metas de macros/micros
- Histórico de treinos

### 5. Scraping de Preços

- Lista de sites configurada em arquivo de ambiente
- Scrapers executados periodicamente (cron job)
- Cache de preços com TTL
- Schema de preços: `site`, `alimento`, `preço`, `peso`, `preço_por_kg`, `data_coleta`

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
| Scraping | Puppeteer/Playwright + Cheerio | Flexível para diferentes sites |
| Otimização | solver linear (simplex) | Dietas de menor custo |
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
│   │   │   ├── tracking/
│   │   │   └── profile/
│   │   ├── api/                # API routes
│   │   └── layout.tsx
│   ├── components/             # UI components
│   │   ├── ui/                 # shadcn primitives
│   │   ├── tracking/
│   │   ├── diet/
│   │   └── onboarding/
│   ├── lib/
│   │   ├── nutrition.ts        # Cálculos nutricionais
│   │   ├── optimizer.ts        # Otimizador de dieta
│   │   └── utils.ts
│   ├── server/
│   │   ├── scraper/            # Scrapers de preço
│   │   └── db.ts
│   └── types/
├── prisma/
│   └── schema.prisma           # Schema do banco
├── public/
├── docs/
│   ├── PROJECT_SPEC.md
│   ├── AGENTS.md
│   └── DESIGN_SYSTEM.md
└── DESIGN_SYSTEM.md
```
