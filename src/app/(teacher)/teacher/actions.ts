'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

type ActionState = { error: string } | null

export async function createQuizSet(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

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
  const { error } = await supabase.from('quiz_assignments').insert({
    quiz_set_id: formData.get('quiz_set_id') as string,
    class_id: formData.get('class_id') as string,
    due_date: (formData.get('due_date') as string) || null,
    mode: formData.get('mode') as string,
  })
  if (error) return { error: error.message }
  revalidatePath('/teacher/assignments')
  return null
}

export async function submitQuizResult(
  studentId: string,
  assignmentId: string,
  score: number,
  detail: { itemId: string; given: string; correct: boolean }[]
) {
  const supabase = await createClient()
  await supabase.from('quiz_results').upsert(
    { student_id: studentId, assignment_id: assignmentId, score, answers: detail },
    { onConflict: 'student_id,assignment_id' }
  )
}
