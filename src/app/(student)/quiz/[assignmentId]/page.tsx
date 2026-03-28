'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeInUp } from '@/lib/constants/animation'
import FlashcardQuiz from '@/components/quiz/FlashcardQuiz'
import OxQuiz from '@/components/quiz/OxQuiz'
import BlankQuiz from '@/components/quiz/BlankQuiz'
import MultipleQuiz from '@/components/quiz/MultipleQuiz'
import ElementQuiz from '@/components/quiz/ElementQuiz'
import { submitQuizResult } from '@/app/(teacher)/teacher/actions'
import { buildMultipleItems } from '@/lib/utils/buildMultipleItems'
import { buildElementItems } from '@/lib/utils/buildElementItems'
import type { QuizSetItemResolved } from '@/lib/types'
import type { MultipleItem } from '@/lib/utils/buildMultipleItems'
import type { ElementQuestion } from '@/lib/utils/buildElementItems'

interface OxItem extends QuizSetItemResolved {
  isDecoy: boolean
  displayBack: string
}

interface Answer {
  itemId: string
  realItemId: string | null
  given: string
  correct: boolean
}

interface Assignment {
  id: string
  mode: string
  quiz_set_id: string
  difficulty: string
}

function buildOxItems(items: QuizSetItemResolved[]): OxItem[] {
  return items.map(item => {
    const isDecoy = Math.random() < 0.5 && items.length > 1
    let displayBack = item.back
    if (isDecoy) {
      const others = items.filter(i => i.id !== item.id)
      const other = others[Math.floor(Math.random() * others.length)]
      displayBack = other.back
    }
    return { ...item, isDecoy, displayBack }
  })
}

export default function QuizSessionPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = use(params)
  const router = useRouter()

  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [items, setItems] = useState<QuizSetItemResolved[]>([])
  const [oxItems, setOxItems] = useState<OxItem[]>([])
  const [multipleItems, setMultipleItems] = useState<MultipleItem[]>([])
  const [elementItems, setElementItems] = useState<ElementQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: assign } = await supabase
        .from('quiz_assignments')
        .select('id, mode, quiz_set_id, difficulty')
        .eq('id', assignmentId)
        .single()

      if (!assign) { router.push('/quiz'); return }
      setAssignment(assign as Assignment)

      type RawSetItem = {
        id: string; quiz_set_id: string; item_id: string | null
        front_override: string | null; back_override: string | null
        items: { front: string; back: string; category_id: string; atomic_number: number | null; valence_electrons: number | null; element_group: string | null } | null
      }

      const { data: rawItems } = await supabase
        .from('quiz_set_items')
        .select('id, quiz_set_id, item_id, front_override, back_override, items(front, back, category_id, atomic_number, valence_electrons, element_group)')
        .eq('quiz_set_id', assign.quiz_set_id)

      const resolved: QuizSetItemResolved[] = ((rawItems ?? []) as unknown as RawSetItem[]).map(si => ({
        id: si.id,
        quiz_set_id: si.quiz_set_id,
        item_id: si.item_id,
        front: si.front_override ?? si.items?.front ?? '',
        back: si.back_override ?? si.items?.back ?? '',
        front_override: si.front_override,
        back_override: si.back_override,
        category_id: si.items?.category_id ?? null,
        atomic_number: si.items?.atomic_number ?? null,
        valence_electrons: si.items?.valence_electrons ?? null,
        element_group: si.items?.element_group ?? null,
      }))

      setItems(resolved)

      if (assign.mode === 'ox') {
        setOxItems(buildOxItems(resolved))
      } else if (assign.mode === 'multiple' || assign.mode === 'element') {
        const categoryIds = [...new Set(resolved.map(i => i.category_id).filter(Boolean))] as string[]
        if (categoryIds.length > 0) {
          const { data: pool } = await supabase
            .from('items')
            .select('id, category_id, front, back, atomic_number, valence_electrons, element_group')
            .in('category_id', categoryIds)
          if (assign.mode === 'multiple') {
            setMultipleItems(buildMultipleItems(resolved, pool ?? []))
          } else {
            setElementItems(buildElementItems(resolved, pool ?? []))
          }
        }
      }

      setLoading(false)
    }
    load()
  }, [assignmentId, router])

  function getTotalCount() {
    switch (assignment?.mode) {
      case 'ox':       return oxItems.length
      case 'multiple': return multipleItems.length
      case 'element':  return elementItems.length
      default:         return items.length
    }
  }

  function getRealItemId(idx: number): string | null {
    switch (assignment?.mode) {
      case 'ox':       return oxItems[idx]?.item_id ?? null
      case 'multiple': return multipleItems[idx]?.item.item_id ?? null
      case 'element':  return elementItems[idx]?.realItemId ?? null
      default:         return items[idx]?.item_id ?? null
    }
  }

  async function handleAnswer(itemId: string, given: string, correct: boolean) {
    const realItemId = getRealItemId(currentIndex)
    const newAnswers = [...answers, { itemId, given, correct, realItemId }]
    setAnswers(newAnswers)

    const totalItems = getTotalCount()
    const isLast = currentIndex >= totalItems - 1

    if (isLast) {
      setSubmitting(true)
      const correctCount = newAnswers.filter(a => a.correct).length
      const score = Math.round((correctCount / newAnswers.length) * 100)
      const detail = newAnswers.map(a => ({ itemId: a.itemId, given: a.given, correct: a.correct }))

      const result = await submitQuizResult(assignmentId, score, detail)
      const earnedPoints = result?.earnedPoints ?? 0

      const wrongIds = newAnswers
        .filter(a => !a.correct && a.realItemId)
        .map(a => a.realItemId)
        .join(',')

      router.push(
        `/quiz/${assignmentId}/result?score=${score}&total=${newAnswers.length}&correct=${correctCount}&earnedPoints=${earnedPoints}&wrongIds=${wrongIds}`
      )
    } else {
      setCurrentIndex(i => i + 1)
    }
  }

  function handleExit() {
    if (confirm('퀴즈를 종료하시겠습니까? 진행 상황이 저장되지 않습니다.')) {
      router.push('/quiz')
    }
  }

  if (loading) {
    return (
      <div className="py-6 space-y-4">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    )
  }

  const totalCount = getTotalCount()
  const progress = totalCount > 0 ? (currentIndex / totalCount) * 100 : 0

  return (
    <div className="py-6 space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={handleExit} className="text-gray-400 text-sm hover:text-gray-600">✕ 종료</button>
        <span className="text-xs text-gray-400">{currentIndex + 1} / {totalCount}</span>
      </div>

      <div>
        <div className="flex items-center justify-end text-xs text-gray-400 mb-2">
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-indigo-500 rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {submitting ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">결과 저장 중...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={currentIndex} variants={fadeInUp} initial="hidden" animate="visible">
            {assignment?.mode === 'flashcard' && items[currentIndex] && (
              <FlashcardQuiz item={items[currentIndex]} index={currentIndex} total={totalCount} onAnswer={handleAnswer} />
            )}
            {assignment?.mode === 'ox' && oxItems[currentIndex] && (
              <OxQuiz item={oxItems[currentIndex]} onAnswer={handleAnswer} />
            )}
            {assignment?.mode === 'blank' && items[currentIndex] && (
              <BlankQuiz item={items[currentIndex]} onAnswer={handleAnswer} />
            )}
            {assignment?.mode === 'multiple' && multipleItems[currentIndex] && (
              <MultipleQuiz
                item={multipleItems[currentIndex].item}
                choices={multipleItems[currentIndex].choices}
                correctAnswer={multipleItems[currentIndex].correctAnswer}
                onAnswer={handleAnswer}
              />
            )}
            {assignment?.mode === 'element' && elementItems[currentIndex] && (
              <ElementQuiz question={elementItems[currentIndex]} onAnswer={handleAnswer} />
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
