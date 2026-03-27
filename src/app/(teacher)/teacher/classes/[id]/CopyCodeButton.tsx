'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { scaleOnTap } from '@/lib/constants/animation'

export default function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.button
      {...scaleOnTap}
      onClick={handleCopy}
      className={[
        'px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200',
        copied
          ? 'bg-[#4ECDC4] text-white'
          : 'bg-indigo-600 text-white hover:bg-indigo-700',
      ].join(' ')}
    >
      {copied ? '복사됨 ✓' : '코드 복사'}
    </motion.button>
  )
}
