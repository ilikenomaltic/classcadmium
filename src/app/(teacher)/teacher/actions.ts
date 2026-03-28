'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

type ActionState = { error: string } | null

async function verifyTeacher() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  return (profile?.role === 'teacher' || profile?.role === 'admin') ? user : null
}

export async function createQuizSet(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const user = await verifyTeacher()
  if (!user) return { error: '선생님 권한이 필요합니다.' }

  const title = (formData.get('title') as string).trim()
  if (!title) return { error: '제목을 입력해주세요.' }

  const itemIds = formData.getAll('itemIds') as string[]
  if (itemIds.length === 0) return { error: '하나 이상의 문항을 선택해주세요.' }

  const { data: set, error: setError } = await supabase
    .from('quiz_sets')
    .insert({ title, teacher_id: user.id })
    .select('id')
    .single()

  if (setError) return { error: setError.message }

  await supabase.from('quiz_set_items').insert(
    itemIds.map(item_id => ({ quiz_set_id: set.id, item_id }))
  )

  redirect(`/teacher/assignments?newSet=${set.id}`)
}

export async function createAssignment(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const user = await verifyTeacher()
  if (!user) return { error: '선생님 권한이 필요합니다.' }

  const quizSetId = formData.get('quiz_set_id') as string
  const classId = formData.get('class_id') as string

  // 퀴즈세트 소유자 확인
  const { data: quizSet } = await supabase
    .from('quiz_sets').select('teacher_id').eq('id', quizSetId).single()
  if (quizSet?.teacher_id !== user.id) return { error: '권한이 없습니다.' }

  // 반 소유자 확인
  const { data: cls } = await supabase
    .from('classes').select('teacher_id').eq('id', classId).single()
  if (cls?.teacher_id !== user.id) return { error: '권한이 없습니다.' }

  const { error } = await supabase.from('quiz_assignments').insert({
    quiz_set_id: quizSetId,
    class_id: classId,
    due_date: (formData.get('due_date') as string) || null,
    mode: formData.get('mode') as string,
  })
  if (error) return { error: error.message }
  revalidatePath('/teacher/assignments')
  return null
}

// studentId 파라미터 제거 — 서버에서 인증된 사용자 ID 사용
export async function submitQuizResult(
  assignmentId: string,
  score: number,
  detail: { itemId: string; given: string; correct: boolean }[]
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  await supabase.from('quiz_results').upsert(
    { student_id: user.id, assignment_id: assignmentId, score, answers: detail },
    { onConflict: 'student_id,assignment_id' }
  )
}
