# Frontend Design Document

## Status

Draft. This document describes the current frontend design direction and implementation standards for the `frontend` Next.js application. The active visual target is now a Hermes Agent-inspired operational dashboard theme.

## Objective

Provide a clear, maintainable design system foundation for the Morpheus frontend. The UI should be fast, accessible, responsive, theme-aware, and easy to extend during rapid product development.

## Non-Goals

- This document does not define backend APIs or data contracts.
- This document does not replace component-level implementation details.
- This document does not introduce a new design system separate from shadcn/ui.

## Current Frontend Structure

The frontend is a Next.js App Router application located in `frontend/`.

Key files and directories:

- `app/layout.tsx`: Root HTML shell, font setup, and global providers.
- `app/page.tsx`: Current landing page placeholder.
- `app/globals.css`: Tailwind v4 imports, shadcn theme variables, Hermes-inspired light/dark tokens, and base styles.
- `components/theme-provider.tsx`: Theme provider and keyboard theme toggle.
- `components/ui/`: Source-owned shadcn/ui components.
- `lib/utils.ts`: Shared utility helpers, currently `cn()` for safe class merging.
- `components.json`: shadcn/ui project configuration.

## Technology Stack

- Framework: Next.js 16 App Router.
- Language: TypeScript with React 19.
- Styling: Tailwind CSS v4.
- Component system: shadcn/ui with `base-vega` style.
- Primitive library: Base UI via `@base-ui/react`.
- Icons: Hugeicons via `@hugeicons/react` and `@hugeicons/core-free-icons`.
- Theme handling: `next-themes` using the `class` strategy.
- Linting: `oxlint` through `npm run lint`.
- Formatting: Prettier with Tailwind class sorting through `npm run format`.

## Design Principles

### 1. Build From Tokens

Use semantic tokens from `app/globals.css` instead of raw color values in components.

Preferred examples:

```tsx
<div className="bg-background text-foreground" />
<div className="border-border text-muted-foreground" />
<Button variant="default">Continue</Button>
```

Avoid examples:

```tsx
<div className="bg-white text-black" />
<div className="text-teal-600" />
```

### 2. Compose Existing Components

Use components from `components/ui/` before creating custom markup. shadcn/ui components are source-owned, so local customization is allowed when it benefits the whole application.

Current installed UI components:

- `Button`

New shared UI primitives should be added under `components/ui/`. Feature-specific components should live outside `components/ui/` and compose shared primitives.

### 3. Keep Layout Explicit

Use Tailwind layout utilities directly at the call site for page and feature layout. Prefer `flex`, `grid`, `gap-*`, `min-h-svh`, and responsive modifiers.

Use `gap-*` for spacing between children. Do not use `space-x-*` or `space-y-*`.

### 4. Design For Light And Dark Themes

Every screen must work in both light and dark mode. The current app uses `next-themes` with `defaultTheme="system"`, and users can toggle the resolved theme with the `d` key when not typing in an input.

Do not hard-code manual `dark:` color overrides unless the token system cannot express the state. Prefer semantic tokens such as `bg-card`, `text-card-foreground`, `bg-muted`, and `text-muted-foreground`.

### 5. Prefer Accessibility By Default

Interactive elements should use native controls or accessible primitives. Buttons must use the shared `Button` component unless there is a specific technical reason not to.

All focusable elements must have visible focus states. The current `Button` component uses `focus-visible:ring-ring/50` and `focus-visible:border-ring`.

## Visual Language

The current theme uses a Hermes Agent-inspired control-panel interface: dark teal canvas, cream foreground, translucent borders, compact uppercase controls, and technical monospace details.

### Color

Core colors are defined as CSS variables in `app/globals.css` and exposed through Tailwind v4 `@theme inline` tokens.

Hermes-style base values:

- `--background-base`: `#041c1c`
- `--midground`: `#ffe6cb`
- `--warm-glow`: `rgba(255, 189, 56, 0.35)`
- `--success`: `#34d399`
- `--warning`: `#ffbd38`

Primary token usage:

- `background` / `foreground`: Page surfaces and main text.
- `card` / `card-foreground`: Elevated or grouped surfaces.
- `primary` / `primary-foreground`: Main actions and brand emphasis.
- `secondary` / `secondary-foreground`: Secondary actions.
- `muted` / `muted-foreground`: Subtle surfaces and supporting text.
- `accent` / `accent-foreground`: Hover, selected, or emphasized neutral areas.
- `destructive`: Dangerous actions and error states.
- `border`, `input`, `ring`: Structural and interaction states.
- `chart-1` through `chart-5`: Data visualization palette.

### Radius

All components must have sharp corners (no rounded corners). The base radius is set to `--radius: 0;` (defined in `globals.css`). Derived radius tokens (`rounded-sm`, `rounded-md`, `rounded-lg`, etc.) are disabled and resolve to `0`. No component should have rounded corners.

### Typography

The root layout configures:

- `Space Grotesk` as the main sans font through `--font-sans`.
- `Geist Mono` as the mono font through `--font-mono`.

Use font utilities consistently:

- `font-sans` for product UI and content.
- `font-mono` for technical metadata, IDs, shortcuts, logs, and code-like text.
- `text-muted-foreground` for secondary descriptions.
- `uppercase tracking-[0.08em]` or the `.text-display` utility for navigation, section labels, and compact dashboard controls.

### Motion

The app imports `tw-animate-css` and shadcn Tailwind styles. Motion should be subtle and functional.

Use transitions for:

- Hover feedback.
- Focus feedback.
- Menu or overlay entry/exit.
- Theme-safe UI state changes.

Avoid decorative motion that distracts from monitoring, alerting, or operational workflows.

## Component Standards

### Shared UI Components

Shared primitives belong in `components/ui/` and should follow shadcn/ui conventions.

Rules:

- Export reusable components and variant helpers when needed.
- Use `class-variance-authority` for component variants.
- Use `cn()` from `@/lib/utils` for class composition.
- Use semantic color classes, not raw brand colors.
- Preserve accessible states such as `disabled`, `aria-invalid`, and `focus-visible`.

### Button

The current `Button` component is styled for the Hermes-like dashboard theme: compact, uppercase, high-tracking, token-driven, and stateful. It supports these variants:

- `default`
- `outline`
- `secondary`
- `ghost`
- `destructive`
- `link`

Supported sizes:

- `default`
- `xs`
- `sm`
- `lg`
- `icon`
- `icon-xs`
- `icon-sm`
- `icon-lg`

Use variants before custom class overrides.

Example:

```tsx
<Button>Primary action</Button>
<Button variant="outline">Secondary action</Button>
<Button variant="destructive">Delete</Button>
```

### Icons

Use Hugeicons for new icons. Icons inside buttons should rely on component sizing where possible.

Preferred pattern:

```tsx
<Button>
  <SomeHugeicon data-icon="inline-start" />
  Label
</Button>
```

## Page And Feature Architecture

### Routing

Use the Next.js App Router under `app/`. Route-level files should stay focused on composition, data boundaries, and page-level layout.

Recommended pattern:

- `app/<route>/page.tsx`: Route entry point.
- `app/<route>/loading.tsx`: Route loading state when needed.
- `app/<route>/error.tsx`: Route error boundary when needed.
- `components/<feature>/`: Feature-specific UI composed from shared primitives.

### Server And Client Components

This project has React Server Components enabled through `components.json` with `rsc: true`.

Default to Server Components. Add `"use client"` only when a component needs browser APIs, state, effects, event handlers, or client-only libraries.

Current client component:

- `components/theme-provider.tsx`

### Imports

Use configured aliases from `components.json`:

- `@/components`
- `@/components/ui`
- `@/lib`
- `@/lib/utils`
- `@/hooks`

## Responsive Design

Every page should be usable on mobile and desktop.

Guidelines:

- Start with mobile layout and add larger breakpoints intentionally.
- Use `min-h-svh` for full-screen sections instead of `min-h-screen`.
- Use fluid containers and avoid fixed widths unless they are bounded with responsive constraints.
- Use `min-w-0` inside flex layouts to prevent text overflow.
- Validate key screens at narrow, tablet, and desktop widths.

## Accessibility Requirements

Minimum requirements for all new UI:

- Keyboard-accessible interactive elements.
- Visible focus states.
- Sufficient color contrast in light and dark themes.
- Semantic HTML landmarks where appropriate.
- Labels for form controls.
- `aria-invalid` for invalid inputs.
- No keyboard shortcut handling while the user is typing in `input`, `textarea`, `select`, or content-editable elements.

## Theming Requirements

Theme values must be defined in `app/globals.css`.

Do not create parallel theme files unless the project intentionally adopts a larger token architecture.

When adding a new design token:

1. Add the CSS variable in `:root`.
2. Add the dark value in `.dark`.
3. Expose it in `@theme inline` if Tailwind utility access is needed.
4. Use the semantic Tailwind class in components.

Hermes-inspired additions available to components:

- `text-text-secondary`
- `text-text-tertiary`
- `text-midground`
- `bg-background-base`
- `text-success`
- `text-warning`
- `.text-display`
- `.surface-glow`
- `.grain`

## Hermes UI Reference

The local Hermes dashboard was analyzed and documented in `../docs/hermes-web-ui-design-analysis.md`. Use that document as the reference for future dashboard, plugin, sidebar, card, form, and operational UI work.

## Quality Bar

Before considering frontend design work complete:

- Run `npm run lint` from `frontend/`.
- Run `npm run typecheck` from `frontend/` for TypeScript changes.
- Run `npm run format` when files need formatting.
- Check light and dark themes.
- Check mobile and desktop layouts.
- Confirm no raw colors were introduced where semantic tokens exist.

## Open Questions

- Product-specific Morpheus branding beyond the Hermes-like base theme is not fully defined yet.
- Data-heavy components such as cards, tables, charts, alerts, and dashboards have not been added yet.
- Form patterns are not established yet because no shared form components are currently installed.

## Decision Log

| Date | Decision | Reason |
| --- | --- | --- |
| 2026-07-04 | Use shadcn/ui `base-vega` as the frontend component foundation. | Matches `components.json` and keeps components source-owned. |
| 2026-07-04 | Use Tailwind v4 CSS variables in `app/globals.css` as the token source of truth. | Matches the current project setup and supports light/dark themes. |
| 2026-07-04 | Use `Space Grotesk` for sans UI and `Geist Mono` for technical text. | Matches `app/layout.tsx` and gives the product a technical interface tone. |
| 2026-07-04 | Keep shared primitives under `components/ui/`. | Aligns with shadcn conventions and the configured aliases. |
| 2026-07-04 | Adapt the base frontend theme toward the Hermes Agent web UI style. | User requested a Hermes-like theme using this project's own components, colors, and CSS. |
