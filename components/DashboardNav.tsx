'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const navItems = [
  { href: '/dashboard',              label: 'Dashboard',    icon: '🏠' },
  { href: '/dashboard/tailor',       label: 'AppliMatic ✨',   icon: '✨' },
  { href: '/dashboard/applications', label: 'Applications', icon: '📋' },
  { href: '/dashboard/resume',       label: 'My Resume',    icon: '📄' },
  { href: '/dashboard/profile',      label: 'Profile',      icon: '👤' },
]

export default function DashboardNav({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-100 flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
            <span className="text-white font-black text-sm">Ap</span>
          </div>
          <span className="text-lg font-black text-gray-900">Appli<span className="text-brand">matic</span></span>
        </Link>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-brand font-semibold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Upgrade CTA */}
      <div className="px-4 pb-2">
        <Link
          href="/dashboard/upgrade"
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-brand text-white text-sm font-semibold hover:bg-brandDark transition-colors"
        >
          ⚡ Upgrade plan
        </Link>
      </div>

      {/* User + Sign Out */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3 px-1">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-brand font-bold text-sm">
            {userEmail.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-gray-500 truncate">{userEmail}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
