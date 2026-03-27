'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import { scaleOnTap } from '@/lib/constants/animation'

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <motion.button
      {...scaleOnTap}
      onClick={handleLogout}
      className="w-full py-3 rounded-full border-2 border-[#FF6B6B] text-[#FF6B6B] font-semibold text-sm"
    >
      로그아웃
    </motion.button>
  )
}
