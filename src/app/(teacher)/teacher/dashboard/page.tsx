'use client'

import { motion } from 'framer-motion'
import DashboardCard from '@/components/ui/DashboardCard'
import { staggerContainer, fadeInUp } from '@/lib/constants/animation'
import { Squares2X2Icon, DocumentPlusIcon } from '@heroicons/react/24/solid'

export default function TeacherDashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">선생님 대시보드</h1>
        <p className="text-gray-500 mt-2">반을 관리하고 퀴즈를 출제하세요.</p>
      </div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={fadeInUp}>
          <DashboardCard
            href="/teacher/classes"
            title="반 관리"
            description="학생을 초대하고 반을 구성하세요"
            icon={<Squares2X2Icon className="w-6 h-6" />}
            accentColor="bg-indigo-500"
          />
        </motion.div>

        <motion.div variants={fadeInUp}>
          <DashboardCard
            href="/teacher/create"
            title="출제"
            description="새로운 화학 퀴즈를 만들어보세요"
            icon={<DocumentPlusIcon className="w-6 h-6" />}
            accentColor="bg-violet-500"
          />
        </motion.div>
      </motion.div>
    </div>
  )
}
