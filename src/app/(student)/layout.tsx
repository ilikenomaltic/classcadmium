import BottomNav from '@/components/student/BottomNav'

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="pb-16 max-w-lg mx-auto px-4">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
