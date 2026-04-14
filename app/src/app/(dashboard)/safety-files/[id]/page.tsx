import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { SafetyFileDetail } from './SafetyFileDetail'

export default async function SafetyFilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: safetyFile }, { data: sections }, { data: progress }] = await Promise.all([
    supabase.from('safety_files').select('*, companies(name)').eq('id', id).single(),
    supabase.from('safety_file_sections').select('*').eq('safety_file_id', id),
    supabase.from('v_safety_file_progress').select('*').eq('safety_file_id', id).single(),
  ])

  if (!safetyFile) notFound()

  return <SafetyFileDetail safetyFile={safetyFile} sections={sections ?? []} progress={progress} />
}
