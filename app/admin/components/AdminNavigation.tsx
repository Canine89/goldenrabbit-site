'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavigationItem {
  title: string
  href: string
  icon: string
}

const navigationItems: NavigationItem[] = [
  { title: '대시보드', href: '/admin', icon: '📊' },
  { title: '도서 관리', href: '/admin/books', icon: '📚' },
  { title: '상품 관리', href: '/admin/products', icon: '🛍️' },
  // { title: '주문 관리', href: '/admin/orders', icon: '📋' }, // TODO: 주문 관리 페이지 구현 필요
  { title: '사용자 관리', href: '/admin/users', icon: '👥' },
  { title: '아티클 관리', href: '/admin/articles', icon: '📝' },
  // { title: '이벤트 관리', href: '/admin/events', icon: '🎉' }, // TODO: 이벤트 관리 페이지 구현 필요
  { title: '교수자료실', href: '/admin/professor-resources', icon: '🎓' },
]

export default function AdminNavigation() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname?.startsWith(href)
  }

  return (
    <div className="sticky top-16 z-40 bg-white/95 backdrop-blur-sm shadow-md border-b mb-6 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-1 overflow-x-auto py-3 scrollbar-hide">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                isActive(item.href)
                  ? 'bg-primary-100 text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:shadow-sm'
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}