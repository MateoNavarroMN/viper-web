import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { get } from '../../../../shared/api/client'
import { useToast } from '../../../../shared/hooks/useToast'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Select from '../../../../shared/components/Select'
import Spinner from '../../../../shared/components/Spinner'
import { escribirPrecio, fechaCompleta, precio } from '../../torneos/torneos'
import {
  ETIQUETA_METODO_PAGO,
  OPCIONES_ESTADO_CUOTA,
  OPCIONES_MES,
  dniConPuntos,
  estadoDeCuota,
  fechaDePago,
  nombrePeriodo,
  opcionesAnio,
} from '../socios'
import GenerarCuotas from './GenerarCuotas'
import RegistrarPago from './RegistrarPago'
import SinResultadosCuotas from './SinResultadosCuotas'

const TAMANIO = 10
const ESPERA_BUSQUEDA = 350 // ms sin tipear antes de buscar (debounce)
// En pantallas anchas (xl) la fecha de pago tiene su propia columna; en las más angostas va debajo del estado
const COLUMNAS = 'md:grid-cols-[minmax(0,1fr)_8.5rem_7rem_6.5rem_6rem] xl:grid-cols-[minmax(0,1fr)_9rem_8rem_7rem_6.5rem_8rem]'

// Fila del listado. En el celular los datos van en una tarjeta: socio, período, monto y vencimiento, y debajo el estado.
function FilaCuota({ cuota, onPagar }) {
  const estado = estadoDeCuota(cuota)
  const pagada = cuota.estadoPago === 'PAGADO'
  const periodo = nombrePeriodo(cuota.mes, cuota.anio)
  const monto = precio(Number(cuota.monto))
  const textoPago = pagada ? `Pagada el ${fechaDePago(cuota.fechaPago)}` : ''
  const botonPagar = (clases) => (
    <Button
      tamano="compacto"
      className={`text-xs whitespace-nowrap !px-3 !py-1.5 ${clases}`}
      aria-label={`Registrar pago de ${cuota.nombre} ${cuota.apellido}, ${periodo}`}
      onClick={() => onPagar(cuota)}
    >
      Registrar pago
    </Button>
  )

  return (
    <li className={`grid grid-cols-1 ${COLUMNAS} items-center gap-x-4 gap-y-2 bg-panel border border-gray-800 rounded-xl px-4 md:px-6 py-3`}>
      <div className="min-w-0">
        <p className="text-sm truncate">
          {cuota.nombre} {cuota.apellido}
        </p>
        <p className="text-xs text-texto-suave truncate">
          DNI {dniConPuntos(cuota.dni)}
          {cuota.socioEstado === 'BAJA' && ' · Socio dado de baja'}
        </p>
        <p className="md:hidden text-xs text-texto-suave mt-1">
          {periodo} · {monto} · Vence {fechaCompleta(cuota.fechaVencimiento)}
        </p>
        <div className="md:hidden flex flex-wrap items-center gap-2 mt-2">
          <EstadoBadge tipo="cuota" estado={estado} />
          {pagada ? <span className="text-xs text-texto-suave">{textoPago}</span> : botonPagar('ml-auto')}
        </div>
      </div>
      <span className="hidden md:block text-sm">{periodo}</span>
      <span className="hidden md:block text-sm tabular-nums">{monto}</span>
      <span className="hidden md:block text-sm tabular-nums">{fechaCompleta(cuota.fechaVencimiento)}</span>
      <div className="hidden md:flex flex-col items-start gap-1">
        <EstadoBadge tipo="cuota" estado={estado} />
        {pagada ? <span className="xl:hidden text-xs text-texto-suave">{fechaDePago(cuota.fechaPago)}</span> : botonPagar('xl:hidden')}
      </div>
      <div className="hidden xl:block text-sm">
        {pagada ? (
          <>
            <span className="tabular-nums">{fechaDePago(cuota.fechaPago)}</span>
            {cuota.metodoPago && <span className="block text-xs text-texto-suave">{ETIQUETA_METODO_PAGO[cuota.metodoPago] ?? cuota.metodoPago}</span>}
          </>
        ) : (
          botonPagar('')
        )}
      </div>
    </li>
  )
}

// Pestaña «Cuotas». Los filtros viven en la URL (?pestana=cuotas&q=&mes=&anio=&estado=&pagina=) para poder recargar o
// compartir la búsqueda. «Adeudado» muestra solo las cuotas vencidas: es una consulta de solo lectura.
export default function ListadoCuotas() {
  const [parametros, setParametros] = useSearchParams()
  const q = parametros.get('q') ?? ''
  const mes = parametros.get('mes') ?? ''
  const anio = parametros.get('anio') ?? ''
  const estado = parametros.get('estado') ?? ''
  const pagina = Math.max(1, Number(parametros.get('pagina')) || 1)

  const [busqueda, setBusqueda] = useState(q)
  const [reintento, setReintento] = useState(0)
  const [generando, setGenerando] = useState(false) // modal «Generar cuotas del mes»
  const [pagando, setPagando] = useState(null) // cuota elegida para «Registrar pago»
  const { mostrarToast } = useToast()
  // Última respuesta recibida y a qué consulta corresponde. Mientras la consulta actual no coincide con
  // `resultado.clave`, se está cargando y se sigue mostrando la lista anterior atenuada.
  const [resultado, setResultado] = useState(null) // { clave, datos, error }
  const clave = `${q}|${mes}|${anio}|${estado}|${pagina}|${reintento}`
  const cargando = resultado?.clave !== clave
  const datos = resultado?.datos ?? null // { cuotas, total, totalPendiente, totalPaginas }
  const error = resultado?.clave === clave ? resultado.error : null

  // Cambia filtros en la URL. Cualquier cambio de filtro vuelve a la página 1.
  const actualizar = (cambios) => {
    const nuevos = new URLSearchParams(parametros)
    for (const [campo, valor] of Object.entries({ pagina: '', ...cambios })) {
      if (valor) nuevos.set(campo, valor)
      else nuevos.delete(campo)
    }
    setParametros(nuevos)
  }

  // Si la URL cambia desde afuera (atrás/adelante del navegador), el buscador la sigue. Si el cambio vino de lo
  // que se está tipeando (busqueda.trim() === q) no se toca, para no pisar un espacio recién escrito.
  const [qPrevia, setQPrevia] = useState(q)
  if (q !== qPrevia) {
    setQPrevia(q)
    if (q !== busqueda.trim()) setBusqueda(q)
  }

  // Debounce: busca cuando se deja de tipear
  useEffect(() => {
    if (busqueda.trim() === q) return undefined
    const espera = setTimeout(() => actualizar({ q: busqueda.trim() }), ESPERA_BUSQUEDA)
    return () => clearTimeout(espera)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda, q])

  useEffect(() => {
    let vigente = true // si cambian los filtros antes de que responda, se ignora la respuesta vieja
    const consulta = new URLSearchParams({ pagina: String(pagina), tamanio: String(TAMANIO) })
    if (q) consulta.set('q', q)
    if (mes) consulta.set('mes', mes)
    if (anio) consulta.set('anio', anio)
    if (estado) consulta.set('estado', estado)
    get(`/cuotas?${consulta}`)
      .then((respuesta) => vigente && setResultado({ clave, datos: respuesta }))
      .catch((e) => vigente && setResultado((anterior) => ({ clave, datos: anterior?.datos, error: e.mensaje })))
    return () => {
      vigente = false
    }
  }, [clave, q, mes, anio, estado, pagina])

  const hayFiltros = Boolean(q || mes || anio || estado)
  const limpiarFiltros = () => {
    setBusqueda('')
    setParametros(new URLSearchParams({ pestana: 'cuotas' }))
  }

  // Se generaron cuotas: el listado pasa a mostrar ese período (sin búsqueda ni estado, que podrían ocultarlas) y se recarga
  const alGenerar = ({ mes: mesGenerado, anio: anioGenerado }) => {
    setGenerando(false)
    setBusqueda('')
    actualizar({ mes: mesGenerado, anio: anioGenerado, estado: '', q: '' })
    setReintento((n) => n + 1)
  }

  // Se registró el pago: la fila pasa a «Pagada» y baja el total pendiente sin esperar; después se vuelve a pedir la lista
  // para que respete el filtro (con «Pendiente» o «Adeudado» la cuota deja de aparecer) y los totales queden exactos.
  const alRegistrar = (pagada, situacionCuotas) => {
    const cuota = pagando
    setPagando(null)
    setResultado((anterior) => {
      if (!anterior?.datos) return anterior
      const { datos: lista } = anterior
      return {
        ...anterior,
        datos: {
          ...lista,
          totalPendiente: (Number(lista.totalPendiente) - Number(cuota.monto)).toFixed(2),
          cuotas: lista.cuotas.map((c) =>
            c.id === pagada.id ? { ...c, estadoPago: pagada.estadoPago, fechaPago: pagada.fechaPago, metodoPago: pagada.metodoPago, vencida: false } : c
          ),
        },
      }
    })
    setReintento((n) => n + 1)
    const quien = `${cuota.nombre} ${cuota.apellido}`
    let aviso = `Pago registrado: ${quien}, ${nombrePeriodo(cuota.mes, cuota.anio)}`
    if (cuota.vencida) aviso += situacionCuotas === 'AL_DIA' ? `. ${quien} quedó al día` : `. ${quien} todavía tiene cuotas vencidas`
    mostrarToast(aviso)
  }

  // Alguien se adelantó y la cuota ya estaba pagada: se avisa y se refresca la lista
  const alYaPagada = (mensaje) => {
    setPagando(null)
    mostrarToast(mensaje, 'advertencia')
    setReintento((n) => n + 1)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col xl:flex-row gap-3 xl:items-center">
        <div className="relative flex-1 xl:max-w-xs">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-texto-suave pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            aria-label="Buscar por socio o DNI"
            placeholder="Buscar por socio o DNI"
            maxLength={100}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-fondo text-texto placeholder:text-texto-suave border border-gray-800 focus:border-viper rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none transition-colors"
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 xl:flex">
          <Select aria-label="Filtrar por mes" opciones={OPCIONES_MES} value={mes} onChange={(e) => actualizar({ mes: e.target.value })} className="xl:w-40" />
          <Select aria-label="Filtrar por año" opciones={opcionesAnio()} value={anio} onChange={(e) => actualizar({ anio: e.target.value })} className="xl:w-28" />
          <Select aria-label="Filtrar por estado" opciones={OPCIONES_ESTADO_CUOTA} value={estado} onChange={(e) => actualizar({ estado: e.target.value })} className="col-span-2 sm:col-span-1 xl:w-44" />
        </div>
        {/* En el celular el botón queda fijo abajo */}
        <div className="fixed bottom-0 inset-x-0 p-4 bg-fondo/90 backdrop-blur border-t border-gray-800 z-30 md:static md:p-0 md:bg-transparent md:border-0 md:backdrop-blur-none md:self-end xl:self-auto xl:ml-auto">
          <Button onClick={() => setGenerando(true)} className="w-full md:w-auto px-6 py-3">
            Generar cuotas del mes
          </Button>
        </div>
      </div>

      {error ? (
        <Alert variante="error" titulo="No pudimos cargar las cuotas">
          {error}{' '}
          <button type="button" onClick={() => setReintento((n) => n + 1)} className="underline font-semibold cursor-pointer">
            Reintentar
          </button>
        </Alert>
      ) : !datos ? (
        <div className="py-16 flex justify-center">
          <Spinner texto="Cargando cuotas" />
        </div>
      ) : datos.cuotas.length === 0 ? (
        <SinResultadosCuotas hayFiltros={hayFiltros} onLimpiar={limpiarFiltros} />
      ) : (
        <div className={`flex flex-col gap-3 transition-opacity ${cargando ? 'opacity-60' : ''}`} aria-busy={cargando}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-1" aria-live="polite">
            <p className="text-sm text-texto-suave">
              Total pendiente{hayFiltros ? ' del filtro' : ''}:{' '}
              <span className="font-semibold text-texto tabular-nums">$ {escribirPrecio(Number(datos.totalPendiente))}</span>
            </p>
          </div>
          <div className={`hidden md:grid ${COLUMNAS} gap-x-4 px-6 text-xs font-bold uppercase tracking-wide text-texto-suave`}>
            <span>Socio</span>
            <span>Período</span>
            <span>Monto</span>
            <span>Vencimiento</span>
            <span>Estado</span>
            <span className="hidden xl:block">Fecha de pago</span>
          </div>
          <ul className="flex flex-col gap-3">
            {datos.cuotas.map((cuota) => (
              <FilaCuota key={cuota.id} cuota={cuota} onPagar={setPagando} />
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
            <p className="text-sm text-texto-suave">
              Mostrando {datos.cuotas.length} de {datos.total} {datos.total === 1 ? 'cuota' : 'cuotas'}
            </p>
            {datos.totalPaginas > 1 && (
              <nav aria-label="Paginación" className="flex items-center gap-3">
                <Button variante="neutro" disabled={pagina <= 1} onClick={() => actualizar({ pagina: String(pagina - 1) })} className="text-sm">
                  Anterior
                </Button>
                <span className="text-sm text-texto-suave tabular-nums">
                  Página {pagina} de {datos.totalPaginas}
                </span>
                <Button variante="neutro" disabled={pagina >= datos.totalPaginas} onClick={() => actualizar({ pagina: String(pagina + 1) })} className="text-sm">
                  Siguiente
                </Button>
              </nav>
            )}
          </div>
        </div>
      )}

      {pagando && <RegistrarPago cuota={pagando} onCerrar={() => setPagando(null)} onRegistrado={alRegistrar} onYaPagada={alYaPagada} />}
      {generando && <GenerarCuotas onCerrar={() => setGenerando(false)} onGenerado={alGenerar} />}
    </div>
  )
}
