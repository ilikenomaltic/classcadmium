'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import FlashCard from '@/components/student/FlashCard'
import { scaleOnTap } from '@/lib/constants/animation'
import type { QuizSetItemResolved } from '@/lib/types'

interface FlashcardQuizProps {
  item: QuizSetItemResolved
  index: number
  total: number
  onAnswer: (itemId: string, given: string, correct: boolean) => void
}

export default function FlashcardQuiz({ item, onAnswer }: FlashcardQuizProps) {
  const [flipped, setFlipped] = useState(false)

  function handleAnswer(known: boolean) {
    setFlipped(false)
    onAnswer(item.id, known ? 'known' : 'unknown', known)
  }

  return (
    <div className="space-y-6">
      <FlashCard
        front={item.front}
        back={item.back}
        isFlipped={flipped}
        onFlip={() => setFlipped(f => !f)}
      />
      <p className="text-center text-xs text-gray-400">탭하여 뒤집기</p>
      <div className="flex gap-3">
        <motion.button
          {...scaleOnTap}
          onClick={() => handleAnswer(false)}
          className="flex-1 py-4 rounded-full border-2 border-[#FF6B6B] text-[#FF6B6B] font-semibold"
        >
          ✗ 모르겠어요
        </motion.button>
        <motion.button
          {...scaleOnTap}
          onClick={() => handleAnswer(true)}
          className="flex-1 py-4 rounded-full bg-[#4ECDC4] text-white font-semibold"
        >
          ✓ 알아요
        </motion.button>
      </div>
    </div>
  )
}
