import { createClient } from '@/lib/supabase/server'
import { QuoteForm } from '../QuoteForm'

export default async function NewQuotePage() {
  const supabase = await createClient()
  const { data: companies } = await supabase.from('companies').select('id, name').eq('status', 'active').order('name')
  return <QuoteForm companies={companies ?? []} />
}
