'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseClient } from '../../lib/supabase-client'
import SmartImage from '../../components/SmartImage'
import Loading from '../../components/ui/Loading'
import Button from '../../components/ui/Button'
import { 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  toggleProductStatus,
  toggleFeaturedProduct,
  updateStock,
  getAdminProducts 
} from '../../../lib/actions/product-actions'
import type { Product } from '../../../lib/actions/product-actions'

interface FormData {
  name: string
  description: string
  price: string
  image_url: string
  category: string
  stock_quantity: string
  is_active: boolean
  is_featured: boolean
}

const categories = [
  { id: 'all', name: '전체' },
  { id: '굿즈', name: '굿즈' },
  { id: '생활용품', name: '생활용품' },
  { id: '문구', name: '문구' },
  { id: '의류', name: '의류' },
  { id: '기타', name: '기타' },
]

const statusOptions = [
  { id: 'all', name: '전체' },
  { id: 'active', name: '활성' },
  { id: 'inactive', name: '비활성' },
]

export default function ProductManagementPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [isPending, startTransition] = useTransition()
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    price: '',
    image_url: '',
    category: '굿즈',
    stock_quantity: '0',
    is_active: true,
    is_featured: false
  })

  const [error, setError] = useState<string>('')
  const supabase = createSupabaseClient()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchProducts()
    }
  }, [user, currentPage, searchQuery, selectedCategory, selectedStatus])

  // 필터가 변경되면 첫 페이지로 이동
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, selectedStatus])

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        router.push('/')
        return
      }

      setUser(user)
    } catch (error) {
      console.error('인증 확인 실패:', error)
      router.push('/')
    }
  }

  const fetchProducts = async () => {
    try {
      setLoading(true)
      let allProducts: Product[] = []
      let page = 1
      let hasMore = true
      
      // 모든 상품을 가져온 후 클라이언트에서 필터링
      while (hasMore) {
        const result = await getAdminProducts(page, 100) // 한 번에 많이 가져오기
        
        if (result.success && result.data) {
          allProducts = [...allProducts, ...result.data.products]
          hasMore = result.data.products.length === 100
          page++
        } else {
          hasMore = false
        }
      }
      
      // 필터링 적용
      let filteredProducts = allProducts
      
      // 검색 필터
      if (searchQuery.trim()) {
        filteredProducts = filteredProducts.filter(product => 
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      }
      
      // 카테고리 필터
      if (selectedCategory !== 'all') {
        filteredProducts = filteredProducts.filter(product => product.category === selectedCategory)
      }
      
      // 상태 필터
      if (selectedStatus !== 'all') {
        const isActive = selectedStatus === 'active'
        filteredProducts = filteredProducts.filter(product => product.is_active === isActive)
      }
      
      // 페이지네이션 적용
      const itemsPerPage = 20
      const startIndex = (currentPage - 1) * itemsPerPage
      const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage)
      
      setProducts(paginatedProducts)
      setTotalPages(Math.ceil(filteredProducts.length / itemsPerPage))
      
    } catch (error) {
      console.error('상품 조회 실패:', error)
      setError('상품 목록을 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      image_url: '',
      category: '굿즈',
      stock_quantity: '0',
      is_active: true,
      is_featured: false
    })
    setEditingProduct(null)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    startTransition(async () => {
      const formDataObj = new FormData()
      formDataObj.append('name', formData.name)
      formDataObj.append('description', formData.description)
      formDataObj.append('price', formData.price)
      formDataObj.append('image_url', formData.image_url)
      formDataObj.append('category', formData.category)
      formDataObj.append('stock_quantity', formData.stock_quantity)
      formDataObj.append('is_active', formData.is_active.toString())
      formDataObj.append('is_featured', formData.is_featured.toString())

      let result
      if (editingProduct) {
        formDataObj.append('id', editingProduct.id)
        result = await updateProduct(formDataObj)
      } else {
        result = await createProduct(formDataObj)
      }

      if (result.success) {
        setShowModal(false)
        resetForm()
        fetchProducts()
        alert(result.message)
      } else {
        setError(result.error)
      }
    })
  }

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      image_url: product.image_url || '',
      category: product.category,
      stock_quantity: product.stock_quantity.toString(),
      is_active: product.is_active,
      is_featured: product.is_featured || false
    })
    setEditingProduct(product)
    setShowModal(true)
  }

  const handleDelete = async (product: Product) => {
    if (!confirm(`"${product.name}" 상품을 삭제하시겠습니까?`)) {
      return
    }

    startTransition(async () => {
      const result = await deleteProduct(product.id)
      
      if (result.success) {
        fetchProducts()
        alert(result.message)
      } else {
        alert(result.error)
      }
    })
  }

  const handleToggleStatus = async (product: Product) => {
    startTransition(async () => {
      const result = await toggleProductStatus(product.id, !product.is_active)
      
      if (result.success) {
        fetchProducts()
      } else {
        alert(result.error)
      }
    })
  }

  const handleToggleFeatured = async (product: Product) => {
    startTransition(async () => {
      const result = await toggleFeaturedProduct(product.id, !product.is_featured)
      
      if (result.success) {
        fetchProducts()
      } else {
        alert(result.error)
      }
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading />
      </div>
    )
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">상품 관리</h1>
          <p className="text-gray-600 mt-1">총 {products.length}개의 상품 등록됨</p>
        </div>
        <Button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="px-6 py-3"
        >
          + 새 상품 추가
        </Button>
      </div>

      {/* 필터 바 */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="상품명 또는 설명으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {statusOptions.map(status => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </select>

          <div className="text-sm text-gray-500 ml-auto">
            {products.length}개 표시
          </div>
        </div>
      </div>

      {/* 상품 목록 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {error ? (
          <div className="p-6 text-center">
            <p className="text-red-600 mb-3">{error}</p>
            <button 
              onClick={fetchProducts} 
              className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg"
            >
              다시 시도
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? '조건에 맞는 상품이 없습니다'
                : '등록된 상품이 없습니다'
              }
            </h3>
            <p className="text-gray-500">
              {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? '다른 검색어나 필터를 시도해보세요'
                : '새 상품을 추가해보세요'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">상품</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">카테고리</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">가격</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">재고</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">상태</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">등록일</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-12 h-16 mr-3 flex-shrink-0">
                            <SmartImage
                              src={product.image_url}
                              alt={product.name}
                              width={48}
                              height={64}
                              className="w-full h-full object-cover rounded"
                              fallback={
                                <div className="w-full h-full rounded bg-gray-200 flex items-center justify-center">
                                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                  </svg>
                                </div>
                              }
                            />
                          </div>
                          <div className="min-w-0">
                            <button
                              onClick={() => handleEdit(product)}
                              className="text-sm font-medium text-gray-900 mb-1 hover:text-primary-600 text-left transition-colors cursor-pointer"
                              title="클릭하여 수정"
                            >
                              {product.name}
                            </button>
                            <div className="text-sm text-gray-600">
                              {product.description && product.description.length > 30 
                                ? `${product.description.substring(0, 30)}...` 
                                : product.description
                              }
                            </div>
                            {product.is_featured && (
                              <span className="inline-block mt-1 px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                                추천
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          {product.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">
                        {formatPrice(product.price)}원
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {product.stock_quantity}개
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 text-xs rounded ${
                          product.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {product.is_active ? '활성' : '비활성'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(product.created_at).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="px-3 py-1 text-xs text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleToggleStatus(product)}
                            className={`px-3 py-1 text-xs rounded ${
                              product.is_active 
                                ? 'text-orange-600 hover:text-orange-800 bg-orange-50 hover:bg-orange-100' 
                                : 'text-green-600 hover:text-green-800 bg-green-50 hover:bg-green-100'
                            }`}
                          >
                            {product.is_active ? '비활성화' : '활성화'}
                          </button>
                          <button
                            onClick={() => handleToggleFeatured(product)}
                            className={`px-3 py-1 text-xs rounded ${
                              product.is_featured
                                ? 'text-yellow-600 hover:text-yellow-800 bg-yellow-50 hover:bg-yellow-100'
                                : 'text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100'
                            }`}
                          >
                            {product.is_featured ? '★' : '☆'}
                          </button>
                          <button
                            onClick={() => handleDelete(product)}
                            className="px-3 py-1 text-xs text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 rounded"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                이전
              </Button>
              
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i
                if (pageNum > totalPages) return null
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "primary" : "outline"}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                )
              })}
              
              <Button
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                다음
              </Button>
            </div>
          </div>
        )}

        {/* 상품 추가/수정 모달 */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div 
              className="bg-white rounded-lg p-8 w-full max-w-4xl max-h-[98vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" 
              style={{scrollbarGutter: 'stable'}}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingProduct ? '상품 수정' : '새 상품 등록'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false)
                    resetForm()
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 오류 메시지 표시 */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {/* 기본 정보 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      상품명 *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      카테고리 *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="">카테고리 선택</option>
                      {categories.slice(1).map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      가격 (원) *
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      min="100"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      재고 수량 *
                    </label>
                    <input
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      min="0"
                      required
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      이미지 URL
                    </label>
                    <input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="구글 드라이브 공유 링크 또는 이미지 URL"
                    />
                  </div>
                </div>

                {/* 상품 설명 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    상품 설명
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                    rows={4}
                    placeholder="상품에 대한 자세한 설명을 입력하세요"
                  />
                </div>

                {/* 상품 옵션 */}
                <div className="flex items-center gap-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 block text-sm text-gray-700">
                      활성화
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 block text-sm text-gray-700">
                      추천 상품으로 설정
                    </span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      resetForm()
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <Button type="submit" className="px-6 py-2" disabled={isPending}>
                    {isPending ? '처리 중...' : (editingProduct ? '수정' : '등록')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  )
}