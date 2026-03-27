'use client'

import { useState, useTransition } from 'react'
import { updateUserRole } from './actions'

const ROLE_LABELS = { student: '학생', teacher: '선생님', admin: '관리자' }
const ROLE_COLORS = {
  student: 'bg-gray-100 text-gray-600',
  teacher: 'bg-indigo-100 text-indigo-700',
  admin: 'bg-red-100 text-red-700',
}

export default function RoleSelect({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [role, setRole] = useState(currentRole)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleChange(newRole: string) {
    if (newRole === role) return
    startTransition(async () => {
      const result = await updateUserRole(userId, newRole as 'student' | 'teacher' | 'admin')
      if (result.error) {
        setError(result.error)
      } else {
        setRole(newRole)
        setError(null)
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-500">{error}</span>}
      <select
        value={role}
        onChange={e => handleChange(e.target.value)}
        disabled={isPending}
        className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 cursor-pointer disabled:opacity-50 ${ROLE_COLORS[role as keyof typeof ROLE_COLORS] ?? 'bg-gray-100 text-gray-600'}`}
      >
        {Object.entries(ROLE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      {isPending && <span className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin inline-block" />}
    </div>
  )
}
