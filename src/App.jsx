import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import MainLayout from './components/layout/MainLayout'
import AdminLayout from './components/admin/AdminLayout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Home from './pages/Home'
import Books from './pages/Books'
import BookDetail from './pages/BookDetail'
import BookCategory from './pages/BookCategory'
import RabbitStore from './pages/RabbitStore'
import Cart from './pages/Cart'
import About from './pages/About'
import Login from './pages/auth/Login'
import AuthCallback from './pages/auth/AuthCallback'
import AuthError from './pages/auth/AuthError'
import AdminDashboard from './pages/admin/AdminDashboard'
import ProductManagement from './pages/admin/ProductManagement'
import BookManagement from './pages/admin/BookManagement'
import ArticleManagement from './pages/admin/ArticleManagement'
import UserManagement from './pages/admin/UserManagement'
import Articles from './pages/Articles'
import ArticleDetail from './pages/ArticleDetail'
import './index.css'

function App() {
  return (
    <AuthProvider>
      <Router 
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <Routes>
          {/* 인증 관련 라우트 */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/error" element={<AuthError />} />

          {/* 메인 사이트 라우트 */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            
            {/* 도서 관련 라우트 */}
            <Route path="/books" element={<Books />} />
            <Route path="/books/detail/:id" element={<BookDetail />} />
            <Route path="/books/:category" element={<BookCategory />} />
            
            {/* 토끼상점 관련 라우트 */}
            <Route path="/rabbit-store" element={<RabbitStore />} />
            <Route path="/cart" element={<Cart />} />
            
            {/* 추후 추가될 라우트들 */}
            <Route path="/about" element={<About />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/articles/:id" element={<ArticleDetail />} />
            <Route path="/events" element={<div className="p-8 text-center">이벤트 페이지 (준비중)</div>} />
            <Route path="/community" element={<div className="p-8 text-center">묘공단 페이지 (준비중)</div>} />
            <Route path="/author-apply" element={<div className="p-8 text-center">저자 신청 페이지 (준비중)</div>} />
            <Route path="/professor" element={<div className="p-8 text-center">교수회원 페이지 (준비중)</div>} />
          </Route>

          {/* 관리자 라우트 */}
          <Route path="/admin" element={
            <ProtectedRoute requireAdmin={true}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<ProductManagement />} />
            <Route path="books" element={<BookManagement />} />
            <Route path="orders" element={<div className="p-8 text-center">주문 관리 (준비중)</div>} />
            <Route path="users" element={<UserManagement />} />
            <Route path="articles" element={<ArticleManagement />} />
            <Route path="events" element={<div className="p-8 text-center">이벤트 관리 (준비중)</div>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App