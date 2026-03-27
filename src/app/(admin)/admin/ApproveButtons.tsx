'use client'

import { useTransition } from 'react'
import { approveTeacher, rejectTeacher } from './actions'

export default function ApproveButtons({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex gap-2">
      <button
        onClick={() => startTransition(async () => { await approveTeacher(userId) })}
        disabled={isPending}
        className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold disabled:opacity-50 hover:bg-indigo-700 transition-colors"
      >
        승인
      </button>
      <button
        onClick={() => startTransition(async () => { await rejectTeacher(userId) })}
        disabled={isPending}
        className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold disabled:opacity-50 hover:bg-gray-200 transition-colors"
      >
        거절
      </button>
    </div>
  )
}
