'use client'

import { useTransition } from 'react'
import { deleteUser } from './actions'

export default function DeleteUserButton({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('정말 이 계정을 삭제하시겠습니까? 되돌릴 수 없습니다.')) return
    startTransition(async () => {
      const result = await deleteUser(userId)
      if (result.error) alert(result.error)
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-semibold disabled:opacity-50 hover:bg-red-100 transition-colors"
    >
      {isPending ? '삭제 중...' : '삭제'}
    </button>
  )
}
