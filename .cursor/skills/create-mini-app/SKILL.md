---
name: create-mini-app
description: Scaffolds a new classroom mini app under src/apps/, matching existing catalog, routing, page chrome, Tailwind tokens, and shared pickers. Use when adding a mini app, creating an app in src/apps/, or when the user asks for a new classroom tool, printable, or designer.
---

# Create a mini app

Scaffold a new printable/classroom tool next to the existing apps in `src/apps/`. Match those apps; do not invent a parallel design system.

## Confirm name and description first

Do not scaffold until both are confirmed.

If available from the user prompt confirm the app name as an option picker (either from provided context or ask directly)

If available from the user prompt confirm the app description as an option picker (either from provided context or ask directly)

Use the `AskQuestion` tool:

- **App name**: one option is the inferred title from the prompt (Recommended). Include a second option such as “Ask me for a different name”.
- **App description**: one option is the inferred one-sentence landing-card copy (Recommended). Include a second option such as “Ask me for a different description”.

If the prompt has no usable name or description, ask directly with `AskQuestion` rather than guessing.

From the confirmed **title**, derive:

| Field | Rule | Example |
| --- | --- | --- |
| `id` | kebab-case, URL-safe | `name-cards` |
| `title` | Title Case, as confirmed | `Name Cards` |
| `path` | `/apps/{id}` | `/apps/name-cards` |
| Folder | `src/apps/{id}/` | `src/apps/name-cards/` |
| Component | PascalCase of the title | `NameCards` |
| Entry file | `{Component}.tsx` in the app folder | `NameCards.tsx` |

`description` is the confirmed sentence for `catalog.ts` and the page subtitle.

## Checklist

1. Confirm name and description (above).
2. Create `src/apps/{id}/{Component}.tsx` plus `lib/` (and `components/` only if the logic is unique to this app).
3. Register in `src/apps/catalog.ts` and `src/router.tsx`.
4. Set `useDocumentTitle(title)`.
5. Reuse shared chrome, tokens, and pickers (below).
6. If the app exports a PDF, use `jspdf` and `addPdfAttributionToAllPages` from `src/lib/pdfAttribution.ts`.

## Register the app

Landing cards come from `MINI_APPS` in `src/apps/catalog.ts`. Add an entry:

```ts
{
  id: '{id}',
  title: '{title}',
  description: '{description}',
  path: '/apps/{id}',
}
```

Wire the route in `src/router.tsx` next to the other `apps/...` children:

- Import `{Component}` from `./apps/{id}/{Component}`
- `{ path: 'apps/{id}', Component: {Component} }`

`LandingPage` already maps `MINI_APPS`; do not hard-code a new card there. Do not change Vite `base` or the router `basename`.

## Page shell and styling

Existing app styling should be carried through to the app

Copy the layout from `BuntingLetters`, `DrawerLabels`, or `LabelDesigner`:

- Page shell comes from `App` (`mx-auto flex min-h-svh max-w-3xl flex-col px-4 py-10 sm:px-6`). Do not wrap the app in that layout again.
- Header: `AppHeader` from `src/components/AppHeader.tsx` with `backToApps`, uppercase `eyebrow`, `title`, and `subtitle`. Do not copy a local `<header>` with `← All apps`.
- Main: `flex flex-1 flex-col gap-8`
- Sections: `flex flex-col gap-3`; labels `text-sm font-medium text-ink`
- Inputs: `rounded-lg border border-beige-dark/40 bg-white … outline-none ring-beige-dark/30 … focus:ring-2` with `placeholder:text-muted/50`
- Primary action: `rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-white transition enabled:hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-40`
- Secondary: `rounded-lg border border-beige-dark/40 bg-white … hover:bg-beige/40`
- Footer bar: `mt-auto … border-t border-beige-dark/30 pt-6` with summary text + Download PDF
- Empty state: dashed `border-beige-dark/50 bg-white/60` centered `text-muted`
- Errors: `text-sm text-red-700` and `role="alert"`
- Selected cards: `border-ink` plus `ring-2 ring-ink/20` (or `/15`)

Use theme tokens from `src/index.css` (`ink`, `muted`, `paper`, `beige`, `beige-dark`, `dot`). Do not add a new colour system or page-level CSS file unless a third-party widget needs a scoped class (as with `.label-date-calendar`).

British English in UI copy (`colour`, `organise`).

## Reuse existing utilities

Existing libraries for utilities (color/font pickers/etc) should be reused

Import these; do not duplicate them:

| Need | Use |
| --- | --- |
| Page header + sign-in | `src/components/AppHeader.tsx` |
| Colour picker | `src/components/ColorField.tsx` (`@uiw/react-color`) |
| Font picker + font list | `src/components/FontPicker.tsx` and `src/lib/fonts.ts` (`ensureDisplayFontsLoaded`, `getDisplayFont`, `DEFAULT_FONT_ID`) |
| Custom select | `src/apps/label-designer/components/SelectMenu.tsx` |
| Date picker | `src/apps/label-designer/components/DatePicker.tsx` |
| Avery-style sheet layout | `SheetLayoutPicker` + `src/apps/label-designer/lib/formats.ts` |
| PDF footer | `addPdfAttributionToAllPages` in `src/lib/pdfAttribution.ts` |
| Document title | `src/useDocumentTitle.ts` |

App-specific colour **presets** may live in `src/apps/{id}/lib/colors.ts` (see drawer-labels / label-designer). Still render them through `ColorField`.

New libraries: only if no existing app already covers the need. Prefer `jspdf` for PDFs and `react-hook-form` when the form is multi-row like Label Designer.

## Typical files

```
src/apps/{id}/
  {Component}.tsx      # page
  lib/pdf.ts           # if printable
  lib/colors.ts        # if ColourField presets are app-specific
  components/          # only for UI unique to this app
```

Keep domain logic in `lib/`. Shared UI lives in `src/components/`; shared helpers in `src/lib/`. Do not import from another app’s folder.

## PDF apps

Follow existing `lib/pdf.ts` files: generate with `jspdf`, then `addPdfAttributionToAllPages(doc)` (pass `contentBottomMm` / `contentTopMm` when the layout is a tight label sheet). Download loading text: `Generating PDF…` / `Download PDF`.
