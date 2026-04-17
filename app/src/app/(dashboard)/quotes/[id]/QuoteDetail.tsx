'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/Card'
import { quoteStatusBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import type { Quote, QuoteLineItem } from '@/types/database'
import { Edit, Trash2, ArrowRight, Download } from 'lucide-react'

interface Props {
  quote: Quote & {
    quote_line_items: QuoteLineItem[]
    companies: { id: string; name: string; email: string | null; address: string | null; contact_person: string | null } | null
  }
}

export function QuoteDetail({ quote }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [deleting, setDeleting] = useState(false)
  const [converting, setConverting] = useState(false)
  const [convertModal, setConvertModal] = useState(false)
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [dueDate, setDueDate] = useState('')

  useEffect(() => {
    if (!invoiceNumber) {
      setInvoiceNumber(`INV-${Date.now().toString().slice(-5)}`)
    }
  }, [invoiceNumber])

  async function handleDelete() {
    if (!confirm('Delete this quote?')) return
    setDeleting(true)
    await supabase.from('quotes').delete().eq('id', quote.id)
    router.push('/quotes')
    router.refresh()
  }

  async function handleConvert() {
    setConverting(true)
    const { data, error } = await supabase.rpc('convert_quote_to_invoice', {
      p_quote_id: quote.id,
      p_invoice_number: invoiceNumber,
      p_issue_date: new Date().toISOString().split('T')[0],
      p_due_date: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    })
    setConverting(false)
    if (!error && data) {
      setConvertModal(false)
      router.push(`/invoices/${data}`)
      router.refresh()
    }
  }

  return (
    <div className="space-y-6">
      {/* Action bar — hidden on print */}
      <div className="print:hidden">
        <PageHeader
          title={quote.quote_number}
          subtitle={`Quote for ${quote.companies?.name ?? '—'}`}
          action={
            <div className="flex flex-wrap gap-2">
              <a href={`/api/quotes/${quote.id}/pdf`} target="_blank" rel="noreferrer">
                <Button variant="secondary" size="sm"><Download className="w-4 h-4 mr-1" />Download PDF</Button>
              </a>
              {!quote.converted_to_invoice_id && (
                <Button variant="secondary" size="sm" onClick={() => setConvertModal(true)}>
                  <ArrowRight className="w-3.5 h-3.5 mr-1" />Convert to Invoice
                </Button>
              )}
              <Link href={`/quotes/${quote.id}/edit`}><Button variant="secondary" size="sm"><Edit className="w-3.5 h-3.5 mr-1" />Edit</Button></Link>
              <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          }
        />
      </div>

      {/* Quote document — branded to match Charlotte's invoice style */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden print:shadow-none print:rounded-none">

        {/* Top colour bar */}
        <div className="h-2 bg-linear-to-r from-slate-700 via-blue-800 to-blue-500" />

        <div className="p-5 sm:p-8 print:p-10">

          {/* ── Header row ── */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-5xl font-black text-red-700 tracking-widest leading-none">QUOTE</h1>
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
              <div className="mt-3 text-right">
                {quoteStatusBadge(quote.status)}
              </div>
            </div>
          </div>

          {/* ── Quote meta ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-8">
            <div>
              <p className="text-xs font-bold text-red-700 uppercase tracking-widest mb-2">Quote For:</p>
              <p className="font-semibold text-blue-950 text-sm">{quote.companies?.name ?? '—'}</p>
              {quote.companies?.contact_person && <p className="text-xs text-gray-500 mt-0.5">{quote.companies.contact_person}</p>}
              {quote.companies?.email && <p className="text-xs text-gray-500">{quote.companies.email}</p>}
              {quote.companies?.address && <p className="text-xs text-gray-500">{quote.companies.address}</p>}
            </div>

            <div className="text-sm space-y-1">
              <div className="flex justify-between border-b border-gray-100 pb-1">
                <span className="text-gray-400 text-xs uppercase tracking-wide">Quote #</span>
                <span className="font-semibold text-blue-950">{quote.quote_number}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-1">
                <span className="text-gray-400 text-xs uppercase tracking-wide">Issue Date</span>
                <span className="text-gray-700">{formatDate(quote.issue_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400 text-xs uppercase tracking-wide">Valid Until</span>
                <span className="text-gray-700">{formatDate(quote.valid_until)}</span>
              </div>
            </div>
          </div>

          {/* ── Line items table ── */}
          <div className="overflow-x-auto -mx-5 px-5 sm:-mx-8 sm:px-8 print:overflow-visible mb-6">
          <table className="w-full text-sm min-w-100">
            <thead>
              <tr className="bg-blue-950 text-white">
                <th className="text-left py-2.5 px-4 font-semibold text-xs uppercase tracking-wide">Description</th>
                <th className="text-right py-2.5 px-4 font-semibold text-xs uppercase tracking-wide">Qty</th>
                <th className="text-right py-2.5 px-4 font-semibold text-xs uppercase tracking-wide">Unit Price</th>
                <th className="text-right py-2.5 px-4 font-semibold text-xs uppercase tracking-wide">Amount</th>
              </tr>
            </thead>
            <tbody>
              {quote.quote_line_items.map((li, idx) => (
                <tr key={li.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="py-2.5 px-4 text-gray-700">{li.description}</td>
                  <td className="py-2.5 px-4 text-right text-gray-500">{li.quantity}</td>
                  <td className="py-2.5 px-4 text-right text-gray-500">{formatCurrency(li.unit_price)}</td>
                  <td className="py-2.5 px-4 text-right font-medium text-gray-900">{formatCurrency(li.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {/* ── Totals ── */}
          <div className="flex justify-end mb-8">
            <div className="w-full sm:w-72 space-y-1 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-700">{formatCurrency(quote.subtotal)}</span>
              </div>
              {quote.vat_enabled && (
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">VAT ({quote.vat_rate}%)</span>
                  <span className="text-gray-700">{formatCurrency(quote.vat_amount)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 bg-blue-950 text-white rounded px-3 mt-1">
                <span className="font-bold uppercase tracking-wide text-xs">Total Estimate</span>
                <span className="font-bold text-base">{formatCurrency(quote.total)}</span>
              </div>
            </div>
          </div>

          {quote.notes && (
            <div className="mb-8 p-3 bg-gray-50 rounded text-xs text-gray-600 border-l-2 border-red-700">
              <span className="font-semibold text-red-700 uppercase tracking-wide mr-2">Notes:</span>
              {quote.notes}
            </div>
          )}

          {quote.converted_to_invoice_id && (
            <div className="mb-6 print:hidden">
              <Link href={`/invoices/${quote.converted_to_invoice_id}`} className="text-sm text-red-700 hover:underline">
                View converted invoice →
              </Link>
            </div>
          )}

          {/* ── Footer ── */}
          <div className="border-t-2 border-red-700 pt-5 mt-4 flex flex-col sm:flex-row gap-4 sm:gap-8">
            <div className="flex-1 flex items-center">
              <p className="text-3xl text-blue-950 italic" style={{ fontFamily: 'Georgia, serif' }}>Thank You</p>
            </div>
            <div className="hidden sm:block w-px bg-gray-200" />
            <div className="flex-1 text-xs text-gray-600 space-y-0.5">
              <p className="font-bold text-red-700 uppercase tracking-widest text-xs mb-1">Terms &amp; Conditions</p>
              <p>This quote is valid until the date specified above.</p>
              <p className="mt-2 font-semibold text-blue-950">ABSA Bank</p>
              <p>SHE Risk &amp; Compliance Consultancy</p>
              <p>Acc. No.: 4107691637</p>
              <p>Branch Code: 632005</p>
            </div>
          </div>

          {/* Bottom colour bar */}
          <div className="h-1 bg-linear-to-r from-blue-500 via-blue-800 to-slate-700 mt-6 -mx-5 sm:-mx-8 print:-mx-10" />
        </div>
      </div>

      {/* Convert modal */}
      <Modal open={convertModal} onClose={() => setConvertModal(false)} title="Convert to Invoice">
        <div className="space-y-4">
          <Input
            label="Invoice Number"
            required
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
          />
          <Input
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            hint="Leave blank for 30 days from today"
          />
          <div className="flex gap-2 pt-2">
            <Button onClick={handleConvert} loading={converting} className="flex-1 justify-center">Convert</Button>
            <Button variant="secondary" onClick={() => setConvertModal(false)} className="flex-1 justify-center">Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
