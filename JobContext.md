# Amma Spares Galore — Job Tracking System

A workshop job management system for Amma Spares Galore, a South African VW Amarok specialist. Tracks vehicle repair and service jobs from intake through completion, parts ordering, invoicing, and payment.

---

## Core Domain

### Job (Service Job)
The central entity. A job represents a single vehicle booking or repair request. Linked to a customer and their vehicle. Carries a status and is never hard-deleted.

**Key fields:** `job_no`, `description`, `customer_id`, `vehicle_id`, `status_id`, `mechanic_id`, `category` (service / repair / diagnostic / warranty), `branch`, `is_archived`, `created_at`

### Vehicle
The vehicle being serviced. Linked to a customer. Amarok-specific fields (year, variant, engine type, odometer) allow accurate parts matching.

**Key fields:** `customer_id`, `registration`, `make`, `model`, `year`, `variant`, `engine`, `vin`, `odometer`

### Customer
The owner of the vehicle. A customer can have multiple vehicles and multiple jobs over time.

**Key fields:** `name`, `email`, `phone`, `branch`

### Parts / Line Items
Parts used on a job, drawn from inventory or ordered externally. Each line item records part number, description, quantity, unit cost, and sell price.

**Key fields:** `job_id`, `part_no`, `description`, `qty`, `unit_cost`, `sell_price`, `sourced` (in-stock / ordered / supplied-by-customer)

### Mechanic
The technician assigned to the job. A job has one primary mechanic (nullable). Mechanics belong to a branch.

---

## Job Lifecycle

```
Booking → Awaiting Drop-off → Vehicle Received → Diagnosing → Awaiting Parts
→ In Progress → Quality Check → Ready for Collection → Collected → Invoiced → Paid
```

Statuses are stored in a `status` table — no hardcoded enums. Each status has flags for:
- `show_on_dashboard` — whether to surface on the main board
- `is_terminal` — marks end states (Collected, Cancelled, Paid)

Every status change writes to `status_history` with entry time, exit time, and duration in minutes.

---

## Workflow Summary

1. Job created (Booking) — customer, vehicle, and description captured; estimated collection date set.
2. Vehicle received at workshop — status moves to "Vehicle Received"; odometer stamped.
3. Mechanic assigned; diagnosis recorded; parts list compiled.
4. Parts sourced: in-stock pulled from inventory, external parts ordered (tracked with ETA).
5. Work carried out; status moves to "In Progress".
6. Quality check; job marked "Ready for Collection".
7. Vehicle collected; job closed with `delivery_date` stamped.
8. Invoice generated from job line items; payment tracked.
9. Archived jobs can be restored (separate permission required).

---

## Parts & Inventory

- Jobs have line items (parts used). Each item records cost and sell price for margin tracking.
- Parts can be sourced three ways: **in-stock** (deducted from inventory), **ordered** (external supplier, tracked with ETA), or **supplied by customer**.
- Ordered parts have an ETA date; overdue ETAs surface as alerts on the job.
- No full inventory module in v1 — parts on jobs are free-text + part number.

---

## In-App Alerts

- Overdue ETAs on ordered parts
- Jobs past estimated collection date
- Jobs awaiting QC for >24h

---

## Multi-Branch

A `branch` field on Job, Customer, Vehicle, and Mechanic supports multiple physical locations sharing one system. All queries filter by branch. Branch switching available in the sidebar.

---

## Permissions

| Permission | Access |
|---|---|
| `jobs.view` | View jobs |
| `jobs.create` | Create new jobs |
| `jobs.edit` | Edit job details and line items |
| `jobs.status` | Change job status |
| `jobs.archive` | Archive / restore jobs |
| `archive.view` | View archived jobs |
| `invoices.create` | Generate invoices from jobs |
| `reports.view` | Access reporting module |

---

## Key Design Decisions

- **Soft deletes** — `is_archived` flag; nothing is hard-deleted.
- **Vehicle as first-class entity** — allows job history per vehicle (service records, past repairs).
- **Status as data** — adding or renaming statuses (e.g. "Awaiting Authorisation") requires no code change.
- **Line items on job** — invoice is generated directly from job parts/labour, no separate entry.
- **Branch isolation** — multi-location safe from day one.

---

## Tech Stack

- **Framework:** Next.js (React + TypeScript) — deployed on Vercel
- **Database:** Supabase (PostgreSQL + RLS)
- **Styling:** Tailwind CSS
- **Forms:** react-hook-form
- **Auth:** Supabase Auth (email + password)

---

## UI / UX Design System

Inspired by the SHE Risk & Compliance platform — same structural DNA, adapted for an operations/workshop context.

### Visual Style

- **Classification:** Minimal flat — clean surfaces, no glassmorphism, subtle layered shadows
- **Mode:** Light mode primary; dark sidebar for persistent navigation contrast
- **Tone:** Professional, dense-but-scannable, operations-first

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--primary` | `#84cc16` | Active nav, primary buttons, key accents |
| `--primary-dark` | `#65a30d` | Button hover state |
| `--bg` | `#f0f1f5` | Page background |
| `--surface` | `#ffffff` | Card / modal background |
| `--surface-soft` | `#f8fafc` | Alternate row, input background |
| `--sidebar-bg` | `#0c0d14` | Sidebar background |
| `--text-primary` | `#0f172a` | Body text |
| `--text-muted` | `#64748b` | Secondary labels, metadata |
| `--border` | `rgba(15,23,42,0.08)` | Card and input borders |
| Success | `#10b981` | Completed, Paid, parts received |
| Warning | `#f59e0b` | Awaiting parts, overdue ETA |
| Danger | `#e11d48` | Overdue collection, Cancelled |
| Info | `#0ea5e9` | Informational states |

### Typography

- **Font family:** Geist Sans, system-ui fallback; Geist Mono for job numbers / part numbers
- **Scale:** `xs` 12px · `sm` 14px · `base` 16px · `lg` 18px · `2xl` 24px
- **Weights:** Regular 400 (body) · Medium 500 (labels) · Semibold 600 (headings)
- **Labels:** Uppercase + `tracking-wide` for section headers and sidebar nav categories

### Layout

- **Sidebar:** 256px fixed, dark `#0c0d14`, hidden on mobile
- **Mobile header:** 56px top bar with hamburger + branch switcher
- **Content area:** Full remaining width, `p-6` padding, `max-w-7xl` container
- **Spacing rhythm:** 4 / 8 / 12 / 16 / 24 / 32px increments
- **Breakpoints:** 375 (mobile) · 768 (tablet) · 1024 (desktop) · 1440 (wide)

### Component Patterns

**Cards**
- `bg-white rounded-2xl` with two-layer shadow: `0 1px 3px rgba(15,23,42,0.04), 0 6px 20px rgba(15,23,42,0.06)`
- Consistent `p-5` padding; section header `px-6 py-4 border-b`

**Status Badges**
- Pill-shaped `rounded-full`, semantic background + text color pairs
- Variants: `booking` (slate) · `vehicle-received` (sky) · `in-progress` (blue) · `awaiting-parts` (amber) · `ready` (emerald) · `collected` (slate muted) · `invoiced` (violet) · `paid` (lime)
- Overdue indicator: red dot or `-N days` chip in danger color

**Buttons**
- Primary: lime `#84cc16`, dark text, shadow, hover `#65a30d`
- Secondary: `slate-950` bg, white text
- Danger: `rose-600` bg, white text
- Ghost: white + subtle border
- Sizes: sm · md · lg — consistent `rounded-xl`

**Data Table (Jobs List)**
- Sticky header, alternating row subtle tint (`surface-soft`)
- Inline status badge per row; collection date chip (green → amber → red)
- Row actions: icon-only (Lucide) with `title` tooltip + `cursor-pointer`
- Sortable column headers with `aria-sort`
- Virtualized for large datasets (50+ rows)

**Sidebar Navigation**
- Active item: 3px left lime border + subtle lime-tinted bg
- Nav category labels: uppercase, `tracking-[0.2em]`, `text-xs`, muted
- Icons: Lucide, stroke-consistent, 20px, aligned to text baseline
- Branch switcher at top of sidebar

**Forms / Modals**
- `rounded-2xl` modal, `bg-black/30` backdrop
- Inputs: `rounded-xl`, focus `ring-2 ring-[#84cc16]`
- Error state: `bg-rose-50 border-rose-300` + message below field
- Labels visible (never placeholder-only); required fields marked `*`

**Dashboard KPI Cards**
- 2-col mobile → 4-col desktop grid, `gap-4`
- Icon + metric + label + trend delta (colored arrow)
- Key metrics: Active Jobs · Overdue Collection · Awaiting Parts · Ready for Collection

### Page Structure

#### Dashboard
- KPI row (Active Jobs, Overdue, Awaiting Parts, Ready for Collection)
- Jobs by Status bar chart (Recharts) + daily completions trend line
- Recent Activity feed (status changes, new bookings, parts arrived)
- Quick Actions: New Job · Mark Parts Arrived · Update Status

#### Jobs List
- Filter bar: Status · Mechanic · Branch · Date range · Search (job no, rego, customer)
- Sortable table with status badge, vehicle rego, customer name, mechanic, collection date
- Bulk actions (archive, status change) via checkbox selection
- Mobile: collapses to card-stack view

#### Job Detail
- Header: Job No · Vehicle (Rego + Model) · Customer · Status badge · Action buttons
- Tabs: Overview · Parts & Labour · Notes · Status History
- Overview: vehicle details, mechanic, dates, description
- Parts & Labour: line items table with cost/sell price, add/edit/remove rows
- Status History: timeline with duration per stage

#### Customers
- List of customers with vehicle count and open job count
- Customer detail: contact info + linked vehicles + job history

#### Archive
- Separate view, requires `archive.view` permission
- Restore action visible only with `jobs.archive` permission

### UX Rules

- Every status transition is confirmed (dialog) before firing — prevents accidental moves
- Overdue collection jobs surface to the top of the default list sort
- Collection date displayed as: `+N days` (green) · `Today` (amber) · `-N days` (red)
- Destructive actions (archive, cancel) use `rose-600` and are separated from primary actions
- No horizontal scroll on mobile; table collapses to card-stack view at < 768px
- Toasts auto-dismiss in 4s; success = emerald, error = rose, info = sky
- Empty states include an icon, message, and primary CTA ("Create your first job")
- Skeleton loaders for async content (no blank frames)
