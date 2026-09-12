---
name: a11y-design-system
description: WCAG AAA accessibility, ARIA patterns, keyboard focus traps, screen-reader semantics, and touch-target standards for design systems.
---

# ♿ Accessible Design System & WCAG Guidelines

Ensures universal accessibility, full keyboard navigability, and screen reader compliance across all interactive UI components.

## 📐 Core Standards

1. **Keyboard Navigability**:
   - Every interactive control (buttons, links, menu triggers, tabs, modals) MUST be reachable and operable using `Tab`, `Shift+Tab`, `Enter`, and `Space`.
   - Menus, dropdowns, and comboboxes must support `ArrowUp`, `ArrowDown`, `Home`, `End`, and `Escape` to close.

2. **Focus Management & Focus Traps**:
   - Modals, side drawers, and full-screen dialogs must trap focus within the dialog while open.
   - Upon closing, focus MUST return to the trigger element that opened it.
   - Never suppress outline indicators (`outline: none`) without providing a prominent, high-contrast `:focus-visible` replacement.

3. **ARIA Semantics & Labels**:
   - Icon-only buttons MUST declare `aria-label` or `aria-labelledby`.
   - Expandable dropdowns must set `aria-expanded="true|false"` and link to content via `aria-controls="menu-id"`.
   - Active navigation links must declare `aria-current="page"`.
   - Modals must declare `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`.

4. **Touch Target Dimensions**:
   - On mobile viewports, all touchable targets must measure at least `44x44px` (or min `2.75rem`), with adequate spacing to prevent accidental mis-taps.

5. **Color Contrast & Motion**:
   - Text must satisfy a minimum contrast ratio of 4.5:1 (normal text) and 3:1 (large text / UI borders).
   - Support `prefers-reduced-motion: reduce` by disabling smooth scrolling, parallax, and heavy transitions.
