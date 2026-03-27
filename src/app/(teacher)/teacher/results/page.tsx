import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

interface ResultRow {
  id: string
  score: number
  created_at: string
  student_id: string
  assignment_id: string
  profiles: { name: string } | null
  quiz_assignments: {
    mode: string
    quiz_sets: { title: string } | null
    classes: { name: string } | null
  } | null
}

const MODE_LABELS: Record<string, string> = {
  flashcard: '플래시카드',
  ox: 'OX 퀴즈',
  blank: '빈칸 채우기',
}

function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 80 ? 'bg-[#4ECDC4]/20 text-[#4ECDC4]' :
    score >= 50 ? 'bg-indigo-100 text-indigo-600' :
    'bg-[#FF6B6B]/20 text-[#FF6B6B]'
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cls}`}>
      {score}점
    </span>
  )
}

export default async function ResultsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get teacher's classes
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name')
    .eq('teacher_id', user.id)

  const classIds = classes?.map(c => c.id) ?? []

  // Get assignments for teacher's classes
  const { data: assignments } = classIds.length > 0
    ? await supabase
        .from('quiz_assignments')
        .select('id')
        .in('class_id', classIds)
    : { data: [] }

  const assignmentIds = assignments?.map(a => a.id) ?? []

  // Get results
  const { data: results } = assignmentIds.length > 0
    ? await supabase
        .from('quiz_results')
        .select(`
          id, score, created_at, student_id, assignment_id,
          profiles(name),
          quiz_assignments(mode, quiz_sets(title), classes(name))
        `)
        .in('assignment_id', assignmentIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  const rows = (results ?? []) as unknown as ResultRow[]

  // Compute per-class stats
  type ClassStat = { name: string; count: number; avg: number }
  const classMap: Record<string, ClassStat> = {}
  for (const r of rows) {
    const className = r.quiz_assignments?.classes?.name ?? '알 수 없음'
    if (!classMap[className]) classMap[className] = { name: className, count: 0, avg: 0 }
    classMap[className].count++
    classMap[className].avg += r.score
  }
  const classStats = Object.values(classMap).map(s => ({ ...s, avg: Math.round(s.avg / s.count) }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">퀴즈 결과</h1>
        <p className="text-gray-500 text-sm mt-1">학생들의 퀴즈 제출 결과를 확인하세요</p>
      </div>

      {/* Class averages */}
      {classStats.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">반별 평균</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {classStats.map(stat => (
              <div key={stat.name} className="bg-white rounded-2xl shadow-sm p-4 text-center">
                <p className="text-2xl font-bold text-indigo-600">{stat.avg}점</p>
                <p className="text-xs text-gray-500 mt-1">{stat.name}</p>
                <p className="text-xs text-gray-400">{stat.count}명 제출</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results table */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">전체 결과 ({rows.length}건)</h2>
        {rows.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <p className="text-4xl mb-4">📊</p>
            <p className="text-gray-500">아직 제출된 결과가 없습니다.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="divide-y divide-gray-50">
              {rows.map(r => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3 gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {r.profiles?.name ?? '이름 없음'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {r.quiz_assignments?.classes?.name} · {r.quiz_assignments?.quiz_sets?.title} · {MODE_LABELS[r.quiz_assignments?.mode ?? ''] ?? r.quiz_assignments?.mode}
                    </p>
                  </div>
                  <ScoreBadge score={r.score} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
