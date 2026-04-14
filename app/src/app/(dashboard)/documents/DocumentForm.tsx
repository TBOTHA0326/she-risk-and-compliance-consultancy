'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Card, PageHeader, ErrorMessage } from '@/components/ui/Card'
import type { SHEDocument, Company } from '@/types/database'
import Link from 'next/link'
import { Upload, FileText, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DocumentFormProps {
  document?: SHEDocument
  companies: Pick<Company, 'id' | 'name'>[]
}

const CATEGORY_OPTIONS = [
  { value: 'compliance_certificate', label: 'Compliance Certificate' },
  { value: 'safety_policy', label: 'Safety Policy' },
  { value: 'audit_report', label: 'Audit Report' },
  { value: 'training_record', label: 'Training Record' },
  { value: 'legal_document', label: 'Legal Document' },
  { value: 'inspection_report', label: 'Inspection Report' },
  { value: 'internal_template', label: 'Internal Template' },
  { value: 'miscellaneous', label: 'Miscellaneous' },
]

export function DocumentForm({ document: doc, companies }: DocumentFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const isEdit = !!doc

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const [form, setForm] = useState({
    title: doc?.title ?? '',
    description: doc?.description ?? '',
    category: doc?.category ?? 'miscellaneous',
    company_id: doc?.company_id ?? searchParams.get('company') ?? '',
    expiry_date: doc?.expiry_date ?? '',
    tags: doc?.tags?.join(', ') ?? '',
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) {
      setFile(dropped)
      setForm((f) => ({ ...f, title: f.title || dropped.name.replace(/\.[^/.]+$/, '') }))
    }
  }, [])

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true) }
  const handleDragLeave = () => setDragOver(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    let storagePath = doc?.storage_path ?? ''
    let fileName = doc?.file_name ?? ''
    let fileSize = doc?.file_size ?? null
    let mimeType = doc?.mime_type ?? null

    // Upload file if new file selected
    if (file) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Not authenticated'); setLoading(false); return }

      const ext = file.name.split('.').pop()
      const path = `documents/${user.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage.from('documents').upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })

      if (uploadError) { setError(uploadError.message); setLoading(false); return }

      storagePath = path
      fileName = file.name
      fileSize = file.size
      mimeType = file.type
    }

    if (!storagePath && !isEdit) {
      setError('Please select a file to upload')
      setLoading(false)
      return
    }

    const category = form.category as SHEDocument['category']
    const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean)

    let docId = doc?.id

    if (isEdit) {
      const { error } = await supabase.from('documents').update({
        title: form.title,
        description: form.description || null,
        category,
        company_id: form.company_id || null,
        expiry_date: form.expiry_date || null,
        tags,
      }).eq('id', doc!.id)
      if (error) { setError(error.message); setLoading(false); return }
    } else {
      const { data, error } = await supabase.from('documents').insert({
        title: form.title,
        description: form.description || null,
        category,
        company_id: form.company_id || null,
        storage_path: storagePath!,
        file_name: fileName!,
        file_size: fileSize,
        mime_type: mimeType,
        expiry_date: form.expiry_date || null,
        tags,
      }).select('id').single()
      if (error) { setError(error.message); setLoading(false); return }
      docId = data.id
    }

    await supabase.from('activity_log').insert({
      action: isEdit ? 'updated' : 'uploaded',
      entity_type: 'document',
      entity_id: docId!,
      entity_label: form.title,
    })

    router.push(`/documents/${docId}`)
    router.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title={isEdit ? 'Edit Document' : 'Upload Document'}
        action={<Link href={isEdit ? `/documents/${doc!.id}` : '/documents'}><Button variant="secondary">Cancel</Button></Link>}
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <ErrorMessage message={error} />}

        {/* File Upload */}
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            {isEdit ? 'Replace File (optional)' : 'File'}
          </h2>

          {file ? (
            <div className="flex items-center gap-3 p-4 bg-violet-50 border border-violet-200 rounded-xl">
              <FileText className="w-5 h-5 text-violet-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
              <button type="button" onClick={() => setFile(null)} className="p-1 text-gray-400 hover:text-gray-600 shrink-0 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={cn(
                'flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-150',
                dragOver
                  ? 'border-violet-400 bg-violet-50 scale-[1.01]'
                  : 'border-gray-200 hover:border-violet-300 hover:bg-violet-50/50'
              )}
            >
              <Upload className={cn('w-7 h-7 mb-2 transition-colors', dragOver ? 'text-violet-500' : 'text-gray-300')} />
              <p className="text-sm font-medium text-gray-500">
                {dragOver ? 'Drop it here!' : 'Drag & drop a file, or click to browse'}
              </p>
              <p className="text-xs text-gray-400 mt-1">PDF, Word, Excel, images up to 50MB</p>
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null
                  setFile(f)
                  if (f && !form.title) set('title', f.name.replace(/\.[^/.]+$/, ''))
                }}
              />
            </label>
          )}

          {isEdit && doc?.file_name && !file && (
            <p className="text-xs text-gray-400 mt-2">Current file: <span className="font-medium text-gray-600">{doc.file_name}</span></p>
          )}
        </Card>

        {/* Document Details */}
        <Card className="p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Document Details</h2>
          <Input
            label="Title"
            required
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Document title"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              options={CATEGORY_OPTIONS}
            />
            <Select
              label="Linked Company"
              value={form.company_id}
              onChange={(e) => set('company_id', e.target.value)}
              options={[
                { value: '', label: 'None' },
                ...companies.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>
          <Textarea
            label="Description"
            rows={2}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Expiry Date"
              type="date"
              value={form.expiry_date}
              onChange={(e) => set('expiry_date', e.target.value)}
            />
            <Input
              label="Tags"
              value={form.tags}
              onChange={(e) => set('tags', e.target.value)}
              placeholder="safety, 2024, audit"
              hint="Comma-separated"
            />
          </div>
        </Card>

        <Button type="submit" loading={loading} size="lg" className="w-full justify-center">
          {isEdit ? 'Save Changes' : 'Upload Document'}
        </Button>
      </form>
    </div>
  )
}
