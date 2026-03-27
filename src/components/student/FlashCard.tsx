'use client'

import { motion } from 'framer-motion'

interface FlashCardProps {
  front: string
  back: string
  isFlipped: boolean
  onFlip: () => void
}

export default function FlashCard({ front, back, isFlipped, onFlip }: FlashCardProps) {
  return (
    <div
      className="relative w-full cursor-pointer"
      style={{ height: '280px', perspective: '1200px' }}
      onClick={onFlip}
    >
      <motion.div
        className="relative w-full h-full"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-2xl shadow-md p-6 text-center"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <p className="text-xs font-medium text-indigo-400 uppercase tracking-wider mb-3">앞면 — 탭하여 뒤집기</p>
          <p className="text-2xl font-bold text-gray-900 leading-tight">{front}</p>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-indigo-600 rounded-2xl shadow-md p-6 text-center"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <p className="text-xs font-medium text-indigo-200 uppercase tracking-wider mb-3">뒷면</p>
          <p className="text-lg font-semibold text-white leading-relaxed">{back}</p>
        </div>
      </motion.div>
    </div>
  )
}
