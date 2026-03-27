import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PlusIcon } from '@heroicons/react/24/solid'

export default async function TeacherClassesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, invite_code, class_members(count)')
    .eq('teacher_id', user.id)
    .order('name')

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">반 관리</h1>
          <p className="text-gray-500 mt-1">총 {classes?.length ?? 0}개의 반</p>
        </div>
        <Link
          href="/teacher/classes/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-full font-medium text-sm hover:bg-indigo-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          새 반 만들기
        </Link>
      </div>

      {classes?.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🏫</p>
          <p className="text-gray-500">아직 만든 반이 없습니다.</p>
          <Link href="/teacher/classes/new" className="mt-4 inline-block text-indigo-600 font-medium">
            첫 번째 반 만들기 →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {classes?.map(cls => {
            const count = (cls.class_members as { count: number }[])?.[0]?.count ?? 0
            return (
              <Link
                key={cls.id}
                href={`/teacher/classes/${cls.id}`}
                className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{cls.name}</h2>
                    <p className="text-sm text-gray-500 mt-1">학생 {count}명</p>
                  </div>
                  <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full font-mono tracking-widest">
                    {cls.invite_code}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
