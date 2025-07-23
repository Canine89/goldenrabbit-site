'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { createSupabaseClient } from '../lib/supabase-client'
import SmartImage from '../components/SmartImage'
import Card from '../components/ui/Card'
import Loading from '../components/ui/Loading'
import Button from '../components/ui/Button'

interface Book {
  id: string
  title: string
  author: string
  price: number
  cover_image_url?: string
  category: string
  is_featured: boolean
  is_active: boolean
  created_at: string
}

const categories = [
  { id: 'all', name: '전체', slug: 'all' },
  { id: '경제경영', name: '경제경영', slug: 'economy' },
  { id: 'IT전문서', name: 'IT전문서', slug: 'it-professional' },
  { id: 'IT활용서', name: 'IT활용서', slug: 'it-practical' },
  { id: '학습만화', name: '학습만화', slug: 'comic' },
  { id: '좋은여름', name: '좋은여름', slug: 'good-summer' },
  { id: '수상작품', name: '수상작품', slug: 'award' },
]

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createSupabaseClient()

  useEffect(() => {
    fetchBooks()
  }, [selectedCategory])

  const fetchBooks = async () => {
    try {
      setLoading(true)
      
      
      let query = supabase
        .from('books')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory)
      }

      const { data, error } = await query

      if (error) throw error
      setBooks(data || [])
    } catch (error) {
      console.error('도서 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  // Enter로 입력된 줄바꿈을 JSX로 처리하는 함수
  const formatTextWithBreaks = (text: string) => {
    if (!text) return text
    return text.split('\n').map((line, index, array) => (
      <React.Fragment key={index}>
        {line}
        {index < array.length - 1 && <br />}
      </React.Fragment>
    ))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 섹션 */}
      <div className="bg-gradient-gold shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4 text-white">도서 목록</h1>
            <p className="text-lg max-w-2xl mx-auto text-white opacity-90">
              골든래빗의 다양한 전문서와 실용서를 만나보세요
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 검색 및 필터 */}
        <div className="mb-8 space-y-6">
          {/* 검색바 */}
          <div className="relative max-w-lg mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="도서 제목이나 저자를 검색하세요..."
              className="block w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-xl shadow-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:outline-none transition-all duration-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="검색어 지우기"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* 카테고리 필터 */}
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-2 rounded-full font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary-500 text-white shadow-lg'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* 도서 목록 */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }, (_, i) => (
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
            ))}
          </div>
        ) : filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <Card
                key={book.id}
                hover={true}
                padding="none"
                className="overflow-visible group"
              >
                <Link href={`/books/${book.id}`} className="block">
                  <div className="p-4 pb-0">
                    <div className="aspect-[3/4] bg-neutral-100 overflow-hidden rounded-lg shadow-sm group-hover:shadow-md transition-all duration-300">
                      <SmartImage
                        src={book.cover_image_url}
                        alt={book.title}
                        width={300}
                        height={400}
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                        fallback={
                          <div className="w-full h-full bg-neutral-100 flex items-center justify-center p-8">
                            <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                        }
                      />
                      {book.is_featured && (
                        <div className="absolute top-3 right-3 px-2 py-1 bg-secondary-500 text-neutral-900 text-xs font-medium rounded-full shadow-sm">
                          추천
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2 line-clamp-2 group-hover:text-primary-500 transition-colors">
                      {formatTextWithBreaks(book.title)}
                    </h3>
                    <p className="text-neutral-600 text-sm mb-2">
                      {formatTextWithBreaks(book.author)}
                    </p>
                    <p className="text-primary-500 font-bold text-lg">
                      {formatPrice(book.price)}원
                    </p>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchQuery ? '검색 결과가 없습니다' : '등록된 도서가 없습니다'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery ? '다른 검색어로 시도해보세요' : '곧 새로운 도서들이 추가될 예정입니다'}
            </p>
            {searchQuery && (
              <Button onClick={() => setSearchQuery('')} variant="outline">
                검색 초기화
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}