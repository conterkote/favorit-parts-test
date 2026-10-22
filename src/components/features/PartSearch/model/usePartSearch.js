import { useCallback, useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@Store'
import { fetchManufacturers } from '@Store/Slices/partsSlice/partsSlice'

export function usePartSearch() {
  const dispatch = useAppDispatch()
  const article = useAppSelector((state) => state.parts.article)
  const timer = useRef(undefined)
  const request = useRef(null)

  const search = useCallback(() => {
    clearTimeout(timer.current)
    request.current?.abort()

    if (article.trim()) request.current = dispatch(fetchManufacturers(article.trim()))
  }, [article, dispatch])

  useEffect(() => {
    if (article.trim()) timer.current = setTimeout(search, 500)

    return () => {
      clearTimeout(timer.current)
      request.current?.abort()
    }
  }, [article, search])

  return search
}
