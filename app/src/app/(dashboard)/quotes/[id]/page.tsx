import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { QuoteDetail } from './QuoteDetail'

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: quote } = await supabase
    .from('quotes')
    .select('*, quote_line_items(*), companies(id, name, email, address, contact_person)')
    .eq('id', id)
    .single()

  if (!quote) notFound()

  return <QuoteDetail quote={quote} />
}
