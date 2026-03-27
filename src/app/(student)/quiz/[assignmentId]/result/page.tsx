'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { staggerContainer, fadeInUp, scaleOnTap } from '@/lib/constants/animation'

function QuizResult() {
  const sp = useSearchParams()

  const score = Number(sp.get('score') ?? 0)
  const total = Number(sp.get('total') ?? 0)
  const correct = Number(sp.get('correct') ?? 0)

  const ringColor =
    score >= 80 ? '#4ECDC4' :
    score >= 50 ? '#6366F1' :
    '#FF6B6B'

  const message =
    score >= 80 ? '훌륭해요! 🎉' :
    score >= 50 ? '잘 했어요! 조금만 더!' :
    '다시 도전해보세요 💪'

  const circumference = 2 * Math.PI * 54
  const dashOffset = circumference * (1 - score / 100)

  return (
    <div className="py-6">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={fadeInUp} className="flex flex-col items-center py-8">
          <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="#F3F4F6" strokeWidth="10" />
              <motion.circle
                cx="60" cy="60" r="54"
                fill="none"
                stroke={ringColor}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-gray-900">{score}</span>
              <span className="text-xs text-gray-400">점</span>
            </div>
          </div>
          <p className="mt-4 text-xl font-bold text-gray-900">{message}</p>
          <p className="text-sm text-gray-500 mt-1">{total}문제 중 {correct}개 정답</p>
        </motion.div>

        <motion.div variants={fadeInUp} className="grid grid-cols-3 gap-3">
          {[
            { label: '총 문제', value: total, color: 'text-gray-900' },
            { label: '정답', value: correct, color: 'text-[#4ECDC4]' },
            { label: '오답', value: total - correct, color: 'text-[#FF6B6B]' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl shadow-sm p-4 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        <motion.div variants={fadeInUp} className="space-y-3">
          <Link href="/quiz">
            <motion.div
              {...scaleOnTap}
              className="block w-full py-4 rounded-full bg-indigo-600 text-white font-semibold text-sm text-center"
            >
              퀴즈 목록으로
            </motion.div>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default function QuizResultPage() {
  return (
    <Suspense fallback={<div className="py-6"><div className="h-36 w-36 mx-auto bg-gray-100 rounded-full animate-pulse" /></div>}>
      <QuizResult />
    </Suspense>
  )
}
