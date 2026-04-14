'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card, PageHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatDateTime, isExpiringSoon, isExpired } from '@/lib/utils'
import type { SHEDocument } from '@/types/database'
import { Edit, Trash2, Download } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  compliance_certificate: 'Compliance Certificate',
  safety_policy: 'Safety Policy',
  audit_report: 'Audit Report',
  training_record: 'Training Record',
  legal_document: 'Legal Document',
  inspection_report: 'Inspection Report',
  internal_template: 'Internal Template',
  miscellaneous: 'Miscellaneous',
}

interface Props {
  doc: SHEDocument & { companies: { name: string } | null }
}

export function DocumentDetail({ doc }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [deleting, setDeleting] = useState(false)
  const [downloading, setDownloading] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this document?')) return
    setDeleting(true)
    // Delete file from storage
    await supabase.storage.from('documents').remove([doc.storage_path])
    await supabase.from('documents').delete().eq('id', doc.id)
    router.push('/documents')
    router.refresh()
  }

  async function handleDownload() {
    setDownloading(true)
    const { data } = await supabase.storage.from('documents').createSignedUrl(doc.storage_path, 60)
    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
    }
    setDownloading(false)
  }

  const expiryBadge = doc.expiry_date
    ? isExpired(doc.expiry_date) ? <Badge variant="danger">Expired</Badge>
    : isExpiringSoon(doc.expiry_date) ? <Badge variant="warning">Expiring soon</Badge>
    : <Badge variant="success">Valid</Badge>
    : null

  return (
    <div className="space-y-6">
      <PageHeader
        title={doc.title}
        subtitle={CATEGORY_LABELS[doc.category] ?? doc.category}
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleDownload} loading={downloading}><Download className="w-3.5 h-3.5 mr-1" />Download</Button>
            <Link href={`/documents/${doc.id}/edit`}><Button variant="secondary" size="sm"><Edit className="w-3.5 h-3.5 mr-1" />Edit</Button></Link>
            <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}><Trash2 className="w-3.5 h-3.5" /></Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Document Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-400">Category</p>
                <p className="mt-0.5">{CATEGORY_LABELS[doc.category] ?? doc.category}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Company</p>
                <p className="mt-0.5">{doc.companies?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Upload Date</p>
                <p className="mt-0.5">{formatDate(doc.upload_date)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Expiry Date</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span>{formatDate(doc.expiry_date)}</span>
                  {expiryBadge}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400">File Name</p>
                <p className="mt-0.5 truncate">{doc.file_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">File Size</p>
                <p className="mt-0.5">{doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : '—'}</p>
              </div>
              {doc.description && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400">Description</p>
                  <p className="mt-0.5">{doc.description}</p>
                </div>
              )}
              {doc.tags && doc.tags.length > 0 && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 mb-1">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {doc.tags.map((tag) => (
                      <Badge key={tag} variant="neutral">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400">Last Updated</p>
                <p className="mt-0.5">{formatDateTime(doc.updated_at)}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
