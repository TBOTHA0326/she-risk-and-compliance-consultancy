'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { Expense, ExpenseCategory, ExpenseStatus } from '@/types/database'

type CompanyOption = { id: string; name: string }

const CATEGORY_OPTIONS: { value: ExpenseCategory; label: string }[] = [
  { value: 'fuel', label: 'Fuel' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'meals', label: 'Meals' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'training', label: 'Training' },
  { value: 'office_supplies', label: 'Office Supplies' },
  { value: 'travel', label: 'Travel' },
  { value: 'professional_services', label: 'Professional Services' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'other', label: 'Other' },
]

const STATUS_OPTIONS: { value: ExpenseStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'reimbursed', label: 'Reimbursed' },
]

interface Props {
  companies: CompanyOption[]
  initialCompanyId?: string
  expense?: Expense
}

export function ExpenseForm({ companies, initialCompanyId, expense }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!expense

  const [title, setTitle] = useState(expense?.title ?? '')
  const [description, setDescription] = useState(expense?.description ?? '')
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category ?? 'other')
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '')
  const [vatEnabled, setVatEnabled] = useState(expense?.vat_enabled ?? false)
  const [vatRate, setVatRate] = useState(expense ? String(expense.vat_rate) : '15')
  const [expenseDate, setExpenseDate] = useState(expense?.expense_date ?? new Date().toISOString().split('T')[0])
  const [companyId, setCompanyId] = useState(expense?.company_id ?? initialCompanyId ?? '')
  const [status, setStatus] = useState<ExpenseStatus>(expense?.status ?? 'pending')
  const [notes, setNotes] = useState(expense?.notes ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const amountNum = parseFloat(amount) || 0
  const vatRateNum = parseFloat(vatRate) || 0
  const vatAmount = vatEnabled ? (amountNum * vatRateNum) / 100 : 0
  const total = amountNum + vatAmount

  function validate() {
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = 'Title is required'
    if (!amount || amountNum <= 0) errs.amount = 'Enter a valid amount'
    if (!expenseDate) errs.expenseDate = 'Date is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      category,
      amount: amountNum,
      vat_enabled: vatEnabled,
      vat_rate: vatRateNum,
      vat_amount: vatAmount,
      total,
      expense_date: expenseDate,
      company_id: companyId || null,
      status,
      notes: notes.trim() || null,
    }

    if (isEdit) {
      const { error } = await supabase
        .from('expenses')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', expense.id)
      if (error) { setSaving(false); setErrors({ form: error.message }); return }
      router.push(`/expenses/${expense.id}`)
    } else {
      const { data, error } = await supabase
        .from('expenses')
        .insert({ ...payload, created_by: (await supabase.auth.getUser()).data.user?.id })
        .select('id')
        .single()
      if (error) { setSaving(false); setErrors({ form: error.message }); return }
      router.push(`/expenses/${data.id}`)
    }

    router.refresh()
  }

  const companyOptions = [
    { value: '', label: '— No company —' },
    ...companies.map((c) => ({ value: c.id, label: c.name })),
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.form && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">{errors.form}</div>
      )}

      <Card className="p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-700">Expense Details</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={errors.title}
              placeholder="e.g. Site visit fuel"
            />
          </div>

          <Select
            label="Category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            options={CATEGORY_OPTIONS}
          />

          <Select
            label="Linked Company"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            options={companyOptions}
          />

          <Input
            label="Expense Date"
            type="date"
            required
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            error={errors.expenseDate}
          />

          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ExpenseStatus)}
            options={STATUS_OPTIONS}
          />

          <div className="sm:col-span-2">
            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional short description"
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-5">
        <h2 className="text-sm font-semibold text-slate-700">Amount</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Amount (excl. VAT)"
            type="number"
            required
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={errors.amount}
            placeholder="0.00"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">VAT</label>
            <div className="flex items-center gap-3 py-2.5">
              <button
                type="button"
                onClick={() => setVatEnabled(!vatEnabled)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${vatEnabled ? 'bg-[#84cc16]' : 'bg-slate-200'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${vatEnabled ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-sm text-slate-600">{vatEnabled ? 'VAT included' : 'No VAT'}</span>
            </div>
          </div>

          {vatEnabled && (
            <Input
              label="VAT Rate (%)"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={vatRate}
              onChange={(e) => setVatRate(e.target.value)}
            />
          )}
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-2">
          {vatEnabled && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">VAT ({vatRate}%)</span>
              <span className="text-slate-700">R {vatAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-semibold">
            <span className="text-slate-900">Total</span>
            <span className="text-slate-900">R {total.toFixed(2)}</span>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <Textarea
          label="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Any additional notes..."
        />
      </Card>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Expense'}
        </Button>
      </div>
    </form>
  )
}
