'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import FlashCard from '@/components/student/FlashCard'
import { shuffle } from '@/lib/utils/shuffle'
import type { Item } from '@/lib/types'

export default function StudySessionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [cards, setCards] = useState<Item[]>([])
  const [index, setIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [known, setKnown] = useState<Item[]>([])
  const [unknown, setUnknown] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  const x = useMotionValue(0)
  const bgGreen = useTransform(x, [0, 80], [0, 1])
  const bgRed = useTransform(x, [-80, 0], [1, 0])

  useEffect(() => {
    async function loadCards() {
      const supabase = createClient()
      const idsParam = searchParams.get('ids')
      const catsParam = searchParams.get('cats')
      const countParam = parseInt(searchParams.get('count') ?? '0')

      let items: Item[] = []

      if (idsParam) {
        const ids = idsParam.split(',').filter(Boolean)
        const { data } = await supabase.from('items').select('*').in('id', ids)
        items = data ?? []
      } else if (catsParam) {
        const catIds = catsParam.split(',').filter(Boolean)
        const { data } = await supabase.from('items').select('*').in('category_id', catIds)
        items = data ?? []
      }

      const shuffled = shuffle(items)
      setCards(countParam > 0 ? shuffled.slice(0, countParam) : shuffled)
      setLoading(false)
    }
    loadCards()
  }, [searchParams])

  const handleAnswer = useCallback((isKnown: boolean) => {
    const card = cards[index]
    if (isKnown) {
      setKnown(prev => [...prev, card])
    } else {
      setUnknown(prev => [...prev, card])
    }
    setIsFlipped(false)

    if (index + 1 >= cards.length) {
      const knownCount = known.length + (isKnown ? 1 : 0)
      const unknownIds = [...unknown, ...(isKnown ? [] : [card])].map(c => c.id).join(',')
      router.push(`/study/result?known=${knownCount}&total=${cards.length}&unknownIds=${unknownIds}`)
    } else {
      setIndex(i => i + 1)
    }
  }, [cards, index, known, unknown, router])

  if (loading) {
    return (
      <div className="py-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-full h-[280px] bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-gray-500">카드가 없습니다.</p>
        <button onClick={() => router.back()} className="mt-4 text-indigo-600 font-medium">← 돌아가기</button>
      </div>
    )
  }

  const card = cards[index]
  const progress = (index / cards.length) * 100

  return (
    <div className="py-6">
      {/* Progress */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => router.push('/study')} className="text-gray-400 text-sm">✕ 종료</button>
        <span className="text-sm font-medium text-gray-500">{index + 1} / {cards.length}</span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-indigo-500 rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Card with swipe */}
      <AnimatePresence mode="wait">
        <motion.div
          key={card.id}
          style={{ x }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.3}
          onDragEnd={(_, info) => {
            if (info.offset.x > 80) handleAnswer(true)
            else if (info.offset.x < -80) handleAnswer(false)
            else x.set(0)
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="relative"
        >
          {/* Swipe hint overlays */}
          <motion.div
            className="absolute inset-0 rounded-2xl bg-[#4ECDC4] pointer-events-none z-10"
            style={{ opacity: bgGreen }}
          />
          <motion.div
            className="absolute inset-0 rounded-2xl bg-[#FF6B6B] pointer-events-none z-10"
            style={{ opacity: bgRed }}
          />
          <FlashCard
            front={card.front}
            back={card.back}
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped(f => !f)}
          />
        </motion.div>
      </AnimatePresence>

      <p className="text-center text-xs text-gray-400 mt-3">← 스와이프로도 답변 가능</p>

      {/* Action buttons */}
      <div className="flex gap-3 mt-6">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => handleAnswer(false)}
          className="flex-1 py-4 rounded-full border-2 border-[#FF6B6B] text-[#FF6B6B] font-semibold text-base"
        >
          ✗ 모르겠어요
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => handleAnswer(true)}
          className="flex-1 py-4 rounded-full bg-[#4ECDC4] text-white font-semibold text-base"
        >
          ✓ 알아요
        </motion.button>
      </div>
    </div>
  )
}
