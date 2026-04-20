import { createClient } from '@/lib/supabase/server'
import { KpiCard, Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import {
  Building2,
  FileText,
  Quote,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  FolderOpen,
  Receipt,
  Clock,
} from 'lucide-react'
import { RevenueChart } from './RevenueChart'
import { InvoiceStatusChart } from './InvoiceStatusChart'
import { ExpensesChart } from './ExpensesChart'
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
    { data: monthlyExpenses },
    { data: recentExpenses },
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
    supabase.from('v_monthly_expenses').select('*').order('month', { ascending: false }).limit(12),
    supabase
      .from('expenses')
      .select('id, title, category, total, status, expense_date, companies(name)')
      .order('expense_date', { ascending: false })
      .limit(5),
  ])

  const statusCounts = (invoiceStatuses ?? []).reduce<Record<string, number>>((acc, inv) => {
    acc[inv.status] = (acc[inv.status] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-950 px-7 py-8 text-white">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-slate-400">SHE Operations</p>
            <h1 className="mt-2.5 text-2xl font-semibold tracking-tight">Welcome back, Charlotte</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-400">Track overdue invoices, active safety files, and expiring documents in one view.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/companies/new" className="inline-flex">
              <Button
                variant="ghost"
                size="sm"
                className="bg-white/10! text-white! border-white/15! hover:bg-white/15!"
              >
                + Company
              </Button>
            </Link>
            <Link href="/invoices/new" className="inline-flex">
              <Button
                variant="primary"
                size="sm"
                className="bg-[#a3e635]! text-[#1a2e05]! hover:bg-[#84cc16]!"
              >
                + Invoice
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute -top-10 -right-10 h-44 w-44 rounded-full bg-white/3" />
        <div className="absolute -bottom-8 left-8 h-32 w-32 rounded-full bg-white/2" />
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Active Companies"
          value={kpis?.total_active_companies ?? 0}
          icon={<Building2 className="w-4 h-4 text-slate-600" />}
        />
        <KpiCard
          title="Active Quotes"
          value={kpis?.active_quotes ?? 0}
          icon={<Quote className="w-4 h-4 text-slate-600" />}
        />
        <KpiCard
          title="Outstanding Invoices"
          value={kpis?.outstanding_invoices ?? 0}
          sub={formatCurrency(kpis?.outstanding_amount ?? 0)}
          icon={<FileText className="w-4 h-4 text-amber-500" />}
          highlight={kpis?.outstanding_invoices ? 'warning' : 'default'}
        />
        <KpiCard
          title="Overdue Invoices"
          value={kpis?.overdue_invoices ?? 0}
          icon={<AlertTriangle className="w-4 h-4 text-rose-500" />}
          highlight={kpis?.overdue_invoices ? 'danger' : 'default'}
        />
        <KpiCard
          title="Safety Files Active"
          value={kpis?.safety_files_in_progress ?? 0}
          icon={<ShieldCheck className="w-4 h-4 text-slate-600" />}
        />
        <KpiCard
          title="Expiring Docs (30d)"
          value={kpis?.expiring_documents_30d ?? 0}
          icon={<FolderOpen className="w-4 h-4 text-orange-500" />}
          highlight={kpis?.expiring_documents_30d ? 'warning' : 'default'}
        />
        <KpiCard
          title="Monthly Revenue"
          value={formatCurrency(monthlyRevenue?.[0]?.revenue ?? 0)}
          sub={monthlyRevenue?.[0] ? new Date(monthlyRevenue[0].month).toLocaleString('en-ZA', { month: 'long', year: 'numeric' }) : ''}
          icon={<TrendingUp className="w-4 h-4 text-[#84cc16]" />}
          highlight="success"
        />
        <KpiCard
          title="Expenses This Month"
          value={formatCurrency(kpis?.expenses_this_month ?? 0)}
          icon={<Receipt className="w-4 h-4 text-orange-500" />}
          highlight={kpis?.expenses_this_month ? 'warning' : 'default'}
        />
        <KpiCard
          title="Pending Expenses"
          value={kpis?.pending_expenses ?? 0}
          icon={<Clock className="w-4 h-4 text-amber-500" />}
          highlight={kpis?.pending_expenses ? 'warning' : 'default'}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Monthly Revenue</h2>
            <RevenueChart data={(monthlyRevenue ?? []).slice().reverse()} />
          </Card>
        </div>
        <div>
          <Card className="p-5 h-full">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Invoice Status</h2>
            <InvoiceStatusChart data={statusCounts} />
          </Card>
        </div>
      </div>

      {/* Expenses chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Monthly Expenses</h2>
            <ExpensesChart data={(monthlyExpenses ?? []).slice().reverse()} />
          </Card>
        </div>
        <div>
          <Card className="p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-700">Recent Expenses</h2>
              <Link href="/expenses" className="text-xs text-[#65a30d] hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-slate-100/60">
              {(recentExpenses ?? []).length === 0 ? (
                <p className="py-8 text-sm text-slate-400 text-center">No expenses yet</p>
              ) : (
                (recentExpenses ?? []).map((exp) => (
                  <Link
                    key={exp.id}
                    href={`/expenses/${exp.id}`}
                    className="flex items-center justify-between py-2.5 hover:opacity-80 transition"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{exp.title}</p>
                      <p className="text-xs text-slate-400 capitalize">{exp.category.replace(/_/g, ' ')}</p>
                    </div>
                    <p className="text-xs font-medium text-slate-700 ml-3 shrink-0">{formatCurrency(exp.total)}</p>
                  </Link>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Invoices */}
        <Card>
          <div className="px-5 py-4 border-b border-slate-100/60 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Recent Invoices</h2>
            <Link href="/invoices" className="text-xs text-[#65a30d] hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-slate-100/60">
            {(recentInvoices ?? []).length === 0 ? (
              <p className="px-5 py-8 text-sm text-slate-400 text-center">No invoices yet</p>
            ) : (
              (recentInvoices ?? []).map((inv) => (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-slate-50/60 transition"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{inv.invoice_number}</p>
                    <p className="text-xs text-slate-400">
                      {inv.companies?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    {invoiceStatusBadge(inv.status)}
                    <p className="text-xs text-slate-400 mt-1">{formatCurrency(inv.total)}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        {/* Activity Feed */}
        <Card>
          <div className="px-5 py-4 border-b border-slate-100/60">
            <h2 className="text-sm font-semibold text-slate-700">Recent Activity</h2>
          </div>
          <div className="divide-y divide-slate-100/60">
            {(recentActivity ?? []).length === 0 ? (
              <p className="px-5 py-8 text-sm text-slate-400 text-center">No activity yet</p>
            ) : (
              (recentActivity ?? []).map((activity) => (
                <div key={activity.id} className="px-5 py-3">
                  <p className="text-sm text-slate-700">
                    <span className="font-medium capitalize">{activity.action}</span>{' '}
                    <span className="text-slate-500">{activity.entity_label ?? activity.entity_type}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(activity.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
