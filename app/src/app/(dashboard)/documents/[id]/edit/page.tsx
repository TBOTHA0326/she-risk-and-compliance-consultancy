import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { DocumentForm } from '../../DocumentForm'

export default async function EditDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const [{ data: doc }, { data: companies }] = await Promise.all([
    supabase.from('documents').select('*').eq('id', id).single(),
    supabase.from('companies').select('id, name').eq('status', 'active').order('name'),
  ])
  if (!doc) notFound()
  return <DocumentForm document={doc} companies={companies ?? []} />
}
