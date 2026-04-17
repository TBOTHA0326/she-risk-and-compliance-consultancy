# Mobile Responsiveness — Design Spec
**Date:** 2026-04-16
**Approach:** C — Targeted fixes + responsive stacking pass across all pages

---

## Goal

Ensure 100% mobile friendliness across the SHE Risk & Compliance dashboard. No components overlapping, no horizontal overflow, all inputs reachable with thumbs, all content readable on a 375px viewport.

## Scope

Fix broken spots and add a consistent mobile-first stacking pattern to every page. No new components. No changes to desktop layouts.

---

## Target Viewport

Primary mobile target: **375px wide** (iPhone SE / most Android phones).
Secondary: **430px** (iPhone Pro Max).
Breakpoint boundary: **`sm` = 640px**, **`lg` = 1024px**.

---

## Section 1 — Layout shell (`layout.tsx`, `Sidebar.tsx`)

**No changes needed.**

- `pt-14 lg:pt-0` on `<main>` correctly reserves space for the mobile top bar.
- Hamburger + drawer nav works on mobile.
- Desktop sidebar is `hidden lg:flex`, correct.

---

## Section 2 — Dashboard page (`dashboard/page.tsx`)

### 2a. Welcome banner

**Problem:** Quick-action buttons (`+ Company`, `+ Invoice`) are `absolute bottom-0 right-0`. On a narrow screen the banner doesn't grow tall enough and they overlap the heading text.

**Fix:** Remove the `absolute` positioning wrapper. Render buttons inline below the subtitle text at all screen sizes. On `lg:` only, float them to the right using a flex row between the text block and the button group.

Before:
```
div.relative (banner)
  div.relative.z-10 (text)
  div.absolute.bottom-0.right-0 (buttons)
```

After:
```
div.relative (banner)
  div.flex.flex-col.lg:flex-row.lg:items-end.lg:justify-between (inner)
    div (text: heading + subtitle)
    div.flex.gap-2.mt-3.lg:mt-0 (buttons)
```

### 2b. Everything else

KPI grid (`grid-cols-2 lg:grid-cols-4`), charts row (`grid-cols-1 lg:grid-cols-3`), and bottom row (`grid-cols-1 lg:grid-cols-2`) are already mobile-safe.

---

## Section 3 — PageHeader component (`components/ui/Card.tsx`)

**Problem:** `flex items-start justify-between` with long title + multi-button action group causes overflow or cramping on mobile.

**Fix:** Add `flex-wrap gap-y-3` to the outer flex. Action slot gets `shrink-0 flex flex-wrap gap-2`.

No API change — same props, same usage everywhere.

---

## Section 4 — Invoice form (`invoices/InvoiceForm.tsx`)

### 4a. Detail fields

`grid grid-cols-2 gap-4` for Invoice # + Company and Issue Date + Due Date. On very small screens these 2-col grids are cramped.

**Fix:** Change to `grid-cols-1 sm:grid-cols-2`.

### 4b. Line items

**Problem:** `grid-cols-12` with `col-span-6/2/3/1` renders ~72px qty and ~108px price fields on 375px — too small to tap.

**Fix:** Replace the `grid-cols-12` row with a responsive layout:
- Mobile: Description full-width on top, then a flex row of `Qty | Unit Price | [trash]` below it.
- `sm:` and above: restore the current `grid-cols-12` column layout.

Concrete classes:
```
Mobile:  flex flex-col gap-1
  row 1: description (full width)
  row 2: flex gap-2
    qty (w-20)
    unit price (flex-1)
    trash button

sm+:     grid grid-cols-12 gap-2 items-end (existing layout)
```

Use `hidden sm:grid` / `flex sm:hidden` to toggle between the two layouts.

---

## Section 5 — Quote form (`quotes/QuoteForm.tsx`)

Same pattern as InvoiceForm — identical fixes:
- `grid-cols-1 sm:grid-cols-2` for detail field pairs
- Responsive line items layout (mobile stack vs sm+ grid)

---

## Section 6 — Invoice detail document (`invoices/[id]/InvoiceDetail.tsx`)

### 6a. Document header row

**Problem:** `flex items-start justify-between` — "INVOICE" heading on left, company branding block on right. At 375px these two blocks are <150px each, unreadable.

**Fix:** `flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4`

### 6b. Invoice meta grid

**Problem:** `grid grid-cols-2 gap-8` — Bill To + dates. Two ~155px columns on mobile.

**Fix:** `grid grid-cols-1 sm:grid-cols-2`

### 6c. Totals block

**Problem:** `w-72` hardcoded — overflows on 375px.

**Fix:** `w-full sm:w-72`

### 6d. Footer

**Problem:** `flex gap-8` — "Thank You" italic + bank details side by side. On mobile the two flex children are ~150px each.

**Fix:** `flex flex-col sm:flex-row gap-4 sm:gap-8`

### 6e. Action bar buttons

**Problem:** 4 buttons in a single `flex gap-2` row. On mobile (Print, Duplicate, Edit, Delete) these overflow.

**Fix:** `flex flex-wrap gap-2`

---

## Section 7 — Quote detail document (`quotes/[id]/QuoteDetail.tsx`)

Identical structure to InvoiceDetail — same fixes:
- Document header: `flex-col sm:flex-row`
- Meta grid: `grid-cols-1 sm:grid-cols-2`
- Totals: `w-full sm:w-72`
- Footer: `flex-col sm:flex-row`
- Action bar: `flex-wrap gap-2`

---

## Section 8 — Other pages (no changes)

| Page | Status |
|---|---|
| Companies list | Row layout already mobile-safe |
| Company detail tabs | `overflow-x-auto whitespace-nowrap` already in place |
| Documents list | Card-list layout with `min-w-0 truncate`, already mobile-safe ✓ |
| Safety Files list | Card-list layout, progress bar already `hidden sm:block` ✓ |
| Company form | Single-column stacking ✓ |
| Document form | Single-column stacking ✓ |
| Safety File form | Single-column stacking ✓ |

---

## Files Changed

| File | Change |
|---|---|
| `app/src/app/(dashboard)/dashboard/page.tsx` | Banner button layout |
| `app/src/components/ui/Card.tsx` | PageHeader flex-wrap |
| `app/src/app/(dashboard)/invoices/InvoiceForm.tsx` | Field grids + line items |
| `app/src/app/(dashboard)/quotes/QuoteForm.tsx` | Field grids + line items |
| `app/src/app/(dashboard)/invoices/[id]/InvoiceDetail.tsx` | Document layout fixes |
| `app/src/app/(dashboard)/quotes/[id]/QuoteDetail.tsx` | Document layout fixes |

---

## Success Criteria

- [ ] No component overlaps or horizontal overflow on 375px viewport
- [ ] All form inputs are reachable and ≥44px tap height on mobile
- [ ] Invoice and Quote documents are readable without horizontal scrolling on mobile
- [ ] Dashboard welcome banner buttons don't overlap heading text on any screen size
- [ ] Desktop layouts are 100% unchanged
