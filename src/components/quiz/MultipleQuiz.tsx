'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { QuizSetItemResolved } from '@/lib/types'

interface MultipleQuizProps {
  item: QuizSetItemResolved
  choices: string[]
  correctAnswer: string
  onAnswer: (itemId: string, given: string, correct: boolean) => void
}

export default function MultipleQuiz({ item, choices, correctAnswer, onAnswer }: MultipleQuizProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)

  function handleSelect(choice: string) {
    if (showFeedback) return
    setSelected(choice)
    setShowFeedback(true)
    const correct = choice === correctAnswer
    setTimeout(() => {
      setSelected(null)
      setShowFeedback(false)
      onAnswer(item.id, choice, correct)
    }, 800)
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
        <p className="text-xs font-medium text-indigo-400 uppercase tracking-wider mb-3">앞면</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{item.front}</p>
      </div>

      <div className="space-y-2.5">
        {choices.map((choice, i) => {
          let cls = 'w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-left font-medium text-sm transition-colors'
          if (showFeedback) {
            if (choice === correctAnswer) cls += ' bg-teal-50 border-[#4ECDC4] text-teal-700'
            else if (choice === selected) cls += ' bg-red-50 border-[#FF6B6B] text-red-600'
            else cls += ' bg-gray-50 border-gray-200 text-gray-400'
          } else {
            cls += ' bg-gray-50 border-gray-200 text-gray-700 active:border-indigo-400'
          }
          return (
            <motion.button
              key={choice}
              whileTap={{ scale: 0.98 }}
              className={cls}
              onClick={() => handleSelect(choice)}
            >
              <span className="bg-indigo-100 text-indigo-600 rounded-lg px-2 py-0.5 text-xs font-bold min-w-[24px] text-center shrink-0">
                {['①', '②', '③', '④'][i]}
              </span>
              {choice}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
