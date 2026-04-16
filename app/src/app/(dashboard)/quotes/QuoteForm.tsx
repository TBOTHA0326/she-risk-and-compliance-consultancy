'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card, PageHeader, ErrorMessage } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import type { Quote, QuoteLineItem, Company } from '@/types/database'
import Link from 'next/link'
import { Plus, Trash2 } from 'lucide-react'

interface LineItem {
  id?: string
  description: string
  quantity: string
  unit_price: string
  sort_order: number
}

interface QuoteFormProps {
  quote?: Quote & { quote_line_items: QuoteLineItem[] }
  companies: Pick<Company, 'id' | 'name'>[]
}

export function QuoteForm({ quote, companies }: QuoteFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const isEdit = !!quote

  const defaultCompany = searchParams.get('company') ?? ''

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [numberError, setNumberError] = useState<string | null>(null)

  const [form, setForm] = useState({
    quote_number: quote?.quote_number ?? '',
    company_id: quote?.company_id ?? defaultCompany,
    issue_date: quote?.issue_date ?? new Date().toISOString().split('T')[0],
    valid_until: quote?.valid_until ?? '',
    status: quote?.status ?? 'draft',
    vat_enabled: quote?.vat_enabled ?? false,
    vat_rate: String(quote?.vat_rate ?? 15),
    notes: quote?.notes ?? '',
  })

  const [lineItems, setLineItems] = useState<LineItem[]>(
    quote?.quote_line_items?.map((li) => ({
      id: li.id,
      description: li.description,
      quantity: String(li.quantity),
      unit_price: String(li.unit_price),
      sort_order: li.sort_order,
    })) ?? [{ description: '', quantity: '1', unit_price: '0', sort_order: 0 }]
  )

  function set(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const subtotal = lineItems.reduce((sum, li) => sum + (parseFloat(li.quantity) || 0) * (parseFloat(li.unit_price) || 0), 0)
  const vatAmount = form.vat_enabled ? subtotal * (parseFloat(form.vat_rate) / 100) : 0
  const total = subtotal + vatAmount

  function addLineItem() {
    setLineItems((li) => [...li, { description: '', quantity: '1', unit_price: '0', sort_order: li.length }])
  }

  function removeLineItem(idx: number) {
    setLineItems((li) => li.filter((_, i) => i !== idx))
  }

  function updateLineItem(idx: number, field: keyof LineItem, value: string) {
    setLineItems((li) => li.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const checkNumberUnique = useCallback(async (num: string) => {
    if (!num) return
    const { data } = await supabase.rpc('check_quote_number_unique', {
      p_quote_number: num,
      p_exclude_id: quote?.id ?? undefined,
    })
    if (data === false) setNumberError('Quote number already exists')
    else setNumberError(null)
  }, [supabase, quote?.id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (numberError) return
    setLoading(true)
    setError(null)

    const payload = {
      quote_number: form.quote_number,
      company_id: form.company_id,
      issue_date: form.issue_date,
      valid_until: form.valid_until,
      status: form.status as Quote['status'],
      vat_enabled: form.vat_enabled,
      vat_rate: parseFloat(form.vat_rate),
      subtotal,
      vat_amount: vatAmount,
      total,
      notes: form.notes || null,
    }

    let quoteId = quote?.id

    if (isEdit) {
      const { error } = await supabase.from('quotes').update(payload).eq('id', quote!.id)
      if (error) { setError(error.message); setLoading(false); return }
      await supabase.from('quote_line_items').delete().eq('quote_id', quote!.id)
    } else {
      const { data, error } = await supabase.from('quotes').insert(payload).select('id').single()
      if (error) { setError(error.message); setLoading(false); return }
      quoteId = data.id
    }

    const lineItemsPayload = lineItems
      .filter((li) => li.description.trim())
      .map((li, idx) => ({
        quote_id: quoteId!,
        description: li.description,
        quantity: parseFloat(li.quantity) || 1,
        unit_price: parseFloat(li.unit_price) || 0,
        sort_order: idx,
      }))

    if (lineItemsPayload.length > 0) {
      await supabase.from('quote_line_items').insert(lineItemsPayload)
    }

    await supabase.from('activity_log').insert({
      action: isEdit ? 'updated' : 'created',
      entity_type: 'quote',
      entity_id: quoteId!,
      entity_label: form.quote_number,
    })

    router.push(`/quotes/${quoteId}`)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEdit ? `Edit ${quote.quote_number}` : 'New Quote'}
        action={<Link href={isEdit ? `/quotes/${quote!.id}` : '/quotes'}><Button variant="secondary">Cancel</Button></Link>}
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700">Quote Details</h2>
              {error && <ErrorMessage message={error} />}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Quote Number"
                  required
                  value={form.quote_number}
                  onChange={(e) => { set('quote_number', e.target.value); checkNumberUnique(e.target.value) }}
                  error={numberError ?? undefined}
                  placeholder="QUO-0001"
                />
                <Select
                  label="Company"
                  required
                  value={form.company_id}
                  onChange={(e) => set('company_id', e.target.value)}
                  options={[
                    { value: '', label: 'Select company...' },
                    ...companies.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Issue Date"
                  type="date"
                  required
                  value={form.issue_date}
                  onChange={(e) => set('issue_date', e.target.value)}
                />
                <Input
                  label="Valid Until"
                  type="date"
                  required
                  value={form.valid_until}
                  onChange={(e) => set('valid_until', e.target.value)}
                />
              </div>

              <Textarea
                label="Notes"
                rows={2}
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
              />
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-700">Line Items</h2>
                <Button type="button" variant="secondary" size="sm" onClick={addLineItem}>
                  <Plus className="w-3.5 h-3.5" /> Add Item
                </Button>
              </div>

              <div className="space-y-2">
                {lineItems.map((li, idx) => (
                  <div key={idx} className="flex flex-col gap-2 sm:grid sm:grid-cols-12 sm:gap-2 sm:items-end">
                    <div className="sm:col-span-6">
                      <Input
                        label={idx === 0 ? 'Description' : ''}
                        value={li.description}
                        onChange={(e) => updateLineItem(idx, 'description', e.target.value)}
                        placeholder="Service description..."
                      />
                    </div>
                    <div className="flex gap-2 items-end sm:contents">
                      <div className="w-20 shrink-0 sm:w-auto sm:col-span-2">
                        <Input label={idx === 0 ? 'Qty' : ''} type="number" min="0" step="0.01" value={li.quantity} onChange={(e) => updateLineItem(idx, 'quantity', e.target.value)} />
                      </div>
                      <div className="flex-1 sm:col-span-3">
                        <Input label={idx === 0 ? 'Unit Price' : ''} type="number" min="0" step="0.01" value={li.unit_price} onChange={(e) => updateLineItem(idx, 'unit_price', e.target.value)} />
                      </div>
                      <div className="flex items-end shrink-0 pb-0.5 sm:col-span-1">
                        <button type="button" onClick={() => removeLineItem(idx)} className="p-2 text-gray-400 hover:text-red-500 transition cursor-pointer">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 space-y-1 text-sm">
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                {form.vat_enabled && <div className="flex justify-between text-gray-500"><span>VAT ({form.vat_rate}%)</span><span>{formatCurrency(vatAmount)}</span></div>}
                <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-100"><span>Total</span><span>{formatCurrency(total)}</span></div>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700">Status</h2>
              <Select
                label="Quote Status"
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'sent', label: 'Sent' },
                  { value: 'accepted', label: 'Accepted' },
                  { value: 'rejected', label: 'Rejected' },
                  { value: 'expired', label: 'Expired' },
                ]}
              />
            </Card>

            <Card className="p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700">VAT</h2>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={form.vat_enabled} onChange={(e) => set('vat_enabled', e.target.checked)} className="w-4 h-4 accent-emerald-600" />
                <span className="text-sm text-gray-700">Apply VAT</span>
              </label>
              {form.vat_enabled && (
                <Input label="VAT Rate (%)" type="number" min="0" max="100" step="0.01" value={form.vat_rate} onChange={(e) => set('vat_rate', e.target.value)} />
              )}
            </Card>

            <Button type="submit" loading={loading} className="w-full justify-center">
              {isEdit ? 'Save Changes' : 'Create Quote'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
