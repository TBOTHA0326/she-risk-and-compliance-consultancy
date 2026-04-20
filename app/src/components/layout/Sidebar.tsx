'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Building2,
  FileText,
  Quote,
  FolderOpen,
  ShieldCheck,
  MapPin,
  LogOut,
  HardHat,
  Menu,
  X,
  Receipt,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/companies', label: 'Companies', icon: Building2 },
  { href: '/trips', label: 'Trips/Calander', icon: MapPin },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/quotes', label: 'Quotes', icon: Quote },
  { href: '/expenses', label: 'Expenses', icon: Receipt },
  { href: '/documents', label: 'Documents', icon: FolderOpen },
  { href: '/safety-files', label: 'Safety Files', icon: ShieldCheck },
]

interface NavContentProps {
  pathname: string
  closeDrawer: () => void
  onLogout: () => Promise<void>
}

function NavContent({ pathname, closeDrawer, onLogout }: NavContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#a3e635] flex items-center justify-center shrink-0">
            <HardHat className="w-4 h-4 text-[#1a2e05]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">SHE Risk</p>
            <p className="text-[11px] text-[#4b5563] leading-tight mt-0.5">Compliance System</p>
          </div>
        </div>
      </div>

      {/* Nav label */}
      <div className="px-5 mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#374151]">Navigation</p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeDrawer}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative',
                active
                  ? 'bg-[rgba(163,230,53,0.09)] text-white border-l-[3px] border-[#a3e635] pl-[9px]'
                  : 'text-[#6b7280] hover:bg-[rgba(255,255,255,0.04)] hover:text-[#d1d5db] border-l-[3px] border-transparent pl-[9px]'
              )}
            >
              <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-[#a3e635]' : 'text-[#6b7280]')} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-5">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-[#6b7280] text-sm font-medium hover:bg-[rgba(255,255,255,0.04)] hover:text-[#d1d5db] transition-all duration-150 border-l-[3px] border-transparent pl-[9px]"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign out
        </button>
      </div>
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-[#0c0d14] shrink-0">
        <NavContent pathname={pathname} closeDrawer={() => setMobileOpen(false)} onLogout={handleLogout} />
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0c0d14] border-b border-[rgba(255,255,255,0.05)] px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#a3e635] flex items-center justify-center">
              <HardHat className="w-4 h-4 text-[#1a2e05]" />
            </div>
            <span className="text-sm font-semibold text-white">SHE Risk</span>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-slate-300 hover:text-white">
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#0c0d14] shadow-2xl">
            <NavContent pathname={pathname} closeDrawer={() => setMobileOpen(false)} onLogout={handleLogout} />
          </aside>
        </div>
      )}
    </>
  )
}
