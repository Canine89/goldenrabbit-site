import { ReactNode } from 'react'
import AdminNavigation from './components/AdminNavigation'

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavigation />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        {children}
      </main>
    </div>
  )
}