import { create } from 'zustand'

// 전역 상태 관리
export const useStore = create((set, get) => ({
  // 사용자 상태
  user: null,
  isAdmin: false,
  
  // 장바구니 상태 (토끼상점용)
  cart: [],
  
  // 로딩 상태
  isLoading: false,
  
  // 액션들
  setUser: (user) => set({ user }),
  setIsAdmin: (isAdmin) => set({ isAdmin }),
  setIsLoading: (isLoading) => set({ isLoading }),
  
  // 장바구니 관리
  addToCart: (product) => set((state) => {
    const existingItem = state.cart.find(item => item.id === product.id)
    if (existingItem) {
      return {
        cart: state.cart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
    }
    return {
      cart: [...state.cart, { ...product, quantity: 1 }]
    }
  }),
  
  removeFromCart: (productId) => set((state) => ({
    cart: state.cart.filter(item => item.id !== productId)
  })),
  
  clearCart: () => set({ cart: [] }),
  
  // 장바구니 총 개수
  getCartTotal: () => {
    const { cart } = get()
    return cart.reduce((total, item) => total + item.quantity, 0)
  },
  
  // 장바구니 총 가격
  getCartPrice: () => {
    const { cart } = get()
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }
}))