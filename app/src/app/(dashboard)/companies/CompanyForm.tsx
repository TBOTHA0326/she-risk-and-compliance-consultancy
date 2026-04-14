'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card, PageHeader, ErrorMessage } from '@/components/ui/Card'
import type { Company } from '@/types/database'
import Link from 'next/link'

interface CompanyFormProps {
  company?: Company
}

export function CompanyForm({ company }: CompanyFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = !!company

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: company?.name ?? '',
    registration_number: company?.registration_number ?? '',
    contact_person: company?.contact_person ?? '',
    email: company?.email ?? '',
    phone: company?.phone ?? '',
    address: company?.address ?? '',
    industry_type: company?.industry_type ?? '',
    status: company?.status ?? 'active',
    notes: company?.notes ?? '',
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const payload = {
      name: form.name,
      registration_number: form.registration_number || null,
      contact_person: form.contact_person || null,
      email: form.email || null,
      phone: form.phone || null,
      address: form.address || null,
      industry_type: form.industry_type || null,
      status: form.status as 'active' | 'inactive',
      notes: form.notes || null,
    }

    let companyId = company?.id

    if (isEdit) {
      const { error } = await supabase.from('companies').update(payload).eq('id', company!.id)
      if (error) { setError(error.message); setLoading(false); return }
    } else {
      const { data, error } = await supabase.from('companies').insert(payload).select('id').single()
      if (error) { setError(error.message); setLoading(false); return }
      companyId = data.id
    }

    // Log activity
    await supabase.from('activity_log').insert({
      action: isEdit ? 'updated' : 'created',
      entity_type: 'company',
      entity_id: companyId,
      entity_label: form.name,
    })

    router.push(`/companies/${companyId}`)
    router.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title={isEdit ? `Edit ${company.name}` : 'New Company'}
        action={<Link href={isEdit ? `/companies/${company!.id}` : '/companies'}><Button variant="secondary">Cancel</Button></Link>}
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <ErrorMessage message={error} />}

        {/* Company Info */}
        <Card className="p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Company Information</h2>
          <Input
            label="Company Name"
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Gibela (Pty) Ltd"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Registration Number"
              value={form.registration_number}
              onChange={(e) => set('registration_number', e.target.value)}
              placeholder="2024/000000/07"
            />
            <Input
              label="Industry"
              value={form.industry_type}
              onChange={(e) => set('industry_type', e.target.value)}
              placeholder="Construction"
            />
          </div>
        </Card>

        {/* Contact Details */}
        <Card className="p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Contact Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact Person"
              value={form.contact_person}
              onChange={(e) => set('contact_person', e.target.value)}
              placeholder="John Smith"
            />
            <Input
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="john@company.co.za"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="082 123 4567"
            />
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </div>
          <Textarea
            label="Address"
            rows={2}
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            placeholder="123 Main St, Johannesburg"
          />
        </Card>

        {/* Notes */}
        <Card className="p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Notes</h2>
          <Textarea
            label=""
            rows={3}
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Any additional notes about this company..."
          />
        </Card>

        <Button type="submit" loading={loading} className="w-full justify-center" size="lg">
          {isEdit ? 'Save Changes' : 'Create Company'}
        </Button>
      </form>
    </div>
  )
}
