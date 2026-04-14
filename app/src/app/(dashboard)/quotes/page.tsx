import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, PageHeader, EmptyState } from '@/components/ui/Card'
import { quoteStatusBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { FileText } from 'lucide-react'

export default async function QuotesPage() {
  const supabase = await createClient()
  const { data: quotes } = await supabase
    .from('quotes')
    .select('*, companies(name)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotes"
        subtitle={`${quotes?.length ?? 0} quotes`}
        action={<Link href="/quotes/new"><Button>+ New Quote</Button></Link>}
      />

      <Card>
        {!quotes?.length ? (
          <EmptyState message="No quotes yet." icon={<FileText className="w-10 h-10" />} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Quote #</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Company</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Issue Date</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Valid Until</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {quotes.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3">
                      <Link href={`/quotes/${q.id}`} className="font-medium text-gray-900 hover:text-emerald-700">
                        {q.quote_number}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-gray-500">{q.companies?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-gray-500">{formatDate(q.issue_date)}</td>
                    <td className="px-5 py-3 text-gray-500">{formatDate(q.valid_until)}</td>
                    <td className="px-5 py-3">{quoteStatusBadge(q.status)}</td>
                    <td className="px-5 py-3 text-right font-medium text-gray-900">{formatCurrency(q.total)}</td>
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
