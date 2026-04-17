import { createClient } from '@/lib/supabase/server'
import TripManager from './TripManager'
import type { Company } from '@/types/database'

type CompanyOption = Pick<Company, 'id' | 'name'>

export default async function TripsPage() {
  const supabase = await createClient()
  const [{ data: companies }, { data: trips }] = await Promise.all([
    supabase.from('companies').select('id, name').eq('status', 'active').order('name'),
    supabase
      .from('trips')
      .select('*, companies(id, name), trip_timeline_entries(*)')
      .order('departure_date', { ascending: true }),
  ])

  const companyOptions = (companies ?? []) as CompanyOption[]

  return <TripManager initialTrips={trips ?? []} companies={companyOptions} />
}
