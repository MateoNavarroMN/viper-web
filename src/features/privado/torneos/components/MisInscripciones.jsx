import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Badge from '../../../../shared/components/Badge'
import EmptyState from '../../../../shared/components/EmptyState'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Spinner from '../../../../shared/components/Spinner'
import { ETIQUETA_DISCIPLINA, rangoFechas } from '../torneos'

const RUTA = '/portal/torneos'

// '2026-11-03T23:00:00.000Z' → '03/11 · 20:00' (hora local)
const venceEl = (iso) => {
  const f = new Date(iso)
  const dos = (n) => String(n).padStart(2, '0')
  return `${dos(f.getDate())}/${dos(f.getMonth() + 1)} · ${dos(f.getHours())}:${dos(f.getMinutes())}`
}

// Las vigentes primero; las anuladas (historial) al final. Dentro de cada grupo se respeta el orden de la API.
const anuladasAlFinal = (a, b) => (a.estado === 'ANULADA') - (b.estado === 'ANULADA')

// «Pádel · con Nombre Apellido · Vence 03/11 · 20:00» (Figma: «Mis inscripciones»)
const subtitulo = (i) => {
  const partes = [ETIQUETA_DISCIPLINA[i.torneo.disciplina]]
  if (i.pareja) partes.push(`con ${i.pareja.nombre} ${i.pareja.apellido}`)
  if (i.estado === 'ACTIVA' && i.estadoPago === 'PENDIENTE' && i.venceEn) partes.push(`Vence ${venceEl(i.venceEn)}`)
  return partes.join(' · ')
}

function Tarjeta({ inscripcion: i }) {
  const anulada = i.estado === 'ANULADA'
  return (
    <li>
      <Link
        to={`${RUTA}/${i.torneo.id}`}
        className={`block h-full bg-panel border border-gray-800 hover:border-viper rounded-2xl p-5 transition-colors focus-visible:outline-2 focus-visible:outline-viper ${anulada ? 'opacity-70' : ''}`}
      >
        <h2 className="font-outfit text-lg font-bold truncate">{i.torneo.nombre}</h2>
        <p className="text-sm text-texto-suave truncate">{subtitulo(i)}</p>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <EstadoBadge tipo="inscripcion" estado={i.estado} />
          {!anulada && <EstadoBadge tipo="pago" estado={i.estadoPago} />}
          {anulada && <Badge>{i.estadoPago === 'PAGADO' ? 'Pagado' : 'Sin pago'}</Badge>}
        </div>
        <p className="text-xs text-texto-suave mt-3 tabular-nums">
          {i.torneo.categoria} · {rangoFechas(i.torneo.fechaInicio, i.torneo.fechaFin)}
        </p>
        {!anulada && i.estadoPago === 'PENDIENTE' && i.venceEn && (
          <p className="text-xs text-advertencia mt-2">Tu cupo queda reservado hasta el {venceEl(i.venceEn).replace(' · ', ' a las ')}; pagá en recepción.</p>
        )}
        {anulada && (
          <p className="text-xs text-texto-suave mt-2">
            {i.torneo.estado === 'CANCELADO'
              ? 'El torneo se canceló; el reembolso, si corresponde, se gestiona con el club.'
              : 'Se anuló porque no se pagó a tiempo.'}
          </p>
        )}
      </Link>
    </li>
  )
}

// Pestaña «Mis inscripciones» del portal del jugador (CU 3.2 · paso 10): torneo, compañero, estado,
// estado de pago y vencimiento. Incluye las anuladas como historial.
export default function MisInscripciones() {
  const [reintento, setReintento] = useState(0)
  const [resultado, setResultado] = useState(null) // { clave, inscripciones, error }
  const clave = String(reintento)
  const cargando = resultado?.clave !== clave
  const error = resultado?.clave === clave ? resultado.error : null
  const inscripciones = resultado?.inscripciones ?? null

  useEffect(() => {
    let vigente = true
    get('/mis-inscripciones')
      .then((r) => vigente && setResultado({ clave, inscripciones: [...r.inscripciones].sort(anuladasAlFinal) }))
      .catch((e) => vigente && setResultado((anterior) => ({ clave, inscripciones: anterior?.inscripciones, error: e.mensaje })))
    return () => {
      vigente = false
    }
  }, [clave])

  const recargar = useCallback(() => setReintento((n) => n + 1), [])

  if (error) {
    return (
      <Alert variante="error" titulo="No pudimos cargar tus inscripciones">
        {error}{' '}
        <button type="button" onClick={recargar} className="underline font-semibold cursor-pointer">Reintentar</button>
      </Alert>
    )
  }
  if (!inscripciones || cargando) {
    return (
      <div className="py-16 flex justify-center">
        <Spinner texto="Cargando tus inscripciones" />
      </div>
    )
  }
  if (inscripciones.length === 0) {
    return (
      <EmptyState
        titulo="Todavía no te inscribiste a ningún torneo"
        descripcion="Cuando te inscribas vas a ver acá el estado de tu inscripción y de tu pago."
        accion={
          <Link to={RUTA} className="font-outfit font-semibold bg-viper hover:bg-viper-hover text-black px-6 py-3 rounded-lg transition-colors">
            Ver torneos disponibles
          </Link>
        }
      />
    )
  }
  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {inscripciones.map((i) => <Tarjeta key={i.id} inscripcion={i} />)}
    </ul>
  )
}