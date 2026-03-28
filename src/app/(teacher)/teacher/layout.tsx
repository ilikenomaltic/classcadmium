import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TeacherHeader from '@/components/teacher/TeacherHeader'

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'teacher' && profile?.role !== 'admin') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      <TeacherHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
