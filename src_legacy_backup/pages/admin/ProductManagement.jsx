import { useState, useEffect } from 'react'
import { useRabbitStoreProducts } from '../../hooks/useRabbitStore'
import { supabase } from '../../lib/supabase'
import ImageUpload from '../../components/admin/ImageUpload'
import SmartImage from '../../components/common/SmartImage'
import Container from '../../components/ui/Container'
import Section from '../../components/ui/Section'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Loading from '../../components/ui/Loading'
import Alert from '../../components/ui/Alert'

export default function ProductManagement() {
  const { products, loading, error, refetch } = useRabbitStoreProducts()
  const [filteredProducts, setFilteredProducts] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('전체')
  const [selectedStatus, setSelectedStatus] = useState('전체')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    image_url: '',
    category: ''
  })

  const categories = ['굿즈', '생활용품', '문구', '의류', '기타']
  const allCategories = ['전체', ...categories]
  const statusOptions = ['전체', '활성', '비활성']

  const filterProducts = () => {
    let filtered = products

    if (selectedCategory !== '전체') {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }

    if (selectedStatus !== '전체') {
      const isActive = selectedStatus === '활성'
      filtered = filtered.filter(product => product.is_active === isActive)
    }

    setFilteredProducts(filtered)
  }

  useEffect(() => {
    setFilteredProducts(products)
  }, [products])

  useEffect(() => {
    filterProducts()
  }, [products, selectedCategory, selectedStatus])

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      stock_quantity: '',
      image_url: '',
      category: ''
    })
    setEditingProduct(null)
    setShowAddForm(false)
  }

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      image_url: product.image_url || '',
      category: product.category || ''
    })
    setEditingProduct(product)
    setShowAddForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseInt(formData.price),
        stock_quantity: parseInt(formData.stock_quantity),
        image_url: formData.image_url,
        category: formData.category
      }

      if (editingProduct) {
        // 수정
        const { error } = await supabase
          .from('rabbit_store_products')
          .update(productData)
          .eq('id', editingProduct.id)

        if (error) throw error
      } else {
        // 새 상품 등록
        const { error } = await supabase
          .from('rabbit_store_products')
          .insert([productData])

        if (error) throw error
      }

      resetForm()
      refetch()
    } catch (error) {
      alert('상품 저장 중 오류가 발생했습니다.')
    }
  }

  const handleDelete = async (product) => {
    if (!confirm(`"${product.name}" 상품을 완전히 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('rabbit_store_products')
        .delete()
        .eq('id', product.id)

      if (error) throw error

      alert('상품이 삭제되었습니다.')
      refetch()
    } catch (error) {
      alert('상품 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleToggleActive = async (product) => {
    const newStatus = !product.is_active
    const action = newStatus ? '활성화' : '비활성화'
    
    if (!confirm(`"${product.name}" 상품을 ${action} 하시겠습니까?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('rabbit_store_products')
        .update({ is_active: newStatus })
        .eq('id', product.id)

      if (error) throw error

      alert(`상품이 ${action}되었습니다.`)
      refetch()
    } catch (error) {
      alert(`상품 ${action} 중 오류가 발생했습니다.`)
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 심플한 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">토끼상점 관리</h1>
          <p className="text-neutral-600 mt-1">총 {products.length}개의 상품 등록됨</p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          variant="primary"
          className="px-4 py-2"
        >
          + 새 상품 추가
        </Button>
      </div>

      {/* 컴팩트한 필터 바 */}
      <div className="bg-white rounded-lg border border-neutral-200 p-4 mb-6">
        <div className="flex items-center gap-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-neutral-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          >
            {allCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="border border-neutral-300 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
          >
            {statusOptions.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <div className="text-sm text-neutral-500 ml-auto">
            {filteredProducts.length}개 표시
          </div>
        </div>
      </div>

      {/* 상품 등록/수정 폼 */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingProduct ? '상품 수정' : '새 상품 등록'}
              </h2>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상품명 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  카테고리
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">카테고리 선택</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    가격 (원) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                    onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <ImageUpload
                  value={formData.image_url}
                  onChange={(url) => setFormData({...formData, image_url: url})}
                  label="상품 이미지"
                  bucket="images"
                  folder="products"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상품 설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows="3"
                  placeholder="상품 설명을 입력하세요"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  {editingProduct ? '수정' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 심플한 상품 목록 */}
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        {error ? (
          <div className="p-6 text-center">
            <p className="text-red-600 mb-3">데이터를 불러오는 중 오류가 발생했습니다.</p>
            <button 
              onClick={refetch} 
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
            >
              다시 시도
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-12 h-12 mx-auto text-neutral-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="text-lg font-medium text-neutral-900 mb-2">
              {selectedCategory === '전체' && selectedStatus === '전체' 
                ? '등록된 상품이 없습니다'
                : '조건에 맞는 상품이 없습니다'
              }
            </h3>
            <p className="text-neutral-500">
              {selectedCategory === '전체' && selectedStatus === '전체' 
                ? '새 상품을 추가해보세요'
                : '다른 필터를 시도해보세요'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase">상품</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase">카테고리</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase">가격</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase">재고</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase">등록일</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-500 uppercase">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 mr-3 flex-shrink-0">
                          <SmartImage
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full rounded object-cover"
                            fallback={
                              <div className="w-full h-full rounded bg-neutral-200 flex items-center justify-center">
                                <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                              </div>
                            }
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-neutral-900">
                            {product.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {product.category || '미분류'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-neutral-900">
                      {formatPrice(product.price)}원
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 text-xs rounded ${
                        product.stock_quantity > 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.stock_quantity}개
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-neutral-500">
                      {new Date(product.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleEdit(product)}
                          className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleToggleActive(product)}
                          className={`px-2 py-1 text-xs rounded transition-colors ${
                            product.is_active 
                              ? 'text-orange-600 hover:text-orange-800 hover:bg-orange-50' 
                              : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                          }`}
                        >
                          {product.is_active ? '비활성화' : '활성화'}
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
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
    </div>
  )
}