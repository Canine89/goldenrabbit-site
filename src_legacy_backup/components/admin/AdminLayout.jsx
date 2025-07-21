import { Link, Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import Container from '../ui/Container'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'

export default function AdminLayout() {
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const navigation = [
    { name: '대시보드', href: '/admin', icon: '📊' },
    { name: '도서 관리', href: '/admin/books', icon: '📚' },
    { name: '상품 관리', href: '/admin/products', icon: '🛍️' },
    { name: '주문 관리', href: '/admin/orders', icon: '📋' },
    { name: '사용자 관리', href: '/admin/users', icon: '👥' },
    { name: '아티클 관리', href: '/admin/articles', icon: '📝' },
    { name: '이벤트 관리', href: '/admin/events', icon: '🎉' },
  ]

  const isActive = (href) => {
    return location.pathname === href
  }

  return (
    <div className="h-screen flex bg-neutral-50">
      {/* 모바일 사이드바 오버레이 */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-neutral-600 bg-opacity-75 lg:hidden z-20"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <div className={`fixed inset-y-0 left-0 z-30 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:z-auto flex flex-col border-r border-neutral-200 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* 사이드바 헤더 */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-neutral-200 flex-shrink-0 bg-gradient-to-r from-primary-500 to-primary-600">
          <Link to="/admin" className="text-xl font-bold text-white">
            관리자 페이지
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-white/80 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 사이드바 네비게이션 */}
        <nav className="flex-1 overflow-y-auto py-6">
          <div className="px-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'text-neutral-700 hover:bg-neutral-50 hover:text-primary-500'
                }`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <span className="mr-3 text-lg group-hover:scale-110 transition-transform duration-200">
                  {item.icon}
                </span>
                <span className="flex-1">{item.name}</span>
                {isActive(item.href) && (
                  <Badge variant="secondary" size="sm" className="bg-white/20 text-white">
                    활성
                  </Badge>
                )}
              </Link>
            ))}
          </div>
        </nav>

        {/* 사이트로 돌아가기 */}
        <div className="p-4 flex-shrink-0">
          <Button
            as={Link}
            to="/"
            variant="ghost"
            className="w-full text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
            onClick={() => setIsSidebarOpen(false)}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            사이트로 돌아가기
          </Button>
        </div>
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 상단 헤더 */}
        <div className="bg-white shadow-sm border-b border-neutral-200 flex-shrink-0">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="flex items-center space-x-4">
                <div className="hidden sm:block">
                  <span className="text-sm text-neutral-500">골든래빗 관리자</span>
                </div>
                <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white text-sm font-bold">관</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 페이지 콘텐츠 */}
        <main className="flex-1 overflow-y-auto bg-neutral-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}