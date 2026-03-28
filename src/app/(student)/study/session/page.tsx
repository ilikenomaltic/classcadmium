'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import FlashCard from '@/components/student/FlashCard'
import MultipleQuiz from '@/components/quiz/MultipleQuiz'
import { shuffle } from '@/lib/utils/shuffle'
import { buildMultipleItems } from '@/lib/utils/buildMultipleItems'
import type { Item } from '@/lib/types'
import type { MultipleItem } from '@/lib/utils/buildMultipleItems'

function StudySession() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [cards, setCards] = useState<Item[]>([])
  const [multipleItems, setMultipleItems] = useState<MultipleItem[]>([])
  const [mode, setMode] = useState<string>('flashcard')
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
      const modeParam = searchParams.get('mode') ?? 'flashcard'
      setMode(modeParam)

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
      const finalItems = countParam > 0 ? shuffled.slice(0, countParam) : shuffled
      setCards(finalItems)

      if (modeParam === 'multiple') {
        // pool: 같은 카테고리 전체 아이템 (오답 생성용)
        const catIds = [...new Set(finalItems.map(i => i.category_id).filter(Boolean))]
        const { data: pool } = await supabase
          .from('items')
          .select('id, category_id, front, back')
          .in('category_id', catIds)

        // QuizSetItemResolved 형태로 변환
        const resolved = finalItems.map(item => ({
          id: item.id,
          quiz_set_id: '',
          item_id: item.id,
          front: item.front,
          back: item.back,
          front_override: null,
          back_override: null,
          category_id: item.category_id,
          atomic_number: item.atomic_number ?? null,
          valence_electrons: item.valence_electrons ?? null,
          element_group: item.element_group ?? null,
        }))
        setMultipleItems(buildMultipleItems(resolved, pool ?? []))
      }

      setLoading(false)
    }
    loadCards()
  }, [searchParams])

  const handleFlashcardAnswer = useCallback((isKnown: boolean) => {
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

  const handleMultipleAnswer = useCallback((_itemId: string, _given: string, correct: boolean) => {
    const card = cards[index]
    if (correct) {
      setKnown(prev => [...prev, card])
    } else {
      setUnknown(prev => [...prev, card])
    }

    if (index + 1 >= cards.length) {
      const knownCount = known.length + (correct ? 1 : 0)
      const unknownIds = [...unknown, ...(correct ? [] : [card])].map(c => c.id).join(',')
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
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => {
            if (confirm('학습을 종료하시겠습니까?')) router.push('/study')
          }}
          className="text-gray-400 text-sm hover:text-gray-600"
        >✕ 종료</button>
        <span className="text-sm font-medium text-gray-500">{index + 1} / {cards.length}</span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full mb-6 overflow-hidden">
        <motion.div
          className="h-full bg-indigo-500 rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <AnimatePresence mode="wait">
        {mode === 'multiple' && multipleItems[index] ? (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <MultipleQuiz
              item={multipleItems[index].item}
              choices={multipleItems[index].choices}
              correctAnswer={multipleItems[index].correctAnswer}
              onAnswer={handleMultipleAnswer}
            />
          </motion.div>
        ) : (
          <motion.div
            key={card.id}
            style={{ x }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.3}
            onDragEnd={(_, info) => {
              if (info.offset.x > 80) handleFlashcardAnswer(true)
              else if (info.offset.x < -80) handleFlashcardAnswer(false)
              else x.set(0)
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative"
          >
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
        )}
      </AnimatePresence>

      {mode === 'flashcard' && (
        <p className="text-center text-xs text-gray-400 mt-3">← 스와이프로도 답변 가능</p>
      )}

      <div className="flex justify-center gap-2 mt-4">
        <span className="bg-green-50 border border-green-200 text-green-700 rounded-full px-3 py-1 text-xs font-semibold">
          ✓ {known.length}
        </span>
        <span className="bg-red-50 border border-red-200 text-red-600 rounded-full px-3 py-1 text-xs font-semibold">
          ✗ {unknown.length}
        </span>
        <span className="bg-purple-50 border border-purple-200 text-purple-600 rounded-full px-3 py-1 text-xs font-semibold">
          — {cards.length - index}
        </span>
      </div>

      {mode === 'flashcard' && (
        <div className="flex gap-3 mt-6">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => handleFlashcardAnswer(false)}
            className="flex-1 py-4 rounded-full border-2 border-[#FF6B6B] text-[#FF6B6B] font-semibold text-base"
          >
            ✗ 모르겠어요
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => handleFlashcardAnswer(true)}
            className="flex-1 py-4 rounded-full bg-[#4ECDC4] text-white font-semibold text-base"
          >
            ✓ 알아요
          </motion.button>
        </div>
      )}
    </div>
  )
}

export default function StudySessionPage() {
  return (
    <Suspense fallback={<div className="py-6"><div className="w-full h-[280px] bg-gray-100 rounded-2xl animate-pulse" /></div>}>
      <StudySession />
    </Suspense>
  )
}
