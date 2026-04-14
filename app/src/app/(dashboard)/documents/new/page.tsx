import { createClient } from '@/lib/supabase/server'
import { DocumentForm } from '../DocumentForm'

export default async function NewDocumentPage() {
  const supabase = await createClient()
  const { data: companies } = await supabase.from('companies').select('id, name').eq('status', 'active').order('name')
  return <DocumentForm companies={companies ?? []} />
}
