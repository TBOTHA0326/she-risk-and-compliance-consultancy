import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn('bg-white rounded-2xl shadow-sm', className)}>
      {children}
    </div>
  )
}

interface KpiCardProps {
  title: string
  value: string | number
  sub?: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  highlight?: 'default' | 'danger' | 'warning' | 'success'
}

const highlights = {
  default: 'bg-white',
  danger: 'bg-rose-50',
  warning: 'bg-amber-50',
  success: 'bg-teal-50',
}

export function KpiCard({ title, value, sub, icon, highlight = 'default' }: KpiCardProps) {
  return (
    <div className={cn('rounded-2xl shadow-sm p-5 flex items-start gap-4', highlights[highlight])}>
      <div className="shrink-0 w-10 h-10 bg-white/80 rounded-xl flex items-center justify-center shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0 flex flex-wrap gap-2">{action}</div>}
    </div>
  )
}

export function EmptyState({ message, icon }: { message: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-3 text-gray-300">{icon}</div>}
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  )
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
      {message}
    </div>
  )
}
