# Mobile Responsiveness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every page in the SHE Risk & Compliance dashboard fully usable on a 375px mobile viewport with no overlapping components and no horizontal overflow.

**Architecture:** Targeted Tailwind breakpoint fixes across 6 files. No new components, no changes to desktop layouts. Primary breakpoint used is `sm` (640px) — below this, layouts stack vertically; above it, existing desktop designs are preserved exactly.

**Tech Stack:** Next.js App Router, React, Tailwind CSS v4, TypeScript

---

## File Map

| File | What changes |
|---|---|
| `app/src/components/ui/Card.tsx` | `PageHeader` — add `flex-wrap` and `gap` |
| `app/src/app/(dashboard)/dashboard/page.tsx` | Welcome banner — move buttons out of `absolute` into normal flow |
| `app/src/app/(dashboard)/invoices/InvoiceForm.tsx` | Field pair grids → `sm:grid-cols-2`; line items → responsive flex/grid |
| `app/src/app/(dashboard)/quotes/QuoteForm.tsx` | Same fixes as InvoiceForm |
| `app/src/app/(dashboard)/invoices/[id]/InvoiceDetail.tsx` | Document header, meta grid, totals, footer, action bar |
| `app/src/app/(dashboard)/quotes/[id]/QuoteDetail.tsx` | Same fixes as InvoiceDetail |

---

## Task 1: PageHeader — flex-wrap

**Files:**
- Modify: `app/src/components/ui/Card.tsx:53-63`

- [ ] **Step 1: Apply the fix**

Replace the `PageHeader` function body in `app/src/components/ui/Card.tsx`:

```tsx
export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 flex flex-wrap gap-2">{action}</div>}
    </div>
  )
}
```

Key changes:
- `flex-wrap gap-3` on the outer div so title and actions wrap instead of overflowing
- `min-w-0` on the title div so long titles truncate instead of forcing the container wider
- `flex flex-wrap gap-2` on the action slot so multiple buttons wrap naturally

- [ ] **Step 2: Verify build**

```bash
cd "app" && npm run build 2>&1 | tail -20
```

Expected: no TypeScript errors, build completes.

- [ ] **Step 3: Commit**

```bash
git add app/src/components/ui/Card.tsx
git commit -m "fix(mobile): PageHeader flex-wrap for narrow viewports"
```

---

## Task 2: Dashboard banner — move buttons to normal flow

**Files:**
- Modify: `app/src/app/(dashboard)/dashboard/page.tsx:51-66`

- [ ] **Step 1: Apply the fix**

Replace the entire welcome banner `<div>` (lines 51–66) with:

```tsx
{/* Welcome Banner */}
<div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-blue-950 to-slate-900 rounded-2xl px-7 py-6 text-white shadow-lg">
  <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Welcome back, Charlotte! 👋</h1>
      <p className="text-sm text-blue-200 mt-1">Here&apos;s your compliance overview for today.</p>
    </div>
    <div className="flex gap-2">
      <Link href="/companies/new"><button className="bg-white/10 hover:bg-white/20 transition text-white text-xs font-medium px-3 py-1.5 rounded-lg border border-white/20">+ Company</button></Link>
      <Link href="/invoices/new"><button className="bg-white text-red-700 hover:bg-red-50 transition text-xs font-semibold px-3 py-1.5 rounded-lg">+ Invoice</button></Link>
    </div>
  </div>
  {/* Decorative circles */}
  <div className="absolute -top-6 -right-6 w-36 h-36 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 opacity-20" />
  <div className="absolute -bottom-10 right-16 w-24 h-24 rounded-full bg-gradient-to-br from-blue-700 to-blue-900 opacity-15" />
  <div className="absolute top-2 right-32 w-12 h-12 rounded-full bg-blue-500 opacity-10" />
</div>
```

Key changes:
- Removed the `absolute bottom-0 right-0` wrapper around the buttons entirely
- Inner content is now `flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4`
- On mobile: text stacks above buttons
- On `lg+`: text and buttons sit side-by-side at the bottom edge (same visual as before)

- [ ] **Step 2: Verify build**

```bash
cd "app" && npm run build 2>&1 | tail -20
```

Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add "app/src/app/(dashboard)/dashboard/page.tsx"
git commit -m "fix(mobile): dashboard banner buttons no longer overlap heading on small screens"
```

---

## Task 3: InvoiceForm — field grids + responsive line items

**Files:**
- Modify: `app/src/app/(dashboard)/invoices/InvoiceForm.tsx:168-266`

- [ ] **Step 1: Fix the two field-pair grids**

In `InvoiceForm.tsx`, find the two `grid grid-cols-2 gap-4` divs (Invoice # + Company, and Issue Date + Due Date) and change both to `grid grid-cols-1 sm:grid-cols-2 gap-4`:

```tsx
{/* Invoice Number + Company */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <div>
    <Input
      label="Invoice Number"
      required
      value={form.invoice_number}
      onChange={(e) => { set('invoice_number', e.target.value); checkNumberUnique(e.target.value) }}
      error={numberError ?? undefined}
      placeholder="INV-0001"
    />
  </div>
  <Select
    label="Company"
    required
    value={form.company_id}
    onChange={(e) => set('company_id', e.target.value)}
    options={[
      { value: '', label: 'Select company...' },
      ...companies.map((c) => ({ value: c.id, label: c.name })),
    ]}
  />
</div>

{/* Issue Date + Due Date */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Input
    label="Issue Date"
    type="date"
    required
    value={form.issue_date}
    onChange={(e) => set('issue_date', e.target.value)}
  />
  <Input
    label="Due Date"
    type="date"
    required
    value={form.due_date}
    onChange={(e) => set('due_date', e.target.value)}
  />
</div>
```

- [ ] **Step 2: Fix the line items — responsive layout**

Replace every `<div key={idx} className="grid grid-cols-12 gap-2 items-end">` row and its 4 children with this pattern. The key technique: outer div is `flex flex-col` on mobile and `grid grid-cols-12` on `sm+`; the inner grouping div uses `sm:contents` to dissolve into the grid on desktop while acting as a `flex` row on mobile.

```tsx
{lineItems.map((li, idx) => (
  <div key={idx} className="flex flex-col gap-2 sm:grid sm:grid-cols-12 sm:gap-2 sm:items-end">
    <div className="sm:col-span-6">
      <Input
        label={idx === 0 ? 'Description' : ''}
        value={li.description}
        onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
        placeholder="Service description..."
      />
    </div>
    <div className="flex gap-2 items-end sm:contents">
      <div className="w-20 shrink-0 sm:w-auto sm:col-span-2">
        <Input
          label={idx === 0 ? 'Qty' : ''}
          type="number"
          min="0"
          step="0.01"
          value={li.quantity}
          onChange={(e) => updateLineItem(idx, 'quantity', e.target.value)}
        />
      </div>
      <div className="flex-1 sm:col-span-3">
        <Input
          label={idx === 0 ? 'Unit Price' : ''}
          type="number"
          min="0"
          step="0.01"
          value={li.unit_price}
          onChange={(e) => updateLineItem(idx, 'unit_price', e.target.value)}
        />
      </div>
      <div className="flex items-end shrink-0 pb-0.5 sm:col-span-1">
        <button
          type="button"
          onClick={() => removeLineItem(idx)}
          className="p-2 text-gray-400 hover:text-red-500 transition cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
))}
```

How it works on mobile (< 640px):
- Outer div = `flex flex-col gap-2` — stacks children vertically
- Description = full width
- Inner div = `flex gap-2 items-end` — Qty (80px fixed) + Price (flex-1) + Trash button in a row

How it works on sm+ (≥ 640px):
- Outer div = `grid grid-cols-12 gap-2 items-end` — 12-column grid
- Description = `col-span-6`
- Inner div = `contents` — disappears, its children become direct grid children
- Qty = `col-span-2` (w-auto overrides w-20)
- Price = `col-span-3`
- Trash = `col-span-1`

- [ ] **Step 3: Verify build**

```bash
cd "app" && npm run build 2>&1 | tail -20
```

Expected: clean build, no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add "app/src/app/(dashboard)/invoices/InvoiceForm.tsx"
git commit -m "fix(mobile): InvoiceForm field grids stack on mobile, line items responsive"
```

---

## Task 4: QuoteForm — same fixes as InvoiceForm

**Files:**
- Modify: `app/src/app/(dashboard)/quotes/QuoteForm.tsx:161-238`

The QuoteForm is structurally identical to InvoiceForm. Apply the exact same two changes.

- [ ] **Step 1: Fix the two field-pair grids**

Change both `grid grid-cols-2 gap-4` to `grid grid-cols-1 sm:grid-cols-2 gap-4`:

```tsx
{/* Quote Number + Company */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Input
    label="Quote Number"
    required
    value={form.quote_number}
    onChange={(e) => { set('quote_number', e.target.value); checkNumberUnique(e.target.value) }}
    error={numberError ?? undefined}
    placeholder="QUO-0001"
  />
  <Select
    label="Company"
    required
    value={form.company_id}
    onChange={(e) => set('company_id', e.target.value)}
    options={[
      { value: '', label: 'Select company...' },
      ...companies.map((c) => ({ value: c.id, label: c.name })),
    ]}
  />
</div>

{/* Issue Date + Valid Until */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
  <Input
    label="Issue Date"
    type="date"
    required
    value={form.issue_date}
    onChange={(e) => set('issue_date', e.target.value)}
  />
  <Input
    label="Valid Until"
    type="date"
    required
    value={form.valid_until}
    onChange={(e) => set('valid_until', e.target.value)}
  />
</div>
```

- [ ] **Step 2: Fix the line items — responsive layout**

Replace the `{lineItems.map((li, idx) => (` block with the same responsive pattern as InvoiceForm (Task 3 Step 2), substituting `quote_line_items` field names. The only difference is `updateLineItem` references remain identical since the function signature is the same:

```tsx
{lineItems.map((li, idx) => (
  <div key={idx} className="flex flex-col gap-2 sm:grid sm:grid-cols-12 sm:gap-2 sm:items-end">
    <div className="sm:col-span-6">
      <Input
        label={idx === 0 ? 'Description' : ''}
        value={li.description}
        onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
        placeholder="Service description..."
      />
    </div>
    <div className="flex gap-2 items-end sm:contents">
      <div className="w-20 shrink-0 sm:w-auto sm:col-span-2">
        <Input
          label={idx === 0 ? 'Qty' : ''}
          type="number"
          min="0"
          step="0.01"
          value={li.quantity}
          onChange={(e) => updateLineItem(idx, 'quantity', e.target.value)}
        />
      </div>
      <div className="flex-1 sm:col-span-3">
        <Input
          label={idx === 0 ? 'Unit Price' : ''}
          type="number"
          min="0"
          step="0.01"
          value={li.unit_price}
          onChange={(e) => updateLineItem(idx, 'unit_price', e.target.value)}
        />
      </div>
      <div className="flex items-end shrink-0 pb-0.5 sm:col-span-1">
        <button
          type="button"
          onClick={() => removeLineItem(idx)}
          className="p-2 text-gray-400 hover:text-red-500 transition cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
))}
```

- [ ] **Step 3: Verify build**

```bash
cd "app" && npm run build 2>&1 | tail -20
```

Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add "app/src/app/(dashboard)/quotes/QuoteForm.tsx"
git commit -m "fix(mobile): QuoteForm field grids stack on mobile, line items responsive"
```

---

## Task 5: InvoiceDetail — document layout fixes

**Files:**
- Modify: `app/src/app/(dashboard)/invoices/[id]/InvoiceDetail.tsx`

Five targeted fixes inside the invoice document card.

- [ ] **Step 1: Action bar — flex-wrap**

Find the action bar `<div className="flex gap-2">` (inside the `print:hidden` PageHeader action prop) and change it to `flex flex-wrap gap-2`:

```tsx
action={
  <div className="flex flex-wrap gap-2">
    <Button variant="ghost" size="sm" onClick={() => window.print()}><Printer className="w-4 h-4" /></Button>
    <Button variant="secondary" size="sm" onClick={handleDuplicate} loading={duplicating}><Copy className="w-3.5 h-3.5 mr-1" />Duplicate</Button>
    <Link href={`/invoices/${invoice.id}/edit`}><Button variant="secondary" size="sm"><Edit className="w-3.5 h-3.5 mr-1" />Edit</Button></Link>
    <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}><Trash2 className="w-3.5 h-3.5" /></Button>
  </div>
}
```

- [ ] **Step 2: Document inner padding — mobile-friendly**

Change `<div className="p-8 print:p-10">` to `<div className="p-5 sm:p-8 print:p-10">` so the document has comfortable padding on small screens.

- [ ] **Step 3: Document header row — stack on mobile**

Change `<div className="flex items-start justify-between mb-8">` to:

```tsx
<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
```

- [ ] **Step 4: Invoice meta grid — stack on mobile**

Change `<div className="grid grid-cols-2 gap-8 mb-8">` to:

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-8">
```

- [ ] **Step 5: Totals block — full width on mobile**

Change `<div className="w-72 space-y-1 text-sm">` to:

```tsx
<div className="w-full sm:w-72 space-y-1 text-sm">
```

- [ ] **Step 6: Footer — stack on mobile**

Change `<div className="border-t-2 border-red-700 pt-5 mt-4 flex gap-8">` to:

```tsx
<div className="border-t-2 border-red-700 pt-5 mt-4 flex flex-col sm:flex-row gap-4 sm:gap-8">
```

Also update the bottom colour bar negative margin to match the new padding. Change:
```tsx
<div className="h-1 bg-gradient-to-r from-blue-500 via-blue-800 to-slate-700 mt-6 -mx-8 print:-mx-10" />
```
to:
```tsx
<div className="h-1 bg-gradient-to-r from-blue-500 via-blue-800 to-slate-700 mt-6 -mx-5 sm:-mx-8 print:-mx-10" />
```

- [ ] **Step 7: Verify build**

```bash
cd "app" && npm run build 2>&1 | tail -20
```

Expected: clean build.

- [ ] **Step 8: Commit**

```bash
git add "app/src/app/(dashboard)/invoices/[id]/InvoiceDetail.tsx"
git commit -m "fix(mobile): InvoiceDetail document layout stacks correctly on small screens"
```

---

## Task 6: QuoteDetail — document layout fixes

**Files:**
- Modify: `app/src/app/(dashboard)/quotes/[id]/QuoteDetail.tsx`

Identical fixes to InvoiceDetail — apply each step below.

- [ ] **Step 1: Action bar — flex-wrap**

Change `<div className="flex gap-2">` inside the PageHeader action prop to `flex flex-wrap gap-2`:

```tsx
action={
  <div className="flex flex-wrap gap-2">
    {!quote.converted_to_invoice_id && (
      <Button variant="secondary" size="sm" onClick={() => setConvertModal(true)}>
        <ArrowRight className="w-3.5 h-3.5 mr-1" />Convert to Invoice
      </Button>
    )}
    <Link href={`/quotes/${quote.id}/edit`}><Button variant="secondary" size="sm"><Edit className="w-3.5 h-3.5 mr-1" />Edit</Button></Link>
    <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}><Trash2 className="w-3.5 h-3.5" /></Button>
  </div>
}
```

- [ ] **Step 2: Document inner padding — mobile-friendly**

Change `<div className="p-8 print:p-10">` to `<div className="p-5 sm:p-8 print:p-10">`.

- [ ] **Step 3: Document header row — stack on mobile**

Change `<div className="flex items-start justify-between mb-8">` to:

```tsx
<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
```

- [ ] **Step 4: Quote meta grid — stack on mobile**

Change `<div className="grid grid-cols-2 gap-8 mb-8">` to:

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-8">
```

- [ ] **Step 5: Totals block — full width on mobile**

Change `<div className="w-72 space-y-1 text-sm">` to:

```tsx
<div className="w-full sm:w-72 space-y-1 text-sm">
```

- [ ] **Step 6: Footer — stack on mobile**

Change `<div className="border-t-2 border-red-700 pt-5 mt-4 flex gap-8">` to:

```tsx
<div className="border-t-2 border-red-700 pt-5 mt-4 flex flex-col sm:flex-row gap-4 sm:gap-8">
```

Also update the bottom colour bar:
```tsx
<div className="h-1 bg-gradient-to-r from-blue-500 via-blue-800 to-slate-700 mt-6 -mx-5 sm:-mx-8 print:-mx-10" />
```

- [ ] **Step 7: Verify build**

```bash
cd "app" && npm run build 2>&1 | tail -20
```

Expected: clean build.

- [ ] **Step 8: Commit**

```bash
git add "app/src/app/(dashboard)/quotes/[id]/QuoteDetail.tsx"
git commit -m "fix(mobile): QuoteDetail document layout stacks correctly on small screens"
```

---

## Final Verification Checklist

- [ ] Run `cd app && npm run build` — confirm zero TypeScript errors
- [ ] Open dev server (`npm run dev`), open browser DevTools, set viewport to 375px width
- [ ] Check Dashboard page — banner buttons appear below heading text, not overlapping
- [ ] Check Invoices list — table scrolls horizontally if needed, no page overflow
- [ ] Check New Invoice form — fields stack single-column, line items show Description + [Qty | Price | Trash] layout
- [ ] Check Invoice detail — document header stacks, meta grid stacks, totals full width, footer stacks, action buttons wrap
- [ ] Repeat the above two checks for Quotes
- [ ] Set viewport to 430px and verify nothing breaks
- [ ] Set viewport back to 1280px and verify desktop layouts are unchanged
