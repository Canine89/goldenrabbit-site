import { Link } from 'react-router-dom'
import SmartImage from '../common/SmartImage'
import Card from '../ui/Card'
import Badge from '../ui/Badge'

export default function BookCard({ book, showCategory = false }) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Card hover={true} padding="none" className="overflow-visible group">
      <Link to={`/books/detail/${book.id}`} className="block">
        <div className="p-4 pb-0">
          <div className="aspect-[3/4] bg-neutral-100 relative overflow-hidden rounded-lg shadow-sm group-hover:shadow-md transition-all duration-300">
            <SmartImage
              src={book.cover_image_url}
              alt={book.title}
              className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
              fallback={
                <div className="w-full h-full flex items-center justify-center text-neutral-400 text-center p-8">
                  <div>
                    <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span className="text-sm">표지 이미지</span>
                  </div>
                </div>
              }
            />
          
            {/* 카테고리 뱃지 */}
            {showCategory && (
              <Badge 
                variant="primary" 
                size="sm"
                className="absolute top-3 left-3 shadow-sm"
              >
                {book.category}
              </Badge>
            )}
            
            {/* 추천 도서 뱃지 */}
            {book.is_featured && (
              <Badge 
                variant="secondary" 
                size="sm"
                className="absolute top-3 right-3 shadow-sm"
              >
                추천
              </Badge>
            )}
          </div>
        </div>
      </Link>
      
      <Card.Content>
        <Link to={`/books/detail/${book.id}`}>
          <Card.Title className="mb-2 line-clamp-2 group-hover:text-primary-500 transition-colors">
            {book.title}
          </Card.Title>
        </Link>
        
        <Card.Description className="text-sm mb-3">
          {book.author}
        </Card.Description>
        
        {book.publication_date && (
          <p className="text-neutral-500 text-xs mb-3">
            {formatDate(book.publication_date)}
          </p>
        )}
        
        <div className="flex justify-between items-center mb-3">
          <span className="text-xl font-bold text-primary-500">
            {formatPrice(book.price)}원
          </span>
          
          {book.book_store_links && book.book_store_links.length > 0 && (
            <Badge variant="outline" size="sm">
              {book.book_store_links.length}개 서점
            </Badge>
          )}
        </div>
        
        {/* 간단한 설명 */}
        {book.description && (
          <Card.Description className="text-sm line-clamp-3">
            {book.description}
          </Card.Description>
        )}
      </Card.Content>
    </Card>
  )
}