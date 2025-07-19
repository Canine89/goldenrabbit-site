import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// 도서 목록 조회 훅
export function useBooks(category = null, limit = null) {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchBooks()
  }, [category, limit])

  const fetchBooks = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('books')
        .select(`
          *,
          book_store_links (*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (category) {
        query = query.eq('category', category)
      }

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      setBooks(data || [])
    } catch (error) {
      console.error('도서 목록 조회 중 오류:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const refetch = () => {
    fetchBooks()
  }

  return { books, loading, error, refetch }
}

// 개별 도서 상세 정보 조회 훅
export function useBook(id) {
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return

    fetchBook()
  }, [id])

  const fetchBook = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('books')
        .select(`
          *,
          book_store_links (*)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single()

      if (error) {
        throw error
      }

      setBook(data)
    } catch (error) {
      console.error('도서 상세 정보 조회 중 오류:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const refetch = () => {
    fetchBook()
  }

  return { book, loading, error, refetch }
}

// 추천 도서 조회 훅
export function useFeaturedBooks(limit = 4) {
  const [featuredBooks, setFeaturedBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchFeaturedBooks()
  }, [limit])

  const fetchFeaturedBooks = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('books')
        .select(`
          *,
          book_store_links (*)
        `)
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw error
      }

      setFeaturedBooks(data || [])
    } catch (error) {
      console.error('추천 도서 조회 중 오류:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const refetch = () => {
    fetchFeaturedBooks()
  }

  return { featuredBooks, loading, error, refetch }
}