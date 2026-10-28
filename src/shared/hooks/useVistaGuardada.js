import { useCallback, useState } from 'react'

// La forma de ver un listado ('cards' o 'filas') se recuerda en este navegador. Si no se puede leer o escribir, sigue funcionando.
const leer = (clave, porDefecto) => {
  try {
    const guardada = localStorage.getItem(clave)
    return guardada === 'cards' || guardada === 'filas' ? guardada : porDefecto
  } catch {
    return porDefecto
  }
}

export function useVistaGuardada(clave, porDefecto = 'cards') {
  const [vista, setVista] = useState(() => leer(clave, porDefecto))
  const cambiar = useCallback(
    (nueva) => {
      setVista(nueva)
      try {
        localStorage.setItem(clave, nueva)
      } catch {
        // sin almacenamiento: queda solo en esta visita
      }
    },
    [clave]
  )
  return [vista, cambiar]
}