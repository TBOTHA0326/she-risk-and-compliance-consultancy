-- ============================================================
-- 006_expenses.sql
-- Expenses tracking: table, views, RLS
-- ============================================================

-- ============================================================
-- ENUM
-- ============================================================

CREATE TYPE expense_category AS ENUM (
  'fuel',
  'accommodation',
  'meals',
  'equipment',
  'training',
  'office_supplies',
  'travel',
  'professional_services',
  'maintenance',
  'other'
);

CREATE TYPE expense_status AS ENUM ('pending', 'approved', 'rejected', 'reimbursed');

-- ============================================================
-- EXPENSES TABLE
-- ============================================================

CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category expense_category NOT NULL DEFAULT 'other',
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  vat_enabled BOOLEAN NOT NULL DEFAULT false,
  vat_rate NUMERIC(5, 2) NOT NULL DEFAULT 15,
  vat_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  status expense_status NOT NULL DEFAULT 'pending',
  receipt_path TEXT,
  receipt_filename TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_expenses_company_id ON public.expenses(company_id);
CREATE INDEX idx_expenses_expense_date ON public.expenses(expense_date DESC);
CREATE INDEX idx_expenses_status ON public.expenses(status);
CREATE INDEX idx_expenses_category ON public.expenses(category);
CREATE INDEX idx_expenses_created_by ON public.expenses(created_by);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_expenses_updated_at();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read expenses"
  ON public.expenses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert expenses"
  ON public.expenses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update expenses"
  ON public.expenses FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete expenses"
  ON public.expenses FOR DELETE
  TO authenticated
  USING (true);

-- ============================================================
-- MONTHLY EXPENSES VIEW
-- ============================================================

CREATE OR REPLACE VIEW public.v_monthly_expenses AS
SELECT
  DATE_TRUNC('month', expense_date) AS month,
  SUM(total) AS total_amount,
  COUNT(*) AS expense_count
FROM public.expenses
GROUP BY DATE_TRUNC('month', expense_date)
ORDER BY month DESC;

-- ============================================================
-- UPDATE DASHBOARD KPI VIEW (add expenses this month)
-- ============================================================

CREATE OR REPLACE VIEW public.v_dashboard_kpis AS
SELECT
  (SELECT COUNT(*) FROM public.companies WHERE status = 'active') AS total_active_companies,
  (SELECT COUNT(*) FROM public.invoices WHERE status IN ('sent', 'draft')) AS outstanding_invoices,
  (SELECT COUNT(*) FROM public.invoices WHERE status = 'overdue') AS overdue_invoices,
  (SELECT COALESCE(SUM(total), 0) FROM public.invoices WHERE status NOT IN ('cancelled', 'paid')) AS outstanding_amount,
  (SELECT COUNT(*) FROM public.quotes WHERE status IN ('draft', 'sent')) AS active_quotes,
  (SELECT COUNT(*) FROM public.safety_files WHERE status IN ('pending', 'in_progress', 'under_review')) AS safety_files_in_progress,
  (SELECT COUNT(*) FROM public.documents WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') AS expiring_documents_30d,
  (SELECT COALESCE(SUM(total), 0) FROM public.expenses WHERE DATE_TRUNC('month', expense_date) = DATE_TRUNC('month', CURRENT_DATE)) AS expenses_this_month,
  (SELECT COUNT(*) FROM public.expenses WHERE status = 'pending') AS pending_expenses;
