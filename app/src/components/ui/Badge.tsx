import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  className?: string
}

const variants = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-teal-50 text-teal-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-rose-50 text-rose-700',
  info: 'bg-blue-50 text-blue-600',
  neutral: 'bg-gray-100 text-gray-500',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}

export function invoiceStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    draft: { label: 'Draft', variant: 'neutral' },
    sent: { label: 'Sent', variant: 'info' },
    paid: { label: 'Paid', variant: 'success' },
    overdue: { label: 'Overdue', variant: 'danger' },
    cancelled: { label: 'Cancelled', variant: 'neutral' },
  }
  const { label, variant } = map[status] ?? { label: status, variant: 'default' }
  return <Badge variant={variant}>{label}</Badge>
}

export function quoteStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    draft: { label: 'Draft', variant: 'neutral' },
    sent: { label: 'Sent', variant: 'info' },
    accepted: { label: 'Accepted', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'danger' },
    expired: { label: 'Expired', variant: 'warning' },
  }
  const { label, variant } = map[status] ?? { label: status, variant: 'default' }
  return <Badge variant={variant}>{label}</Badge>
}

export function safetyFileStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    pending: { label: 'Pending', variant: 'neutral' },
    in_progress: { label: 'In Progress', variant: 'info' },
    under_review: { label: 'Under Review', variant: 'warning' },
    completed: { label: 'Completed', variant: 'success' },
    expired: { label: 'Expired', variant: 'danger' },
  }
  const { label, variant } = map[status] ?? { label: status, variant: 'default' }
  return <Badge variant={variant}>{label}</Badge>
}

export function companyStatusBadge(status: string) {
  return (
    <Badge variant={status === 'active' ? 'success' : 'neutral'}>
      {status === 'active' ? 'Active' : 'Inactive'}
    </Badge>
  )
}
