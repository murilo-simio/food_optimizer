# AGENTS.md — Guia para Agentes de IA

Este arquivo contém instruções e boas práticas que **devem ser seguidas** por qualquer agente de IA que contribua com código neste projeto.

## Princípios Gerais

- **Faça pouco, faça bem.** Não adicione features que não foram pedidas. Cada arquivo criado deve ter um propósito claro.
- **Type safety sempre.** Nada de `any`. Use tipos estritos. Se precisar de um tipo genérico, defina-o explicitamente.
- **DRY mas sem over-engineering.** Não crie abstrações para evitar 2-3 linhas repetidas. Abstraia quando o padrão se repetir 3+ vezes ou quando fizer sentido conceitual.
- **Mobile-first.** Toda nova página/componente deve funcionar em telas de 320px+ sem layout shift.
- **Acessibilidade mínima.** Use elementos semânticos (`<button>`, `<label>`, `<nav>`), nunca div como botão. Cores com contraste sufficientemente alto.

## Next.js / App Router

- **Server Components por padrão.** Use `"use client"` apenas quando necessário (estado local, event handlers, hooks não-server).
- **API routes** em `src/app/api/` devem usar `NextResponse`, nunca `res.json()`.
- **Server Actions** são preferidos sobre API routes para mutations que vêm de formulários no mesmo app.
- **Routing groups** `(auth)`, `(app)` para layouts separados sem afetar a URL.

## TypeScript

```typescript
// BOM: tipos explícitos e strict
interface UserInput {
  weight: number;
  bodyFatPercentage: number;
  activityLevel: ActivityLevel;
  goal: Goal;
}

// RUIM: uso de any
interface UserInput {
  weight: any;
  goal: any;
}
```

- Use `interface` para objetos que podem ser estendidos, `type` para unions/intersections.
- Validação de input em runtime com **Zod**. Tipos TS cobrem apenas compile-time.
- Zod schemas devem ficar junto com o código que os usa, não em arquivo separado.

## Prisma

- **Nunca rode `prisma generate` manualmente em código.** O postinstall do npm cuida disso.
- Sempre use `include` ou `select` para evitar N+1 queries.
- Migrations: `npx prisma migrate dev --name <description>` para dev. Para prod, `prisma db push` ou `prisma migrate deploy`.
- Cada modelo deve ter `createdAt` e `updatedAt` automáticos.

## Tailwind CSS

- Use **classes utilitárias diretamente** nos componentes. Não crie componentes CSS customizados via `@apply` a menos que o padrão seja realmente repetitivo.
- Para responsividade: prefixos `sm:`, `md:`, `lg:` com abordagem mobile-first (estilo base = mobile).
- Use CSS variables do design system para cores principais (ver `DESIGN_SYSTEM.md`).
- Nomes Tailwind: use `clsx` ou `cn()` (de `src/lib/utils.ts`) para classes condicionais.

## Componentes UI

- **shadcn/ui** é a biblioteca base. Não instale componentes UI pesados (MUI, Chakra, etc).
- Componentes compostos devem seguir a estrutura `Component.Root`, `Component.Trigger`, `Component.Content` quando fizer sentido (como Radix).
- Cada componente em seu próprio arquivo: `src/components/ui/button.tsx`.
- Props: use `interface ComponentProps extends React.ComponentProps<typeof Element>` quando estender elementos HTML nativos.

## Banco de Dados

- **Dev:** SQLite via arquivo local. Nunca comite o arquivo `.db`.
- **Prod futura:** Supabase (PostgreSQL). Escreva queries compatíveis com PostgreSQL desde o início. Evite funções específicas de SQLite.
- Seeds em `prisma/seed.ts` para dados de referência (tabela nutricional de alimentos).

## Integração com IA (OpenRouter)

- Use `OPENROUTER_API_KEY` e `OPENROUTER_MODEL` do `.env`.
- Modelo default: o mais capaz disponível no momento (consultar leaderboard).
- **Streaming** é obrigatório — respostas da IA devem usar `ReadableStream` do Next.js.
- System prompts devem incluir: perfil do usuário, dieta atual, tracking, preços, exames (ver template em `NUTRITIONIST_IA.md`).
- **Nunca** enviar dados sensíveis (senha, tokens) à API.
- **Fallback:** se a IA falhar, o montador algorítmico (simplex) assume.
- **Rate limits:** implemente debounce/throttle no frontend para não spammar chamadas.
- Log de custos de API (tokens input/output) em env local para monitorar gastos.

## Chat com IA

- Mensagens devem ser salvas no banco (`ChatMessage`).
- Mensagens do sistema (`role: SYSTEM`) não são renderizadas para o usuário — são contexto.
- Dieta gerada pelo chat deve ser linkada via `relatedDietId`.
- Cards inline no chat (dietas, análises) usam estilo com borda `--ai-accent`.

## Scraping

- Scrapers devem ser **idempotentes**: rodar múltiplas vezes sem duplicar dados.
- Use `upsert` para salvar preços coletados.
- Timeouts e retries em todas as chamadas de rede.
- **Respeite robots.txt** dos sites alvo.
- User-Agent identificável com contato do projeto.

## Segurança

- **Nunca comite** `.env` ou arquivos com secrets.
- Hash de senhas com bcrypt (via next-auth).
- Zod validation em TODO input de usuário (forms, API routes, server actions).
- Sanitize outputs que vão para o HTML (next.js já faz auto-escape, mas cuidado com `dangerouslySetInnerHTML`).

## Commits

- Mensagens concisas no imperativo: `add onboarding form`, `fix diet optimizer calculation`
- Commits pequenos e atômicos. Uma feature = um ou mais commits, nunca misturar features.
- **Nunca force push** em main.

## Testes (quando aplicável)

- Para lógica de negócio (cálculos nutricionais, otimizador): unit tests.
- Para UI: testes focam em comportamento interacional, não em snapshots.
- Scraper tests: mock de HTTP, nunca chamar URLs reais em CI.
- IA: mock de chamadas OpenRouter — nunca gastar créditos de API em testes.

## Documentos de Referência

- `AGENTS.md` — boas práticas de código (este arquivo)
- `NUTRITIONIST_IA.md` — diretrizes da IA nutricionista (comportamento, tom, guardrails)
- `DESIGN_SYSTEM.md` — padrão visual e componentes
- `PROJECT_SPEC.md` — especificação completa do projeto
- `CHANGELOG.md` — **OBRIGATÓRIO**: registre todas as mudanças aqui antes de concluir

---

## Changelog

Toda alteração no código deve ser documentada em `CHANGELOG.md`:

1. Antes de finalizar qualquer tarefa, adicione uma entrada no changelog
2. Use formato: `[Desenvolvimento] - YYYY-MM-DD`
3. Categorize: 🎯 Funcionalidades, 🐛 Correções, 🎨 Melhorias, 📦 Estrutura, ⚙️ Configuração
4. Seja conciso mas específico: arquivo alterado, tipo de mudança, razão (se não óbvia)
5. Não inclua detalhes de implementação no changelog — isso fica no commit

**Versionamento**:
- `v0.0.0` — desenvolvimento (atual)
- `v1.0.0` — MVP completo (quando Fase 5 estiver funcional)
