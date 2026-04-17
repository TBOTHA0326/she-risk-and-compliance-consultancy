import { LoadingSpinner } from '@/components/ui/Card'

interface LoadingPageProps {
  message?: string
}

export function LoadingPage({ message = 'Loading...' }: LoadingPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f1f5] px-6 py-20">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-10 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_6px_20px_rgba(15,23,42,0.06)]">
        <LoadingSpinner />
        <p className="text-sm text-slate-500">{message}</p>
      </div>
    </div>
  )
}
