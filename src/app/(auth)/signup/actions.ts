'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signUp(_prevState: { error: string } | null, formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as 'student' | 'teacher'

  if (!name || !email || !password || !role) {
    return { error: '모든 항목을 입력해주세요.' }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role } },
  })

  if (error) return { error: error.message }

  redirect(role === 'teacher' ? '/teacher/dashboard' : '/dashboard')
}
