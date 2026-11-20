import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { get } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Select from '../../../../shared/components/Select'
import { fechaDeHoy } from '../../socios/socios'
import { diaConNombre } from '../caja'
import Jornada from './Jornada'

// Pestaña «Cierre de caja». La jornada a cerrar es la de hoy; si quedaron jornadas anteriores sin cerrar se puede elegir
// cualquiera de ellas. La elegida vive en la URL (?pestana=cierre&fecha=AAAA-MM-DD).
export default function Cierre() {
  const hoy = fechaDeHoy()
  const [parametros, setParametros] = useSearchParams()
  const pedida = parametros.get('fecha')
  const fecha = pedida && /^\d{4}-\d{2}-\d{2}$/.test(pedida) && pedida <= hoy ? pedida : hoy

  const [version, setVersion] = useState(0)
  const [abiertas, setAbiertas] = useState(null) // jornadas anteriores sin cerrar: [{ fecha, movimientos, efectivoCalculado }]

  useEffect(() => {
    let vigente = true
    get('/caja/cierre/fechas-abiertas')
      .then((r) => vigente && setAbiertas(r.fechas))
      .catch(() => vigente && setAbiertas((anteriores) => anteriores ?? [])) // sin la lista igual se puede cerrar la de hoy
    return () => {
      vigente = false
    }
  }, [version])

  const elegir = (nueva) => {
    const nuevos = new URLSearchParams(parametros)
    if (nueva === hoy) nuevos.delete('fecha')
    else nuevos.set('fecha', nueva)
    setParametros(nuevos)
  }

  const lista = abiertas ?? []
  const opciones = [{ valor: hoy, texto: `Hoy · ${diaConNombre(hoy)}` }]
  for (const f of lista) opciones.push({ valor: f.fecha, texto: `${diaConNombre(f.fecha)} · sin cerrar` })
  // Una jornada que no está en la lista (por ejemplo, una que ya se cerró) se sigue pudiendo ver
  if (!opciones.some((o) => o.valor === fecha)) opciones.push({ valor: fecha, texto: diaConNombre(fecha) })

  return (
    <div className="flex flex-col gap-6">
      {lista.length > 0 && (
        <div className="flex flex-col gap-3">
          <Alert variante="advertencia">
            {lista.length === 1 ? 'Hay 1 jornada anterior sin cerrar.' : `Hay ${lista.length} jornadas anteriores sin cerrar.`} Elegila para cerrarla.
          </Alert>
          <label className="flex flex-col gap-1 sm:max-w-sm">
            <span className="text-xs font-bold uppercase tracking-wide text-texto-suave">Jornada a cerrar</span>
            <Select aria-label="Jornada a cerrar" opciones={opciones} value={fecha} onChange={(e) => elegir(e.target.value)} />
          </label>
        </div>
      )}

      <Jornada key={fecha} fecha={fecha} hoy={hoy} onCerrada={() => setVersion((n) => n + 1)} />
    </div>
  )
}