'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'

export default function OrderCompletePage() {
  const searchParams = useSearchParams()
  const [orderNumber, setOrderNumber] = useState<string>('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const order = searchParams.get('order')
    if (order) {
      setOrderNumber(order)
    }
  }, [searchParams])

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 섹션 */}
      <div className="bg-gradient-gold shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center">
            <h1 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4 text-white">주문 완료</h1>
            <p className="text-base sm:text-lg max-w-2xl mx-auto text-white opacity-90 px-2">
              주문이 성공적으로 접수되었습니다
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="text-center">
          {/* 성공 아이콘 */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">주문이 완료되었습니다!</h2>
          
          {orderNumber && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <p className="text-sm text-gray-600 mb-2">주문번호</p>
              <p className="text-2xl font-bold text-primary-500">{orderNumber}</p>
            </div>
          )}

          <div className="space-y-4 text-gray-600 mb-8">
            <p>주문 내역이 입력하신 이메일로 발송되었습니다.</p>
            <p className="text-sm">
              (실제 이메일 발송 기능은 준비 중입니다)
            </p>
          </div>

          {/* 안내 메시지 */}
          <div className="bg-amber-50 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-medium text-amber-900 mb-3">📌 안내사항</h3>
            <ul className="space-y-2 text-sm text-amber-800">
              <li>• 현재는 테스트 주문으로 실제 결제는 진행되지 않았습니다</li>
              <li>• 주문 상태는 '결제 대기' 상태로 저장되었습니다</li>
              <li>• 실제 결제 시스템은 추후 연동 예정입니다</li>
              <li>• 주문 내역은 마이페이지에서 확인하실 수 있습니다</li>
            </ul>
          </div>

          {/* 다음 단계 */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-medium text-gray-900 mb-3">다음 단계</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 주문 확인 이메일을 확인해주세요</li>
              <li>• 배송 준비가 완료되면 알림을 보내드립니다</li>
              <li>• 배송은 주문 후 1-3일 내에 시작됩니다</li>
              <li>• 문의사항은 고객센터로 연락해주세요</li>
            </ul>
          </div>

          {/* 버튼 */}
          <div className="space-y-3">
            <Link href="/rabbit-store">
              <Button size="lg" className="w-full sm:w-auto">
                쇼핑 계속하기
              </Button>
            </Link>
            
            {/* 주문 내역 보기는 마이페이지 구현 후 활성화 */}
            <div className="text-sm text-gray-500">
              <p>주문 내역 확인 기능은 준비 중입니다</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}