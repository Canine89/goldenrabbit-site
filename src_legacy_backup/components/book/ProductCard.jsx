import { useStore } from '../../store/useStore'

export default function ProductCard({ product }) {
  const { addToCart } = useStore()

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  const handleAddToCart = () => {
    if (product.stock_quantity > 0) {
      addToCart(product)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        )}
        
        {/* 재고 부족 오버레이 */}
        {product.stock_quantity === 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
              품절
            </span>
          </div>
        )}
        
        {/* 카테고리 뱃지 */}
        {product.category && (
          <div className="absolute top-2 left-2">
            <span className="bg-golden-rabbit-orange text-white text-xs px-2 py-1 rounded-full">
              {product.category}
            </span>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-gray-900">
          {product.name}
        </h3>
        
        {product.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-3">
            {product.description}
          </p>
        )}
        
        <div className="flex justify-between items-center mb-3">
          <span className="text-xl font-bold text-golden-rabbit-orange">
            {formatPrice(product.price)}원
          </span>
          <span className="text-sm text-gray-500">
            재고: {product.stock_quantity}개
          </span>
        </div>
        
        <button 
          onClick={handleAddToCart}
          disabled={product.stock_quantity === 0}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
            product.stock_quantity === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-golden-rabbit-orange text-white hover:bg-orange-600'
          }`}
        >
          {product.stock_quantity === 0 ? '품절' : '장바구니에 담기'}
        </button>
      </div>
    </div>
  )
}