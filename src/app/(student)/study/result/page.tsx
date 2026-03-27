'use client'

import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { staggerContainer, fadeInUp, scaleOnTap } from '@/lib/constants/animation'

function StudyResult() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const known = parseInt(searchParams.get('known') ?? '0')
  const total = parseInt(searchParams.get('total') ?? '0')
  const unknownIds = searchParams.get('unknownIds') ?? ''
  const unknownCount = total - known
  const percentage = total > 0 ? Math.round((known / total) * 100) : 0

  const scoreColor =
    percentage >= 80 ? '#4ECDC4' : percentage >= 50 ? '#6366F1' : '#FF6B6B'

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">학습 결과</h1>

      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={fadeInUp} className="flex flex-col items-center">
          <div
            className="w-36 h-36 rounded-full flex flex-col items-center justify-center border-8 mb-4"
            style={{ borderColor: scoreColor }}
          >
            <span className="text-4xl font-bold" style={{ color: scoreColor }}>{percentage}%</span>
            <span className="text-sm text-gray-500">{known}/{total}</span>
          </div>
          <p className="text-gray-600 font-medium">
            {percentage >= 80 ? '훌륭해요! 🎉' : percentage >= 50 ? '잘 하고 있어요 👍' : '조금 더 연습해봐요 💪'}
          </p>
        </motion.div>

        <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-3">
          <div className="bg-[#4ECDC4]/10 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-[#4ECDC4]">{known}</p>
            <p className="text-sm text-gray-500 mt-1">알아요 ✓</p>
          </div>
          <div className="bg-[#FF6B6B]/10 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-[#FF6B6B]">{unknownCount}</p>
            <p className="text-sm text-gray-500 mt-1">모르겠어요 ✗</p>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} className="flex flex-col gap-3">
          {unknownCount > 0 && unknownIds && (
            <motion.button
              {...scaleOnTap}
              onClick={() => router.push(`/study/session?ids=${unknownIds}`)}
              className="w-full py-4 rounded-full bg-[#FF6B6B] text-white font-semibold"
            >
              틀린 카드만 다시 ({unknownCount}개)
            </motion.button>
          )}
          <motion.button
            {...scaleOnTap}
            onClick={() => router.push('/study')}
            className="w-full py-4 rounded-full border-2 border-indigo-600 text-indigo-600 font-semibold"
          >
            처음부터 다시
          </motion.button>
          <motion.button
            {...scaleOnTap}
            onClick={() => router.push('/dashboard')}
            className="w-full py-3 rounded-full text-gray-400 font-medium"
          >
            홈으로
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default function StudyResultPage() {
  return (
    <Suspense fallback={<div className="py-6"><div className="h-36 w-36 mx-auto bg-gray-100 rounded-full animate-pulse" /></div>}>
      <StudyResult />
    </Suspense>
  )
}
