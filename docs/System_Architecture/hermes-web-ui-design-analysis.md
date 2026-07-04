# Hermes Web UI Design Analysis

## Source Reviewed

The Hermes Agent dashboard running at `http://127.0.0.1:9119/plugins` is served from local files on this machine.

Reviewed source locations:

- `~/.hermes/hermes-agent/web/src/index.css`
- `~/.hermes/hermes-agent/web/src/App.tsx`
- `~/.hermes/hermes-agent/web/src/themes/presets.ts`
- `~/.hermes/hermes-agent/web/src/themes/context.tsx`
- `~/.hermes/hermes-agent/web/src/pages/PluginsPage.tsx`
- `~/.hermes/hermes-agent/web/src/components/SidebarStatusStrip.tsx`
- `~/.hermes/hermes-agent/hermes_cli/web_dist/`

## Design Summary

Hermes uses a dense operational dashboard style. The interface feels like a terminal-adjacent control panel rather than a generic SaaS app.

Core traits:

- Dark teal canvas.
- Cream foreground text.
- Thin translucent borders.
- Uppercase navigation labels.
- Compact card grids and stacked panels.
- Monospace text for identifiers, commands, logs, and technical metadata.
- Plugin-driven architecture with named slots around pages and layout regions.
- Strong local-first behavior: dashboard shell and bundles are served from local files.

## Palette

The canonical Hermes theme is named `Hermes Teal` in `web/src/themes/presets.ts`.

Primary values:

- Background: `#041c1c`
- Midground: `#ffe6cb`
- Foreground: `#ffffff` with alpha `0`
- Warm glow: `rgba(255, 189, 56, 0.35)`
- Input token accent: `#ffe6cb`
- Output token accent: `#34d399`

Hermes maps this palette into shadcn-like tokens so legacy utility classes still work:

- `card`: cream mixed into the dark background at low opacity.
- `primary`: cream text/action color.
- `primary-foreground`: dark teal.
- `muted`: low-opacity cream over dark teal.
- `border`: low-opacity cream.
- `ring`: cream focus color.
- `success`: green.
- `warning`: amber.
- `destructive`: red.

## Typography

Hermes uses theme-controlled font variables:

- Sans: system UI stack by default.
- Mono: system monospace stack by default.
- Terminal mono: bundled JetBrains Mono for embedded terminal views.
- Base size: `15px`.
- Line height: `1.55`.
- Letter spacing: `0`.

Common text patterns:

- Navigation labels are uppercase, small, and widely tracked.
- Secondary copy uses low-contrast cream tokens.
- Technical values use a mono class.
- Section headings often use compact display styling and uppercase labels.

## Layout Pattern

The main Hermes dashboard layout is a shell with:

- Fixed/sticky left sidebar on desktop.
- Collapsible sidebar width from `16rem` to icon-only `3.5rem`.
- Mobile sidebar as an off-canvas drawer with dark overlay.
- Main content area with responsive horizontal padding.
- Header/profile/plugin slots around the shell.
- Scroll contained inside layout regions on desktop.

Important layout classes seen in Hermes:

- `min-h-0` and `min-w-0` to prevent flex overflow.
- `h-dvh` and `max-h-dvh` for viewport-bound dashboard sections.
- `gap-*` for spacing.
- `border-current/20` and `border-current/10` for subtle panel separation.

## Component Patterns

### Sidebar

The sidebar is the strongest visual anchor.

Traits:

- Solid dark teal background.
- Thin right border using current color opacity.
- Uppercase brand lockup split over two lines.
- Icon + label nav rows.
- Active nav state uses cream text and a subtle vertical active bar.
- Hover state uses low-opacity cream background.
- Collapsed mode keeps icons and shows tooltips.

### Cards

Cards are used as bounded operational panels.

Traits:

- Dark teal surfaces with slightly lighter cream-mixed background.
- Thin cream translucent border.
- Small radius, usually `0.5rem`.
- Header/content composition.
- Compact labels and descriptions.
- Dense spacing but not cramped.

### Buttons

Buttons are compact, uppercase-capable, and stateful.

Traits:

- Primary button uses cream background with dark teal text.
- Ghost button is transparent with cream hover wash.
- Outline button uses translucent cream border.
- Destructive button is red-tinted but still subdued.
- Focus ring uses cream.

### Forms

Forms use compact labels and technical placeholders.

Traits:

- Labels are small and readable.
- Inputs use dark surfaces and cream borders.
- Technical fields use mono text.
- Switch rows use inline label groups with large gaps.

### Plugins Page

The `/plugins` page is organized as:

- Top plugin slot.
- Provider configuration card.
- Plugin installation card.
- Plugin list heading.
- Stack of plugin row cards.
- Orphan plugin panel.
- Toast feedback.
- Bottom plugin slot.

Rows use badges for source, version, runtime status, and auth state. Actions are grouped at the right and wrap responsively.

## Motion And Feedback

Hermes motion is minimal and utilitarian.

Observed patterns:

- Sidebar width and transform transitions.
- Tooltip fade/slide.
- Toast slide in/out.
- Dialog fade and slight scale.
- Hover color transitions.
- Loading spinners and skeleton strips.

## Accessibility Patterns

Hermes uses accessible navigation and state primitives:

- `aria-label` on sidebar and icon-only controls.
- `NavLink` active state for route navigation.
- Focus-visible rings.
- Keyboard-focusable links and buttons.
- Labels connected to form controls.
- Loading states with `aria-busy` and `aria-live` where needed.

## Adaptation For This Project

This project should not copy Hermes dependencies or import `@nous-research/ui`. The project already uses Next.js, Tailwind v4, shadcn/ui, Base UI, and Hugeicons.

Adapted approach:

- Keep shadcn source-owned components in `frontend/components/ui/`.
- Recreate Hermes visual tokens in `frontend/app/globals.css`.
- Use the project fonts, but bias typography toward compact, uppercase, technical UI.
- Use semantic Tailwind tokens instead of raw colors.
- Keep light and dark theme behavior, but make the base theme Hermes-like.
- Add project-specific utilities for text hierarchy, surface glow, and grain overlays.

## Implementation Decisions

| Area | Hermes Pattern | Project Adaptation |
| --- | --- | --- |
| Background | `#041c1c` dark teal | `--background` and `--sidebar` use Hermes teal |
| Main text | `#ffe6cb` cream | `--foreground`, `--primary`, and card text use cream |
| Borders | Cream with low alpha | `--border` and `--input` use translucent cream |
| Cards | Cream mixed into dark teal | `--card` and `--popover` use low-opacity cream surfaces |
| Radius | `0.5rem` default | `--radius: 0.5rem` |
| Buttons | Compact operational controls | shadcn `Button` variants restyled through tokens/classes |
| Data accents | Cream input, green output | `--chart-*`, `--success`, and `--warning` tokens added |
| Texture | Optional grain utility | `.grain` utility added to project CSS |

## Usage Guidance

Use these class patterns in future frontend work:

```tsx
<section className="rounded-lg border bg-card text-card-foreground surface-glow">
  <h2 className="text-display text-xs font-semibold text-muted-foreground">
    Section
  </h2>
</section>
```

```tsx
<div className="flex min-w-0 flex-col gap-3">
  <p className="font-mono text-xs text-muted-foreground">device:alpha-01</p>
</div>
```

```tsx
<Button className="uppercase tracking-[0.08em]">Execute</Button>
```

## Risks

- Hermes relies on its own Nous design system. This project should only emulate the visual language, not depend on Hermes UI packages.
- A very dark default theme needs careful contrast checks for charts, maps, and warning states.
- Existing future components should avoid hard-coded light surfaces, or they will break the Hermes-like theme.
