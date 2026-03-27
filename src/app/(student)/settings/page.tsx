import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/student/LogoutButton'

const ROLE_LABELS: Record<string, string> = {
  student: '🎓 학생',
  teacher: '👩‍🏫 선생님',
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, email, role')
    .eq('id', user.id)
    .single()

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

        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">역할</span>
            <span className="text-sm font-medium text-gray-800">
              {ROLE_LABELS[profile?.role ?? 'student']}
            </span>
          </div>
        </div>
      </div>

      <LogoutButton />
    </div>
  )
}
