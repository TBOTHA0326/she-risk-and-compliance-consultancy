'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card, PageHeader, ErrorMessage } from '@/components/ui/Card'
import type { SafetyFile, Company } from '@/types/database'
import Link from 'next/link'

interface SafetyFileFormProps {
  safetyFile?: SafetyFile
  companies: Pick<Company, 'id' | 'name'>[]
}

export function SafetyFileForm({ safetyFile: sf, companies }: SafetyFileFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const isEdit = !!sf

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    file_reference: sf?.file_reference ?? '',
    company_id: sf?.company_id ?? searchParams.get('company') ?? '',
    project_name: sf?.project_name ?? '',
    site_name: sf?.site_name ?? '',
    status: sf?.status ?? 'pending',
    assigned_date: sf?.assigned_date ?? new Date().toISOString().split('T')[0],
    due_date: sf?.due_date ?? '',
    notes: sf?.notes ?? '',
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    let sfId = sf?.id

    if (isEdit) {
      const { error } = await supabase.from('safety_files').update({
        file_reference: form.file_reference,
        project_name: form.project_name,
        site_name: form.site_name || null,
        status: form.status as SafetyFile['status'],
        assigned_date: form.assigned_date,
        due_date: form.due_date || null,
        notes: form.notes || null,
      }).eq('id', sf!.id)
      if (error) { setError(error.message); setLoading(false); return }
    } else {
      const { data, error } = await supabase.from('safety_files').insert({
        file_reference: form.file_reference,
        company_id: form.company_id,
        project_name: form.project_name,
        site_name: form.site_name || null,
        status: form.status as SafetyFile['status'],
        assigned_date: form.assigned_date,
        due_date: form.due_date || null,
        notes: form.notes || null,
      }).select('id').single()
      if (error) { setError(error.message); setLoading(false); return }
      sfId = data.id
    }

    await supabase.from('activity_log').insert({
      action: isEdit ? 'updated' : 'created',
      entity_type: 'safety_file',
      entity_id: sfId!,
      entity_label: form.project_name,
    })

    router.push(`/safety-files/${sfId}`)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEdit ? 'Edit Safety File' : 'New Safety File'}
        action={<Link href={isEdit ? `/safety-files/${sf!.id}` : '/safety-files'}><Button variant="secondary">Cancel</Button></Link>}
      />

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700">File Information</h2>
              {error && <ErrorMessage message={error} />}

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="File Reference"
                  required
                  value={form.file_reference}
                  onChange={(e) => set('file_reference', e.target.value)}
                  placeholder="SF-2024-001"
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

              <Input
                label="Project / Site Name"
                required
                value={form.project_name}
                onChange={(e) => set('project_name', e.target.value)}
                placeholder="Main Construction Site"
              />

              <Input
                label="Site Name"
                value={form.site_name}
                onChange={(e) => set('site_name', e.target.value)}
                placeholder="Building A, Floor 3..."
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Assigned Date"
                  type="date"
                  required
                  value={form.assigned_date}
                  onChange={(e) => set('assigned_date', e.target.value)}
                />
                <Input
                  label="Due Date"
                  type="date"
                  value={form.due_date}
                  onChange={(e) => set('due_date', e.target.value)}
                />
              </div>

              <Textarea
                label="Notes"
                rows={3}
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
              />
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700">Status</h2>
              <Select
                label="Status"
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'under_review', label: 'Under Review' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'expired', label: 'Expired' },
                ]}
              />
            </Card>

            <Button type="submit" loading={loading} className="w-full justify-center">
              {isEdit ? 'Save Changes' : 'Create Safety File'}
            </Button>

            {!isEdit && (
              <p className="text-xs text-gray-400 text-center">
                All 7 sections will be created automatically.
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
