'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart, CartItem } from '../contexts/CartContext'
import { createSupabaseClient } from '../lib/supabase-client'
import SmartImage from '../components/SmartImage'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import PaymentWidget from '../components/PaymentWidget'

interface ShippingInfo {
  customerName: string
  customerPhone: string
  customerEmail: string
  shippingAddress: string
  shippingDetailAddress: string
  shippingPostcode: string
  shippingNote: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotalPrice, getTotalItems, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [usePaymentWidget, setUsePaymentWidget] = useState(false)
  const [paymentWidgetError, setPaymentWidgetError] = useState<string | null>(null)
  const supabase = createSupabaseClient()
  
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    shippingAddress: '',
    shippingDetailAddress: '',
    shippingPostcode: '',
    shippingNote: ''
  })

  const [errors, setErrors] = useState<Partial<ShippingInfo>>({})

  useEffect(() => {
    // 사용자 정보 가져오기
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        setShippingInfo(prev => ({
          ...prev,
          customerEmail: user.email || ''
        }))
      }
    }
    fetchUser()
  }, [])

  useEffect(() => {
    // 장바구니가 비어있으면 장바구니 페이지로 리다이렉트
    if (items.length === 0) {
      router.push('/cart')
    }
  }, [items, router])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  const formatTextWithBreaks = (text: string) => {
    if (!text) return text
    return text.split('\n').map((line, index, array) => (
      <React.Fragment key={index}>
        {line}
        {index < array.length - 1 && <br />}
      </React.Fragment>
    ))
  }

  const validateForm = () => {
    const newErrors: Partial<ShippingInfo> = {}
    
    if (!shippingInfo.customerName.trim()) {
      newErrors.customerName = '받는 사람 이름을 입력해주세요'
    }
    
    if (!shippingInfo.customerPhone.trim()) {
      newErrors.customerPhone = '연락처를 입력해주세요'
    } else if (!/^[0-9-]+$/.test(shippingInfo.customerPhone)) {
      newErrors.customerPhone = '올바른 연락처 형식이 아닙니다'
    }
    
    if (!shippingInfo.customerEmail.trim()) {
      newErrors.customerEmail = '이메일을 입력해주세요'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingInfo.customerEmail)) {
      newErrors.customerEmail = '올바른 이메일 형식이 아닙니다'
    }
    
    if (!shippingInfo.shippingAddress.trim()) {
      newErrors.shippingAddress = '배송 주소를 입력해주세요'
    }
    
    if (!shippingInfo.shippingPostcode.trim()) {
      newErrors.shippingPostcode = '우편번호를 입력해주세요'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }))
    // 입력 시 해당 필드의 에러 제거
    if (errors[name as keyof ShippingInfo]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  const generateOrderId = () => {
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 9)
    return `order_${timestamp}_${randomStr}`
  }

  const generateOrderNumber = () => {
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    const timeStr = Date.now().toString().slice(-6) // 마지막 6자리
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `ORD${dateStr}${timeStr}${randomStr}`
  }

  const handlePaymentSuccess = async (paymentData: any) => {
    try {
      console.log('결제 성공:', paymentData)
      // 결제 성공 시 추가 로직이 필요한 경우 여기에 작성
      // 예: 주문 정보 저장, 장바구니 비우기 등은 결제 승인 API에서 처리
    } catch (error) {
      console.error('결제 성공 후처리 실패:', error)
    }
  }

  const handlePaymentFail = (error: any) => {
    console.error('결제 실패:', error)
    setPaymentWidgetError(error?.message || '결제에 실패했습니다.')
    // 자동으로 테스트 주문으로 폴백
    setUsePaymentWidget(false)
    alert('결제 위젯에 문제가 발생했습니다. 테스트 주문으로 변경됩니다.')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    if (usePaymentWidget) {
      // 결제위젯 사용 시에는 결제위젯이 처리
      return
    }
    
    // 기존 테스트 주문 처리 (결제위젯을 사용하지 않는 경우)
    setLoading(true)
    
    try {
      const orderNumber = generateOrderNumber()
      
      // 주문 생성
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id || null,
          order_number: orderNumber,
          total_amount: getTotalPrice(),
          status: 'pending',
          customer_name: shippingInfo.customerName,
          customer_phone: shippingInfo.customerPhone,
          customer_email: shippingInfo.customerEmail,
          shipping_address: `${shippingInfo.shippingAddress} ${shippingInfo.shippingDetailAddress}`.trim(),
          shipping_postcode: shippingInfo.shippingPostcode,
          shipping_note: shippingInfo.shippingNote
        })
        .select()
        .single()
      
      if (orderError) throw orderError
      
      // 주문 상품 저장
      const orderItems = items.map(item => ({
        order_id: orderData.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price
      }))
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
      
      if (itemsError) throw itemsError
      
      // 장바구니 비우기
      clearCart()
      
      // 주문 완료 페이지로 이동
      router.push(`/checkout/complete?order=${orderNumber}`)
      
    } catch (error) {
      console.error('주문 처리 실패:', error)
      alert('주문 처리 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const getCategoryName = (category: string) => {
    const categories: { [key: string]: string } = {
      'goods': '굿즈',
      'lifestyle': '생활용품',
      'stationery': '문구',
      'clothing': '의류',
      'other': '기타'
    }
    return categories[category] || category
  }

  if (items.length === 0) {
    return null // useEffect에서 리다이렉트 처리
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 섹션 */}
      <div className="bg-gradient-gold shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center">
            <h1 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4 text-white">주문하기</h1>
            <p className="text-base sm:text-lg max-w-2xl mx-auto text-white opacity-90 px-2">
              배송 정보를 입력하고 주문을 완료하세요
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* 왼쪽: 배송 정보 입력 */}
            <div className="lg:col-span-2">
              <Card>
                <h2 className="text-xl font-bold text-gray-900 mb-6">배송 정보</h2>
                
                <div className="space-y-4">
                  {/* 받는 사람 */}
                  <div>
                    <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                      받는 사람 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="customerName"
                      name="customerName"
                      value={shippingInfo.customerName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        errors.customerName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="홍길동"
                    />
                    {errors.customerName && (
                      <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>
                    )}
                  </div>

                  {/* 연락처 */}
                  <div>
                    <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-1">
                      연락처 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="customerPhone"
                      name="customerPhone"
                      value={shippingInfo.customerPhone}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        errors.customerPhone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="010-1234-5678"
                    />
                    {errors.customerPhone && (
                      <p className="mt-1 text-sm text-red-600">{errors.customerPhone}</p>
                    )}
                  </div>

                  {/* 이메일 */}
                  <div>
                    <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                      이메일 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="customerEmail"
                      name="customerEmail"
                      value={shippingInfo.customerEmail}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        errors.customerEmail ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="example@email.com"
                    />
                    {errors.customerEmail && (
                      <p className="mt-1 text-sm text-red-600">{errors.customerEmail}</p>
                    )}
                  </div>

                  {/* 우편번호 */}
                  <div>
                    <label htmlFor="shippingPostcode" className="block text-sm font-medium text-gray-700 mb-1">
                      우편번호 <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="shippingPostcode"
                        name="shippingPostcode"
                        value={shippingInfo.shippingPostcode}
                        onChange={handleInputChange}
                        className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors.shippingPostcode ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="12345"
                      />
                      <Button type="button" variant="outline" onClick={() => alert('우편번호 검색 기능은 준비 중입니다')}>
                        우편번호 찾기
                      </Button>
                    </div>
                    {errors.shippingPostcode && (
                      <p className="mt-1 text-sm text-red-600">{errors.shippingPostcode}</p>
                    )}
                  </div>

                  {/* 주소 */}
                  <div>
                    <label htmlFor="shippingAddress" className="block text-sm font-medium text-gray-700 mb-1">
                      주소 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="shippingAddress"
                      name="shippingAddress"
                      value={shippingInfo.shippingAddress}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        errors.shippingAddress ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="서울특별시 강남구 테헤란로 123"
                    />
                    {errors.shippingAddress && (
                      <p className="mt-1 text-sm text-red-600">{errors.shippingAddress}</p>
                    )}
                  </div>

                  {/* 상세주소 */}
                  <div>
                    <label htmlFor="shippingDetailAddress" className="block text-sm font-medium text-gray-700 mb-1">
                      상세주소
                    </label>
                    <input
                      type="text"
                      id="shippingDetailAddress"
                      name="shippingDetailAddress"
                      value={shippingInfo.shippingDetailAddress}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="○○빌딩 5층"
                    />
                  </div>

                  {/* 배송 메모 */}
                  <div>
                    <label htmlFor="shippingNote" className="block text-sm font-medium text-gray-700 mb-1">
                      배송 메모
                    </label>
                    <textarea
                      id="shippingNote"
                      name="shippingNote"
                      value={shippingInfo.shippingNote}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="배송 시 요청사항을 입력해주세요"
                    />
                  </div>
                </div>
              </Card>

              {/* 주문 상품 목록 */}
              <Card className="mt-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">주문 상품</h2>
                
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0">
                      {/* 상품 이미지 */}
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                          <SmartImage
                            src={item.image_url}
                            alt={item.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                            fallback={
                              <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                                <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              </div>
                            }
                          />
                        </div>
                      </div>

                      {/* 상품 정보 */}
                      <div className="flex-1 min-w-0">
                        <span className="inline-block px-2 py-0.5 text-xs bg-primary-100 text-primary-700 rounded-full mb-1">
                          {getCategoryName(item.category)}
                        </span>
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-1">
                          {formatTextWithBreaks(item.name)}
                        </h3>
                        <div className="text-sm text-gray-500">
                          {formatPrice(item.price)}원 × {item.quantity}개
                        </div>
                      </div>

                      {/* 가격 */}
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatPrice(item.price * item.quantity)}원
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* 오른쪽: 결제 정보 */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <Card>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">결제 정보</h3>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">상품 개수</span>
                      <span className="font-medium">{getTotalItems()}개</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">상품 금액</span>
                      <span className="font-medium">{formatPrice(getTotalPrice())}원</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">배송비</span>
                      <span className="font-medium">무료</span>
                    </div>
                    <hr />
                    <div className="flex justify-between text-lg font-bold">
                      <span>총 결제 금액</span>
                      <span className="text-primary-500">{formatPrice(getTotalPrice())}원</span>
                    </div>
                  </div>

                  {/* 결제 방법 선택 */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">결제 방법 선택</h4>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="widget"
                          checked={usePaymentWidget}
                          onChange={(e) => setUsePaymentWidget(e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm">토스페이먼츠 결제위젯 (실제 결제)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="test"
                          checked={!usePaymentWidget}
                          onChange={(e) => setUsePaymentWidget(!e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm">테스트 주문 (결제 없음)</span>
                      </label>
                    </div>
                    
                    {/* 결제 위젯 오류 시 경고 표시 */}
                    {paymentWidgetError && (
                      <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-amber-700">
                              <strong>결제 위젯 오류:</strong> {paymentWidgetError}
                            </p>
                            <p className="text-xs text-amber-600 mt-1">
                              테스트 주문으로 진행하거나 페이지를 새로고침해주세요.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {!usePaymentWidget && (
                    <div className="space-y-3">
                      <Button
                        type="submit"
                        size="lg"
                        className="w-full"
                        disabled={loading}
                      >
                        {loading ? '주문 처리 중...' : '테스트 주문하기'}
                      </Button>
                      <Link href="/cart">
                        <Button
                          type="button"
                          variant="outline"
                          size="lg"
                          className="w-full"
                        >
                          장바구니로 돌아가기
                        </Button>
                      </Link>
                    </div>
                  )}

                  {/* 결제 안내 */}
                  {!usePaymentWidget && (
                    <div className="mt-6 bg-amber-50 rounded-lg p-4 text-sm text-amber-800">
                      <p className="font-medium mb-2">⚠️ 테스트 주문 안내</p>
                      <p>현재는 테스트 주문으로 실제 결제는 진행되지 않습니다.</p>
                    </div>
                  )}

                  {usePaymentWidget && (
                    <div className="mt-6 bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
                      <p className="font-medium mb-2">💳 실제 결제 안내</p>
                      <p>토스페이먼츠를 통한 실제 결제가 진행됩니다. 테스트 환경에서는 실제 돈이 출금되지 않습니다.</p>
                    </div>
                  )}

                  {/* 주문 안내 */}
                  <div className="mt-4 bg-gray-50 rounded-lg p-4 text-sm text-gray-600 space-y-2">
                    <p>• 주문 완료 후 주문번호가 발급됩니다</p>
                    <p>• 배송은 주문 후 1-3일 내에 시작됩니다</p>
                    <p>• 주문 내역은 마이페이지에서 확인 가능합니다</p>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {/* 토스페이먼츠 결제위젯 섹션 */}
          {usePaymentWidget && (
            <div className="mt-8">
              <Card>
                <h2 className="text-xl font-bold text-gray-900 mb-6">결제하기</h2>
                <PaymentWidget
                  amount={getTotalPrice()}
                  orderId={generateOrderId()}
                  orderName={`토끼상점 상품 ${getTotalItems()}건`}
                  customerName={shippingInfo.customerName}
                  customerEmail={shippingInfo.customerEmail}
                  customerMobilePhone={shippingInfo.customerPhone}
                  shippingAddress={`${shippingInfo.shippingAddress} ${shippingInfo.shippingDetailAddress}`.trim()}
                  shippingPostcode={shippingInfo.shippingPostcode}
                  shippingNote={shippingInfo.shippingNote}
                  cartItems={items}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentFail={handlePaymentFail}
                />
              </Card>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}