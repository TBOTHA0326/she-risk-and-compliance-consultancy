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
import { Edit, Printer, Copy, Trash2 } from 'lucide-react'

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
              <Button variant="ghost" size="sm" onClick={() => window.print()}><Printer className="w-4 h-4" /></Button>
              <Button variant="secondary" size="sm" onClick={handleDuplicate} loading={duplicating}><Copy className="w-3.5 h-3.5 mr-1" />Duplicate</Button>
              <Link href={`/invoices/${invoice.id}/edit`}><Button variant="secondary" size="sm"><Edit className="w-3.5 h-3.5 mr-1" />Edit</Button></Link>
              <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          }
        />
      </div>

      {/* Invoice document — styled to match Charlotte's brand */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden print:shadow-none print:rounded-none">

        {/* Top colour bar */}
        <div className="h-2 bg-gradient-to-r from-slate-700 via-blue-800 to-blue-500" />

        <div className="p-5 sm:p-8 print:p-10">

          {/* ── Header row ── */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
            {/* Left: INVOICE heading */}
            <div>
              <h1 className="text-5xl font-black text-red-700 tracking-widest leading-none">INVOICE</h1>
              <div className="mt-3 space-y-0.5 text-xs text-gray-500">
                <p>M C Fourie</p>
                <p>6 Blignaut Street, Vanderbijlpark, 1911</p>
                <p>REG NO. 2022/863818/07 &nbsp;|&nbsp; VAT REG NO. 9069397285</p>
                <p>charlottefourie11@gmail.com &nbsp;|&nbsp; 082 561 2236</p>
              </div>
            </div>

            {/* Right: Company logo block */}
            <div className="text-right">
              <p className="text-lg font-black text-red-700 uppercase tracking-wider leading-tight">SHE RISK &amp;</p>
              <p className="text-lg font-black text-blue-950 uppercase tracking-wider leading-tight">COMPLIANCE</p>
              <p className="text-lg font-black text-blue-950 uppercase tracking-wider leading-tight">CONSULTANCY</p>
              <p className="text-xs text-gray-400 mt-1">M C FOURIE — Nationwide</p>
              <div className="mt-3 text-right">
                {invoiceStatusBadge(invoice.status)}
              </div>
            </div>
          </div>

          {/* ── Invoice meta ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-8">
            {/* Bill To */}
            <div>
              <p className="text-xs font-bold text-red-700 uppercase tracking-widest mb-2">Bill To:</p>
              <p className="font-semibold text-blue-950 text-sm">{invoice.companies?.name ?? '—'}</p>
              {invoice.companies?.contact_person && <p className="text-xs text-gray-500 mt-0.5">{invoice.companies.contact_person}</p>}
              {invoice.companies?.email && <p className="text-xs text-gray-500">{invoice.companies.email}</p>}
              {invoice.companies?.address && <p className="text-xs text-gray-500">{invoice.companies.address}</p>}
            </div>

            {/* Dates + Invoice # */}
            <div className="text-sm space-y-1">
              <div className="flex justify-between border-b border-gray-100 pb-1">
                <span className="text-gray-400 text-xs uppercase tracking-wide">Invoice #</span>
                <span className="font-semibold text-blue-950">{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-1">
                <span className="text-gray-400 text-xs uppercase tracking-wide">Invoice Date</span>
                <span className="text-gray-700">{formatDate(invoice.issue_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-xs uppercase tracking-wide">Due Date</span>
                <span className="text-gray-700">{formatDate(invoice.due_date)}</span>
              </div>
            </div>
          </div>

          {/* ── Line items table ── */}
          <table className="w-full text-sm mb-6">
            <thead>
              <tr className="bg-blue-950 text-white">
                <th className="text-left py-2.5 px-4 font-semibold text-xs uppercase tracking-wide">Description</th>
                <th className="text-right py-2.5 px-4 font-semibold text-xs uppercase tracking-wide">Qty</th>
                <th className="text-right py-2.5 px-4 font-semibold text-xs uppercase tracking-wide">Unit Price</th>
                <th className="text-right py-2.5 px-4 font-semibold text-xs uppercase tracking-wide">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.invoice_line_items.map((li, idx) => (
                <tr key={li.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="py-2.5 px-4 text-gray-700">{li.description}</td>
                  <td className="py-2.5 px-4 text-right text-gray-500">{li.quantity}</td>
                  <td className="py-2.5 px-4 text-right text-gray-500">{formatCurrency(li.unit_price)}</td>
                  <td className="py-2.5 px-4 text-right text-gray-900 font-medium">{formatCurrency(li.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── Totals ── */}
          <div className="flex justify-end mb-8">
            <div className="w-full sm:w-72 space-y-1 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-700">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.vat_enabled && (
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">VAT ({invoice.vat_rate}%)</span>
                  <span className="text-gray-700">{formatCurrency(invoice.vat_amount)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 bg-blue-950 text-white rounded px-3 mt-1">
                <span className="font-bold uppercase tracking-wide text-xs">Total</span>
                <span className="font-bold text-base">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="mb-8 p-3 bg-gray-50 rounded text-xs text-gray-600 border-l-2 border-red-700">
              <span className="font-semibold text-red-700 uppercase tracking-wide mr-2">Notes:</span>
              {invoice.notes}
            </div>
          )}

          {/* ── Footer ── */}
          <div className="border-t-2 border-red-700 pt-5 mt-4 flex flex-col sm:flex-row gap-4 sm:gap-8">
            {/* Thank You */}
            <div className="flex-1 flex items-center">
              <p className="text-3xl text-blue-950 italic" style={{ fontFamily: 'Georgia, serif' }}>Thank You</p>
            </div>

            {/* Divider */}
            <div className="w-px bg-gray-200" />

            {/* Terms & bank details */}
            <div className="flex-1 text-xs text-gray-600 space-y-0.5">
              <p className="font-bold text-red-700 uppercase tracking-widest text-xs mb-1">Terms &amp; Conditions</p>
              <p>Payment is due upon Invoice receipt.</p>
              <p className="mt-2 font-semibold text-blue-950">ABSA Bank</p>
              <p>SHE Risk &amp; Compliance Consultancy</p>
              <p>Acc. No.: 4107691637</p>
              <p>Branch Code: 632005</p>
            </div>
          </div>

          {/* Bottom colour bar */}
          <div className="h-1 bg-gradient-to-r from-blue-500 via-blue-800 to-slate-700 mt-6 -mx-5 sm:-mx-8 print:-mx-10" />
        </div>
      </div>
    </div>
  )
}
