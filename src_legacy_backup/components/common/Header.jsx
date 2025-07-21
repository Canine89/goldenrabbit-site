import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useStore } from '../../store/useStore'
import { useAuth } from '../../contexts/AuthContext'
import LoginButton from '../auth/LoginButton'
import UserProfile from '../auth/UserProfile'
import Container from '../ui/Container'
import Badge from '../ui/Badge'

export default function Header() {
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { cart, getCartTotal } = useStore()
  const { user, profile, forceUpdateTrigger } = useAuth()

  // forceUpdateTrigger 변경 시 Header 상태 추적
  useEffect(() => {
    if (forceUpdateTrigger > 0 && profile) {
      console.log('🔄 Header: 프로필 상태 업데이트 감지', { 
        forceUpdateTrigger, 
        profileRole: profile.role,
        userId: user?.id,
        timestamp: new Date().toISOString()
      })
    }
  }, [forceUpdateTrigger, profile, user])

  const navigationItems = [
    { name: '소개', href: '/about' },
    { name: '도서', href: '/books' },
    { name: '읽을거리', href: '/articles' },
    { name: '토끼상점', href: '/rabbit-store' },
    { name: '저자신청', href: '/author-apply' },
    { name: '교수회원', href: '/professor' },
  ]

  const isActiveRoute = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-neutral-200 shadow-sm">
      <Container>
        <div className="flex justify-between items-center h-16">
          {/* 로고 */}
          <Link to="/" className="flex items-center group py-2">
            <div className="text-2xl font-bold text-primary-500 group-hover:text-primary-600 transition-colors duration-200">
              골든래빗
            </div>
          </Link>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden md:flex items-center">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center h-16 px-4 text-sm font-medium transition-colors border-b-2 ${
                  isActiveRoute(item.href)
                    ? 'text-primary-500 border-primary-500'
                    : 'text-neutral-700 hover:text-primary-500 border-transparent hover:border-primary-200'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* 우측 액션 버튼들 */}
          <div className="flex items-center space-x-2">
            {/* 검색 아이콘 */}
            <button className="p-2 text-neutral-600 hover:text-primary-500 hover:bg-neutral-50 rounded-lg transition-all duration-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* 장바구니 아이콘 (토끼상점용) */}
            <Link to="/cart" className="relative p-2 text-neutral-600 hover:text-primary-500 hover:bg-neutral-50 rounded-lg transition-all duration-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5 5H3m4 8v6a2 2 0 002 2h6a2 2 0 002-2v-6" />
              </svg>
              {getCartTotal() > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center font-medium animate-scale-in">
                  {getCartTotal()}
                </span>
              )}
            </Link>

            {/* 로그인/사용자 프로필 */}
            {user ? (
              <UserProfile />
            ) : (
              <LoginButton className="text-sm" />
            )}

            {/* 모바일 메뉴 버튼 */}
            <button
              className="md:hidden p-2 text-neutral-600 hover:text-primary-500 hover:bg-neutral-50 rounded-lg transition-all duration-200"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-neutral-200 animate-slide-down">
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 text-base font-medium transition-colors rounded-lg ${
                    isActiveRoute(item.href)
                      ? 'text-primary-500 bg-primary-50'
                      : 'text-neutral-700 hover:text-primary-500 hover:bg-neutral-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* 모바일 로그인/사용자 메뉴 */}
              <div className="pt-4 border-t border-neutral-200">
                {user ? (
                  <div className="space-y-1">
                    <div className="px-3 py-2 text-sm text-neutral-600 bg-neutral-50 rounded-lg">
                      {user.user_metadata?.full_name || user.email}
                    </div>
                    <Link
                      to="/profile"
                      className="block px-3 py-2 text-sm text-neutral-600 hover:text-primary-500 hover:bg-neutral-50 rounded-lg transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      프로필 설정
                    </Link>
                  </div>
                ) : (
                  <div className="px-3 py-2">
                    <LoginButton className="w-full text-sm" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Container>
    </header>
  )
}