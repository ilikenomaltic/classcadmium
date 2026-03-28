'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  BookOpenIcon as BookOpenIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
  AcademicCapIcon as AcademicCapIconSolid,
} from '@heroicons/react/24/solid'

interface NavItem {
  href: string
  label: string
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  IconActive: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: '홈',   Icon: HomeIcon,                 IconActive: HomeIconSolid },
  { href: '/study',     label: '학습', Icon: BookOpenIcon,              IconActive: BookOpenIconSolid },
  { href: '/quiz',      label: '퀴즈', Icon: ClipboardDocumentListIcon, IconActive: ClipboardDocumentListIconSolid },
  { href: '/classes',   label: '내 반', Icon: AcademicCapIcon,          IconActive: AcademicCapIconSolid },
  { href: '/settings',  label: '설정', Icon: Cog6ToothIcon,             IconActive: Cog6ToothIconSolid },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Student navigation"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-1px_8px_rgba(0,0,0,0.06)]"
    >
      <ul className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ href, label, Icon, IconActive }) => {
          const isActive = pathname === href
          const ActiveIcon = isActive ? IconActive : Icon

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={[
                  'flex flex-col items-center justify-center gap-0.5 min-h-[48px] min-w-[48px] w-full',
                  'text-xs font-medium transition-colors duration-150',
                  isActive ? 'text-indigo-600' : 'text-gray-400',
                ].join(' ')}
                aria-current={isActive ? 'page' : undefined}
              >
                <ActiveIcon className="w-6 h-6" aria-hidden="true" />
                <span>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
