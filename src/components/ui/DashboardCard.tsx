'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { cardHover } from '@/lib/constants/animation'

interface DashboardCardProps {
  href: string
  title: string
  description: string
  icon: React.ReactNode
  accentColor?: string
}

export default function DashboardCard({
  href,
  title,
  description,
  icon,
  accentColor = 'bg-indigo-500',
}: DashboardCardProps) {
  return (
    <motion.div initial="rest" whileHover="hover" variants={cardHover}>
      <Link
        href={href}
        className="block bg-white rounded-2xl shadow-md hover:shadow-lg p-6 transition-shadow duration-200"
      >
        <div className={`w-12 h-12 ${accentColor} rounded-xl flex items-center justify-center mb-4`}>
          <span className="text-white">{icon}</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">{title}</h2>
        <p className="text-sm text-gray-500">{description}</p>
      </Link>
    </motion.div>
  )
}
