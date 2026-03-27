'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import JoinClassModal from '@/components/student/JoinClassModal'
import { motion } from 'framer-motion'
import { scaleOnTap, staggerContainer, fadeInUp } from '@/lib/constants/animation'
import { PlusIcon } from '@heroicons/react/24/outline'

interface ClassInfo {
  class_id: string
  classes: { id: string; name: string; invite_code: string } | null
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  async function fetchClasses() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('class_members')
      .select('class_id, classes(id, name, invite_code)')
      .eq('student_id', user.id)
    setClasses((data as unknown as ClassInfo[]) ?? [])
    setLoading(false)
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchClasses() }, [])

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">내 반</h1>
          <p className="text-gray-500 text-sm mt-1">참여한 반 목록</p>
        </div>
        <motion.button
          {...scaleOnTap}
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-full text-sm font-medium"
        >
          <PlusIcon className="w-4 h-4" />
          반 참여
        </motion.button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : classes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🏫</p>
          <p className="text-gray-500 mb-2">아직 참여한 반이 없어요.</p>
          <motion.button
            {...scaleOnTap}
            onClick={() => setModalOpen(true)}
            className="text-indigo-600 font-medium"
          >
            반 참여하기 →
          </motion.button>
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-3">
          {classes.map(({ class_id, classes: cls }) => (
            <motion.div
              key={class_id}
              variants={fadeInUp}
              className="bg-white rounded-2xl shadow-md p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-semibold text-gray-900">{cls?.name}</p>
              </div>
              <span className="text-xs text-indigo-500 font-mono bg-indigo-50 px-2 py-1 rounded-lg">
                {cls?.invite_code}
              </span>
            </motion.div>
          ))}
        </motion.div>
      )}

      <JoinClassModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onJoined={fetchClasses}
      />
    </div>
  )
}
