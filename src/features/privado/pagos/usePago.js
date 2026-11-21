import { useEffect, useState } from 'react'
import { consultarPago } from './pagos'

// Estado de un pago en línea, siempre leído de la API (GET /pagos/:id). Mientras el pago está pendiente lo vuelve a consultar cada
// `cada` milisegundos, hasta `maximo` veces; si no hay conexión reintenta solo y cuando vuelve la red consulta enseguida.
// Devuelve { cargando, pago, noExiste, error, sinConexion, agotado, actualizar }:
//  · pago         el último estado conocido (se conserva si una consulta falla)
//  · sinConexion  la última consulta no pudo llegar a la API
//  · agotado      se dejó de consultar solo porque sigue pendiente; `actualizar()` vuelve a consultar
export function usePago(id, { cada = 4000, maximo = 60 } = {}) {
  const [estado, setEstado] = useState({ id: null })
  const [pedido, setPedido] = useState(0)

  useEffect(() => {
    let vigente = true
    let temporizador = null
    let intentos = 0

    const consultar = () => {
      consultarPago(id)
        .then((pago) => {
          if (!vigente) return
          intentos += 1
          const pendiente = pago.estado === 'PENDIENTE'
          const agotado = pendiente && intentos >= maximo
          setEstado({ id, pago, agotado })
          if (pendiente && !agotado) temporizador = setTimeout(consultar, cada)
        })
        .catch((e) => {
          if (!vigente) return
          intentos += 1
          setEstado((anterior) => ({ id, pago: anterior.id === id ? anterior.pago : null, error: e.mensaje, status: e.status }))
          // Sin conexión (o la API caída): se reintenta; lo demás (404, 403…) no mejora solo
          if (e.status === 0 || e.status >= 500) {
            if (intentos < maximo) temporizador = setTimeout(consultar, cada * 2)
          }
        })
    }

    consultar()
    const alVolverLaRed = () => {
      clearTimeout(temporizador)
      consultar()
    }
    window.addEventListener('online', alVolverLaRed)
    return () => {
      vigente = false
      clearTimeout(temporizador)
      window.removeEventListener('online', alVolverLaRed)
    }
  }, [id, pedido, cada, maximo])

  const actual = estado.id === id ? estado : null
  const status = actual?.status
  return {
    cargando: !actual,
    pago: actual?.pago ?? null,
    noExiste: status === 404 || status === 403,
    error: actual?.error && status !== 404 && status !== 403 ? actual.error : null,
    sinConexion: actual?.error != null && (status === 0 || status >= 500),
    agotado: Boolean(actual?.agotado),
    actualizar: () => setPedido((n) => n + 1),
  }
}