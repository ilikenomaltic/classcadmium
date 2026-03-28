'use server'

import { createClient } from '@/lib/supabase/server'
import { generateInviteCode } from '@/lib/utils/inviteCode'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

async function verifyTeacher() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  return (profile?.role === 'teacher' || profile?.role === 'admin') ? user : null
}

export async function createClass(_prevState: { error: string } | null, formData: FormData) {
  const supabase = await createClient()
  const user = await verifyTeacher()
  if (!user) return { error: '선생님 권한이 필요합니다.' }

  const name = (formData.get('name') as string).trim()
  if (!name) return { error: '반 이름을 입력해주세요.' }

  const invite_code = generateInviteCode()
  const { data, error } = await supabase
    .from('classes')
    .insert({ name, teacher_id: user.id, invite_code })
    .select('id')
    .single()

  if (error) return { error: error.message }
  redirect(`/teacher/classes/${data.id}`)
}

export async function removeStudent(classId: string, studentId: string) {
  const supabase = await createClient()
  const user = await verifyTeacher()
  if (!user) return

  // 이 반의 선생님인지 확인
  const { data: cls } = await supabase
    .from('classes').select('teacher_id').eq('id', classId).single()
  if (cls?.teacher_id !== user.id) return

  await supabase
    .from('class_members')
    .delete()
    .eq('class_id', classId)
    .eq('student_id', studentId)
  revalidatePath(`/teacher/classes/${classId}`)
}
