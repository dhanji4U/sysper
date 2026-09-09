# UI Quality Checklist — Emiote Sysper (Tauri React + Tailwind v4)

Covers: Web Interface Guidelines (vercel), Tauri/desktop (Windows/macOS), AGENTS.md brand rules.

---

## 1. Accessibility (A11Y)
- [ ] Icon-only buttons have `aria-label`
- [ ] All interactive elements have keyboard handlers (`onKeyDown`/tab order)
- [ ] Semantic HTML (`<button>` for actions, `<a>` for nav)
- [ ] Images have `alt` (or `alt=""`)
- [ ] Decorative icons: `aria-hidden="true"`
- [ ] Async updates (`toasts`, `success`) have `aria-live="polite"`
- [ ] Skip link / heading hierarchy (`h1`-`h6`)
- [ ] No click-only `<div>` without keyboard access

## 2. Focus States
- [ ] Visible focus ring (`focus-visible:ring-*` or equivalent)
- [ ] Never `outline-none` without replacement
- [ ] `:focus-visible` used over `:focus`
- [ ] Focus not covered by sticky headers/overlays

## 3. Forms & Inputs
- [ ] Inputs have `label` / `aria-label`
- [ ] Correct `type`, `inputmode`, `autocomplete`
- [ ] No blocked paste (`preventDefault` on `onPaste`)
- [ ] Labels clickable (`htmlFor` or wrapping)
- [ ] Errors shown inline; first error focused on submit
- [ ] Submit button enabled until request; spinner shown during request

## 4. Animation & Motion
- [ ] `prefers-reduced-motion` honored (disable or reduce)
- [ ] Only `transform`/`opacity` animated
- [ ] No `transition: all`
- [ ] Correct `transform-origin`
- [ ] Autoplay motion >5s has pause/stop controls (or stops under reduced motion)

## 5. Typography
- [ ] `…` not `...`
- [ ] Curly quotes (`"`) not straight
- [ ] Non-breaking spaces for units (`10&nbsp;MB`)
- [ ] `tabular-nums` for number columns
- [ ] `text-wrap: balance` / `text-pretty` on headings
- [ ] Loading states end with `…`

## 6. Content & Layout
- [ ] Long text handled (`truncate`, `line-clamp`, `break-words`)
- [ ] Flex children use `min-w-0`
- [ ] Empty states handled (no broken UI)
- [ ] User content anticipates short/long inputs
- [ ] Destructive actions confirmed (modal / undo)

## 7. Images & Media
- [ ] `<img>` has explicit `width`/`height`
- [ ] Below-fold: `loading="lazy"`
- [ ] Critical above-fold: priority/fetchpriority
- [ ] Video preferred over animated GIF; still fallback provided

## 8. Performance
- [ ] No layout reads in render (`getBoundingClientRect`, etc.)
- [ ] Large lists virtualized (>50 items)
- [ ] Batch DOM reads/writes
- [ ] Uncontrolled inputs preferred; controlled inputs cheap per keystroke
- [ ] Fonts preloaded; `font-display: swap`

## 9. Navigation & State
- [ ] Link state in URL (filters, tabs, pagination)
- [ ] Deep-link all stateful UI
- [ ] `<a>` / `<Link>` for navigation (not `<div onClick>`)

## 10. Touch, Interaction & Gestures
- [ ] `touch-action: manipulation`
- [ ] `-webkit-tap-highlight-color` set
- [ ] `overscroll-behavior: contain` in modals/sheets
- [ ] Gestures have tap/click + keyboard alternatives
- [ ] `autoFocus` used sparingly; not on mobile

## 11. Safe Areas & Layout (Desktop / Mobile)
- [ ] Full-bleed layouts use `env(safe-area-inset-*)` for notches
- [ ] Unwanted scrollbars prevented (`overflow-x-hidden` on containers)
- [ ] Flex/grid over JS measurement
- [ ] Sticky headers/footers don't cover focused elements

## 12. Dark Mode & Theming
- [ ] `color-scheme: dark` on `<html>` for dark themes
- [ ] `<meta name="theme-color">` matches background
- [ ] Native `<select>`: explicit `background-color` and `color` (Windows dark)
- [ ] Dark/Light toggle works (AGENTS.md Settings)

## 13. Windows & macOS Native (Tauri)
- [ ] Title bar / drag region configured (`tauri.conf.json`)
- [ ] Window state persisted (size, position on macOS/Windows)
- [ ] Native menu / shortcuts (Cmd/Ctrl) supported
- [ ] Safe area insets respected on macOS notches
- [ ] Dark mode sync with OS theme (`tauri` plugin / native)
- [ ] No `user-scalable=no` (zoom disabled)

## 14. Locale & i18n
- [ ] `Intl.DateTimeFormat` / `Intl.NumberFormat` (not hardcoded)
- [ ] Brand/code tokens wrapped with `translate="no"`
- [ ] Language detected via `Accept-Language`, not IP

## 15. Hydration Safety
- [ ] Inputs with `value` have `onChange` (or `defaultValue`)
- [ ] Date/time rendering guarded against hydration mismatch
- [ ] `suppressHydrationWarning` only where needed

## 16. Hover & Interactive States (AGENTS.md)
- [ ] Buttons/links have `hover:` state
- [ ] Interactive states increase contrast
- [ ] Minimal UI — 1 black button aesthetic (AGENTS.md)

## 17. Anti-Patterns (Flag if present)
- [ ] `outline-none` without focus-visible replacement
- [ ] Inline `onClick` navigation without `<a>`
- [ ] `<div>` / `<span>` with click handlers instead of `<button>`
- [ ] Images without dimensions
- [ ] `.map()` without virtualization for large arrays
- [ ] Form inputs without labels
- [ ] Hardcoded date/number formats
- [ ] `transition: all`
- [ ] Animated GIF when compressed video is suitable
- [ ] Gesture-only without keyboard/tap alternative

---

## AGENTS.md Brand / Product Rules
- [ ] Minimal UI — no ads/popups, no bloat
- [ ] 1 black button aesthetic
- [ ] Confetti on success
- [ ] Offline mode (no telemetry, no cloud)
- [ ] Trash only (`trash` crate) — never `remove_dir_all`
- [ ] Never touch `.env`, `.git`, `src`, `lib`
- [ ] Safety warning: "Moved to Trash"
- [ ] Human-readable size formatting
- [ ] Dark/Light settings

---

## Quick Audit (Current Source)
File patterns checked: `src/components/*.tsx`, `src/App.tsx`, `src/index.css`
