import { useCallback, useEffect, useState } from 'react'
import { get, post } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import ConfirmDialog from '../../../../shared/components/ConfirmDialog'
import EmptyState from '../../../../shared/components/EmptyState'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Select from '../../../../shared/components/Select'
import Spinner from '../../../../shared/components/Spinner'
import { useToast } from '../../../../shared/hooks/useToast'
import { fechaCompleta, fechaHora, normalizar, precio } from '../torneos'

// Filtro por estado. Se aplica acá porque un torneo tiene como mucho 128 inscripciones.
const FILTROS = [
  { valor: '', texto: 'Estado: Todas' },
  { valor: 'PENDIENTE', texto: 'Pago pendiente' },
  { valor: 'PAGADA', texto: 'Pagadas' },
  { valor: 'ANULADA', texto: 'Anuladas' },
]
const categoriaDe = (i) => (i.estado === 'ANULADA' ? 'ANULADA' : i.estadoPago === 'PAGADO' ? 'PAGADA' : 'PENDIENTE')

// Las anuladas (historial) al final; dentro de cada grupo se respeta el orden de la API
const anuladasAlFinal = (a, b) => (a.estado === 'ANULADA') - (b.estado === 'ANULADA')

const nombreCompleto = (p) => `${p.nombre} ${p.apellido}`

// '2026-11-03T23:00:00.000Z' → '03/11 · 20:00' (hora local)
const venceEl = (iso) => fechaHora(iso).replace(' a las ', ' · ')

// Lo que se ve en la columna «Pago» de cada inscripción
function Pago({ inscripcion: i }) {
  if (i.estado === 'ANULADA') return <span className="text-texto-suave">—</span>
  if (i.estadoPago === 'PAGADO') return <span className="text-texto-suave">Pagó el {fechaHora(i.fechaPago)}</span>
  return <span className="text-advertencia">Vence el {venceEl(i.venceEn)}</span>
}

function Badges({ inscripcion: i }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <EstadoBadge tipo="inscripcion" estado={i.estado} />
      {i.estado === 'ACTIVA' && <EstadoBadge tipo="pago" estado={i.estadoPago} />}
    </div>
  )
}

function Cifra({ etiqueta, valor }) {
  return (
    <div className="bg-panel border border-gray-800 rounded-xl p-3 sm:p-4 flex flex-col justify-between gap-1">
      <p className="text-xs sm:text-[13px] text-texto-suave">{etiqueta}</p>
      <p className="font-outfit text-2xl sm:text-3xl font-bold tabular-nums">{valor}</p>
    </div>
  )
}

function BotonCobrar({ inscripcion: i, onCobrar }) {
  return (
    <Button
      tamano="compacto"
      className="text-sm whitespace-nowrap w-full lg:w-auto !px-4"
      aria-label={`Registrar pago en efectivo de ${nombreCompleto(i.titular)}`}
      onClick={() => onCobrar(i)}
    >
      <span className="xl:hidden">Registrar pago</span>
      <span className="hidden xl:inline">Registrar pago en efectivo</span>
    </Button>
  )
}

// Una fila de la tabla en escritorio (lg+) o una tarjeta en el celular
function FilaInscripcion({ inscripcion: i, puedeCobrar, onCobrar }) {
  const anulada = i.estado === 'ANULADA'
  const cobrable = puedeCobrar && i.estado === 'ACTIVA' && i.estadoPago === 'PENDIENTE'
  const jugador = (
    <div className="min-w-0">
      <p className="truncate font-semibold">{nombreCompleto(i.titular)}</p>
      <p className="text-sm text-texto-suave truncate">DNI {i.titular.dni}</p>
      {i.companero && <p className="text-sm text-texto-suave truncate">con {nombreCompleto(i.companero)}</p>}
    </div>
  )

  return (
    <li className={`border-gray-800 max-lg:border max-lg:rounded-2xl max-lg:bg-panel lg:border-b lg:last:border-b-0 ${anulada ? 'opacity-70' : ''}`}>
      {/* Escritorio */}
      <div className="hidden lg:grid grid-cols-[minmax(0,1fr)_13rem_10rem_9rem] xl:grid-cols-[minmax(0,1fr)_8rem_14rem_11rem_13.5rem] items-center gap-x-4 px-6 py-4 hover:bg-fondo/50 transition-colors">
        {jugador}
        <span className="hidden xl:block text-sm tabular-nums">{fechaCompleta(i.fechaInscripcion.slice(0, 10))}</span>
        <Badges inscripcion={i} />
        <span className="text-sm"><Pago inscripcion={i} /></span>
        <span className="justify-self-end">{cobrable && <BotonCobrar inscripcion={i} onCobrar={onCobrar} />}</span>
      </div>

      {/* Celular y tablet */}
      <div className="lg:hidden p-5 flex flex-col gap-3">
        {jugador}
        <Badges inscripcion={i} />
        <p className="text-sm"><Pago inscripcion={i} /></p>
        {cobrable && <BotonCobrar inscripcion={i} onCobrar={onCobrar} />}
      </div>
    </li>
  )
}

// Pestaña «Inscriptos» (CU 3.2 · 7a): lista con estado de pago y vencimiento, filtro por estado y búsqueda.
// Con `puedeCobrar` (Recepcionista y Administrador) cada pendiente tiene «Registrar pago en efectivo», con confirmación;
// el Organizador solo ve la lista. `precioInscripcion` es opcional: se muestra en la confirmación.
export default function PanelInscriptos({ torneoId, puedeCobrar, precioInscripcion }) {
  const { mostrarToast } = useToast()
  const [filtro, setFiltro] = useState('')
  const [q, setQ] = useState('')
  const [aCobrar, setACobrar] = useState(null)
  const [enviando, setEnviando] = useState(false)

  // Carga (patrón clave/resultado): al recargar después de cobrar se sigue mostrando la lista anterior
  const [reintento, setReintento] = useState(0)
  const [resultado, setResultado] = useState(null) // { clave, torneoId, torneo, inscripciones, error }
  const clave = `${torneoId}|${reintento}`
  const datos = resultado?.torneoId === torneoId ? resultado : null
  const error = resultado?.clave === clave ? resultado.error : null

  useEffect(() => {
    let vigente = true
    get(`/torneos/${torneoId}/inscripciones`)
      .then((r) => vigente && setResultado({ clave, torneoId, torneo: r.torneo, inscripciones: [...r.inscripciones].sort(anuladasAlFinal) }))
      .catch((e) => vigente && setResultado((anterior) => ({ clave, torneoId, error: e.mensaje, torneo: anterior?.torneo, inscripciones: anterior?.torneoId === torneoId ? anterior.inscripciones : undefined })))
    return () => {
      vigente = false
    }
  }, [torneoId, clave])

  const recargar = useCallback(() => setReintento((n) => n + 1), [])
  const cerrarDialogo = useCallback(() => setACobrar(null), [])

  const confirmarCobro = async () => {
    setEnviando(true)
    try {
      const respuesta = await post(`/inscripciones/${aCobrar.id}/confirmar-pago`)
      // La fila pasa a Pagado sin esperar a la recarga
      setResultado((actual) => ({
        ...actual,
        inscripciones: actual.inscripciones.map((i) => (i.id === aCobrar.id
          ? { ...i, estadoPago: 'PAGADO', fechaPago: respuesta.inscripcion?.fechaPago ?? new Date().toISOString(), venceEn: null }
          : i)),
      }))
      mostrarToast(respuesta.mensaje, 'exito')
    } catch (e) {
      // Venció o la cobró otra persona: se muestra el motivo y la lista se actualiza
      mostrarToast(e.mensaje, 'error')
    } finally {
      setEnviando(false)
      setACobrar(null)
      recargar()
    }
  }

  if (!datos?.inscripciones) {
    return error ? (
      <Alert variante="error" titulo="No pudimos cargar las inscripciones">
        {error}{' '}
        <button type="button" onClick={recargar} className="underline font-semibold cursor-pointer">Reintentar</button>
      </Alert>
    ) : (
      <div className="py-16 flex justify-center">
        <Spinner texto="Cargando inscriptos" />
      </div>
    )
  }

  const todas = datos.inscripciones
  const cuenta = (categoria) => todas.filter((i) => categoriaDe(i) === categoria).length
  const busqueda = normalizar(q)
  const visibles = todas.filter((i) => {
    if (filtro && categoriaDe(i) !== filtro) return false
    if (!busqueda) return true
    return [i.titular, i.companero].some((p) => p && normalizar(`${p.nombre} ${p.apellido} ${p.dni}`).includes(busqueda))
  })

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <Alert variante="error">
          {error}{' '}
          <button type="button" onClick={recargar} className="underline font-semibold cursor-pointer">Reintentar</button>
        </Alert>
      )}

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Cifra etiqueta="Pagadas" valor={cuenta('PAGADA')} />
        <Cifra etiqueta="Pago pendiente" valor={cuenta('PENDIENTE')} />
        <Cifra etiqueta="Anuladas" valor={cuenta('ANULADA')} />
      </div>

      {todas.length === 0 ? (
        <EmptyState titulo="Todavía no hay inscriptos" descripcion="Cuando los jugadores se inscriban vas a verlos acá, con el estado de su pago." />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative flex-1 sm:max-w-md">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-texto-suave pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="search"
                aria-label="Buscar por nombre o DNI"
                placeholder="Buscar por nombre o DNI"
                maxLength={60}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="w-full bg-fondo text-texto placeholder:text-texto-suave border border-gray-800 focus:border-viper rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none transition-colors"
              />
            </div>
            <Select aria-label="Filtrar por estado" opciones={FILTROS} value={filtro} onChange={(e) => setFiltro(e.target.value)} className="sm:w-56" />
          </div>

          {visibles.length === 0 ? (
            <EmptyState
              titulo="No encontramos inscripciones"
              descripcion="Probá con otro nombre o quitá el filtro."
              accion={<Button variante="secundario" onClick={() => { setQ(''); setFiltro('') }}>Limpiar filtros</Button>}
            />
          ) : (
            <div className="lg:bg-panel lg:border lg:border-gray-800 lg:rounded-2xl">
              <div className="hidden lg:grid grid-cols-[minmax(0,1fr)_13rem_10rem_9rem] xl:grid-cols-[minmax(0,1fr)_8rem_14rem_11rem_13.5rem] gap-x-4 px-6 py-4 border-b border-gray-800 text-xs font-semibold uppercase tracking-wide text-texto-suave">
                <span>Jugador</span>
                <span className="hidden xl:block">Inscripción</span>
                <span>Estado</span>
                <span>Pago</span>
              </div>
              <ul className="flex flex-col gap-4 lg:gap-0">
                {visibles.map((i) => <FilaInscripcion key={i.id} inscripcion={i} puedeCobrar={puedeCobrar} onCobrar={setACobrar} />)}
              </ul>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        abierto={Boolean(aCobrar)}
        posicion="abajo-movil"
        tipo="advertencia"
        variante="primario"
        titulo="¿Registrar pago en efectivo?"
        mensaje={aCobrar
          ? `Confirmá que recibiste en efectivo la inscripción de ${nombreCompleto(aCobrar.titular)}${aCobrar.companero ? ` y ${nombreCompleto(aCobrar.companero)}` : ''}${precioInscripcion > 0 ? ` (${precio(precioInscripcion)})` : ''} a «${datos.torneo.nombre}».`
          : ''}
        textoConfirmar="Registrar pago"
        textoCancelar="Volver"
        cargando={enviando}
        onConfirmar={confirmarCobro}
        onCancelar={cerrarDialogo}
      />
    </div>
  )
}