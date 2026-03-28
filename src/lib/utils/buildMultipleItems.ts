import { shuffle } from '@/lib/utils/shuffle'
import type { QuizSetItemResolved } from '@/lib/types'

export interface PoolItem {
  id: string
  category_id: string
  back: string
}

export interface MultipleItem {
  item: QuizSetItemResolved
  choices: string[]
  correctAnswer: string
}

export function buildMultipleItems(
  quizItems: QuizSetItemResolved[],
  pool: PoolItem[]
): MultipleItem[] {
  return quizItems.map(item => {
    const correctAnswer = item.back

    const sameCategory = pool.filter(
      p => p.category_id === item.category_id && p.back !== correctAnswer
    )
    let distractors = shuffle(sameCategory).slice(0, 3).map(p => p.back)

    if (distractors.length < 3) {
      const usedAnswers = new Set([correctAnswer, ...distractors])
      const otherCategory = pool.filter(
        p => !usedAnswers.has(p.back)
      )
      distractors = [
        ...distractors,
        ...shuffle(otherCategory).slice(0, 3 - distractors.length).map(p => p.back),
      ]
    }

    return {
      item,
      choices: shuffle([correctAnswer, ...distractors.slice(0, 3)]),
      correctAnswer,
    }
  })
}
