import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, PageHeader, EmptyState } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate, isExpiringSoon, isExpired } from '@/lib/utils'
import { FolderOpen, FileText } from 'lucide-react'

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

export default async function DocumentsPage() {
  const supabase = await createClient()
  const { data: documents } = await supabase
    .from('documents')
    .select('*, companies(name)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        subtitle={`${documents?.length ?? 0} documents`}
        action={<Link href="/documents/new"><Button>+ Upload Document</Button></Link>}
      />

      <Card>
        {!documents?.length ? (
          <EmptyState message="No documents yet." icon={<FolderOpen className="w-10 h-10" />} />
        ) : (
          <div className="divide-y divide-gray-50">
            {documents.map((doc) => (
              <Link key={doc.id} href={`/documents/${doc.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                  <p className="text-xs text-gray-400">
                    {CATEGORY_LABELS[doc.category] ?? doc.category}
                    {doc.companies && ` · ${doc.companies.name}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {doc.expiry_date && (
                    isExpired(doc.expiry_date) ? <Badge variant="danger">Expired</Badge>
                    : isExpiringSoon(doc.expiry_date) ? <Badge variant="warning">Expiring {formatDate(doc.expiry_date)}</Badge>
                    : <Badge variant="neutral">{formatDate(doc.expiry_date)}</Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
