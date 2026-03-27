'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { useState } from 'react'
import { BeakerIcon } from '@heroicons/react/24/solid'
import { signUp } from './actions'
import { motion } from 'framer-motion'
import { scaleOnTap } from '@/lib/constants/animation'

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signUp, null)
  const [role, setRole] = useState<'student' | 'teacher'>('student')

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-3">
            <BeakerIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Classcadmium</h1>
          <p className="text-gray-500 text-sm mt-1">화학 암기, 더 쉽게</p>
        </div>

        <form action={formAction} className="bg-white rounded-2xl shadow-md p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 text-center">회원가입</h2>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">이름</label>
            <input
              id="name" name="name" type="text" required
              placeholder="홍길동"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input
              id="email" name="email" type="email" required
              placeholder="example@school.kr"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
            <input
              id="password" name="password" type="password" required minLength={6}
              placeholder="6자 이상"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">역할</label>
            <div className="flex gap-3">
              {(['student', 'teacher'] as const).map((r) => (
                <motion.button
                  key={r}
                  type="button"
                  {...scaleOnTap}
                  onClick={() => setRole(r)}
                  className={[
                    'flex-1 py-3 rounded-full border-2 text-sm font-semibold transition-colors duration-150',
                    role === r
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 text-gray-500',
                  ].join(' ')}
                >
                  {r === 'student' ? '🎓 학생' : '👩‍🏫 선생님'}
                </motion.button>
              ))}
            </div>
            <input type="hidden" name="role" value={role} />
          </div>

          {state?.error && (
            <p className="text-[#FF6B6B] text-sm text-center">{state.error}</p>
          )}

          <motion.button
            {...scaleOnTap}
            type="submit"
            disabled={pending}
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-full disabled:opacity-60 text-sm"
          >
            {pending ? '가입 중...' : '가입하기'}
          </motion.button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-indigo-600 font-medium hover:underline">로그인</Link>
        </p>
      </div>
    </div>
  )
}
