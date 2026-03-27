'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { scaleOnTap } from '@/lib/constants/animation'
import type { QuizSetItemResolved } from '@/lib/types'

interface OxItem extends QuizSetItemResolved {
  isDecoy: boolean
  displayBack: string
}

interface OxQuizProps {
  item: OxItem
  onAnswer: (itemId: string, given: string, correct: boolean) => void
}

export default function OxQuiz({ item, onAnswer }: OxQuizProps) {
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)
  // For real items (isDecoy=false) correct answer is O; for decoys it's X
  const correctAnswer = item.isDecoy ? 'X' : 'O'

  function handleAnswer(answer: 'O' | 'X') {
    const correct = answer === correctAnswer
    setFeedback(correct ? 'correct' : 'incorrect')
    setTimeout(() => {
      setFeedback(null)
      onAnswer(item.id, answer, correct)
    }, 800)
  }

  return (
    <div className="space-y-6">
      {/* Statement card */}
      <div className="bg-white rounded-2xl shadow-md p-8 text-center min-h-[200px] flex flex-col items-center justify-center">
        <p className="text-xs font-medium text-indigo-400 uppercase tracking-wider mb-3">다음 설명이 맞으면 O, 틀리면 X</p>
        <p className="text-xl font-bold text-gray-900 mb-2">{item.front}</p>
        <p className="text-base text-gray-600">{item.displayBack}</p>
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            className={`text-center text-6xl font-bold ${feedback === 'correct' ? 'text-[#4ECDC4]' : 'text-[#FF6B6B]'}`}
          >
            {feedback === 'correct' ? '✓' : '✗'}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-4">
        <motion.button
          {...scaleOnTap}
          onClick={() => handleAnswer('O')}
          disabled={!!feedback}
          className="flex-1 py-6 rounded-2xl bg-[#4ECDC4] text-white text-4xl font-bold disabled:opacity-50"
        >
          O
        </motion.button>
        <motion.button
          {...scaleOnTap}
          onClick={() => handleAnswer('X')}
          disabled={!!feedback}
          className="flex-1 py-6 rounded-2xl bg-[#FF6B6B] text-white text-4xl font-bold disabled:opacity-50"
        >
          X
        </motion.button>
      </div>
    </div>
  )
}
