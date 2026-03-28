import { shuffle } from '@/lib/utils/shuffle'
import type { QuizSetItemResolved } from '@/lib/types'

export type ElementQuestionType = 'symbol_to_atomic' | 'atomic_to_name' | 'valence_to_group'

export interface ElementQuestion {
  id: string
  realItemId: string | null
  questionType: ElementQuestionType
  questionText: string
  choices: string[]
  correctAnswer: string
}

export interface ElementPoolItem {
  id: string
  category_id: string
  front: string
  back: string
  atomic_number: number | null
  valence_electrons: number | null
  element_group: string | null
}

export function getElementName(back: string): string {
  return back.split(' — ')[0].trim()
}

const QUESTION_TYPES: ElementQuestionType[] = [
  'symbol_to_atomic',
  'atomic_to_name',
  'valence_to_group',
]

export function buildElementItems(
  quizItems: QuizSetItemResolved[],
  pool: ElementPoolItem[]
): ElementQuestion[] {
  const elementItems = quizItems.filter(item => item.atomic_number != null)
  const elementPool = pool.filter(
    (p): p is ElementPoolItem & { atomic_number: number; valence_electrons: number; element_group: string } =>
      p.atomic_number != null && p.valence_electrons != null && p.element_group != null
  )

  return elementItems.map((item, i) => {
    const questionType = QUESTION_TYPES[i % 3]
    const symbol = item.front.split(' ')[0]

    switch (questionType) {
      case 'symbol_to_atomic': {
        const correctAnswer = String(item.atomic_number)
        const distractors = shuffle(
          elementPool
            .filter(p => p.id !== item.item_id && String(p.atomic_number) !== correctAnswer)
            .map(p => String(p.atomic_number))
        ).slice(0, 3)
        return {
          id: item.id,
          realItemId: item.item_id,
          questionType,
          questionText: `${symbol}의 원자번호는?`,
          choices: shuffle([correctAnswer, ...distractors]),
          correctAnswer,
        }
      }

      case 'atomic_to_name': {
        const correctAnswer = getElementName(item.back)
        const distractors = shuffle(
          elementPool
            .filter(p => p.id !== item.item_id)
            .map(p => getElementName(p.back))
            .filter(name => name !== correctAnswer)
        ).slice(0, 3)
        return {
          id: item.id,
          realItemId: item.item_id,
          questionType,
          questionText: `원자번호 ${item.atomic_number}번 원소의 이름은?`,
          choices: shuffle([correctAnswer, ...distractors]),
          correctAnswer,
        }
      }

      case 'valence_to_group': {
        const correctAnswer = item.element_group!
        const allGroups = [...new Set(elementPool.map(p => p.element_group))]
        const distractors = shuffle(allGroups.filter(g => g !== correctAnswer)).slice(0, 3)
        return {
          id: item.id,
          realItemId: item.item_id,
          questionType,
          questionText: `${symbol}의 원자가전자가 ${item.valence_electrons}개일 때, 어느 족(族)에 속하나요?`,
          choices: shuffle([correctAnswer, ...distractors]),
          correctAnswer,
        }
      }
    }
  })
}
