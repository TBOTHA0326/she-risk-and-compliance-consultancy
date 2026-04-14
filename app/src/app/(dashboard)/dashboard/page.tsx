import { createClient } from '@/lib/supabase/server'
import { KpiCard, Card } from '@/components/ui/Card'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import {
  Building2,
  FileText,
  Quote,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  FolderOpen,
} from 'lucide-react'
import { RevenueChart } from './RevenueChart'
import { InvoiceStatusChart } from './InvoiceStatusChart'
import Link from 'next/link'
import { invoiceStatusBadge } from '@/components/ui/Badge'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { data: kpis },
    { data: recentInvoices },
    { data: recentActivity },
    { data: monthlyRevenue },
    { data: invoiceStatuses },
  ] = await Promise.all([
    supabase.from('v_dashboard_kpis').select('*').single(),
    supabase
      .from('invoices')
      .select('id, invoice_number, status, total, due_date, companies(name)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('v_monthly_revenue').select('*').order('month', { ascending: false }).limit(12),
    supabase.from('invoices').select('status'),
  ])

  const statusCounts = (invoiceStatuses ?? []).reduce<Record<string, number>>((acc, inv) => {
    acc[inv.status] = (acc[inv.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-red-800 rounded-2xl px-7 py-6 text-white shadow-lg">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, Charlotte! 👋</h1>
          <p className="text-sm text-blue-200 mt-1">Here&apos;s your compliance overview for today.</p>
        </div>
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 w-36 h-36 rounded-full bg-gradient-to-br from-red-600 to-red-800 opacity-30" />
        <div className="absolute -bottom-10 right-16 w-24 h-24 rounded-full bg-gradient-to-br from-red-700 to-red-900 opacity-20" />
        <div className="absolute top-2 right-32 w-12 h-12 rounded-full bg-red-600 opacity-15" />
        <div className="absolute bottom-0 right-0">
          <div className="flex gap-2 p-5">
            <Link href="/companies/new"><button className="bg-white/10 hover:bg-white/20 transition text-white text-xs font-medium px-3 py-1.5 rounded-lg border border-white/20">+ Company</button></Link>
            <Link href="/invoices/new"><button className="bg-white text-red-700 hover:bg-red-50 transition text-xs font-semibold px-3 py-1.5 rounded-lg">+ Invoice</button></Link>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Active Companies"
          value={kpis?.total_active_companies ?? 0}
          icon={<Building2 className="w-5 h-5 text-red-600" />}
        />
        <KpiCard
          title="Active Quotes"
          value={kpis?.active_quotes ?? 0}
          icon={<Quote className="w-5 h-5 text-blue-500" />}
        />
        <KpiCard
          title="Outstanding Invoices"
          value={kpis?.outstanding_invoices ?? 0}
          sub={formatCurrency(kpis?.outstanding_amount ?? 0)}
          icon={<FileText className="w-5 h-5 text-amber-500" />}
          highlight={kpis?.outstanding_invoices ? 'warning' : 'default'}
        />
        <KpiCard
          title="Overdue Invoices"
          value={kpis?.overdue_invoices ?? 0}
          icon={<AlertTriangle className="w-5 h-5 text-rose-500" />}
          highlight={kpis?.overdue_invoices ? 'danger' : 'default'}
        />
        <KpiCard
          title="Safety Files Active"
          value={kpis?.safety_files_in_progress ?? 0}
          icon={<ShieldCheck className="w-5 h-5 text-teal-500" />}
        />
        <KpiCard
          title="Expiring Docs (30d)"
          value={kpis?.expiring_documents_30d ?? 0}
          icon={<FolderOpen className="w-5 h-5 text-orange-500" />}
          highlight={kpis?.expiring_documents_30d ? 'warning' : 'default'}
        />
        <KpiCard
          title="Monthly Revenue"
          value={formatCurrency(monthlyRevenue?.[0]?.revenue ?? 0)}
          sub={monthlyRevenue?.[0] ? new Date(monthlyRevenue[0].month).toLocaleString('en-ZA', { month: 'long', year: 'numeric' }) : ''}
          icon={<TrendingUp className="w-5 h-5 text-teal-500" />}
          highlight="success"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Monthly Revenue</h2>
            <RevenueChart data={(monthlyRevenue ?? []).slice().reverse()} />
          </Card>
        </div>
        <div>
          <Card className="p-5 h-full">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Invoice Status</h2>
            <InvoiceStatusChart data={statusCounts} />
          </Card>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Invoices */}
        <Card>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Recent Invoices</h2>
            <Link href="/invoices" className="text-xs text-violet-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(recentInvoices ?? []).length === 0 ? (
              <p className="px-5 py-8 text-sm text-gray-400 text-center">No invoices yet</p>
            ) : (
              (recentInvoices ?? []).map((inv) => (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{inv.invoice_number}</p>
                    <p className="text-xs text-gray-400">
                      {inv.companies?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    {invoiceStatusBadge(inv.status)}
                    <p className="text-xs text-gray-400 mt-1">{formatCurrency(inv.total)}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        {/* Activity Feed */}
        <Card>
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {(recentActivity ?? []).length === 0 ? (
              <p className="px-5 py-8 text-sm text-gray-400 text-center">No activity yet</p>
            ) : (
              (recentActivity ?? []).map((activity) => (
                <div key={activity.id} className="px-5 py-3">
                  <p className="text-sm text-gray-700">
                    <span className="font-medium capitalize">{activity.action}</span>{' '}
                    <span className="text-gray-500">{activity.entity_label ?? activity.entity_type}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(activity.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
