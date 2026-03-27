'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BeakerIcon } from '@heroicons/react/24/solid'
import {
  Squares2X2Icon,
  DocumentPlusIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'

interface NavLink {
  href: string
  label: string
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const navLinks: NavLink[] = [
  { href: '/teacher/classes',     label: '반 관리', Icon: Squares2X2Icon },
  { href: '/teacher/create',      label: '출제',    Icon: DocumentPlusIcon },
  { href: '/teacher/assignments', label: '배정 목록', Icon: ClipboardDocumentListIcon },
  { href: '/teacher/results',     label: '결과',    Icon: ChartBarIcon },
]

export default function TeacherHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/teacher/dashboard"
            className="flex items-center gap-2 text-indigo-600 font-bold text-lg"
          >
            <BeakerIcon className="w-6 h-6" aria-hidden="true" />
            <span className="hidden sm:inline">Classcadmium</span>
          </Link>

          <nav aria-label="Teacher navigation">
            <ul className="flex items-center gap-1">
              {navLinks.map(({ href, label, Icon }) => {
                const isActive = pathname.startsWith(href)
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      className={[
                        'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium',
                        'transition-colors duration-150 min-h-[44px]',
                        isActive
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800',
                      ].join(' ')}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                      <span className="hidden sm:inline">{label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  )
}
