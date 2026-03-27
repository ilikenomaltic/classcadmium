'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { staggerContainer, fadeInUp } from '@/lib/constants/animation'

interface Assignment {
  id: string
  due_date: string | null
  mode: string
  class_id: string
  quiz_sets: { title: string } | null
}

function DdayBadge({ due }: { due: string | null }) {
  if (!due) return null
  // eslint-disable-next-line react-hooks/purity
  const diff = Math.ceil((new Date(due).getTime() - Date.now()) / 86400000)
  const label = diff === 0 ? '오늘' : diff < 0 ? `D+${Math.abs(diff)}` : `D-${diff}`
  const cls =
    diff <= 0 ? 'bg-red-100 text-red-600' :
    diff <= 3 ? 'bg-yellow-100 text-yellow-700' :
    'bg-gray-100 text-gray-500'
  return <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cls}`}>{label}</span>
}

const MODE_LABELS: Record<string, string> = {
  flashcard: '플래시카드',
  ox: 'OX 퀴즈',
  blank: '빈칸 채우기',
}

export default function QuizListPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: memberships } = await supabase
        .from('class_members').select('class_id').eq('student_id', user.id)
      const classIds = memberships?.map(m => m.class_id) ?? []

      if (classIds.length === 0) { setLoading(false); return }

      const [{ data: assigns }, { data: results }] = await Promise.all([
        supabase.from('quiz_assignments')
          .select('id, due_date, mode, class_id, quiz_sets(title)')
          .in('class_id', classIds)
          .order('due_date', { ascending: true, nullsFirst: false }),
        supabase.from('quiz_results').select('assignment_id').eq('student_id', user.id),
      ])

      setAssignments((assigns as unknown as Assignment[]) ?? [])
      setCompletedIds(new Set(results?.map(r => r.assignment_id).filter(Boolean) as string[]))
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">퀴즈</h1>
        <p className="text-gray-500 text-sm mt-1">배정된 퀴즈를 확인하세요</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">📋</p>
          <p className="text-gray-500">배정된 퀴즈가 없습니다.</p>
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
          {assignments.map(a => {
            const done = completedIds.has(a.id)
            return (
              <motion.div key={a.id} variants={fadeInUp}>
                <Link
                  href={done ? `/quiz/${a.id}/result` : `/quiz/${a.id}`}
                  className="block bg-white rounded-2xl shadow-md p-4 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {a.quiz_sets?.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{MODE_LABELS[a.mode]}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <DdayBadge due={a.due_date} />
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        done ? 'bg-[#4ECDC4]/20 text-[#4ECDC4]' : 'bg-[#FF6B6B]/20 text-[#FF6B6B]'
                      }`}>
                        {done ? '완료' : '미완료'}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
