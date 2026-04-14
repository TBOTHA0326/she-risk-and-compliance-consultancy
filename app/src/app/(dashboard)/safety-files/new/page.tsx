import { createClient } from '@/lib/supabase/server'
import { SafetyFileForm } from '../SafetyFileForm'

export default async function NewSafetyFilePage() {
  const supabase = await createClient()
  const { data: companies } = await supabase.from('companies').select('id, name').eq('status', 'active').order('name')
  return <SafetyFileForm companies={companies ?? []} />
}
