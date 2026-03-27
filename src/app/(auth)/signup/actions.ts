'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signUp(_prevState: { error: string } | null, formData: FormData) {
  const supabase = await createClient()
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as 'student' | 'teacher'
  const studentId = formData.get('student_id') as string | null

  if (!name || !email || !password || !role) {
    return { error: '모든 항목을 입력해주세요.' }
  }

  if (role === 'student' && !studentId) {
    return { error: '학번을 입력해주세요.' }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role, student_id: studentId ?? null } },
  })

  if (error) return { error: error.message }

  // Teacher signups wait for admin approval (saved as student + requested_role='teacher')
  if (role === 'teacher') {
    redirect('/dashboard?pending=teacher')
  }

  redirect('/dashboard')
}
