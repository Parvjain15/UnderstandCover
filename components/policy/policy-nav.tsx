'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface PolicyNavProps {
  policyId: string
}

const navItems = [
  { href: '', label: 'Overview' },
  { href: '/coverage', label: 'Coverage' },
  { href: '/ask', label: 'Ask a Question' },
  { href: '/report', label: 'Report' },
]

export function PolicyNav({ policyId }: PolicyNavProps) {
  const pathname = usePathname()
  const base = `/policies/${policyId}`

  return (
    <nav className="flex gap-1 bg-white border-b border-slate-200 px-4 overflow-x-auto">
      {navItems.map((item) => {
        const href = base + item.href
        const isActive = item.href === '' ? pathname === base : pathname.startsWith(href)
        return (
          <Link
            key={item.href}
            href={href}
            className={cn(
              'px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors',
              isActive
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
