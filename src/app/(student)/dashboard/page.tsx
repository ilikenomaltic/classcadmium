'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import DashboardCard from '@/components/ui/DashboardCard'
import { staggerContainer, fadeInUp } from '@/lib/constants/animation'
import { BookOpenIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/solid'

interface ClassInfo {
  class_id: string
  classes: { name: string } | null
}

export default function StudentDashboard() {
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [name, setName] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('name').eq('id', user.id).single()
        .then(({ data }) => { if (data) setName(data.name) })
      supabase.from('class_members')
        .select('class_id, classes(name)')
        .eq('student_id', user.id)
        .then(({ data }) => { if (data) setClasses(data as unknown as ClassInfo[]) })
    })
  }, [])

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {name ? `안녕하세요, ${name}님! 👋` : '안녕하세요! 👋'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">오늘도 화학 공부 시작해볼까요?</p>
      </div>

      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
        <motion.div variants={fadeInUp} className="grid grid-cols-2 gap-4">
          <DashboardCard
            href="/study"
            title="학습하기"
            description="플래시카드로 원소 암기"
            icon={<BookOpenIcon className="w-6 h-6" />}
            accentColor="bg-indigo-500"
          />
          <DashboardCard
            href="/quiz"
            title="퀴즈"
            description="배정된 퀴즈 풀기"
            icon={<ClipboardDocumentListIcon className="w-6 h-6" />}
            accentColor="bg-teal-400"
          />
        </motion.div>

        {classes.length > 0 && (
          <motion.div variants={fadeInUp}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">내 반</h2>
              <Link href="/classes" className="text-xs text-indigo-600 font-medium">전체 보기 →</Link>
            </div>
            <div className="space-y-2">
              {classes.slice(0, 3).map(({ class_id, classes: cls }) => (
                <div key={class_id} className="bg-white rounded-xl px-4 py-3 shadow-sm flex items-center">
                  <span className="text-gray-800 font-medium text-sm">{cls?.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
