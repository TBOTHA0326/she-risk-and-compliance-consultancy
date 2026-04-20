import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, PageHeader, EmptyState } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Receipt } from 'lucide-react'
import type { ExpenseCategory, ExpenseStatus } from '@/types/database'

function expenseStatusBadge(status: ExpenseStatus) {
  const map: Record<ExpenseStatus, { label: string; variant: 'neutral' | 'warning' | 'danger' | 'success' | 'info' }> = {
    pending: { label: 'Pending', variant: 'warning' },
    approved: { label: 'Approved', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'danger' },
    reimbursed: { label: 'Reimbursed', variant: 'info' },
  }
  const { label, variant } = map[status] ?? { label: status, variant: 'neutral' }
  return <Badge variant={variant}>{label}</Badge>
}

function formatCategory(cat: ExpenseCategory) {
  return cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export default async function ExpensesPage() {
  const supabase = await createClient()
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*, companies(name)')
    .order('expense_date', { ascending: false })

  const totalAmount = (expenses ?? []).reduce((sum, e) => sum + e.total, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        subtitle={`${expenses?.length ?? 0} expenses · ${formatCurrency(totalAmount)} total`}
        action={<Link href="/expenses/new"><Button>+ New Expense</Button></Link>}
      />

      <Card>
        {!expenses?.length ? (
          <EmptyState message="No expenses yet. Add your first expense to start tracking." icon={<Receipt className="w-10 h-10" />} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Title</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Category</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Company</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Date</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3">
                      <Link href={`/expenses/${exp.id}`} className="font-medium text-gray-900 hover:text-emerald-700">
                        {exp.title}
                      </Link>
                      {exp.description && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{exp.description}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-500">{formatCategory(exp.category)}</td>
                    <td className="px-5 py-3 text-gray-500">{exp.companies?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-500">{formatDate(exp.expense_date)}</td>
                    <td className="px-5 py-3">{expenseStatusBadge(exp.status)}</td>
                    <td className="px-5 py-3 text-right font-medium text-gray-900">{formatCurrency(exp.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
