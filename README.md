# Food Optimizer

Otimizador de dieta e nutrientes para devs fitness.

## Objetivo

Aplicação web mobile-first que ajuda o usuário a otimizar a ingestão de macro e micronutrientes, levando em conta:

- **Perfil individual**: dados corporais (peso, % gordura), nível de exercício, hábitos diários, rotina de trabalho
- **Questionário onboarding**: coletar dados para calcular necessidades de vitaminas, minerais e macros
- **Objetivo personalizável**: ganho de massa, perda de gordura, manutenção, performance
- **Dieta baseada em custo**: scraping de preços de alimentos em sites parceiros para montar dietas extremamente baratas
- **Tracking diário**: registro de peso, % gordura, exercício e refeições
- **NutrIA**: assistente de IA que monta, revisa e ajusta dietas com base em evidências científicas
- **Ajuste fino de nutrientes**: rebalancear dieta para aumentar/ diminuir micronutrientes específicos (ex: mais ferro)
- **Exames de sangue**: ingestão de resultados laboratoriais para que a IA ajuste a dieta conforme deficiências reais

## Arquitetura

- **Stack**: Next.js (App Router) + TypeScript + Tailwind CSS + Prisma ORM
- **Banco de dados local (dev)**: SQLite
- **Produção futura**: Supabase (PostgreSQL) ou alternativa gratuita
- **Mobile-first**: PWA para acesso via celular
- **IA**: OpenRouter API (multiprovider) para acesso a modelos como Claude, GPT, etc.

## Roadmap

- [ ] **Fase 1** — Infraestrutura e base
  - [ ] Configuração do projeto Next.js
  - [ ] Schema de banco de dados (Usuários, Alimentos)
  - [ ] Autenticação
  - [ ] Questionário de onboarding

- [ ] **Fase 2** — Core de nutrição
  - [ ] Calculadora de necessidades nutricionais (TDEE, macros, micros)
  - [ ] Tabela nutricional de alimentos
  - [ ] Montador de dieta otimizada por custo

- [ ] **Fase 3** — Scraping de preços
  - [ ] Scrapers para sites de mercado/feira livre
  - [ ] API de preços atualizados
  - [ ] Otimizador de custo/dieta

- [ ] **Fase 4** — Tracking
  - [ ] Registro diário de peso / % gordura
  - [ ] Log de exercícios e refeições
  - [ ] Dashboard de progresso

- [ ] **Fase 5** — Nutrição Inteligente
  - [ ] Integração com OpenRouter API
  - [ ] NutrIA: chat com IA para montar/ajerar/revisar dietas
  - [ ] Rebalanceamento de dieta por nutriente-alvo (ex: "aumentar ferro")
  - [ ] Perfil de sabor do usuário (alimentos do dia-a-dia, preferências, aversões)
  - [ ] Ajustes incrementais baseados em tracking de peso e refeições

- [ ] **Fase 6** — Exames de Sangue
  - [ ] Input/scan de resultados de exames laboratoriais
  - [ ] Mapeamento exame → nutriente deficiente/excedente
  - [ ] NutrIA ajusta dieta automaticamente com base nos exames

- [ ] **Fase Futura**
  - [ ] Migração para Supabase / produção
  - [ ] Integração com wearables
  - [ ] Receitas e substituições de alimentos
  - [ ] Comunidade e compartilhamento de dietas

## Como rodar localmente

```bash
npm install
npx prisma migrate dev
npm run dev
```
