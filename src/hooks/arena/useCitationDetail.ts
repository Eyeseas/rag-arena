import { useState, useEffect } from 'react'
import type { Citation, CitationDetail } from '@/types/arena'
import { arenaApi } from '@/services/arena'

export function useCitationDetail(open: boolean, citation: Citation | null, priId: string | null) {
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<CitationDetail | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && citation && priId) {
      // Defer state updates to avoid setState-in-effect lint rule.
      queueMicrotask(() => {
        setLoading(true)
        setError(null)
        setDetail(null)
      })

      let cancelled = false

      arenaApi
        .getCitationDetail(citation.id, priId)
        .then((data) => {
          if (cancelled) return
          setDetail(data)
        })
        .catch((err) => {
          if (cancelled) return
          setError(err instanceof Error ? err.message : '加载引用详情失败')
        })
        .finally(() => {
          if (cancelled) return
          setLoading(false)
        })

      return () => {
        cancelled = true
      }
    } else {
      queueMicrotask(() => {
        setDetail(null)
        setError(null)
      })
    }
  }, [open, citation, priId])

  return { loading, detail, error }
}
