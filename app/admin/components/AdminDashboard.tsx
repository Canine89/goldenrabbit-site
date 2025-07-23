'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createSupabaseClient } from '../../lib/supabase-client'
import Container from '../../components/ui/Container'
import Card from '../../components/ui/Card'
import Loading from '../../components/ui/Loading'

interface Stats {
  totalBooks: number
  totalProducts: number
  totalOrders: number
  recentOrders: any[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalBooks: 0,
    totalProducts: 0,
    totalOrders: 0,
    recentOrders: []
  })
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseClient()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)

      // 도서 수 조회
      const { count: bookCount } = await supabase
        .from('books')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      // 상품 수 조회
      const { count: productCount } = await supabase
        .from('rabbit_store_products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      // 주문 수 조회 - orders 테이블이 아직 구현되지 않음
      const orderCount = 0
      // const { count: orderCount } = await supabase
      //   .from('orders')
      //   .select('*', { count: 'exact', head: true })

      // 최근 주문 조회 - orders 테이블이 아직 구현되지 않음
      const recentOrders: any[] = []
      // const { data: recentOrders } = await supabase
      //   .from('orders')
      //   .select(`
      //     *,
      //     profiles (username, email)
      //   `)
      //   .order('created_at', { ascending: false })
      //   .limit(5)

      setStats({
        totalBooks: bookCount || 0,
        totalProducts: productCount || 0,
        totalOrders: orderCount || 0,
        recentOrders: recentOrders || []
      })
    } catch (error) {
      console.error('통계 데이터 조회 중 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '주문 대기'
      case 'confirmed':
        return '주문 확인'
      case 'shipped':
        return '배송 중'
      case 'delivered':
        return '배송 완료'
      case 'cancelled':
        return '주문 취소'
      default:
        return '알 수 없음'
    }
  }

  if (loading) {
    return <Loading />
  }

  // 통계 카드 데이터
  const statCards = [
    {
      title: '총 도서 수',
      value: stats.totalBooks,
      icon: '📚',
      color: 'bg-blue-500',
    },
    {
      title: '토끼상점 상품 수',
      value: stats.totalProducts,
      icon: '🛍️',
      color: 'bg-orange-500',
    },
    {
      title: '총 주문 수',
      value: stats.totalOrders,
      icon: '📋',
      color: 'bg-green-500',
    }
  ]

  // 빠른 액션 메뉴
  const quickActions = [
    {
      title: '도서 관리',
      description: '도서 정보 관리',
      href: '/admin/books',
      icon: '📚',
      color: 'bg-blue-500'
    },
    {
      title: '상품 관리',
      description: '토끼상점 상품 관리',
      href: '/admin/products',
      icon: '🛍️',
      color: 'bg-orange-500'
    },
    // {
    //   title: '주문 관리',
    //   description: '주문 현황 관리',
    //   href: '/admin/orders',
    //   icon: '📋',
    //   color: 'bg-green-500'
    // }, // TODO: 주문 관리 페이지 구현 필요
    {
      title: '사용자 관리',
      description: '회원 관리',
      href: '/admin/users',
      icon: '👥',
      color: 'bg-purple-500'
    },
    {
      title: '아티클 관리',
      description: '아티클 작성 및 관리',
      href: '/admin/articles',
      icon: '📝',
      color: 'bg-indigo-500'
    },
    // {
    //   title: '이벤트 관리',
    //   description: '이벤트 기획 및 관리',
    //   href: '/admin/events',
    //   icon: '🎉',
    //   color: 'bg-pink-500'
    // }, // TODO: 이벤트 관리 페이지 구현 필요
    {
      title: '교수자료실',
      description: '교수 자료 관리',
      href: '/admin/professor-resources',
      icon: '🎓',
      color: 'bg-teal-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 심플한 헤더 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">관리자 대시보드</h1>
            <p className="text-gray-600">골든래빗 플랫폼 관리</p>
          </div>
        </div>
      </div>

      {/* 통계 카드 - 심플 디자인 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm p-6 border">
              <div className="flex items-center">
                <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center text-white text-lg mr-4`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 관리 메뉴 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">관리 메뉴</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center">
                <div className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center text-white text-sm mr-3`}>
                  {action.icon}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{action.title}</h3>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* 최근 주문 - 심플 디자인 (TODO: orders 테이블 구현 후 활성화) */}
      {/* <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">최근 주문</h3>
            <Link
              href="/admin/orders"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              전체 보기 →
            </Link>
          </div> */}
          {/* 
          <div className="p-6">
            {stats.recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h4 className="text-lg font-medium text-gray-900 mb-2">최근 주문이 없습니다</h4>
                <p className="text-gray-500">새로운 주문이 들어오면 여기에 표시됩니다</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">주문자</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">주문 금액</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">상태</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">주문일</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stats.recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                              {order.customer_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                              <div className="text-sm text-gray-500">{order.customer_email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          {formatPrice(order.total_amount)}원
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-1 text-xs rounded ${
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {getStatusText(order.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('ko-KR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div> */}
    </div>
  )
}