import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variants = {
  primary: 'bg-[#84cc16] hover:bg-[#65a30d] text-[#1a2e05] shadow-sm shadow-lime-200/40 disabled:opacity-50',
  secondary: 'bg-slate-950 text-white hover:bg-slate-800 shadow-sm shadow-slate-900/10',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-200/40 disabled:opacity-50',
  ghost: 'bg-white text-slate-700 hover:bg-slate-50 border border-[rgba(15,23,42,0.12)]',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-5 py-2.5 text-sm rounded-xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition duration-150 ease-in-out cursor-pointer disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#84cc16] focus:ring-offset-2 focus:ring-offset-white',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}
