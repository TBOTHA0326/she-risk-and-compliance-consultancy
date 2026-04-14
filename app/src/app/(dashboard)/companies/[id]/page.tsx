import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CompanyDetail } from './CompanyDetail'

export default async function CompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: company },
    { data: invoices },
    { data: quotes },
    { data: documents },
    { data: safetyFiles },
    { data: activity },
  ] = await Promise.all([
    supabase.from('companies').select('*').eq('id', id).single(),
    supabase.from('invoices').select('*').eq('company_id', id).order('created_at', { ascending: false }),
    supabase.from('quotes').select('*').eq('company_id', id).order('created_at', { ascending: false }),
    supabase.from('documents').select('*').eq('company_id', id).order('created_at', { ascending: false }),
    supabase.from('v_safety_file_progress').select('*').eq('company_id', id),
    supabase.from('activity_log').select('*').eq('entity_id', id).order('created_at', { ascending: false }).limit(20),
  ])

  if (!company) notFound()

  return (
    <CompanyDetail
      company={company}
      invoices={invoices ?? []}
      quotes={quotes ?? []}
      documents={documents ?? []}
      safetyFiles={safetyFiles ?? []}
      activity={activity ?? []}
    />
  )
}
