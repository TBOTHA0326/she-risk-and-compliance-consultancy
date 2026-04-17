'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/Card'
import { invoiceStatusBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Invoice, InvoiceLineItem } from '@/types/database'
import { Edit, Download, Copy, Trash2 } from 'lucide-react'

interface Props {
  invoice: Invoice & {
    invoice_line_items: InvoiceLineItem[]
    companies: { id: string; name: string; email: string | null; address: string | null; contact_person: string | null } | null
  }
}

export function InvoiceDetail({ invoice }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [deleting, setDeleting] = useState(false)
  const [duplicating, setDuplicating] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this invoice? This cannot be undone.')) return
    setDeleting(true)
    await supabase.from('invoices').delete().eq('id', invoice.id)
    router.push('/invoices')
    router.refresh()
  }

  async function handleDuplicate() {
    setDuplicating(true)
    const newNumber = `${invoice.invoice_number}-COPY`
    const { data } = await supabase.from('invoices').insert({
      invoice_number: newNumber,
      company_id: invoice.company_id,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: invoice.due_date,
      status: 'draft',
      vat_enabled: invoice.vat_enabled,
      vat_rate: invoice.vat_rate,
      subtotal: invoice.subtotal,
      vat_amount: invoice.vat_amount,
      total: invoice.total,
      notes: invoice.notes,
    }).select('id').single()

    if (data) {
      const lineItems = invoice.invoice_line_items.map((li) => ({
        invoice_id: data.id,
        description: li.description,
        quantity: li.quantity,
        unit_price: li.unit_price,
        sort_order: li.sort_order,
      }))
      await supabase.from('invoice_line_items').insert(lineItems)
      router.push(`/invoices/${data.id}`)
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {/* Action bar — hidden on print */}
      <div className="print:hidden">
        <PageHeader
          title={invoice.invoice_number}
          subtitle={`Invoice for ${invoice.companies?.name ?? '—'}`}
          action={
            <div className="flex flex-wrap gap-2">
              <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noreferrer">
                <Button variant="secondary" size="sm"><Download className="w-4 h-4 mr-1" />Download PDF</Button>
              </a>
              <Button variant="secondary" size="sm" onClick={handleDuplicate} loading={duplicating}><Copy className="w-3.5 h-3.5 mr-1" />Duplicate</Button>
              <Link href={`/invoices/${invoice.id}/edit`}><Button variant="secondary" size="sm"><Edit className="w-3.5 h-3.5 mr-1" />Edit</Button></Link>
              <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          }
        />
      </div>

      {/* Invoice document — styled to match Charlotte's brand */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_14px_50px_rgba(15,23,42,0.08)] overflow-hidden print:shadow-none print:rounded-none print:border-slate-200">

        <div className="p-6 sm:p-8 print:p-10">

          {/* ── Header row ── */}
          <div className="flex flex-col gap-6 mb-8 border-b border-slate-200 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-5xl font-black text-red-700 tracking-widest leading-none">INVOICE</h1>
                <div className="mt-3 space-y-0.5 text-xs text-gray-500">
                  <p>M C Fourie</p>
                  <p>6 Blignaut Street, Vanderbijlpark, 1911</p>
                  <p>REG NO. 2022/863818/07 &nbsp;|&nbsp; VAT REG NO. 9069397285</p>
                  <p>charlottefourie11@gmail.com &nbsp;|&nbsp; 082 561 2236</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-lg font-black text-red-700 uppercase tracking-wider leading-tight">SHE RISK &amp;</p>
                <p className="text-lg font-black text-blue-950 uppercase tracking-wider leading-tight">COMPLIANCE</p>
                <p className="text-lg font-black text-blue-950 uppercase tracking-wider leading-tight">CONSULTANCY</p>
                <p className="text-xs text-gray-400 mt-1">M C FOURIE — Nationwide</p>
                <div className="mt-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {invoiceStatusBadge(invoice.status)}
                </div>
              </div>
            </div>
          </div>

          {/* ── Invoice meta ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 border-b border-slate-200 pb-6">
            <div className="space-y-2">
              <p className="text-xs font-bold text-red-700 uppercase tracking-widest">Bill To</p>
              <p className="font-semibold text-blue-950 text-sm">{invoice.companies?.name ?? '—'}</p>
              {invoice.companies?.contact_person && <p className="text-xs text-gray-500">{invoice.companies.contact_person}</p>}
              {invoice.companies?.email && <p className="text-xs text-gray-500">{invoice.companies.email}</p>}
              {invoice.companies?.address && <p className="text-xs text-gray-500">{invoice.companies.address}</p>}
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-gray-400 text-xs uppercase tracking-wide">Invoice #</span>
                <span className="font-semibold text-blue-950">{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-gray-400 text-xs uppercase tracking-wide">Issue Date</span>
                <span className="text-gray-700">{formatDate(invoice.issue_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-xs uppercase tracking-wide">Due Date</span>
                <span className="text-gray-700">{formatDate(invoice.due_date)}</span>
              </div>
            </div>
          </div>

          {/* ── Line items table ── */}
          <div className="overflow-x-auto print:overflow-visible mb-6 border border-slate-200 rounded-3xl">
            <table className="w-full text-sm">
              <thead className="bg-slate-950 text-white">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-xs uppercase tracking-wide">Description</th>
                  <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wide">Qty</th>
                  <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wide">Unit Price</th>
                  <th className="text-right py-3 px-4 font-semibold text-xs uppercase tracking-wide">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {invoice.invoice_line_items.map((li) => (
                  <tr key={li.id}>
                    <td className="py-3 px-4 text-gray-700">{li.description}</td>
                    <td className="py-3 px-4 text-right text-gray-500">{li.quantity}</td>
                    <td className="py-3 px-4 text-right text-gray-500">{formatCurrency(li.unit_price)}</td>
                    <td className="py-3 px-4 text-right text-gray-900 font-semibold">{formatCurrency(li.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Totals ── */}
          <div className="flex justify-end mb-8">
            <div className="w-full sm:w-80 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-200">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-700">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.vat_enabled && (
                <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-gray-500">VAT ({invoice.vat_rate}%)</span>
                  <span className="text-gray-700">{formatCurrency(invoice.vat_amount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-3 mt-2 bg-slate-900 text-white rounded-2xl px-4">
                <span className="font-bold uppercase tracking-wide text-xs">Total</span>
                <span className="font-bold text-lg">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="mb-8 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-gray-700">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-700">Notes</p>
              <p>{invoice.notes}</p>
            </div>
          )}

          {/* ── Footer ── */}
          <div className="border-t-2 border-red-700 pt-6 mt-4 flex flex-col sm:flex-row gap-4 sm:gap-8">
            <div className="flex-1 flex items-center">
              <p className="text-3xl text-blue-950 italic" style={{ fontFamily: 'Georgia, serif' }}>Thank You</p>
            </div>

            <div className="hidden sm:block w-px bg-gray-200" />

            <div className="flex-1 text-xs text-gray-600 space-y-1">
              <p className="font-bold text-red-700 uppercase tracking-widest text-xs mb-1">Terms &amp; Conditions</p>
              <p>Payment is due upon invoice receipt.</p>
              <p className="mt-2 font-semibold text-blue-950">ABSA Bank</p>
              <p>SHE Risk &amp; Compliance Consultancy</p>
              <p>Acc. No.: 4107691637</p>
              <p>Branch Code: 632005</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
