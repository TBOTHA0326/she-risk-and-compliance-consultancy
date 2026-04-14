import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, PageHeader, EmptyState } from '@/components/ui/Card'
import { invoiceStatusBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { FileText } from 'lucide-react'

export default async function InvoicesPage() {
  const supabase = await createClient()
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, companies(name)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        subtitle={`${invoices?.length ?? 0} invoices`}
        action={<Link href="/invoices/new"><Button>+ New Invoice</Button></Link>}
      />

      <Card>
        {!invoices?.length ? (
          <EmptyState message="No invoices yet." icon={<FileText className="w-10 h-10" />} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Invoice #</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Company</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Issue Date</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Due Date</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3">
                      <Link href={`/invoices/${inv.id}`} className="font-medium text-gray-900 hover:text-emerald-700">
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{inv.companies?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-500">{formatDate(inv.issue_date)}</td>
                    <td className="px-5 py-3 text-gray-500">{formatDate(inv.due_date)}</td>
                    <td className="px-5 py-3">{invoiceStatusBadge(inv.status)}</td>
                    <td className="px-5 py-3 text-right font-medium text-gray-900">{formatCurrency(inv.total)}</td>
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
