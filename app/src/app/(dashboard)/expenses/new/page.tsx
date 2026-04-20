import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/Card'
import { ExpenseForm } from '../ExpenseForm'

export default async function NewExpensePage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name, status')
    .eq('status', 'active')
    .order('name')

  return (
    <div className="space-y-6">
      <PageHeader title="New Expense" subtitle="Record a new business expense" />
      <ExpenseForm companies={companies ?? []} initialCompanyId={params.company} />
    </div>
  )
}
