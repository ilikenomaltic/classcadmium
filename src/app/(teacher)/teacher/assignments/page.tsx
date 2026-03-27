import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AssignmentForm from './AssignmentForm'

export default async function AssignmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ newSet?: string }>
}) {
  const { newSet } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: assignments }, { data: quizSets }, { data: classes }] = await Promise.all([
    supabase
      .from('quiz_assignments')
      .select('id, due_date, mode, quiz_sets(title), classes(name)')
      .order('due_date', { ascending: true }),
    supabase.from('quiz_sets').select('id, title').eq('teacher_id', user.id).order('created_at', { ascending: false }),
    supabase.from('classes').select('id, name').eq('teacher_id', user.id).order('name'),
  ])

  const dday = (due: string | null) => {
    if (!due) return null
    // eslint-disable-next-line react-hooks/purity
    const diff = Math.ceil((new Date(due).getTime() - Date.now()) / 86400000)
    return diff
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">배정 목록</h1>
        <p className="text-gray-500 mt-1">퀴즈를 반에 배정하고 마감일을 설정하세요.</p>
      </div>

      {/* New assignment form */}
      <AssignmentForm
        quizSets={quizSets ?? []}
        classes={classes ?? []}
        defaultSetId={newSet}
      />

      {/* Existing assignments */}
      <h2 className="text-lg font-semibold text-gray-900 mt-8 mb-4">배정된 퀴즈</h2>
      {assignments?.length === 0 ? (
        <p className="text-gray-400 text-sm">아직 배정된 퀴즈가 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {assignments?.map(a => {
            const dd = dday(a.due_date ?? null)
            return (
              <div key={a.id} className="bg-white rounded-2xl shadow-md p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    {(a.quiz_sets as unknown as { title: string })?.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {(a.classes as unknown as { name: string })?.name} · {a.mode}
                  </p>
                </div>
                {dd !== null && (
                  <span className={[
                    'text-xs font-bold px-2.5 py-1 rounded-full',
                    dd <= 0 ? 'bg-red-100 text-red-600' :
                    dd <= 3 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-500',
                  ].join(' ')}>
                    {dd === 0 ? '오늘' : dd < 0 ? `D+${Math.abs(dd)}` : `D-${dd}`}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
