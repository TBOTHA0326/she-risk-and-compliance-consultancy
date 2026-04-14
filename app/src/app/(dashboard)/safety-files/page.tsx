import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, PageHeader, EmptyState } from '@/components/ui/Card'
import { safetyFileStatusBadge } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import { ShieldCheck } from 'lucide-react'

export default async function SafetyFilesPage() {
  const supabase = await createClient()
  const { data: safetyFiles } = await supabase
    .from('v_safety_file_progress')
    .select('*')
    .order('safety_file_id')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Safety Files"
        subtitle={`${safetyFiles?.length ?? 0} files`}
        action={<Link href="/safety-files/new"><Button>+ New Safety File</Button></Link>}
      />

      <Card>
        {!safetyFiles?.length ? (
          <EmptyState message="No safety files yet." icon={<ShieldCheck className="w-10 h-10" />} />
        ) : (
          <div className="divide-y divide-gray-50">
            {safetyFiles.map((sf) => (
              <Link key={sf.safety_file_id} href={`/safety-files/${sf.safety_file_id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition">
                <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{sf.project_name}</p>
                  <p className="text-xs text-gray-400">{sf.company_name} · {sf.file_reference}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Progress bar */}
                  <div className="hidden sm:block w-24">
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${sf.completion_percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 text-center">{sf.completion_percentage}%</p>
                  </div>
                  {safetyFileStatusBadge(sf.status)}
                  {sf.due_date && <p className="text-xs text-gray-400">{formatDate(sf.due_date)}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
