'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, PageHeader, EmptyState } from '@/components/ui/Card'
import { Badge, invoiceStatusBadge, quoteStatusBadge, safetyFileStatusBadge, companyStatusBadge } from '@/components/ui/Badge'
import { formatCurrency, formatDate, formatDateTime, isExpiringSoon, isExpired } from '@/lib/utils'
import type { Company, Invoice, Quote, SHEDocument, ActivityLog, Expense, ExpenseCategory, ExpenseStatus } from '@/types/database'
import { Building2, Edit, FileText, FolderOpen, ShieldCheck, Receipt } from 'lucide-react'

interface SafetyFileSummary {
  safety_file_id: string
  file_reference: string
  project_name: string
  status: string
  completion_percentage: number
  due_date: string | null
}

function expenseStatusBadge(status: ExpenseStatus) {
  const map: Record<ExpenseStatus, { label: string; variant: 'neutral' | 'warning' | 'danger' | 'success' | 'info' }> = {
    pending: { label: 'Pending', variant: 'warning' },
    approved: { label: 'Approved', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'danger' },
    reimbursed: { label: 'Reimbursed', variant: 'info' },
  }
  const { label, variant } = map[status] ?? { label: status, variant: 'neutral' }
  return <Badge variant={variant}>{label}</Badge>
}

function formatExpenseCategory(cat: ExpenseCategory) {
  return cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

interface Props {
  company: Company
  invoices: Invoice[]
  quotes: Quote[]
  documents: SHEDocument[]
  safetyFiles: SafetyFileSummary[]
  activity: ActivityLog[]
  expenses: Expense[]
}

type Tab = 'overview' | 'invoices' | 'quotes' | 'documents' | 'safety_files' | 'expenses' | 'activity'

const tabs: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'quotes', label: 'Quotes' },
  { id: 'documents', label: 'Documents' },
  { id: 'safety_files', label: 'Safety Files' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'activity', label: 'Activity' },
]

export function CompanyDetail({ company, invoices, quotes, documents, safetyFiles, activity, expenses }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  const outstandingBalance = invoices
    .filter((i) => i.status === 'sent' || i.status === 'overdue')
    .reduce((sum, i) => sum + i.total, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title={company.name}
        subtitle={company.industry_type ?? undefined}
        action={
          <div className="flex gap-2">
            <Link href={`/companies/${company.id}/edit`}>
              <Button variant="secondary" size="sm"><Edit className="w-3.5 h-3.5 mr-1" />Edit</Button>
            </Link>
            <Link href={`/invoices/new?company=${company.id}`}>
              <Button size="sm">+ Invoice</Button>
            </Link>
          </div>
        }
      />

      {/* Tabs */}
      <div className="border-b border-gray-100">
        <div className="flex gap-1 -mb-px overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-5 space-y-4">
              <h2 className="text-sm font-semibold text-gray-700">Company Details</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Contact Person</p>
                  <p className="text-gray-900 mt-0.5">{company.contact_person ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="text-gray-900 mt-0.5">{company.email ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="text-gray-900 mt-0.5">{company.phone ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Registration No.</p>
                  <p className="text-gray-900 mt-0.5">{company.registration_number ?? '—'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-400">Address</p>
                  <p className="text-gray-900 mt-0.5">{company.address ?? '—'}</p>
                </div>
                {company.notes && (
                  <div className="col-span-2">
                    <p className="text-xs text-gray-400">Notes</p>
                    <p className="text-gray-900 mt-0.5">{company.notes}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-5 space-y-3">
              <h2 className="text-sm font-semibold text-gray-700">Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  {companyStatusBadge(company.status)}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Invoices</span>
                  <span className="font-medium">{invoices.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Outstanding</span>
                  <span className="font-medium text-amber-700">{formatCurrency(outstandingBalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Safety Files</span>
                  <span className="font-medium">{safetyFiles.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Documents</span>
                  <span className="font-medium">{documents.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Expenses</span>
                  <span className="font-medium">{expenses.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Expenses</span>
                  <span className="font-medium text-rose-700">{formatCurrency(expenses.reduce((s, e) => s + e.total, 0))}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <Card>
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-700">Invoices</h2>
            <Link href={`/invoices/new?company=${company.id}`}><Button size="sm">+ Invoice</Button></Link>
          </div>
          {!invoices.length ? (
            <EmptyState message="No invoices" icon={<FileText className="w-8 h-8" />} />
          ) : (
            <div className="divide-y divide-gray-50">
              {invoices.map((inv) => (
                <Link key={inv.id} href={`/invoices/${inv.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{inv.invoice_number}</p>
                    <p className="text-xs text-gray-400">Due {formatDate(inv.due_date)}</p>
                  </div>
                  <div className="text-right">
                    {invoiceStatusBadge(inv.status)}
                    <p className="text-xs text-gray-500 mt-1">{formatCurrency(inv.total)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Quotes Tab */}
      {activeTab === 'quotes' && (
        <Card>
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-700">Quotes</h2>
            <Link href={`/quotes/new?company=${company.id}`}><Button size="sm">+ Quote</Button></Link>
          </div>
          {!quotes.length ? (
            <EmptyState message="No quotes" icon={<FileText className="w-8 h-8" />} />
          ) : (
            <div className="divide-y divide-gray-50">
              {quotes.map((q) => (
                <Link key={q.id} href={`/quotes/${q.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{q.quote_number}</p>
                    <p className="text-xs text-gray-400">Valid until {formatDate(q.valid_until)}</p>
                  </div>
                  <div className="text-right">
                    {quoteStatusBadge(q.status)}
                    <p className="text-xs text-gray-500 mt-1">{formatCurrency(q.total)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <Card>
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-700">Documents</h2>
            <Link href={`/documents/new?company=${company.id}`}><Button size="sm">+ Document</Button></Link>
          </div>
          {!documents.length ? (
            <EmptyState message="No documents" icon={<FolderOpen className="w-8 h-8" />} />
          ) : (
            <div className="divide-y divide-gray-50">
              {documents.map((doc) => (
                <Link key={doc.id} href={`/documents/${doc.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.title}</p>
                    <p className="text-xs text-gray-400 capitalize">{doc.category.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    {doc.expiry_date && (
                      isExpired(doc.expiry_date) ? <Badge variant="danger">Expired</Badge>
                      : isExpiringSoon(doc.expiry_date) ? <Badge variant="warning">Expiring soon</Badge>
                      : <Badge variant="neutral">{formatDate(doc.expiry_date)}</Badge>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Safety Files Tab */}
      {activeTab === 'safety_files' && (
        <Card>
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-700">Safety Files</h2>
            <Link href={`/safety-files/new?company=${company.id}`}><Button size="sm">+ Safety File</Button></Link>
          </div>
          {!safetyFiles.length ? (
            <EmptyState message="No safety files" icon={<ShieldCheck className="w-8 h-8" />} />
          ) : (
            <div className="divide-y divide-gray-50">
              {safetyFiles.map((sf) => (
                <Link key={sf.safety_file_id} href={`/safety-files/${sf.safety_file_id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{sf.project_name}</p>
                    <p className="text-xs text-gray-400">{sf.file_reference}</p>
                  </div>
                  <div className="text-right">
                    {safetyFileStatusBadge(sf.status)}
                    <p className="text-xs text-gray-400 mt-1">{sf.completion_percentage}% complete</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <Card>
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-700">Expenses</h2>
            <Link href={`/expenses/new?company=${company.id}`}><Button size="sm">+ Expense</Button></Link>
          </div>
          {!expenses.length ? (
            <EmptyState message="No expenses" icon={<Receipt className="w-8 h-8" />} />
          ) : (
            <div className="divide-y divide-gray-50">
              {expenses.map((exp) => (
                <Link key={exp.id} href={`/expenses/${exp.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{exp.title}</p>
                    <p className="text-xs text-gray-400">{formatExpenseCategory(exp.category)} · {formatDate(exp.expense_date)}</p>
                  </div>
                  <div className="text-right">
                    {expenseStatusBadge(exp.status)}
                    <p className="text-xs text-gray-500 mt-1">{formatCurrency(exp.total)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <Card>
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Activity Log</h2>
          </div>
          {!activity.length ? (
            <EmptyState message="No activity recorded" icon={<Building2 className="w-8 h-8" />} />
          ) : (
            <div className="divide-y divide-gray-50">
              {activity.map((log) => (
                <div key={log.id} className="px-5 py-3">
                  <p className="text-sm text-gray-700 capitalize">
                    <span className="font-medium">{log.action}</span>{' '}
                    <span className="text-gray-500">{log.entity_label ?? log.entity_type}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(log.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
