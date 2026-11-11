import { useCallback, useEffect, useRef, useState } from 'react'

/** 진입/포커스 복귀/동일 브라우저의 저장소 변경 시 재조회합니다. 폴링은 사용하지 않습니다. */
export function useResource<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const generation = useRef(0)

  const refresh = useCallback(async () => {
    const current = ++generation.current
    setLoading(true)
    setError('')
    try {
      const result = await load()
      if (current === generation.current) setData(result)
    } catch (cause) {
      if (current === generation.current)
        setError(
          cause instanceof Error
            ? cause.message
            : '불러오지 못했어요. 다시 시도해 주세요.',
        )
    } finally {
      if (current === generation.current) setLoading(false)
    }
  }, [load])

  useEffect(() => {
    void refresh()
    const reload = () => {
      void refresh()
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') reload()
    }
    window.addEventListener('focus', reload)
    window.addEventListener('storage', reload)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      generation.current++
      window.removeEventListener('focus', reload)
      window.removeEventListener('storage', reload)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh])

  return { data, error, loading, refresh }
}
