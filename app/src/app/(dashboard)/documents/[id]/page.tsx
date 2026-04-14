import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { DocumentDetail } from './DocumentDetail'

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: doc } = await supabase
    .from('documents')
    .select('*, companies(name)')
    .eq('id', id)
    .single()

  if (!doc) notFound()
  return <DocumentDetail doc={doc} />
}
