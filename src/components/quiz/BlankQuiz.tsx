'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { scaleOnTap } from '@/lib/constants/animation'
import type { QuizSetItemResolved } from '@/lib/types'

function extractBlank(back: string): { display: string; answer: string } {
  // Take the longest Korean/English word as the blank target
  const words = back.split(/[\s,\-·—]+/).filter(w => w.length > 1)
  const target = words.reduce((a, b) => (b.length > a.length ? b : a), words[0] ?? '')
  return {
    display: back.replace(target, '___'),
    answer: target.replace(/[()]/g, '').trim(),
  }
}

interface BlankQuizProps {
  item: QuizSetItemResolved
  onAnswer: (itemId: string, given: string, correct: boolean) => void
}

export default function BlankQuiz({ item, onAnswer }: BlankQuizProps) {
  const { display, answer } = extractBlank(item.back)
  const [input, setInput] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null)

  function handleSubmit() {
    const correct = input.trim().toLowerCase() === answer.toLowerCase()
    setFeedback(correct ? 'correct' : 'incorrect')
    setTimeout(() => {
      setFeedback(null)
      setInput('')
      onAnswer(item.id, input.trim(), correct)
    }, 1000)
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-md p-8 text-center min-h-[200px] flex flex-col items-center justify-center">
        <p className="text-xs font-medium text-indigo-400 uppercase tracking-wider mb-3">빈칸에 들어갈 말은?</p>
        <p className="text-2xl font-bold text-gray-900 mb-4">{item.front}</p>
        <p className="text-base text-gray-600 leading-relaxed">{display}</p>
      </div>

      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`text-center text-sm font-bold py-2 rounded-xl ${
              feedback === 'correct' ? 'bg-[#4ECDC4]/20 text-[#4ECDC4]' : 'bg-[#FF6B6B]/20 text-[#FF6B6B]'
            }`}
          >
            {feedback === 'correct' ? '정답! ✓' : `오답 — 정답: ${answer}`}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
          disabled={!!feedback}
          placeholder="답을 입력하세요"
          className="flex-1 px-4 py-3.5 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-indigo-500 disabled:opacity-50"
        />
        <motion.button
          {...scaleOnTap}
          onClick={handleSubmit}
          disabled={!input.trim() || !!feedback}
          className="px-6 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm disabled:opacity-50"
        >
          확인
        </motion.button>
      </div>
    </div>
  )
}
