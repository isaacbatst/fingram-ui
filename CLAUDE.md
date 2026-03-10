# fingram-ui

Web app do Duna. React 19 + Vite + shadcn/ui + Tailwind CSS v4.

## Stack

- **Framework:** React 19, Vite 7, TypeScript (strict)
- **UI:** shadcn/ui (New York style) + Radix UI + Lucide icons
- **Data fetching:** SWR (custom hooks como camada de abstração)
- **Estado:** React Context (ApiContext, StorageContext, AuthContext)
- **Estilo:** Tailwind CSS v4 (CSS-only config, sem `tailwind.config.ts`) + CSS custom properties
- **PWA:** vite-plugin-pwa com autoUpdate

## Estrutura

```
src/
├── components/       # Feature components + ui/ (shadcn)
│   ├── ui/           # shadcn/ui primitivos (button, dialog, tabs, etc.)
│   └── icons/        # Ícones customizados
├── hooks/            # Custom hooks (SWR wrappers, domain logic)
├── contexts/         # React Context providers (Api, Auth, Storage, Telegram)
├── services/         # ApiService interface + implementações
├── utils/            # Utilitários puros
├── lib/              # cn() + helpers compartilhados
├── App.tsx           # Root: tabs, layout, providers
├── index.css         # Tailwind + Duna design tokens (:root)
└── main.tsx          # Entry point + PWA registration
```

## Design System (Duna/Estratos)

**Fonte de verdade:** `docs/product/design-identity.md`. Consultar antes de criar ou alterar componentes visuais. Atualizar após qualquer mudança que altere padrões documentados.

### Tokens

Todos os design tokens vivem em `src/index.css` (bloco `:root`). Nunca hardcodar valores de cor, tipografia ou espaçamento — sempre `var(--token)`.

### Fontes

| Família | Classe Tailwind | Uso |
|---------|----------------|-----|
| DM Serif Text | `font-display` | Headings, nomes de entidade |
| Libre Franklin | `font-sans` | UI text, labels, botões |
| JetBrains Mono | `font-mono` | Valores monetários, dados |

Nunca misturar `font-display` e `font-mono` na mesma linha.

### Padrões visuais

- **Superfícies:** 3 níveis — transparente (`bg-background`), gradient lighting (`.duna-surface`), transparente + border (inputs)
- **CTAs:** Padrão tinted accent — `bg-[var(--color-accent-bg)]` + `text-[var(--color-accent)]` + `border-[var(--color-accent-border)]`
- **Touch targets:** Mínimo 44px (WCAG 2.5.5) para elementos interativos
- **Toasts:** Apenas para erros e confirmações necessárias. Ações rotineiras não geram toast.
- **Texturas:** Grain overlay (z-9999) + ambient glow (z-1), ambos tokenizados

## Convenções

- **Path alias:** `@/*` → `src/*`
- **Idioma do código:** inglês. **Idioma da UI:** português (com acentuação correta)
- **Hooks:** Cada hook SWR encapsula uma operação de API (useTransactions, useBoxes, useSummary, etc.)
- **Componentes:** shadcn/ui como base, CVA para variantes, `cn()` para merge de classes

## Verificação

```bash
npm run lint && npm run build
```

Rodar antes de considerar qualquer mudança pronta.
