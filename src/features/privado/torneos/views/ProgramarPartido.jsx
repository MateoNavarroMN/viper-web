import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { get, put } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Badge from '../../../../shared/components/Badge'
import Button from '../../../../shared/components/Button'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Spinner from '../../../../shared/components/Spinner'
import Tabs from '../../../../shared/components/Tabs'
import { useMediaQuery } from '../../../../shared/hooks/useMediaQuery'
import { useToast } from '../../../../shared/hooks/useToast'
import ConflictoFranja from '../components/ConflictoFranja'
import GrillaFranjas from '../components/GrillaFranjas'
import { DURACION, aHora, aMinutos, partidosDelCuadro, rivalesDe } from '../programacion'
import { ETIQUETA_DISCIPLINA, ETIQUETA_INSTANCIA, diaCorto, diasEntre, fechaCompleta, fechaLarga, fechaPartido, nombreCorto } from '../torneos'

const RUTA = '/gestion/torneos'
const TARJETA = 'bg-panel border border-gray-800 rounded-2xl p-5 md:p-6'
const TITULO_SECCION = 'text-xs font-bold uppercase tracking-wide text-texto-suave mb-4'
const MENSAJE_CONCURRENCIA = 'Franja ocupada, elegí otro horario'
const DIAS_VISIBLES = 5

// Cada requisito que la API valida al reservar. Con una franja elegida de la grilla (libre y sin participantes ocupados)
// los tres se cumplen; la API los vuelve a comprobar al confirmar.
const REQUISITOS = ['Cancha libre en la franja', 'Sin alquiler ni otro partido', 'Ningún participante ocupado']

function Marca() {
  return (
    <span className="shrink-0 w-6 h-6 rounded-full bg-viper/15 text-viper flex items-center justify-center" aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
    </span>
  )
}

function Programador({ torneo, partido, partidos }) {
  const navigate = useNavigate()
  const { mostrarToast } = useToast()
  const variosDias = useMediaQuery('(min-width: 768px)') // desde tablet se ven los 5 días; en el celular, uno solo
  const volver = () => navigate(`${RUTA}/${torneo.id}`, { state: { pestana: 'cuadro' } })

  const periodo = { inicio: torneo.fechaInicio, fin: torneo.fechaFin }
  const dias = diasEntre(periodo.inicio, periodo.fin)
  const actual = partido.programacion
  const primero = Math.max(0, dias.indexOf(actual?.fecha))

  const [inicio, setInicio] = useState(primero) // primer día de la ventana de 5
  const [diaActivo, setDiaActivo] = useState(dias[primero]) // en el celular se ve un solo día
  const [canchaElegida, setCanchaElegida] = useState(actual?.cancha.id ?? null)
  const [seleccion, setSeleccion] = useState(null) // { canchaId, fecha, horaInicio }
  const [version, setVersion] = useState(0) // sube para volver a pedir la disponibilidad
  const [cache, setCache] = useState({ version: 0, datos: {}, error: null })
  const [guardando, setGuardando] = useState(false)
  const [conflicto, setConflicto] = useState(null)
  const [error, setError] = useState('')
  const [reserva, setReserva] = useState(null)
  const pedidos = useRef(new Set())

  const visibles = dias.slice(inicio, inicio + DIAS_VISIBLES)
  const dia = visibles.includes(diaActivo) ? diaActivo : visibles[0]
  const mostrados = variosDias ? visibles : [dia]
  const datos = cache.version === version ? cache.datos : {}
  const falloLaCarga = cache.version === version ? cache.error : null

  // Se piden los días que se ven y todavía no llegaron (y se vuelven a pedir cuando sube `version`)
  const pendientes = mostrados.filter((f) => !datos[f]).join(',')
  useEffect(() => {
    if (!pendientes || falloLaCarga) return
    pendientes.split(',').forEach((fecha) => {
      const clave = `${version}|${fecha}`
      if (pedidos.current.has(clave)) return
      pedidos.current.add(clave)
      get(`/canchas/disponibilidad?disciplina=${torneo.disciplina}&fecha=${fecha}`)
        .then((r) => setCache((c) => ({ version, datos: { ...(c.version === version ? c.datos : {}), [fecha]: r }, error: null })))
        .catch((e) => setCache((c) => ({ version, datos: c.version === version ? c.datos : {}, error: e.mensaje })))
    })
  }, [pendientes, version, falloLaCarga, torneo.disciplina])

  const canchas = Object.values(datos)[0]?.canchas ?? []
  const canchaId = canchas.some((c) => c.id === canchaElegida) ? canchaElegida : canchas[0]?.id
  const nombreCancha = (id) => canchas.find((c) => c.id === id)?.nombre
  const etiquetas = Object.fromEntries(partidos.filter((p) => p.local && p.visitante).map((p) => [p.id, rivalesDe(p)]))

  const refrescar = () => {
    pedidos.current = new Set()
    setCache({ version: version + 1, datos: {}, error: null })
    setVersion((v) => v + 1)
  }
  const irAlDia = (fecha) => {
    const i = dias.indexOf(fecha)
    if (i < 0) return
    setDiaActivo(fecha)
    if (!visibles.includes(fecha)) setInicio(i)
  }
  const mover = (pasos) => setInicio((i) => Math.min(Math.max(0, i + pasos * DIAS_VISIBLES), Math.max(0, dias.length - 1)))

  const elegir = (fecha, minutos) => {
    setSeleccion({ canchaId, fecha, horaInicio: aHora(minutos) })
    setDiaActivo(fecha)
  }

  const reservar = async (franja) => {
    setGuardando(true)
    setError('')
    try {
      const r = await put(`/partidos/${partido.id}/programacion`, { canchaId: franja.canchaId, inicio: `${franja.fecha}T${franja.horaInicio}` })
      mostrarToast('Franja reservada correctamente', 'exito')
      setConflicto(null)
      setReserva(r.partido)
    } catch (e) {
      if (e.status === 409 && e.datos && 'sugerencia' in e.datos) {
        setConflicto({ tipo: e.mensaje === 'Franja no disponible' ? 'franja' : 'participante', franja, sugerencia: e.datos.sugerencia })
      } else if (e.status === 409 && e.mensaje === MENSAJE_CONCURRENCIA) {
        setConflicto({ tipo: 'concurrencia', franja, sugerencia: null })
      } else {
        setConflicto(null)
        setError(e.mensaje)
      }
      setSeleccion(null) // la franja ya no sirve: se elige otra con la grilla actualizada
      refrescar()
    } finally {
      setGuardando(false)
    }
  }

  const usarSugerencia = () => {
    const { sugerencia } = conflicto
    const franja = { canchaId: sugerencia.canchaId, fecha: sugerencia.fecha, horaInicio: sugerencia.horaInicio }
    setSeleccion(franja)
    setCanchaElegida(franja.canchaId)
    irAlDia(franja.fecha)
    reservar(franja)
  }

  const encabezado = (
    <Link to={`${RUTA}/${torneo.id}`} state={{ pestana: 'cuadro' }} className="text-sm text-texto-suave hover:text-viper transition-colors inline-flex items-center gap-1 w-fit">
      <span aria-hidden="true">‹</span> Volver a la ficha del torneo
    </Link>
  )

  if (reserva) {
    return (
      <div className="max-w-2xl mx-auto w-full flex flex-col gap-6">
        {encabezado}
        <div>
          <h1 className="font-outfit text-[28px] font-bold">Partido programado</h1>
          <p className="text-texto-suave text-sm mt-1">{torneo.nombre} · {partido.lugar} · {rivalesDe(partido)}</p>
        </div>
        <Alert variante="exito">Franja reservada correctamente</Alert>
        <section className={TARJETA} aria-label="Reserva creada">
          <h2 className={TITULO_SECCION}>Reserva creada</h2>
          <Badge variante="exito">Confirmada</Badge>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mt-5">
            <div><dt className="text-[13px] text-texto-suave">Tipo</dt><dd className="mt-1">Torneo</dd></div>
            <div><dt className="text-[13px] text-texto-suave">Cancha</dt><dd className="mt-1">{reserva.cancha.nombre}</dd></div>
            <div><dt className="text-[13px] text-texto-suave">Fecha</dt><dd className="mt-1">{fechaLarga(reserva.fecha)}</dd></div>
            <div><dt className="text-[13px] text-texto-suave">Horario</dt><dd className="mt-1">{reserva.horaInicio} – {reserva.horaFin}</dd></div>
            <div className="sm:col-span-2"><dt className="text-[13px] text-texto-suave">Partido</dt><dd className="mt-1">{rivalesDe(partido)} · {partido.lugar}</dd></div>
          </dl>
        </section>
        <Button className="w-full sm:w-auto sm:self-end" onClick={volver}>Volver al fixture</Button>
      </div>
    )
  }

  const fin = seleccion && aHora(aMinutos(seleccion.horaInicio) + DURACION)
  const grilla = canchaId && Object.keys(datos).length > 0

  return (
    <div className="max-w-7xl mx-auto w-full flex flex-col gap-6 pb-24 min-[1400px]:pb-0">
      {encabezado}
      <div>
        <h1 className="font-outfit text-[28px] font-bold">{actual ? 'Reprogramar partido' : 'Programar partido'}</h1>
        <p className="text-texto-suave text-sm mt-1">{torneo.nombre} · {partido.lugar} · {rivalesDe(partido)}</p>
      </div>

      {error && <Alert variante="error">{error}</Alert>}

      <div className="grid grid-cols-1 min-[1400px]:grid-cols-[19rem_minmax(0,1fr)] gap-6 items-start">
        <div className="contents min-[1400px]:flex min-[1400px]:flex-col min-[1400px]:gap-6 min-[1400px]:sticky min-[1400px]:top-24">
          <section className={`${TARJETA} order-1`} aria-label="Partido">
            <h2 className={TITULO_SECCION}>Partido</h2>
            <div className="flex items-start justify-between gap-3">
              <p className="font-outfit text-lg font-bold">{partido.lugar}</p>
              <EstadoBadge tipo="partido" estado={partido.estado} />
            </div>
            <p className="mt-3 break-words">{nombreCorto(partido.local)}</p>
            <p className="break-words text-texto-suave">vs {nombreCorto(partido.visitante)}</p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 mt-5 pt-5 border-t border-gray-800">
              <div><dt className="text-[13px] text-texto-suave">Cancha</dt><dd className="mt-1">{actual ? actual.cancha.nombre : '—'}</dd></div>
              <div><dt className="text-[13px] text-texto-suave">Horario actual</dt><dd className="mt-1">{actual ? fechaPartido(actual.fecha, actual.horaInicio) : 'Sin programar'}</dd></div>
              <div className="col-span-2"><dt className="text-[13px] text-texto-suave">Período del torneo</dt><dd className="mt-1">{fechaCompleta(periodo.inicio)} – {fechaCompleta(periodo.fin)}</dd></div>
            </dl>
          </section>

          <section className={`${TARJETA} order-3`} aria-label="Franja seleccionada">
            <h2 className={TITULO_SECCION}>Franja seleccionada</h2>
            {seleccion ? (
              <>
                <p className="font-outfit text-lg font-bold text-advertencia">{fechaPartido(seleccion.fecha, seleccion.horaInicio)}</p>
                <p className="text-sm text-texto-suave mt-1">{nombreCancha(seleccion.canchaId)} · hasta las {fin}</p>
                <ul className="mt-4 bg-fondo border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
                  {REQUISITOS.map((texto) => (
                    <li key={texto} className="flex items-center gap-3"><Marca />{texto}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-texto-suave">Elegí una franja libre de la grilla. Cada partido dura {DURACION} minutos.</p>
            )}
            <div className="hidden min-[1400px]:flex flex-row justify-end gap-3 mt-6">
              <Button variante="neutro" onClick={volver} disabled={guardando}>Cancelar</Button>
              <Button disabled={!seleccion} cargando={guardando && !conflicto} onClick={() => reservar(seleccion)}>Reservar franja</Button>
            </div>
          </section>
        </div>
        <section className={`${TARJETA} order-2 min-[1400px]:col-start-2 min-[1400px]:row-start-1 min-w-0`} aria-label="Disponibilidad">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-outfit text-lg font-bold">Disponibilidad de la cancha{canchas.length === 1 ? ` de ${ETIQUETA_DISCIPLINA[torneo.disciplina].toLowerCase()}` : ''}</h2>
              <p className="text-sm text-texto-suave mt-1">Solo se ofrecen franjas dentro del período del torneo</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button type="button" aria-label="Días anteriores" disabled={inicio === 0} onClick={() => mover(-1)} className="w-9 h-9 rounded-lg bg-fondo border border-gray-800 hover:border-viper disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">‹</button>
              <button type="button" aria-label="Días siguientes" disabled={inicio + DIAS_VISIBLES >= dias.length} onClick={() => mover(1)} className="w-9 h-9 rounded-lg bg-fondo border border-gray-800 hover:border-viper disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">›</button>
            </div>
          </div>

          {canchas.length > 1 && (
            <div className="mt-4">
              <Tabs pestanas={canchas.map((c) => ({ clave: c.id, titulo: c.nombre }))} activa={canchaId} onCambiar={setCanchaElegida} />
            </div>
          )}

          {!variosDias && (
            <div className="sin-barra flex gap-2 mt-4 overflow-x-auto" role="tablist" aria-label="Día">
              {visibles.map((fecha) => (
                <button
                  key={fecha}
                  type="button"
                  role="tab"
                  aria-selected={fecha === dia}
                  onClick={() => setDiaActivo(fecha)}
                  className={`shrink-0 px-3 py-2 rounded-lg border text-sm cursor-pointer ${fecha === dia ? 'border-viper text-viper bg-viper/10' : 'border-gray-800 bg-fondo text-texto-suave'}`}
                >
                  {diaCorto(fecha)}
                </button>
              ))}
            </div>
          )}

          <div className="mt-5">
            {falloLaCarga ? (
              <Alert variante="error" titulo="No pudimos cargar la disponibilidad">
                {falloLaCarga}{' '}
                <button type="button" onClick={refrescar} className="underline font-semibold cursor-pointer">Reintentar</button>
              </Alert>
            ) : grilla ? (
              <GrillaFranjas
                dias={mostrados}
                datos={datos}
                canchaId={canchaId}
                partido={partido}
                partidos={partidos}
                etiquetas={etiquetas}
                periodo={periodo}
                seleccion={seleccion}
                onElegir={elegir}
              />
            ) : (
              <div className="py-16 flex justify-center"><Spinner texto="Cargando disponibilidad" /></div>
            )}
          </div>

          <ul className="flex flex-wrap gap-x-5 gap-y-2 mt-5 text-xs text-texto-suave" aria-label="Referencias">
            {[['border border-dashed border-gray-700 bg-fondo', 'Libre'], ['border border-info/40 bg-info/15', 'Alquiler'], ['border border-violeta/40 bg-violeta/15', 'Reserva fija'], ['border border-viper/40 bg-viper/10', 'Torneo'], ['border border-advertencia bg-advertencia/20', 'Seleccionada'], ['border border-error/40 bg-error/10', 'Participante ocupado']].map(([clases, texto]) => (
              <li key={texto} className="flex items-center gap-2"><span className={`w-3.5 h-3.5 rounded ${clases}`} aria-hidden="true" />{texto}</li>
            ))}
          </ul>
        </section>

      </div>

      <div className="fixed bottom-0 inset-x-0 p-4 bg-fondo/90 backdrop-blur border-t border-gray-800 z-30 lg:left-60 min-[1400px]:hidden">
        <Button className="w-full" disabled={!seleccion} cargando={guardando && !conflicto} onClick={() => reservar(seleccion)}>Reservar franja</Button>
      </div>

      <ConflictoFranja
        conflicto={conflicto}
        nombreCancha={conflicto?.sugerencia ? nombreCancha(conflicto.sugerencia.canchaId) : null}
        cargando={guardando}
        onUsar={usarSugerencia}
        onElegirOtra={() => setConflicto(null)}
      />
    </div>
  )
}

// «Programar partido» / «Reprogramar partido» (CU 3.5): la grilla de franjas de la cancha para elegir cuándo se juega.
// Pide el torneo y el cuadro (de ahí sale el partido y los demás partidos de sus participantes) y arma el programador.
export default function ProgramarPartido() {
  const { id, partidoId } = useParams()
  const [reintento, setReintento] = useState(0)
  const [resultado, setResultado] = useState(null) // { clave, torneo, cuadro, error }
  const clave = `${id}|${reintento}`
  const actual = resultado?.clave === clave ? resultado : null

  useEffect(() => {
    let vigente = true
    Promise.allSettled([get(`/torneos/${id}`), get(`/torneos/${id}/cuadro`)]).then(([ficha, cuadro]) => {
      if (!vigente) return
      if (ficha.status === 'rejected') return setResultado({ clave, error: ficha.reason })
      if (cuadro.status === 'rejected') return setResultado({ clave, error: cuadro.reason })
      setResultado({ clave, torneo: ficha.value.torneo, cuadro: cuadro.value })
    })
    return () => {
      vigente = false
    }
  }, [id, clave])

  const volver = (
    <Link to={`${RUTA}/${id}`} state={{ pestana: 'cuadro' }} className="text-sm text-texto-suave hover:text-viper transition-colors inline-flex items-center gap-1 w-fit">
      <span aria-hidden="true">‹</span> Volver a la ficha del torneo
    </Link>
  )

  let contenido
  if (!actual) {
    contenido = <div className="py-16 flex justify-center"><Spinner texto="Cargando partido" /></div>
  } else if (actual.error) {
    contenido = (
      <Alert variante="error" titulo="No pudimos cargar el partido">
        {actual.error.mensaje}{' '}
        {actual.error.status !== 404 && <button type="button" onClick={() => setReintento((n) => n + 1)} className="underline font-semibold cursor-pointer">Reintentar</button>}
      </Alert>
    )
  } else {
    const partidos = partidosDelCuadro(actual.cuadro, ETIQUETA_INSTANCIA)
    const partido = partidos.find((p) => p.id === partidoId)
    const programable = partido && !partido.esBye && partido.local && partido.visitante && ['PENDIENTE', 'PROGRAMADO'].includes(partido.estado)
    if (!partido) {
      contenido = <Alert variante="error" titulo="No encontramos el partido">El partido no es de este torneo.</Alert>
    } else if (actual.torneo.estado !== 'EN_CURSO' || !programable) {
      contenido = <Alert variante="info" titulo="Este partido no se puede programar">Solo se programan partidos pendientes o programados, con los dos rivales definidos, de un torneo en curso.</Alert>
    } else {
      return <Programador key={partido.id} torneo={actual.torneo} partido={partido} partidos={partidos} />
    }
  }

  return (
    <div className="max-w-6xl mx-auto w-full flex flex-col gap-6">
      {volver}
      {contenido}
    </div>
  )
}