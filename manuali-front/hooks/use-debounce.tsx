import { useEffect, useState } from "react"

// Devolve `value` apenas depois de `delay` ms sem mudanças (evita 1 request por tecla).
export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
