import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/ui/Card'
import { ExpenseForm } from '../../ExpenseForm'

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: expense }, { data: companies }] = await Promise.all([
    supabase.from('expenses').select('*').eq('id', id).single(),
    supabase.from('companies').select('id, name, status').eq('status', 'active').order('name'),
  ])

  if (!expense) notFound()

  return (
    <div className="space-y-6">
      <PageHeader title="Edit Expense" subtitle={expense.title} />
      <ExpenseForm companies={companies ?? []} expense={expense} />
    </div>
  )
}
