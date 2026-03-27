'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import CategoryChip from '@/components/student/CategoryChip'
import { scaleOnTap, staggerContainer, fadeInUp } from '@/lib/constants/animation'
import type { Category } from '@/lib/types'

const COUNT_OPTIONS = [
  { label: '5개', value: 5 },
  { label: '10개', value: 10 },
  { label: '20개', value: 20 },
  { label: '전체', value: 0 },
]

export default function StudyPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [count, setCount] = useState<number>(10)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('categories').select('id, name').then(({ data }) => {
      if (data) setCategories(data)
      setLoading(false)
    })
  }, [])

  function toggleCategory(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  function handleStart() {
    if (selectedIds.size === 0) return
    const cats = Array.from(selectedIds).join(',')
    router.push(`/study/session?cats=${cats}&count=${count}`)
  }

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">학습하기</h1>
        <p className="text-gray-500 text-sm mt-1">카테고리와 개수를 선택하세요</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 bg-gray-100 rounded-full animate-pulse" />
          ))}
        </div>
      ) : (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
          {/* Category selection */}
          <motion.div variants={fadeInUp}>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">카테고리 선택</h2>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <CategoryChip
                  key={cat.id}
                  label={cat.name}
                  selected={selectedIds.has(cat.id)}
                  onToggle={() => toggleCategory(cat.id)}
                />
              ))}
            </div>
          </motion.div>

          {/* Count selection */}
          <motion.div variants={fadeInUp}>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">개수 선택</h2>
            <div className="flex gap-2">
              {COUNT_OPTIONS.map(opt => (
                <motion.button
                  key={opt.value}
                  {...scaleOnTap}
                  onClick={() => setCount(opt.value)}
                  className={[
                    'flex-1 py-2.5 rounded-full border-2 text-sm font-medium transition-colors duration-150',
                    count === opt.value
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-gray-200 text-gray-600',
                  ].join(' ')}
                >
                  {opt.label}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Start button */}
          <motion.div variants={fadeInUp}>
            <motion.button
              {...scaleOnTap}
              onClick={handleStart}
              disabled={selectedIds.size === 0}
              className="w-full py-4 rounded-full bg-indigo-600 text-white font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {selectedIds.size === 0 ? '카테고리를 선택하세요' : `학습 시작 →`}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
