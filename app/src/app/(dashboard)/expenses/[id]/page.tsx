import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, PageHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Edit, Building2, Calendar, Tag, FileText } from 'lucide-react'
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

export default async function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: expense } = await supabase
    .from('expenses')
    .select('*, companies(id, name)')
    .eq('id', id)
    .single()

  if (!expense) notFound()

  return (
    <div className="space-y-6">
      <PageHeader
        title={expense.title}
        subtitle={formatCategory(expense.category)}
        action={
          <div className="flex gap-2">
            <Link href={`/expenses/${expense.id}/edit`}>
              <Button variant="secondary" size="sm">
                <Edit className="w-3.5 h-3.5 mr-1" />Edit
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Expense Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Date</p>
                  <p className="text-gray-900 mt-0.5">{formatDate(expense.expense_date)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Tag className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Category</p>
                  <p className="text-gray-900 mt-0.5">{formatCategory(expense.category)}</p>
                </div>
              </div>
              {expense.companies && (
                <div className="flex items-start gap-2">
                  <Building2 className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Company</p>
                    <Link href={`/companies/${expense.companies.id}`} className="text-emerald-700 hover:underline mt-0.5 block">
                      {expense.companies.name}
                    </Link>
                  </div>
                </div>
              )}
              {expense.description && (
                <div className="col-span-2 flex items-start gap-2">
                  <FileText className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Description</p>
                    <p className="text-gray-900 mt-0.5">{expense.description}</p>
                  </div>
                </div>
              )}
              {expense.notes && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400">Notes</p>
                  <p className="text-gray-700 mt-0.5 text-sm">{expense.notes}</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                {expenseStatusBadge(expense.status)}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="font-medium">{formatCurrency(expense.amount)}</span>
              </div>
              {expense.vat_enabled && (
                <div className="flex justify-between">
                  <span className="text-gray-500">VAT ({expense.vat_rate}%)</span>
                  <span className="font-medium">{formatCurrency(expense.vat_amount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-100 pt-2">
                <span className="text-gray-900 font-semibold">Total</span>
                <span className="font-semibold text-gray-900">{formatCurrency(expense.total)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
