import type { Variants } from 'framer-motion'

export const fadeInUp: Variants = {
  hidden:  { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
}

export const staggerContainer: Variants = {
  hidden:  {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
}

export const scaleOnTap = {
  whileTap: { scale: 0.96 },
  transition: { type: 'spring', stiffness: 400, damping: 20 },
} as const

export const cardHover: Variants = {
  rest:  { scale: 1, y: 0 },
  hover: { scale: 1.02, y: -2, transition: { duration: 0.2 } },
}
