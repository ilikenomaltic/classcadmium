'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { scaleOnTap } from '@/lib/constants/animation'
import { createClass } from '../actions'

export default function NewClassPage() {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(createClass, null)

  return (
    <div className="max-w-md">
      <div className="mb-8">
        <button onClick={() => router.back()} className="text-gray-400 text-sm mb-4 flex items-center gap-1">
          ← 돌아가기
        </button>
        <h1 className="text-3xl font-bold text-gray-900">새 반 만들기</h1>
        <p className="text-gray-500 mt-1">반 이름을 입력하면 초대코드가 자동 생성됩니다.</p>
      </div>

      <form action={formAction} className="bg-white rounded-2xl shadow-md p-6 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">반 이름</label>
          <input
            id="name" name="name" type="text" required
            placeholder="예: 2학년 3반 화학"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {state?.error && <p className="text-[#FF6B6B] text-sm">{state.error}</p>}

        <motion.button
          {...scaleOnTap}
          type="submit"
          disabled={pending}
          className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-full disabled:opacity-60"
        >
          {pending ? '생성 중...' : '반 만들기'}
        </motion.button>
      </form>
    </div>
  )
}
