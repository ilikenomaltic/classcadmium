import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/student/LogoutButton'

const ROLE_LABELS: Record<string, string> = {
  student: '🎓 학생',
  teacher: '👩‍🏫 선생님',
  admin: '🛡️ 관리자',
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email, role, requested_role')
    .eq('id', user.id)
    .single()

  const isPendingTeacher = profile?.requested_role === 'teacher' && profile?.role === 'student'

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">설정</h1>

      <div className="bg-white rounded-2xl shadow-md p-6 space-y-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
            {profile?.name?.[0] ?? '?'}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-lg">{profile?.name}</p>
            <p className="text-sm text-gray-500">{profile?.email}</p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">역할</span>
            <span className="text-sm font-medium text-gray-800">
              {ROLE_LABELS[profile?.role ?? 'student']}
            </span>
          </div>

          {isPendingTeacher && (
            <div className="flex items-center justify-between bg-yellow-50 rounded-xl px-4 py-3">
              <span className="text-sm text-yellow-700 font-medium">선생님 승인 대기 중</span>
              <span className="text-xs bg-yellow-100 text-yellow-600 font-bold px-2.5 py-1 rounded-full">검토 중</span>
            </div>
          )}
        </div>
      </div>

      {profile?.role === 'admin' && (
        <>
          <Link
            href="/teacher/dashboard"
            className="block w-full mb-3 py-4 rounded-2xl bg-indigo-600 text-white font-semibold text-sm text-center hover:bg-indigo-700 transition-colors"
          >
            👩‍🏫 선생님 대시보드
          </Link>
          <Link
            href="/admin"
            className="block w-full mb-4 py-4 rounded-2xl bg-gray-900 text-white font-semibold text-sm text-center hover:bg-gray-800 transition-colors"
          >
            🛡️ 관리자 대시보드
          </Link>
        </>
      )}

      <LogoutButton />
    </div>
  )
}
