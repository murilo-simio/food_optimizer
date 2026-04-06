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
  --background:       0 0% 7%;        /* #121212 — Fundo principal */
  --background-elevated: 0 0% 11%;    /* #1C1C1C — Cards, modais */
  --background-subtle: 0 0% 14%;     /* #232323 — Hover states, inputs */

  /* Texto */
  --foreground:       0 0% 95%;       /* #F2F2F2 — Texto principal */
  --foreground-muted: 0 0% 55%;       /* #8C8C8C — Labels, placeholders */
  --foreground-inverse: 0 0% 10%;    /* Para texto sobre fundos claros */

  /* Bordas */
  --border:           0 0% 20%;       /* #333333 — Bordas de cards, inputs */
  --border-subtle:    0 0% 16%;       /* #282828 — Separadores sutis */

  /* Brand / Accent */
  --accent:           142 70% 45%;    /* #1DB954-esque — Verde energia/saúde */
  --accent-hover:     142 70% 50%;
  --accent-muted:     142 40% 15%;    /* Fundo sutil com tom accent */

  /* States */
  --success:          145 63% 42%;    /* #2ECC71 */
  --warning:          45 93% 50%;     /* #F1C40F */
  --error:            0 84% 60%;      /* #E74C5B */
  --info:             210 80% 56%;    /* #3498DB */
}
```

### Uso semântico

| Token | Usa |
|-------|-----|
| `--accent` | Botões primários, links, ícones ativos, gráficos |
| `--success` | Meta batida, progresso positivo |
| `--warning` | Perto do limite, alertas suaves |
| `--error` | Meta não batida, erros de validação |
| `--info` | Tooltips, informações educacionais |

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
<button className="bg-accent text-foreground-inverse font-medium rounded-sm px-4 py-2 text-sm">
  // hover: brightness-110 transition-colors

// Secundário / Ghost
<button className="border border-border bg-background-elevated text-foreground font-medium rounded-sm px-4 py-2 text-sm">
  // hover:bg-background-subtle transition-colors
```

**Altura mínima:** 44px (acessibilidade toque mobile).
**Altura full-width:** use em formulários mobile.

### Cards

```tsx
<div className="bg-background-elevated border border-border rounded-md p-4 shadow-sm">
  <p className="text-xs text-muted-foreground">Label</p>
  <p className="text-2xl font-mono font-bold">{value}</p>
</div>
```

### Inputs / Formulários

```tsx
// Container de campo
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
<span className="bg-accent/15 text-accent text-xs font-medium px-2 py-0.5 rounded-sm rounded-md">
  Proteína
</span>
```

### Barras de Progresso (macros)

```tsx
<div className="h-2 bg-background-subtle rounded-full overflow-hidden">
  <div className="h-full bg-accent" style={{ width: `${percentage}%` }} />
</div>
```

---

## Layout

### Grid de cards (dashboard)

```tsx
// Mobile: 1 coluna
// Tablet+: 2 colunas
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
```

### Página padrão

```tsx
<div className="min-h-screen bg-background">
  {/* Top header */}
  <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3">
    <h1 className="text-xl font-bold">Page Title</h1>
  </header>