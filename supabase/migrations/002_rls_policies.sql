-- ============================================================
-- 002_rls_policies.sql
-- Row Level Security policies for all tables
-- ============================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_file_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_file_section_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Helper: get current user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- PROFILES
-- ============================================================

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (public.get_user_role() = 'admin');

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR ALL USING (public.get_user_role() = 'admin');

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- COMPANIES — all authenticated users can read, only admin/manager can write
-- ============================================================

CREATE POLICY "companies_select_authenticated" ON public.companies
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "companies_insert_admin_manager" ON public.companies
  FOR INSERT WITH CHECK (
    public.get_user_role() IN ('admin', 'manager')
  );

CREATE POLICY "companies_update_admin_manager" ON public.companies
  FOR UPDATE USING (
    public.get_user_role() IN ('admin', 'manager')
  );

CREATE POLICY "companies_delete_admin" ON public.companies
  FOR DELETE USING (public.get_user_role() = 'admin');

-- ============================================================
-- INVOICES
-- ============================================================

CREATE POLICY "invoices_select_authenticated" ON public.invoices
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "invoices_insert_finance_admin_manager" ON public.invoices
  FOR INSERT WITH CHECK (
    public.get_user_role() IN ('admin', 'manager', 'finance')
  );

CREATE POLICY "invoices_update_finance_admin_manager" ON public.invoices
  FOR UPDATE USING (
    public.get_user_role() IN ('admin', 'manager', 'finance')
  );

CREATE POLICY "invoices_delete_admin" ON public.invoices
  FOR DELETE USING (public.get_user_role() = 'admin');

-- Invoice line items follow parent invoice
CREATE POLICY "invoice_line_items_select" ON public.invoice_line_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "invoice_line_items_write" ON public.invoice_line_items
  FOR ALL USING (
    public.get_user_role() IN ('admin', 'manager', 'finance')
  );

-- ============================================================
-- QUOTES
-- ============================================================

CREATE POLICY "quotes_select_authenticated" ON public.quotes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "quotes_insert_finance_admin_manager" ON public.quotes
  FOR INSERT WITH CHECK (
    public.get_user_role() IN ('admin', 'manager', 'finance')
  );

CREATE POLICY "quotes_update_finance_admin_manager" ON public.quotes
  FOR UPDATE USING (
    public.get_user_role() IN ('admin', 'manager', 'finance')
  );

CREATE POLICY "quotes_delete_admin" ON public.quotes
  FOR DELETE USING (public.get_user_role() = 'admin');

CREATE POLICY "quote_line_items_select" ON public.quote_line_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "quote_line_items_write" ON public.quote_line_items
  FOR ALL USING (
    public.get_user_role() IN ('admin', 'manager', 'finance')
  );

-- ============================================================
-- DOCUMENTS
-- ============================================================

CREATE POLICY "documents_select_authenticated" ON public.documents
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "documents_insert_authenticated" ON public.documents
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "documents_update_admin_manager_compliance" ON public.documents
  FOR UPDATE USING (
    public.get_user_role() IN ('admin', 'manager', 'compliance_officer')
  );

CREATE POLICY "documents_delete_admin" ON public.documents
  FOR DELETE USING (public.get_user_role() = 'admin');

-- ============================================================
-- SAFETY FILES
-- ============================================================

CREATE POLICY "safety_files_select_authenticated" ON public.safety_files
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "safety_files_insert_compliance_admin_manager" ON public.safety_files
  FOR INSERT WITH CHECK (
    public.get_user_role() IN ('admin', 'manager', 'compliance_officer')
  );

CREATE POLICY "safety_files_update_compliance_admin_manager" ON public.safety_files
  FOR UPDATE USING (
    public.get_user_role() IN ('admin', 'manager', 'compliance_officer')
  );

CREATE POLICY "safety_files_delete_admin" ON public.safety_files
  FOR DELETE USING (public.get_user_role() = 'admin');

CREATE POLICY "safety_file_sections_select" ON public.safety_file_sections
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "safety_file_sections_write" ON public.safety_file_sections
  FOR ALL USING (
    public.get_user_role() IN ('admin', 'manager', 'compliance_officer')
  );

CREATE POLICY "safety_file_section_documents_select" ON public.safety_file_section_documents
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "safety_file_section_documents_write" ON public.safety_file_section_documents
  FOR ALL USING (
    public.get_user_role() IN ('admin', 'manager', 'compliance_officer')
  );

-- ============================================================
-- ACTIVITY LOG — insert by any authenticated, read by admin/manager
-- ============================================================

CREATE POLICY "activity_log_select_admin_manager" ON public.activity_log
  FOR SELECT USING (
    public.get_user_role() IN ('admin', 'manager')
  );

CREATE POLICY "activity_log_insert_authenticated" ON public.activity_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
