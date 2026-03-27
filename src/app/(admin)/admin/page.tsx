import { createAdminClient } from '@/lib/supabase/admin'
import RoleSelect from './RoleSelect'
import ApproveButtons from './ApproveButtons'

interface Profile {
  id: string
  email: string
  name: string
  role: string
  requested_role: string | null
  created_at: string
}

export default async function AdminPage() {
  const admin = createAdminClient()

  const { data: profiles } = await admin
    .from('profiles')
    .select('id, email, name, role, requested_role, created_at')
    .order('created_at', { ascending: false })

  const rows = (profiles ?? []) as Profile[]
  const pending = rows.filter(p => p.requested_role === 'teacher' && p.role === 'student')

  const total = rows.length
  const byRole = rows.reduce<Record<string, number>>((acc, p) => {
    acc[p.role] = (acc[p.role] ?? 0) + 1
    return acc
  }, {})
  const today = new Date().toDateString()
  const todayCount = rows.filter(p => new Date(p.created_at).toDateString() === today).length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
        <p className="text-gray-500 text-sm mt-1">전체 가입자 현황 및 권한 관리</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: '전체 가입자', value: total, color: 'text-gray-900' },
          { label: '오늘 가입', value: todayCount, color: 'text-indigo-600' },
          { label: '학생', value: byRole.student ?? 0, color: 'text-gray-600' },
          { label: '선생님', value: byRole.teacher ?? 0, color: 'text-indigo-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl shadow-sm p-5 text-center">
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Pending teacher approvals */}
      {pending.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold text-gray-700">선생님 승인 대기</h2>
            <span className="text-xs bg-yellow-400 text-white font-bold px-2 py-0.5 rounded-full">
              {pending.length}
            </span>
          </div>
          <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-yellow-100">
            <div className="divide-y divide-gray-50">
              {pending.map(p => (
                <div key={p.id} className="flex items-center justify-between px-5 py-4 gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                    <p className="text-xs text-gray-400 truncate">{p.email}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(p.created_at).toLocaleDateString('ko-KR')}
                  </span>
                  <ApproveButtons userId={p.id} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* User table */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">전체 가입자 ({total}명)</h2>
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="grid grid-cols-[1fr_1.5fr_auto_auto] gap-4 px-5 py-3 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            <span>이름</span>
            <span>이메일</span>
            <span>가입일</span>
            <span>권한</span>
          </div>
          <div className="divide-y divide-gray-50">
            {rows.map(p => (
              <div key={p.id} className="grid grid-cols-[1fr_1.5fr_auto_auto] gap-4 px-5 py-3.5 items-center">
                <div className="min-w-0">
                  <span className="font-medium text-gray-900 text-sm truncate block">{p.name}</span>
                  {p.requested_role === 'teacher' && p.role === 'student' && (
                    <span className="text-xs text-yellow-600">승인 대기 중</span>
                  )}
                </div>
                <span className="text-gray-500 text-sm truncate">{p.email}</span>
                <span className="text-gray-400 text-xs whitespace-nowrap">
                  {new Date(p.created_at).toLocaleDateString('ko-KR')}
                </span>
                <RoleSelect userId={p.id} currentRole={p.role} />
              </div>
            ))}
            {rows.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">가입자가 없습니다.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
