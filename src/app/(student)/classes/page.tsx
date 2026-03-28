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

interface RankEntry {
  student_id: string
  name: string
  points: number
}

interface ClassRanking {
  classId: string
  entries: RankEntry[]
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [rankings, setRankings] = useState<ClassRanking[]>([])
  const [myId, setMyId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  async function fetchClasses() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setMyId(user.id)

    const { data } = await supabase
      .from('class_members')
      .select('class_id, classes(id, name, invite_code)')
      .eq('student_id', user.id)
    const classData = (data as unknown as ClassInfo[]) ?? []
    setClasses(classData)

    // 각 반의 랭킹 로드
    const rankingResults = await Promise.all(
      classData.map(async ({ class_id }) => {
        const { data: members } = await supabase
          .from('class_members')
          .select('student_id, profiles(name, points)')
          .eq('class_id', class_id)

        type MemberRow = { student_id: string; profiles: { name: string; points: number } | null }
        const entries: RankEntry[] = ((members ?? []) as unknown as MemberRow[])
          .filter(m => m.profiles)
          .map(m => ({
            student_id: m.student_id,
            name: m.profiles!.name,
            points: m.profiles!.points,
          }))
          .sort((a, b) => b.points - a.points)

        return { classId: class_id, entries }
      })
    )
    setRankings(rankingResults)
    setLoading(false)
  }

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
          <motion.button {...scaleOnTap} onClick={() => setModalOpen(true)} className="text-indigo-600 font-medium">
            반 참여하기 →
          </motion.button>
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
          {classes.map(({ class_id, classes: cls }) => {
            const ranking = rankings.find(r => r.classId === class_id)
            return (
              <motion.div key={class_id} variants={fadeInUp} className="space-y-3">
                {/* 반 카드 */}
                <div className="bg-white rounded-2xl shadow-md p-4 flex items-center justify-between">
                  <p className="font-semibold text-gray-900">{cls?.name}</p>
                  <span className="text-xs text-indigo-500 font-mono bg-indigo-50 px-2 py-1 rounded-lg">
                    {cls?.invite_code}
                  </span>
                </div>

                {/* 랭킹 */}
                {ranking && ranking.entries.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">🏆 반 내 랭킹</p>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {ranking.entries.slice(0, 5).map((entry, idx) => (
                        <div
                          key={entry.student_id}
                          className={`flex items-center gap-3 px-4 py-3 ${entry.student_id === myId ? 'bg-indigo-50' : ''}`}
                        >
                          <span className={`w-6 text-center text-sm font-bold ${
                            idx === 0 ? 'text-yellow-500' :
                            idx === 1 ? 'text-gray-400' :
                            idx === 2 ? 'text-amber-600' :
                            'text-gray-400'
                          }`}>
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`}
                          </span>
                          <span className={`flex-1 text-sm ${entry.student_id === myId ? 'font-bold text-indigo-700' : 'text-gray-700'}`}>
                            {entry.name} {entry.student_id === myId && '(나)'}
                          </span>
                          <span className="text-sm font-semibold text-gray-500">{entry.points.toLocaleString()} pt</span>
                        </div>
                      ))}
                      {/* 내 순위가 5위 밖인 경우 */}
                      {(() => {
                        const myRank = ranking.entries.findIndex(e => e.student_id === myId)
                        if (myRank >= 5) {
                          return (
                            <>
                              <div className="px-4 py-1 text-center text-xs text-gray-400">···</div>
                              <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50">
                                <span className="w-6 text-center text-sm font-bold text-gray-400">{myRank + 1}</span>
                                <span className="flex-1 text-sm font-bold text-indigo-700">{ranking.entries[myRank].name} (나)</span>
                                <span className="text-sm font-semibold text-gray-500">{ranking.entries[myRank].points.toLocaleString()} pt</span>
                              </div>
                            </>
                          )
                        }
                        return null
                      })()}
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </motion.div>
      )}

      <JoinClassModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onJoined={fetchClasses} />
    </div>
  )
}
