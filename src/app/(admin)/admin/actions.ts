'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

export async function updateUserRole(userId: string, role: 'student' | 'teacher' | 'admin') {
  if (!await verifyAdmin()) return { error: '권한이 없습니다.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { error: null }
}

export async function approveTeacher(userId: string) {
  if (!await verifyAdmin()) return { error: '권한이 없습니다.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ role: 'teacher', requested_role: null })
    .eq('id', userId)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { error: null }
}

export async function rejectTeacher(userId: string) {
  if (!await verifyAdmin()) return { error: '권한이 없습니다.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ requested_role: null })
    .eq('id', userId)

  if (error) return { error: error.message }
  revalidatePath('/admin')
  return { error: null }
}
