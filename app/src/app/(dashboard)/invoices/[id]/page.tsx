import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { InvoiceDetail } from './InvoiceDetail'

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, invoice_line_items(*), companies(id, name, email, address, contact_person)')
    .eq('id', id)
    .single()

  if (!invoice) notFound()

  return <InvoiceDetail invoice={invoice} />
}
