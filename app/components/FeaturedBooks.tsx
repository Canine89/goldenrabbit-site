'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createSupabaseClient } from '../lib/supabase-client'
import SmartImage from './SmartImage'
import Card from './ui/Card'
import Loading from './ui/Loading'

interface Book {
  id: string
  title: string
  author: string
  price: number
  cover_image_url?: string
  is_featured: boolean
  created_at: string
}

export default function FeaturedBooks() {
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseClient()

  useEffect(() => {
    fetchFeaturedBooks()
  }, [])

  const fetchFeaturedBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(4)

      if (error) throw error
      setFeaturedBooks(data || [])
    } catch (error) {
      console.error('추천 도서 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-4">
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              추천 도서
            </h2>
            <p className="text-lg text-gray-600">
              골든래빗에서 엄선한 베스트셀러와 신간들
            </p>
          </div>
          <Link
            href="/books"
            className="inline-flex items-center px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors shadow-lg hover:shadow-xl"
          >
            전체보기
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            // 로딩 스켈레톤
            Array.from({ length: 4 }, (_, i) => (
              <Card key={i} padding="none" className="overflow-visible animate-pulse">
                <div className="p-4 pb-0">
                  <Loading.Skeleton variant="image" className="aspect-[3/4]" />
                </div>
                <div className="p-6 space-y-3">
                  <Loading.Skeleton variant="title" />
                  <Loading.Skeleton variant="text" width="75%" />
                  <Loading.Skeleton variant="text" width="50%" />
                </div>
              </Card>
            ))
          ) : featuredBooks.length > 0 ? (
            // 실제 추천 도서들
            featuredBooks.map((book) => (
              <Card
                key={book.id}
                hover={true}
                padding="none"
                className="overflow-visible group"
              >
                <Link href={`/books/${book.id}`} className="block">
                  <div className="p-4 pb-0">
                    <div className="aspect-[3/4] bg-gray-100 overflow-hidden rounded-lg shadow-sm group-hover:shadow-md transition-all duration-300">
                      <SmartImage
                        src={book.cover_image_url}
                        alt={book.title}
                        width={300}
                        height={400}
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                        fallback={
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center p-8">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                        }
                      />
                      {book.is_featured && (
                        <div className="absolute top-3 right-3 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full shadow-sm">
                          추천
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-500 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">
                      {book.author}
                    </p>
                    <p className="text-primary-500 font-bold text-lg">
                      {formatPrice(book.price)}원
                    </p>
                  </div>
                </Link>
              </Card>
            ))
          ) : (
            // 추천 도서가 없을 때 임시 카드들
            Array.from({ length: 4 }, (_, i) => (
              <Card key={i} padding="none" className="overflow-visible">
                <div className="p-4 pb-0">
                  <div className="aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500">준비 중</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">준비 중인 도서</h3>
                  <p className="text-gray-600 text-sm mb-2">곧 만나요!</p>
                  <p className="text-primary-500 font-bold text-lg">-</p>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </section>
  )
}