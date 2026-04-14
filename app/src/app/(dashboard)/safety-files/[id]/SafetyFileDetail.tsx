'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card, PageHeader } from '@/components/ui/Card'
import { Badge, safetyFileStatusBadge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Input'
import { formatDate } from '@/lib/utils'
import type { SafetyFile, SafetyFileSection, SafetySectionStatus } from '@/types/database'
import { Edit, Trash2, CheckCircle, Clock, AlertCircle, MinusCircle } from 'lucide-react'

const SECTION_LABELS: Record<string, string> = {
  risk_assessments: 'Risk Assessments',
  method_statements: 'Method Statements',
  ppe_compliance: 'PPE Compliance',
  training_records: 'Training Records',
  induction_records: 'Induction Records',
  emergency_procedures: 'Emergency Procedures',
  site_inspections: 'Site Inspections',
}

const SECTION_ICONS: Record<SafetySectionStatus, React.ReactNode> = {
  pending: <Clock className="w-4 h-4 text-gray-400" />,
  in_progress: <AlertCircle className="w-4 h-4 text-blue-500" />,
  completed: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  not_applicable: <MinusCircle className="w-4 h-4 text-gray-300" />,
}

interface Props {
  safetyFile: SafetyFile & { companies: { name: string } | null }
  sections: SafetyFileSection[]
  progress: { completion_percentage: number; completed_sections: number; total_sections: number } | null
}

export function SafetyFileDetail({ safetyFile, sections, progress }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [deleting, setDeleting] = useState(false)
  const [updatingSections, setUpdatingSections] = useState<Record<string, boolean>>({})

  async function handleDelete() {
    if (!confirm('Delete this safety file?')) return
    setDeleting(true)
    await supabase.from('safety_files').delete().eq('id', safetyFile.id)
    router.push('/safety-files')
    router.refresh()
  }

  async function updateSectionStatus(sectionId: string, status: SafetySectionStatus) {
    setUpdatingSections((s) => ({ ...s, [sectionId]: true }))
    await supabase.from('safety_file_sections').update({ status }).eq('id', sectionId)
    setUpdatingSections((s) => ({ ...s, [sectionId]: false }))
    router.refresh()
  }

  const pct = progress?.completion_percentage ?? 0

  return (
    <div className="space-y-6">
      <PageHeader
        title={safetyFile.project_name}
        subtitle={
          `${(safetyFile as { companies?: { name: string } | null }).companies?.name ?? '—'} · ${safetyFile.file_reference}`
        }
        action={
          <div className="flex gap-2">
            <Link href={`/safety-files/${safetyFile.id}/edit`}><Button variant="secondary" size="sm"><Edit className="w-3.5 h-3.5 mr-1" />Edit</Button></Link>
            <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}><Trash2 className="w-3.5 h-3.5" /></Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sections */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Compliance Sections</h2>
              <span className="text-sm text-gray-500">{progress?.completed_sections ?? 0}/{progress?.total_sections ?? 7} complete</span>
            </div>

            {/* Progress bar */}
            <div className="mb-5">
              <div className="w-full bg-gray-100 rounded-full h-2 mb-1">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 text-right">{pct}% complete</p>
            </div>

            <div className="space-y-2">
              {sections.map((section) => (
                <div key={section.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="flex-shrink-0">
                    {SECTION_ICONS[section.status]}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{SECTION_LABELS[section.section_type] ?? section.section_type}</p>
                    {section.notes && <p className="text-xs text-gray-400 mt-0.5">{section.notes}</p>}
                  </div>
                  <div className="flex-shrink-0 w-36">
                    <select
                      value={section.status}
                      onChange={(e) => updateSectionStatus(section.id, e.target.value as SafetySectionStatus)}
                      disabled={updatingSections[section.id]}
                      className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="not_applicable">N/A</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* File info */}
        <div className="space-y-4">
          <Card className="p-5 space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">File Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Status</span>
                {safetyFileStatusBadge(safetyFile.status)}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Assigned</span>
                <span>{formatDate(safetyFile.assigned_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Due Date</span>
                <span>{formatDate(safetyFile.due_date)}</span>
              </div>
              {safetyFile.site_name && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Site</span>
                  <span>{safetyFile.site_name}</span>
                </div>
              )}
            </div>
          </Card>

          {safetyFile.notes && (
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Notes</h2>
              <p className="text-sm text-gray-600">{safetyFile.notes}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
