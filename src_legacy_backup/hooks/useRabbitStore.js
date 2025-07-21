import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// 토끼상점 상품 목록 조회 훅
export function useRabbitStoreProducts(category = null) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProducts()
  }, [category])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('rabbit_store_products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (category) {
        query = query.eq('category', category)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      setProducts(data || [])
    } catch (error) {
      console.error('상품 목록 조회 중 오류:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const refetch = () => {
    fetchProducts()
  }

  return { products, loading, error, refetch }
}

// 개별 상품 상세 정보 조회 훅
export function useRabbitStoreProduct(id) {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return

    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('rabbit_store_products')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single()

      if (error) {
        throw error
      }

      setProduct(data)
    } catch (error) {
      console.error('상품 상세 정보 조회 중 오류:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const refetch = () => {
    fetchProduct()
  }

  return { product, loading, error, refetch }
}

// 주문 생성 훅
export function useCreateOrder() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const createOrder = async (orderData) => {
    try {
      setLoading(true)
      setError(null)

      // 주문 생성
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: orderData.userId,
          total_amount: orderData.totalAmount,
          shipping_address: orderData.shippingAddress,
          customer_name: orderData.customerName,
          customer_phone: orderData.customerPhone,
          customer_email: orderData.customerEmail,
          status: 'pending'
        }])
        .select()
        .single()

      if (orderError) {
        throw orderError
      }

      // 주문 상품 항목 생성
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        throw itemsError
      }

      return order
    } catch (error) {
      console.error('주문 생성 중 오류:', error)
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return { createOrder, loading, error }
}

// 재고 업데이트 훅
export function useUpdateStock() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const updateStock = async (productId, quantity) => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase
        .from('rabbit_store_products')
        .update({ 
          stock_quantity: quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error('재고 업데이트 중 오류:', error)
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return { updateStock, loading, error }
}