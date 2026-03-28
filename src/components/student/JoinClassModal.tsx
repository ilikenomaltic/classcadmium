'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { scaleOnTap } from '@/lib/constants/animation'

interface JoinClassModalProps {
  isOpen: boolean
  onClose: () => void
  onJoined: () => void
}

export default function JoinClassModal({ isOpen, onClose, onJoined }: JoinClassModalProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleJoin() {
    if (code.length !== 6) {
      setError('6자리 코드를 입력해주세요.')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('로그인이 필요합니다.'); setLoading(false); return }

    const { data: cls } = await supabase
      .from('classes')
      .select('id')
      .eq('invite_code', code.toUpperCase())
      .single()

    if (!cls) {
      setError('반을 찾을 수 없습니다. 코드를 확인해주세요.')
      setLoading(false)
      return
    }

    const { error: joinError } = await supabase
      .from('class_members')
      .insert({ class_id: cls.id, student_id: user.id })

    if (joinError) {
      if (joinError.code === '23505') setError('이미 참여한 반입니다.')
      else setError(joinError.message)
      setLoading(false)
      return
    }

    setCode('')
    onJoined()
    onClose()
    setLoading(false)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[60]"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 z-[70] max-w-lg mx-auto"
          >
            <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">반 참여하기</h2>
            <p className="text-gray-500 text-sm mb-6">선생님께 받은 6자리 초대 코드를 입력하세요.</p>

            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.trim().toUpperCase())}
              placeholder="ABC123"
              className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 text-center text-2xl font-bold font-mono tracking-widest focus:outline-none focus:border-indigo-500 mb-4"
            />

            {error && <p className="text-[#FF6B6B] text-sm text-center mb-4">{error}</p>}

            <motion.button
              {...scaleOnTap}
              onClick={handleJoin}
              disabled={loading || code.length !== 6}
              className="w-full py-4 rounded-full bg-indigo-600 text-white font-semibold disabled:opacity-50"
            >
              {loading ? '참여 중...' : '반 참여하기'}
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
