'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export interface CartItem {
  id: string
  name: string
  price: number
  image_url?: string
  category: string
  stock_quantity: number
  quantity: number
}

interface CartContextType {
  items: CartItem[]
  addToCart: (product: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotalPrice: () => number
  getTotalItems: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // 로컬 스토리지에서 장바구니 데이터 로드
  useEffect(() => {
    const savedCart = localStorage.getItem('rabbit-store-cart')
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch (error) {
        console.error('장바구니 데이터 로드 실패:', error)
      }
    }
  }, [])

  // 장바구니 데이터를 로컬 스토리지에 저장
  useEffect(() => {
    localStorage.setItem('rabbit-store-cart', JSON.stringify(items))
  }, [items])

  const addToCart = (product: Omit<CartItem, 'quantity'>, quantity = 1) => {
    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id)
      
      if (existingItem) {
        // 이미 있는 상품이면 수량 증가
        const newQuantity = existingItem.quantity + quantity
        const maxQuantity = product.stock_quantity
        
        if (newQuantity > maxQuantity) {
          alert(`재고가 부족합니다. 최대 ${maxQuantity}개까지 주문 가능합니다.`)
          return prevItems.map(item =>
            item.id === product.id
              ? { ...item, quantity: maxQuantity }
              : item
          )
        }
        
        return prevItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        )
      } else {
        // 새로운 상품 추가
        if (quantity > product.stock_quantity) {
          alert(`재고가 부족합니다. 최대 ${product.stock_quantity}개까지 주문 가능합니다.`)
          quantity = product.stock_quantity
        }
        return [...prevItems, { ...product, quantity }]
      }
    })
  }

  const removeFromCart = (productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id === productId) {
          const maxQuantity = item.stock_quantity
          if (quantity > maxQuantity) {
            alert(`재고가 부족합니다. 최대 ${maxQuantity}개까지 주문 가능합니다.`)
            return { ...item, quantity: maxQuantity }
          }
          return { ...item, quantity }
        }
        return item
      })
    )
  }

  const clearCart = () => {
    setItems([])
  }

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0)
  }

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getTotalPrice,
      getTotalItems
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}