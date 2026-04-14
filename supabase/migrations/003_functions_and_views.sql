-- ============================================================
-- 003_functions_and_views.sql
-- Helper functions, views, and auto-overdue detection
-- ============================================================

-- ============================================================
-- AUTO OVERDUE: mark invoices as overdue when past due date
-- ============================================================

CREATE OR REPLACE FUNCTION public.mark_overdue_invoices()
RETURNS void AS $$
  UPDATE public.invoices
  SET status = 'overdue'
  WHERE status = 'sent'
    AND due_date < CURRENT_DATE;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- AUTO EXPIRED: mark quotes as expired when past valid_until
-- ============================================================

CREATE OR REPLACE FUNCTION public.mark_expired_quotes()
RETURNS void AS $$
  UPDATE public.quotes
  SET status = 'expired'
  WHERE status = 'sent'
    AND valid_until < CURRENT_DATE;
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================
-- SAFETY FILE PROGRESS VIEW
-- ============================================================

CREATE OR REPLACE VIEW public.v_safety_file_progress AS
SELECT
  sf.id AS safety_file_id,
  sf.file_reference,
  sf.project_name,
  sf.company_id,
  c.name AS company_name,
  sf.status,
  sf.due_date,
  COUNT(sfs.id) AS total_sections,
  COUNT(sfs.id) FILTER (WHERE sfs.status = 'completed') AS completed_sections,
  CASE
    WHEN COUNT(sfs.id) = 0 THEN 0
    ELSE ROUND(
      (COUNT(sfs.id) FILTER (WHERE sfs.status = 'completed')::NUMERIC / COUNT(sfs.id)::NUMERIC) * 100,
      0
    )
  END AS completion_percentage
FROM public.safety_files sf
LEFT JOIN public.companies c ON c.id = sf.company_id
LEFT JOIN public.safety_file_sections sfs ON sfs.safety_file_id = sf.id
GROUP BY sf.id, sf.file_reference, sf.project_name, sf.company_id, c.name, sf.status, sf.due_date;

-- ============================================================
-- DASHBOARD KPI VIEW
-- ============================================================

CREATE OR REPLACE VIEW public.v_dashboard_kpis AS
SELECT
  (SELECT COUNT(*) FROM public.companies WHERE status = 'active') AS total_active_companies,
  (SELECT COUNT(*) FROM public.invoices WHERE status IN ('sent', 'draft')) AS outstanding_invoices,
  (SELECT COUNT(*) FROM public.invoices WHERE status = 'overdue') AS overdue_invoices,
  (SELECT COALESCE(SUM(total), 0) FROM public.invoices WHERE status NOT IN ('cancelled', 'paid')) AS outstanding_amount,
  (SELECT COUNT(*) FROM public.quotes WHERE status IN ('draft', 'sent')) AS active_quotes,
  (SELECT COUNT(*) FROM public.safety_files WHERE status IN ('pending', 'in_progress', 'under_review')) AS safety_files_in_progress,
  (SELECT COUNT(*) FROM public.documents WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') AS expiring_documents_30d;

-- ============================================================
-- MONTHLY REVENUE VIEW
-- ============================================================

CREATE OR REPLACE VIEW public.v_monthly_revenue AS
SELECT
  DATE_TRUNC('month', issue_date) AS month,
  SUM(total) AS revenue,
  COUNT(*) AS invoice_count
FROM public.invoices
WHERE status = 'paid'
GROUP BY DATE_TRUNC('month', issue_date)
ORDER BY month DESC;

-- ============================================================
-- INVOICE NUMBER VALIDATION FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_invoice_number_unique(
  p_invoice_number TEXT,
  p_exclude_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.invoices
    WHERE invoice_number = p_invoice_number
      AND (p_exclude_id IS NULL OR id <> p_exclude_id)
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- QUOTE NUMBER VALIDATION FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.check_quote_number_unique(
  p_quote_number TEXT,
  p_exclude_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.quotes
    WHERE quote_number = p_quote_number
      AND (p_exclude_id IS NULL OR id <> p_exclude_id)
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- CONVERT QUOTE TO INVOICE FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.convert_quote_to_invoice(
  p_quote_id UUID,
  p_invoice_number TEXT,
  p_issue_date DATE DEFAULT CURRENT_DATE,
  p_due_date DATE DEFAULT CURRENT_DATE + INTERVAL '30 days'
)
RETURNS UUID AS $$
DECLARE
  v_quote public.quotes%ROWTYPE;
  v_invoice_id UUID;
BEGIN
  -- Fetch the quote
  SELECT * INTO v_quote FROM public.quotes WHERE id = p_quote_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote % not found', p_quote_id;
  END IF;

  -- Insert new invoice
  INSERT INTO public.invoices (
    invoice_number, company_id, issue_date, due_date,
    vat_enabled, vat_rate, subtotal, vat_amount, total, notes, created_by
  )
  VALUES (
    p_invoice_number, v_quote.company_id, p_issue_date, p_due_date,
    v_quote.vat_enabled, v_quote.vat_rate, v_quote.subtotal, v_quote.vat_amount, v_quote.total,
    v_quote.notes, auth.uid()
  )
  RETURNING id INTO v_invoice_id;

  -- Copy line items
  INSERT INTO public.invoice_line_items (invoice_id, description, quantity, unit_price, sort_order)
  SELECT v_invoice_id, description, quantity, unit_price, sort_order
  FROM public.quote_line_items
  WHERE quote_id = p_quote_id;

  -- Link quote to invoice and mark accepted
  UPDATE public.quotes
  SET converted_to_invoice_id = v_invoice_id, status = 'accepted'
  WHERE id = p_quote_id;

  RETURN v_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SEED DEFAULT SAFETY FILE SECTIONS FOR NEW SAFETY FILES
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_default_safety_sections()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.safety_file_sections (safety_file_id, section_type)
  VALUES
    (NEW.id, 'risk_assessments'),
    (NEW.id, 'method_statements'),
    (NEW.id, 'ppe_compliance'),
    (NEW.id, 'training_records'),
    (NEW.id, 'induction_records'),
    (NEW.id, 'emergency_procedures'),
    (NEW.id, 'site_inspections');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_default_safety_sections
  AFTER INSERT ON public.safety_files
  FOR EACH ROW EXECUTE FUNCTION public.create_default_safety_sections();
