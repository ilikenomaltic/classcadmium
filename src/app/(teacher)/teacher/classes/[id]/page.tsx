import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { removeStudent } from '../actions'
import CopyCodeButton from './CopyCodeButton'

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: cls } = await supabase
    .from('classes')
    .select('id, name, invite_code, teacher_id')
    .eq('id', id)
    .single()

  if (!cls || cls.teacher_id !== user.id) notFound()

  const { data: members } = await supabase
    .from('class_members')
    .select('student_id, profiles(id, name, email)')
    .eq('class_id', id)

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link href="/teacher/classes" className="text-gray-400 text-sm flex items-center gap-1 mb-4">
          ← 반 목록
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{cls.name}</h1>
      </div>

      {/* Invite code */}
      <div className="bg-indigo-50 rounded-2xl p-5 mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-indigo-500 font-medium mb-1">초대 코드</p>
          <p className="text-3xl font-bold text-indigo-700 font-mono tracking-widest">{cls.invite_code}</p>
          <p className="text-xs text-indigo-400 mt-1">학생에게 이 코드를 알려주세요</p>
        </div>
        <CopyCodeButton code={cls.invite_code} />
      </div>

      {/* Student list */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">학생 목록</h2>
          <span className="text-sm text-gray-500">{members?.length ?? 0}명</span>
        </div>

        {members?.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">아직 참여한 학생이 없습니다.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {members?.map((m) => {
              const profile = m.profiles as unknown as { id: string; name: string; email: string } | null
              return (
                <li key={m.student_id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{profile?.name}</p>
                    <p className="text-xs text-gray-400">{profile?.email}</p>
                  </div>
                  <form action={async () => {
                    'use server'
                    await removeStudent(id, m.student_id)
                  }}>
                    <button type="submit" className="text-xs text-[#FF6B6B] hover:underline">제거</button>
                  </form>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
