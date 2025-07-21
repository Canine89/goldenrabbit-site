import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import Container from '../../components/ui/Container'
import Section from '../../components/ui/Section'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Loading from '../../components/ui/Loading'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalProducts: 0,
    totalOrders: 0,
    recentOrders: []
  })
  const [loading, setLoading] = useState(true)

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

      // 주문 수 조회
      const { count: orderCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })

      // 최근 주문 조회
      const { data: recentOrders } = await supabase
        .from('orders')
        .select(`
          *,
          profiles (username, email)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  const getStatusVariant = (status) => {
    switch (status) {
      case 'pending':
        return 'warning'
      case 'confirmed':
        return 'info'
      case 'shipped':
        return 'primary'
      case 'delivered':
        return 'success'
      case 'cancelled':
        return 'danger'
      default:
        return 'neutral'
    }
  }

  const getStatusText = (status) => {
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
      change: null
    },
    {
      title: '토끼상점 상품 수',
      value: stats.totalProducts,
      icon: '🛍️',
      color: 'bg-orange-500',
      change: null
    },
    {
      title: '총 주문 수',
      value: stats.totalOrders,
      icon: '📋',
      color: 'bg-green-500',
      change: null
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
    {
      title: '주문 관리',
      description: '주문 현황 관리',
      href: '/admin/orders',
      icon: '📋',
      color: 'bg-green-500'
    },
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
    {
      title: '이벤트 관리',
      description: '이벤트 기획 및 관리',
      href: '/admin/events',
      icon: '🎉',
      color: 'bg-pink-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* 모던 헤더 섹션 */}
      <div className="relative overflow-hidden">
        {/* 배경 패턴 */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="relative px-6 py-16 sm:py-24">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-6">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                관리자 권한
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                관리자 대시보드
              </h1>
              <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                골든래빗 플랫폼의 모든 관리 기능을 한곳에서 효율적으로 운영하세요
              </p>
              
              {/* 실시간 상태 인디케이터 */}
              <div className="flex items-center justify-center mt-8">
                <div className="flex items-center px-4 py-2 bg-green-500/20 backdrop-blur-sm rounded-full text-green-100">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></div>
                  시스템 정상 운영 중
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 통계 카드 - 모던 디자인 */}
      <div className="px-6 -mt-16 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {statCards.map((stat, index) => (
              <div key={index} className="group">
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20 hover:shadow-2xl hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center text-white text-xl shadow-lg`}>
                          {stat.icon}
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                        </div>
                      </div>
                      <p className="text-4xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {stat.value.toLocaleString()}
                      </p>
                      <div className="flex items-center mt-3 text-sm">
                        <span className="text-green-600 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L10 4.414 4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          활성화됨
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 빠른 액션 - 프리미엄 디자인 */}
      <div className="px-6 py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">빠른 액션</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              자주 사용하는 관리 기능에 빠르게 접근하세요
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.href}
                className="group block"
              >
                <div className="relative bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                  {/* 배경 그라디언트 효과 */}
                  <div className={`absolute top-0 right-0 w-20 h-20 ${action.color} opacity-10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500`}></div>
                  
                  {/* 아이콘 */}
                  <div className={`w-16 h-16 ${action.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <span className="text-white text-2xl">
                      {action.icon}
                    </span>
                  </div>
                  
                  {/* 콘텐츠 */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {action.description}
                  </p>
                  
                  {/* 버튼 */}
                  <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
                    <span>바로가기</span>
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 최근 주문 - 엘레간트 디자인 */}
      <div className="px-6 py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            {/* 헤더 */}
            <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">최근 주문</h3>
                  <p className="text-gray-600">최근 들어온 주문 현황을 확인하세요</p>
                </div>
                <Link
                  to="/admin/orders"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
                >
                  전체 보기
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* 콘텐츠 */}
            <div className="p-8">
              {stats.recentOrders.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">최근 주문이 없습니다</h4>
                  <p className="text-gray-600">새로운 주문이 들어오면 여기에 표시됩니다</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-100">
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">주문자</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">주문 금액</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">상태</th>
                        <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm uppercase tracking-wider">주문일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentOrders.map((order, index) => (
                        <tr key={order.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${index === 0 ? 'bg-blue-50/30' : ''}`}>
                          <td className="py-6 px-6">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-4">
                                {order.customer_name?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {order.customer_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {order.customer_email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-6 px-6">
                            <div className="text-lg font-bold text-gray-900">
                              {formatPrice(order.total_amount)}원
                            </div>
                          </td>
                          <td className="py-6 px-6">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
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
                          <td className="py-6 px-6 text-sm text-gray-500 font-medium">
                            {new Date(order.created_at).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}