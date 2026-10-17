import { useEffect, useState } from 'react'
import { get } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Badge from '../../../../shared/components/Badge'
import Spinner from '../../../../shared/components/Spinner'
import Nota from './Nota'

const DISCIPLINA = { TENIS: 'Tenis', PADEL: 'Pádel' }
const ESTADO_INSCRIPCION = {
  ACTIVA: { texto: 'Inscripto', variante: 'info' },
  ANULADA: { texto: 'Anulada', variante: 'error' },
}
const ESTADO_CUOTA = {
  AL_DIA: { texto: 'Al día', variante: 'exito' },
  ADEUDADA: { texto: 'Adeudado', variante: 'error' },
}

// '2026-10-14' → '14/10/2026' (la API manda las fechas como texto, sin hora)
const fecha = (texto) => (texto ? texto.slice(0, 10).split('-').reverse().join('/') : '')
const pesos = (monto) => Number(monto).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })

const Seccion = ({ titulo, vacio, children }) => (
  <section className="border-b border-gray-800 last:border-b-0">
    <h3 className="px-5 pt-5 pb-2 text-xs font-bold uppercase tracking-wide text-texto-suave">{titulo}</h3>
    {vacio ? <p className="px-5 pb-5 text-sm text-texto-suave">{vacio}</p> : <ul>{children}</ul>}
  </section>
)

const Fila = ({ titulo, detalle, monto, badges }) => (
  <li className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-5 py-3 border-t border-gray-800 first:border-t-0">
    <div className="min-w-0 flex-1">
      <p className="text-sm break-words">{titulo}</p>
      <p className="text-xs text-texto-suave break-words">{detalle}</p>
    </div>
    <div className="flex flex-wrap items-center sm:justify-end gap-2">
      {monto && <span className="text-sm tabular-nums whitespace-nowrap mr-1">{monto}</span>}
      {badges}
    </div>
  </li>
)

// Estado vacío de toda la pestaña (sin ninguna actividad)
const SinActividad = () => (
  <div className="bg-panel border border-gray-800 rounded-2xl px-6 py-12 text-center flex flex-col items-center">
    <div className="w-12 h-12 rounded-full bg-fondo border border-gray-800 flex items-center justify-center text-texto-suave mb-5">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    </div>
    <h2 className="font-outfit text-lg font-bold">Aún no hay actividad</h2>
    <p className="text-texto-suave text-sm mt-2 max-w-sm">
      Cuando reserves una cancha o te inscribas a un torneo, lo vas a ver acá.
    </p>
  </div>
)

// CU 1.3 · A2 · Mi actividad (solo JUGADOR), consulta de solo lectura.
// GET /api/perfil/actividad → { inscripciones, reservas, pagos, cuotas }. Hoy solo vienen inscripciones
// (Módulo 3); reservas y pagos llegan vacíos y cuotas en null hasta que existan los Módulos 2, 4 y 5.
// Para esos módulos se espera: reservas [{ id, cancha, fecha, horaInicio, estado }],
// pagos [{ id, concepto, fecha, monto, estado }] y cuotas { periodo, estado: 'AL_DIA' | 'ADEUDADA' }.
export default function MiActividad() {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    get('/perfil/actividad')
      .then((respuesta) => {
        if (!vigente) return
        setDatos(respuesta)
        setError(null)
      })
      .catch((e) => vigente && setError(e.mensaje))
    return () => {
      vigente = false
    }
  }, [intento])

  if (error) {
    return (
      <Alert variante="error" titulo="No pudimos cargar tu actividad">
        {error}{' '}
        <button type="button" onClick={() => setIntento((n) => n + 1)} className="underline font-semibold cursor-pointer">
          Reintentar
        </button>
      </Alert>
    )
  }
  if (!datos) {
    return (
      <div className="py-16 flex justify-center">
        <Spinner texto="Cargando actividad" />
      </div>
    )
  }

  const inscripciones = datos.inscripciones ?? []
  const reservas = datos.reservas ?? []
  const pagos = datos.pagos ?? []
  const cuotas = datos.cuotas ?? null
  if (inscripciones.length + reservas.length + pagos.length === 0 && !cuotas) return <SinActividad />

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-panel border border-gray-800 rounded-2xl overflow-hidden">
        <Seccion
          titulo="Reservas e inscripciones"
          vacio={reservas.length + inscripciones.length === 0 && 'Todavía no tenés reservas ni inscripciones.'}
        >
          {reservas.map((r) => (
            <Fila
              key={`r-${r.id}`}
              titulo={`Reserva · ${r.cancha}`}
              detalle={`${fecha(r.fecha)} · ${r.horaInicio?.slice(0, 5) ?? ''}`}
              badges={<Badge variante="exito">{r.estado}</Badge>}
            />
          ))}
          {inscripciones.map((i) => {
            const estado = ESTADO_INSCRIPCION[i.estado] ?? { texto: i.estado, variante: 'neutro' }
            const pareja = i.pareja ? ` · con ${i.pareja.nombre} ${i.pareja.apellido}` : ''
            return (
              <Fila
                key={`i-${i.id}`}
                titulo={`${i.torneo.nombre} · ${DISCIPLINA[i.torneo.disciplina] ?? i.torneo.disciplina}`}
                detalle={`Inscripción ${fecha(i.fechaInscripcion)} · ${i.torneo.categoria}${pareja}`}
                badges={
                  <>
                    {i.estado === 'ACTIVA' && i.estadoPago === 'PENDIENTE' && <Badge variante="advertencia">Pago pendiente</Badge>}
                    <Badge variante={estado.variante}>{estado.texto}</Badge>
                  </>
                }
              />
            )
          })}
        </Seccion>

        <Seccion titulo="Pagos" vacio={pagos.length === 0 && 'Todavía no hay pagos registrados.'}>
          {pagos.map((p) => (
            <Fila
              key={p.id}
              titulo={p.concepto}
              detalle={fecha(p.fecha)}
              monto={pesos(p.monto)}
              badges={<Badge variante={p.estado === 'PAGADO' ? 'exito' : 'advertencia'}>{p.estado === 'PAGADO' ? 'Pagado' : 'Pendiente'}</Badge>}
            />
          ))}
        </Seccion>

        {/* Cuotas: solo si es socio (la API manda null si no lo es) */}
        {cuotas && (
          <Seccion titulo="Cuotas">
            <Fila
              titulo="Cuota mensual"
              detalle={cuotas.periodo}
              badges={<Badge variante={ESTADO_CUOTA[cuotas.estado]?.variante ?? 'neutro'}>{ESTADO_CUOTA[cuotas.estado]?.texto ?? cuotas.estado}</Badge>}
            />
          </Seccion>
        )}
      </div>
      {cuotas && <Nota>El estado de cuota es «Al día» o «Adeudado».</Nota>}
    </div>
  )
}