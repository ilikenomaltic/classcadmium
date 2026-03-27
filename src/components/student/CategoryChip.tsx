'use client'

import { motion } from 'framer-motion'
import { scaleOnTap } from '@/lib/constants/animation'

interface CategoryChipProps {
  label: string
  selected: boolean
  onToggle: () => void
}

export default function CategoryChip({ label, selected, onToggle }: CategoryChipProps) {
  return (
    <motion.button
      onClick={onToggle}
      {...scaleOnTap}
      className={[
        'flex items-center gap-2 px-4 py-2.5 rounded-full border-2 text-sm font-medium transition-colors duration-150',
        selected
          ? 'border-indigo-600 bg-indigo-600 text-white'
          : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-300',
      ].join(' ')}
    >
      {selected && <span className="text-white">✓</span>}
      {label}
    </motion.button>
  )
}
