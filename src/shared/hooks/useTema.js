import { useCallback, useLayoutEffect, useState } from 'react'

const CLAVE = 'viper_tema'
const CLASE_CLARO = 'tema-claro' // la paleta clara está en index.css

const temaGuardado = () => {
  try {
    return localStorage.getItem(CLAVE) === 'claro' ? 'claro' : 'oscuro'
  } catch {
    return 'oscuro'
  }
}

// Modo claro u oscuro de las pantallas privadas. Se recuerda en el navegador y se aplica mientras el componente que lo usa está
// en pantalla: al salir (por ejemplo, a la landing o al login) vuelve el modo oscuro, que es el único de las vistas públicas.
//   const { tema, alternar } = useTema()   // tema: 'oscuro' | 'claro'
export function useTema() {
  const [tema, setTema] = useState(temaGuardado)

  useLayoutEffect(() => {
    const raiz = document.documentElement
    raiz.classList.toggle(CLASE_CLARO, tema === 'claro')
    return () => raiz.classList.remove(CLASE_CLARO)
  }, [tema])

  const alternar = useCallback(() => {
    setTema((actual) => {
      const nuevo = actual === 'claro' ? 'oscuro' : 'claro'
      try {
        localStorage.setItem(CLAVE, nuevo)
      } catch {
        // sin almacenamiento el modo vale solo para esta visita
      }
      return nuevo
    })
  }, [])

  return { tema, alternar }
}