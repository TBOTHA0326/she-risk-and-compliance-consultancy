import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { InvoiceForm } from '../../InvoiceForm'

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: invoice }, { data: companies }] = await Promise.all([
    supabase.from('invoices').select('*, invoice_line_items(*)').eq('id', id).single(),
    supabase.from('companies').select('id, name').eq('status', 'active').order('name'),
  ])

  if (!invoice) notFound()

  return <InvoiceForm invoice={invoice} companies={companies ?? []} />
}
