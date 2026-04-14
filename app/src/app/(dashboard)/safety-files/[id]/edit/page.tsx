import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { SafetyFileForm } from '../../SafetyFileForm'

export default async function EditSafetyFilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: sf }, { data: companies }] = await Promise.all([
    supabase.from('safety_files').select('*').eq('id', id).single(),
    supabase.from('companies').select('id, name').eq('status', 'active').order('name'),
  ])

  if (!sf) notFound()
  return <SafetyFileForm safetyFile={sf} companies={companies ?? []} />
}
