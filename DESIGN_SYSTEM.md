# Design System — Food Optimizer

> Minimalista, dark-mode first, mobile-first. Público: devs fitness.

## Filosofia

- **Dark por padrão**. Desenvolvedores passam o dia olhando tela clara — nosso app será o oposto.
- **Dados em primeiro plano**. Gráficos, números e progresso são os protagonistas. Decoracao é mínima.
- **Consistência sobre criatividade**. Uma vez definido um padrão visual, reutilize-o em todas as páginas.
- **Mobile-first**. Toda página deve funcionar bem em 320px de largura.

---

## Paleta de Cores

### Base (Dark Theme)

```css
:root {
  /* Backgrounds */
  --background:        0 0% 7%;      /* #121212 — Fundo principal */
  --background-elevated: 0 0% 11%;    /* #1C1C1C — Cards, modais */
  --background-subtle: 0 0% 14%;     /* #232323 — Hover states, inputs */

  /* Texto */
  --foreground:        0 0% 95%;     /* #F2F2F2 — Texto principal */
  --foreground-muted:  0 0% 55%;     /* #8C8C8C — Labels, placeholders */
  --foreground-inverse: 0 0% 10%;    /* Para texto sobre fundos claros */

  /* Bordas */
  --border:            0 0% 20%;     /* #333333 — Bordas de cards, inputs */
  --border-subtle:     0 0% 16%;     /* #282828 — Separadores sutis */

  /* Brand / Accent */
  --accent:            142 70% 45%;  /* Verde energia/saúde */
  --accent-hover:      142 70% 50%;
  --accent-muted:      142 40% 15%;  /* Fundo sutil com tom accent */

  /* AI / NutrIA */
  --ai-accent:         260 60% 55%;  /* Roxo — indica conteúdo gerado por IA */
  --ai-accent-muted:   260 30% 15%;  /* Fundo sutil para mensagens da IA */

  /* States */
  --success:           145 63% 42%;  /* #2ECC71 */
  --warning:           45 93% 50%;   /* #F1C40F */
  --error:             0 84% 60%;    /* #E74C5B */
  --info:              210 80% 56%;  /* #3498DB */
}
```

### Uso semântico

| Token | Uso |
|-------|-----|
| `--accent` | Botões primários, links, ícones ativos, gráficos |
| `--ai-accent` | Chat da NutrIA, recomendações de IA, badges "gerado por IA" |
| `--success` | Meta batida, progresso positivo |
| `--warning` | Perto do limite, alertas suaves |
| `--error` | Meta não batida, erros de validação |
| `--info` | Tooltips, informações educacionais |

### Cores de Macronutrientes (gráficos)

| Nutriente | Cor (HSL) | Hex aprox. |
|-----------|-----------|------------|
| Proteína  | 0 70% 55%  | `#E05555`  |
| Carbo     | 40 85% 55% | `#E8B83D`  |
| Gordura   | 200 65% 50%| `#3A8FD4`  |

---

## Tipografia

### Fonte

```
Inter (Google Fonts) — sans-serif padrão
JetBrains Mono (Google Fonts) — números e dados técnicos
```

### Escala Tipográfica (mobile-first)

```css
/* Textos utilitários / captions */
--text-xs:     0.6875rem;   /* 11px */

/* Labels secundários, timestamps */
--text-sm:     0.8125rem;   /* 13px */

/* Corpo principal (mínimo para leitura confortável) */
--text-base:   0.9375rem;   /* 15px */

/* Subtítulos, card titles */
--text-lg:     1.125rem;    /* 18px */

/* Page titles */
--text-xl:     1.375rem;    /* 22px */

/* Hero numbers (calorias, peso) */
--text-2xl:    1.75rem;     /* 28px */
--text-3xl:    2.25rem;     /* 36px */
--text-4xl:    3rem;        /* 48px */
```

### Hierarquia

- **Numbers/Data** → `JetBrains Mono`, `font-mono`. Ex: `2450 kcal`, `78.5 kg`
- **Labels de dados** → `Inter`, `text-sm`, `text-muted`
- **Corpo de texto** → `Inter`, `text-base`
- **Títulos de seção** → `Inter`, `text-lg`, `font-semibold`
- **Títulos de página** → `Inter`, `text-xl`, `font-bold`

---

## Espaçamento

Base de **4px**. Espaçamentos são sempre múltiplos de 4.

```
--space-1:  0.25rem;   /* 4px  */
--space-2:  0.5rem;    /* 8px  */
--space-3:  0.75rem;   /* 12px */
--space-4:  1rem;      /* 16px */
--space-6:  1.5rem;    /* 24px */
--space-8:  2rem;      /* 32px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
```

**Regra:** padding interno de cards = `--space-4`. Gap entre cards = `--space-4`. Margens de seção = `--space-8`.

---

## Bordas e Raios

```
--radius-sm:   0.375rem;   /* 6px — botões, inputs, badges */
--radius-md:   0.5rem;     /* 8px — cards */
--radius-lg:   0.75rem;    /* 12px — modais, drawers */
```

Borda padrão em cards: `1px solid hsl(var(--border))`.

---

## Sombras

```
/* Elevação 1 — cards sobre fundo escuro */
--shadow-sm:  0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2);

/* Elevação 2 — dropdowns, popovers */
--shadow-md:  0 4px 8px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3);

/* Elevação 3 — modais, snackbars */
--shadow-lg:  0 12px 24px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.3);
```

---

## Componentes

### Botões

```tsx
// Primário
<button className="bg-accent text-foreground-inverse font-medium rounded-sm px-4 py-2 text-sm hover:brightness-110 transition-colors min-h-[44px]">

// Secundário / Ghost
<button className="border border-border bg-background-elevated text-foreground font-medium rounded-sm px-4 py-2 text-sm hover:bg-background-subtle transition-colors min-h-[44px]">
```

**Altura mínima:** 44px (acessibilidade toque mobile).

### Cards

```tsx
<div className="bg-background-elevated border border-border rounded-md p-4 shadow-sm">
  <p className="text-xs text-muted-foreground">Label</p>
  <p className="text-2xl font-mono font-bold">{value}</p>
</div>
```

### Inputs / Formulários

```tsx
<div className="flex flex-col gap-2">
  <label className="text-sm font-medium">{label}</label>
  <input className="h-11 bg-background-subtle border border-border rounded-sm px-3 text-sm placeholder:text-muted-foreground focus:border-accent focus:outline-none transition-colors" />
</div>
```

**Estado de foco:** borda muda para `--accent`.
**Estado de erro:** borda muda para `--error`, mensagem abaixo em vermelho.

### Tabs / Navegação

```tsx
// Bottom navigation bar (mobile)
<nav className="fixed bottom-0 left-0 right-0 bg-background-elevated border-t border-border flex justify-around py-2">
  // Cada tab: ícone + label, cor "muted", ativo com "accent"
```

### Badges / Tags

```tsx
// Para restrições alimentares, categorias de alimento
<span className="bg-accent/15 text-accent text-xs font-medium px-2 py-0.5 rounded-sm">
  Proteína
</span>

// Badge "IA" para conteúdo gerado por IA
<span className="bg-ai-accent/20 text-ai-accent text-xs font-medium px-2 py-0.5 rounded-sm flex items-center gap-1">
  <Sparkles className="w-3 h-3" />
  NutrIA
</span>
```

### Barras de Progresso (macros)

```tsx
<div className="h-2 bg-background-subtle rounded-full overflow-hidden">
  <div className="h-full bg-accent" style={{ width: `${percentage}%` }} />
</div>
```

---

## Padroes de Páginas

### Dashboard

- Header sticky com nome da página
- Grid de cards 1 col (mobile) / 2 col (tablet+) / 3 col (desktop)
- Cada card: label muted + número grande em mono
- Gráfico de tendência de peso em largura total

### Rebalanceamento de Dieta

```
┌──────────────────────────── ┐
│  Rebalancear Dieta           │
│                              │
│  ↑ Ferro  [___] +10 mg       │  ← Slider + input numérico
│  Custo est. +R$ 2.50/sem     │  ← Feedback em tempo real
│                              │
│  [ Rebalancear ]             │  ← Botão primário
│  [Cancelar]                 │  ← Botão ghost
│                              │
│  Após aplicar:               │
│  ┌─────────────────────┐     │
│  │  Lentilha  120g→150g│     │  ← Lista de alterações
│  │  +Espinafre  0→50g  │     │
│  │  Arroz   200g→180g  │     │
│  └─────────────────────┘     │
└──────────────────────────────┘
```

### Chat com NutrIA

```
┌──────────────────────────────┐
│  ← NutrIA              [⚙]   │  ← Header com config de modelo
│                              │
│  ┌────────────────────────┐  │
│  │  👋 Olá! Sou a NutrIA. │  │  ← Mensagem da IA (bg ai-accent-muted)
│  │  Como posso ajudar?    │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────┐      │  ← Mensagem do usuário (bg subtle)
│  │  Quero mais ferro   │      │
│  └────────────────────┘      │
│                              │
│  ┌────────────────────────┐  │  ← Resposta da IA com dieta embed
│  │  Para aumentar o ferro │  │
│  │  sugiro...             │  │
│  │  ┌──────────────────┐  │  │  ← Card de dieta inline
│  │  │ Nova dieta v2    │  │  │
│  │  │ Ferro: 18mg ✅   │  │  │
│  │  │ [Aplicar] [Ver]  │  │  │
│  │  └──────────────────┘  │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │  ← Input fixo no bottom
│  │  [📎] Digite...  [ ▶] │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

### Input de Exames de Sangue

```
┌──────────────────────────────┐
│  Exames de Sangue             │
│                              │
│  ┌───────────────────────┐   │
│  │ Data: [__/__/____]    │   │
│  │ Lab:  [____________]  │   │
│  │ Notas:[____________]  │   │
│  │                       │   │
│  │  [Adicionar marcador] │   │  ← Adiciona linhas dinamicamente
│  │                       │   │
│  │  Ferritina  12  15-48 │   │  ← Campo: nome, valor, ref min-max
│  │  🟡 Baixo              │   │  ← Status colorido automático
│  │                       │   │
│  │  Vitamina D 35  30-100│   │
│  │  🟢 Normal            │   │
│  │                       │   │
│  │  [Salvar Exame]       │   │
│  └───────────────────────┘   │
│                              │
│  Após salvar:                │
│  🤖 "Notei que sua ferritina │
│     está baixa. Sugiro      │
│     aumentar alimentos ricos │
│     em ferro. Quer que eu   │
│     ajuste sua dieta?"       │  ← Botões: [Ajustar dieta] [Dispensar]
│       [Ajustar] [Dispensar]  │
└──────────────────────────────┘
```

### Página padrão

```tsx
<div className="min-h-screen bg-background">
  <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3">
    <h1 className="text-xl font-bold">Page Title</h1>
  </header>
  <main className="px-4 py-6 pb-24 max-w-2xl mx-auto">
    {/* Conteúdo */}
  </main>
</div>
```

---

## Animações

- **Duração:** 150ms para hover/active, 250ms para transições de página
- **Easing:** `ease-out` para entrada, `ease-in-out` para toggle
- **Loading states:** skeleton shimmer (pulse) para dados carregando
- **Chat:** mensagens novas com fade-in sutil de 150ms
- **Progress bars:** transição de 300ms quando valores mudam

---

## Tailwind Config Preview

```ts
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      background: 'hsl(var(--background))',
      'background-elevated': 'hsl(var(--background-elevated))',
      'background-subtle': 'hsl(var(--background-subtle))',
      foreground: 'hsl(var(--foreground))',
      'foreground-muted': 'hsl(var(--foreground-muted))',
      border: 'hsl(var(--border))',
      accent: 'hsl(var(--accent))',
      'ai-accent': 'hsl(var(--ai-accent))',
      'ai-accent-muted': 'hsl(var(--ai-accent-muted))',
      success: 'hsl(var(--success))',
      warning: 'hsl(var(--warning))',
      error: 'hsl(var(--error))',
      info: 'hsl(var(--info))',
    },
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
  },
}
```
