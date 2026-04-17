-- ============================================================
-- 005_trips.sql
-- Trip planning schema and timeline support
-- ============================================================

CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  departure_date DATE NOT NULL,
  return_date DATE NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.trip_timeline_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  entry_time TIME NOT NULL,
  title TEXT NOT NULL,
  location TEXT,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_timeline_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trips_select_authenticated" ON public.trips
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "trips_insert_compliance_admin_manager" ON public.trips
  FOR INSERT WITH CHECK (
    public.get_user_role() IN ('admin', 'manager', 'compliance_officer')
  );

CREATE POLICY "trips_update_compliance_admin_manager" ON public.trips
  FOR UPDATE USING (
    public.get_user_role() IN ('admin', 'manager', 'compliance_officer')
  );

CREATE POLICY "trips_delete_admin" ON public.trips
  FOR DELETE USING (public.get_user_role() = 'admin');

CREATE POLICY "trip_timeline_entries_select" ON public.trip_timeline_entries
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "trip_timeline_entries_write" ON public.trip_timeline_entries
  FOR ALL USING (
    public.get_user_role() IN ('admin', 'manager', 'compliance_officer')
  );

CREATE INDEX idx_trips_company_id ON public.trips(company_id);
CREATE INDEX idx_trips_departure_date ON public.trips(departure_date);
CREATE INDEX idx_trips_return_date ON public.trips(return_date);
CREATE INDEX idx_trip_timeline_entries_trip_id ON public.trip_timeline_entries(trip_id);
CREATE INDEX idx_trip_timeline_entries_entry_time ON public.trip_timeline_entries(entry_time);

CREATE TRIGGER trg_trips_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
