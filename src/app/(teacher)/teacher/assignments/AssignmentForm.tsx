'use client'

import { useActionState, useState } from 'react'
import { motion } from 'framer-motion'
import { scaleOnTap } from '@/lib/constants/animation'
import { createAssignment } from '../actions'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

interface QuizSet { id: string; title: string }
interface ClassItem { id: string; name: string }

const MODES = [
  { value: 'flashcard', label: '플래시카드' },
  { value: 'ox', label: 'OX 퀴즈' },
  { value: 'blank', label: '빈칸 채우기' },
  { value: 'multiple', label: '4지선다' },
  { value: 'element', label: '원소 퀴즈' },
]

const DIFFICULTIES = [
  { value: 'easy', label: '쉬움' },
  { value: 'normal', label: '보통' },
  { value: 'hard', label: '어려움' },
]

export default function AssignmentForm({
  quizSets,
  classes,
  defaultSetId,
}: {
  quizSets: QuizSet[]
  classes: ClassItem[]
  defaultSetId?: string
}) {
  const [state, formAction, pending] = useActionState(createAssignment, null)
  const [open, setOpen] = useState(!!defaultSetId)

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900">+ 새 배정 만들기</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }}>
          <ChevronDownIcon className="w-4 h-4 text-gray-400" />
        </motion.div>
      </button>

      {open && (
        <form action={formAction} className="px-6 pb-6 space-y-4 border-t border-gray-100 pt-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">퀴즈 세트</label>
            <select name="quiz_set_id" required defaultValue={defaultSetId ?? ''}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="" disabled>선택하세요</option>
              {quizSets.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">반</label>
            <select name="class_id" required
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="" disabled>선택하세요</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">마감일</label>
              <input type="date" name="due_date"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">모드</label>
              <select name="mode" required defaultValue="flashcard"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                {MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">난이도</label>
            <select name="difficulty" required defaultValue="normal"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
              {DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>

          {state?.error && <p className="text-[#FF6B6B] text-sm">{state.error}</p>}

          <motion.button
            {...scaleOnTap}
            type="submit"
            disabled={pending}
            className="w-full py-3 rounded-full bg-indigo-600 text-white font-semibold text-sm disabled:opacity-60"
          >
            {pending ? '배정 중...' : '배정하기'}
          </motion.button>
        </form>
      )}
    </div>
  )
}
