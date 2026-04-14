import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { QuoteForm } from '../../QuoteForm'

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: quote }, { data: companies }] = await Promise.all([
    supabase.from('quotes').select('*, quote_line_items(*)').eq('id', id).single(),
    supabase.from('companies').select('id, name').eq('status', 'active').order('name'),
  ])

  if (!quote) notFound()
  return <QuoteForm quote={quote} companies={companies ?? []} />
}
