'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import UserProfile from './UserProfile'
import LoginButton from './LoginButton'
import type { User } from '@supabase/supabase-js'
import Image from 'next/image';
import Logo from './gdrb_logo_vertical.png';

interface HeaderProps {
  user: User | null
  profile: any
  loading: boolean
}

export default function Header({ user, profile, loading }: HeaderProps) {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const navigationItems = [
    { name: '소개', href: '/about' },
    { name: '도서', href: '/books' },
    { name: '읽을거리', href: '/articles' },
    { name: '토끼상점', href: '/rabbit-store' },
    { name: '저자신청', href: '/author-apply' },
    { name: '교수자료실', href: '/professor/resources' },
  ]

  const isActiveRoute = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/')
  }

  return (
    <header className="bg-gradient-modern sticky top-0 z-50 border-b border-primary-500 shadow-lg backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* 로고 */}
          <Link href="/" className="flex items-center group py-2">
            <Image src={Logo} alt="골든래빗 로고" width={56} height={56} className="mr-2" />
            <div className="text-2xl font-bold text-primary-500 group-hover:text-white transition-colors duration-200">
              골든래빗
            </div>
          </Link>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden md:flex items-center">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center h-16 px-4 text-sm font-medium transition-colors border-b-2 ${
                  isActiveRoute(item.href)
                    ? 'text-primary-500 border-primary-500'
                    : 'text-white hover:text-primary-500 border-transparent hover:border-primary-500'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* 우측 액션 버튼들 */}
          <div className="flex items-center space-x-2">
            {/* 검색 아이콘 */}
            <button className="p-2 text-white hover:text-primary-500 hover:bg-gray-800 rounded-lg transition-all duration-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* 장바구니 아이콘 */}
            <Link href="/cart" className="relative p-2 text-white hover:text-blue-500 hover:bg-gray-800 rounded-lg transition-all duration-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5 5H3m4 8v6a2 2 0 002 2h6a2 2 0 002-2v-6" />
              </svg>
            </Link>

            {/* 로그인/사용자 프로필 */}
            {loading && user ? (
              <div className="animate-pulse bg-gray-200 h-10 w-24 rounded"></div>
            ) : user ? (
              <UserProfile user={user} profile={profile} />
            ) : (
              <LoginButton />
            )}

            {/* 모바일 메뉴 버튼 */}
            <button
              className="md:hidden p-2 text-white hover:text-primary-500 hover:bg-gray-800 rounded-lg transition-all duration-200"
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
          <div className="md:hidden py-4 border-t border-gray-700 animate-fade-in bg-gray-900">
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-3 py-2 text-base font-medium transition-colors rounded-lg ${
                    isActiveRoute(item.href)
                      ? 'text-primary-500 bg-gray-800'
                      : 'text-white hover:text-primary-500 hover:bg-gray-800'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* 모바일 로그인/사용자 메뉴 */}
              <div className="pt-4 border-t border-gray-700">
                {user ? (
                  <div className="space-y-1">
                    <div className="px-3 py-2 text-sm text-white bg-gray-800 rounded-lg">
                      {user.user_metadata?.full_name || user.email}
                    </div>
                    <Link
                      href="/profile"
                      className="block px-3 py-2 text-sm text-white hover:text-primary-500 hover:bg-gray-800 rounded-lg transition-colors"
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
      </div>
    </header>
  )
}