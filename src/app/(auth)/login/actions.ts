'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signIn(_prevState: { error: string } | null, formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: '이메일과 비밀번호를 입력해주세요.' }
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: '이메일 또는 비밀번호가 올바르지 않습니다.' }

  // middleware will handle role-based redirect
  redirect('/dashboard')
}
