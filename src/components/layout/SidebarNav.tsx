'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Clients', href: '/dashboard/clients' },
]

export default function SidebarNav({ alertCount }: { alertCount: number }) {
  const pathname = usePathname()
  const isAlertsActive = pathname.startsWith('/dashboard/alerts')

  return (
    <nav className="space-y-1">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 mb-2">
        Menu
      </p>
      {navItems.map((item) => {
        const isActive =
          item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive
                ? 'bg-sky-100 text-sky-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
      <Link
        href="/dashboard/alerts"
        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
          isAlertsActive
            ? 'bg-sky-100 text-sky-700 font-medium'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <span>Alerts</span>
        {alertCount > 0 && (
          <span className="ml-auto inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {alertCount > 99 ? '99+' : alertCount}
          </span>
        )}
      </Link>
    </nav>
  )
}
