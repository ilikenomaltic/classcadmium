'use client'

import { motion } from 'framer-motion'
import DashboardCard from '@/components/ui/DashboardCard'
import { staggerContainer, fadeInUp } from '@/lib/constants/animation'
import { BookOpenIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/solid'

export default function StudentDashboard() {
  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">안녕하세요! 👋</h1>
        <p className="text-gray-500 text-sm mt-1">오늘도 화학 공부 시작해볼까요?</p>
      </div>

      <motion.div
        className="grid grid-cols-2 gap-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeInUp}>
          <DashboardCard
            href="/study"
            title="학습하기"
            description="플래시카드로 원소 암기"
            icon={<BookOpenIcon className="w-6 h-6" />}
            accentColor="bg-indigo-500"
          />
        </motion.div>

        <motion.div variants={fadeInUp}>
          <DashboardCard
            href="/quiz"
            title="퀴즈"
            description="내 실력을 테스트해보자"
            icon={<ClipboardDocumentListIcon className="w-6 h-6" />}
            accentColor="bg-teal-400"
          />
        </motion.div>
      </motion.div>
    </div>
  )
}
