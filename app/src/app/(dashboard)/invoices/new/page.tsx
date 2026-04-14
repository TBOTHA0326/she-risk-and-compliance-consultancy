import { createClient } from '@/lib/supabase/server'
import { InvoiceForm } from '../InvoiceForm'

export default async function NewInvoicePage() {
  const supabase = await createClient()
  const { data: companies } = await supabase.from('companies').select('id, name').eq('status', 'active').order('name')
  return <InvoiceForm companies={companies ?? []} />
}
