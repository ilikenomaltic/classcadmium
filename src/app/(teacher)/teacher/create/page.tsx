'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { motion } from 'framer-motion'
import { scaleOnTap } from '@/lib/constants/animation'
import ItemPicker from '@/components/teacher/ItemPicker'
import { createQuizSet } from '../actions'

export default function CreateQuizPage() {
  const [state, formAction, pending] = useActionState(createQuizSet, null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  function toggleItem(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">퀴즈 세트 만들기</h1>
        <p className="text-gray-500 mt-1">문항을 선택하고 퀴즈 세트를 저장하세요.</p>
      </div>

      <form action={formAction} className="space-y-6">
        {/* Title */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">퀴즈 제목</label>
          <input
            id="title" name="title" type="text" required
            placeholder="예: 1학기 원소 총정리"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Item picker */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">문항 선택</h2>
            <span className="text-sm text-indigo-600 font-medium">{selectedIds.size}개 선택됨</span>
          </div>
          <ItemPicker selectedIds={selectedIds} onToggle={toggleItem} />
          {/* Hidden inputs for selected IDs */}
          {Array.from(selectedIds).map(id => (
            <input key={id} type="hidden" name="itemIds" value={id} />
          ))}
        </div>

        {state?.error && <p className="text-[#FF6B6B] text-sm">{state.error}</p>}

        <motion.button
          {...scaleOnTap}
          type="submit"
          disabled={pending || selectedIds.size === 0}
          className="w-full py-4 rounded-full bg-indigo-600 text-white font-semibold disabled:opacity-50"
        >
          {pending ? '저장 중...' : `퀴즈 세트 저장 후 배정하기 (${selectedIds.size}개)`}
        </motion.button>
      </form>
    </div>
  )
}
