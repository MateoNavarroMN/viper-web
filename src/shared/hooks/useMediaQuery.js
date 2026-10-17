import { useSyncExternalStore } from 'react'

// true si la pantalla cumple la media query y se actualiza al cambiar de tamaño.
//   const esEscritorio = useMediaQuery('(min-width: 1024px)')
export function useMediaQuery(consulta) {
  return useSyncExternalStore(
    (avisar) => {
      const lista = window.matchMedia(consulta)
      lista.addEventListener('change', avisar)
      return () => lista.removeEventListener('change', avisar)
    },
    () => window.matchMedia(consulta).matches,
    () => false
  )
}