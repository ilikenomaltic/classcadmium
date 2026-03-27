'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { BeakerIcon } from '@heroicons/react/24/solid'
import { signIn } from './actions'
import { motion } from 'framer-motion'
import { scaleOnTap } from '@/lib/constants/animation'

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, null)

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-3">
            <BeakerIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Classcadmium</h1>
          <p className="text-gray-500 text-sm mt-1">화학 암기, 더 쉽게</p>
        </div>

        <form action={formAction} className="bg-white rounded-2xl shadow-md p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 text-center">로그인</h2>

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
              id="password" name="password" type="password" required
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
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
            {pending ? '로그인 중...' : '로그인'}
          </motion.button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          계정이 없으신가요?{' '}
          <Link href="/signup" className="text-indigo-600 font-medium hover:underline">회원가입</Link>
        </p>
      </div>
    </div>
  )
}
