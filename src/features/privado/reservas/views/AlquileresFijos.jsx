import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import Alert from '../../../../shared/components/Alert'
import Badge from '../../../../shared/components/Badge'
import Button from '../../../../shared/components/Button'
import EmptyState from '../../../../shared/components/EmptyState'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Paginacion from '../../../../shared/components/Paginacion'
import Select from '../../../../shared/components/Select'
import Spinner from '../../../../shared/components/Spinner'
import { dniConPuntos } from '../../../../shared/utils/dni'
import { ETIQUETA_DISCIPLINA, fechaCompleta } from '../../torneos/torneos'
import { OPCIONES_ESTADO_CONTRATO, horarioDelContrato } from '../reservas'
import { useAlquileresFijos } from '../useAlquileresFijos'

const ESPERA_BUSQUEDA = 350 // ms sin tipear antes de buscar
const COLUMNAS = 'md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.3fr)_8.5rem]'

// Una fila del listado; abre el detalle del contrato. En el celular es una tarjeta con los mismos datos.
function FilaContrato({ contrato }) {
  const { cancha, cliente } = contrato
  const nombre = cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Sin cliente'
  return (
    <li>
      <Link
        to={`/gestion/alquileres-fijos/${contrato.id}`}
        className={`grid grid-cols-1 ${COLUMNAS} items-center gap-x-4 gap-y-2 bg-panel border border-gray-800 hover:border-viper rounded-xl px-4 md:px-6 py-4 transition-colors focus-visible:outline-2 focus-visible:outline-viper`}
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">{cancha.nombre}</p>
          <p className="text-xs text-texto-suave">{ETIQUETA_DISCIPLINA[cancha.deporte]}</p>
        </div>
        <p className="text-sm">{horarioDelContrato(contrato)}</p>
        <div className="min-w-0">
          <p className="text-sm truncate">{nombre}</p>
          {cliente?.dni && <p className="text-xs text-texto-suave truncate">DNI {dniConPuntos(cliente.dni)}</p>}
        </div>
        <p className="text-sm tabular-nums">
          <span className="md:hidden text-texto-suave">Período: </span>
          {fechaCompleta(contrato.fechaInicio)} al {fechaCompleta(contrato.fechaFinContrato)}
        </p>
        <div className="flex flex-wrap items-center gap-2 md:flex-col md:items-start">
          <EstadoBadge tipo="contratoFijo" estado={contrato.estado} />
          {contrato.avisoFinContrato && <Badge variante="advertencia">Último turno</Badge>}
        </div>
      </Link>
    </li>
  )
}

// Alquileres fijos (contratos de 3 meses) para Recepción y Administrador. Los filtros viven en la URL (?q=&estado=&pagina=).
export default function AlquileresFijos() {
  const location = useLocation()
  const navigate = useNavigate()
  // Lo que deja la pantalla de alta: el contrato recién cargado. Se guarda acá y se saca de la navegación para que recargar no lo repita.
  const [novedad, setNovedad] = useState(() => location.state ?? null)
  useEffect(() => {
    if (location.state) navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
  }, [location, navigate])
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const estado = OPCIONES_ESTADO_CONTRATO.some((o) => o.valor && o.valor === params.get('estado')) ? params.get('estado') : ''
  const numero = Number(params.get('pagina'))
  const pagina = Number.isInteger(numero) && numero >= 1 ? numero : 1

  const [busqueda, setBusqueda] = useState(q)
  const { cargando, error, datos, reintentar } = useAlquileresFijos({ q, estado, pagina })

  // Cambia filtros en la URL; cualquier cambio de filtro vuelve a la página 1
  const cambiar = (cambios) =>
    setParams((previo) => {
      const nuevos = new URLSearchParams(previo)
      for (const [clave, valor] of Object.entries({ pagina: '', ...cambios })) {
        if (valor) nuevos.set(clave, valor)
        else nuevos.delete(clave)
      }
      return nuevos
    }, { replace: true })

  // Si la URL cambia desde afuera (atrás/adelante), el buscador la sigue; si el cambio vino de lo que se tipea, no se toca
  const [qPrevia, setQPrevia] = useState(q)
  if (q !== qPrevia) {
    setQPrevia(q)
    if (q !== busqueda.trim()) setBusqueda(q)
  }

  // Busca cuando se deja de tipear
  useEffect(() => {
    if (busqueda.trim() === q) return undefined
    const espera = setTimeout(() => cambiar({ q: busqueda.trim() }), ESPERA_BUSQUEDA)
    return () => clearTimeout(espera)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda])

  const hayFiltros = Boolean(q || estado)
  const limpiar = () => {
    setBusqueda('')
    setParams(new URLSearchParams(), { replace: true })
  }
  const nuevo = (
    <Link to="/gestion/alquileres-fijos/nuevo" className="font-outfit font-semibold bg-viper hover:bg-viper-hover text-sobre-viper px-6 py-3 rounded-lg text-center block transition-colors">
      Nuevo alquiler fijo
    </Link>
  )
  const control = (etiqueta, abajo) => (
    <Paginacion
      pagina={pagina}
      totalPaginas={datos.totalPaginas}
      onCambiar={(n) => cambiar({ pagina: n > 1 ? String(n) : '' })}
      etiqueta={etiqueta}
      resumen={abajo ? `Mostrando ${datos.contratos.length} de ${datos.total} ${datos.total === 1 ? 'contrato' : 'contratos'}` : null}
    />
  )

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 pb-24 md:pb-0">
      <div>
        <h1 className="font-outfit text-[28px] font-bold">Alquileres fijos</h1>
        <p className="text-texto-suave text-sm mt-1">Contratos de 3 meses con un turno semanal, siempre el mismo día y a la misma hora.</p>
      </div>

      {novedad?.contratoNuevo && (
        <section aria-label="Alquiler fijo registrado" className="bg-panel border border-exito/50 rounded-2xl p-5 flex flex-col gap-3">
          <Alert variante="exito">{novedad.mensaje}</Alert>
          <ul><FilaContrato contrato={novedad.contratoNuevo} /></ul>
          <div className="flex justify-end"><Button variante="neutro" onClick={() => setNovedad(null)}>Entendido</Button></div>
        </section>
      )}

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="relative flex-1 lg:max-w-md">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-texto-suave pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            aria-label="Buscar por cliente o cancha"
            placeholder="Buscar por cliente, DNI o cancha"
            maxLength={100}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-fondo text-texto placeholder:text-texto-suave border border-gray-800 focus:border-viper rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none transition-colors"
          />
        </div>
        <Select aria-label="Filtrar por estado" opciones={OPCIONES_ESTADO_CONTRATO} value={estado} onChange={(e) => cambiar({ estado: e.target.value })} className="lg:w-48" />
        {/* En el celular el botón queda fijo abajo */}
        <div className="fixed bottom-0 inset-x-0 p-4 bg-fondo/90 backdrop-blur border-t border-gray-800 z-30 md:static md:p-0 md:bg-transparent md:border-0 md:backdrop-blur-none lg:ml-auto">{nuevo}</div>
      </div>

      {error && (
        <Alert variante="error" titulo="No pudimos cargar los alquileres fijos">
          {error}{' '}
          <button type="button" onClick={reintentar} className="underline font-semibold cursor-pointer">Reintentar</button>
        </Alert>
      )}

      {!datos && !error && <div className="py-16 flex justify-center"><Spinner texto="Cargando alquileres fijos" /></div>}

      {datos && datos.contratos.length === 0 && (
        <EmptyState
          titulo={hayFiltros ? 'No se encontraron resultados' : 'Todavía no hay alquileres fijos'}
          descripcion={hayFiltros ? 'Probá con otro cliente o cancha, o quitá los filtros.' : 'Cuando registres un contrato de alquiler fijo, va a aparecer acá.'}
          accion={hayFiltros ? <Button variante="secundario" onClick={limpiar}>Limpiar filtros</Button> : undefined}
        />
      )}

      {datos && datos.contratos.length > 0 && (
        <div className={`flex flex-col gap-3 transition-opacity ${cargando ? 'opacity-60' : ''}`} aria-busy={cargando}>
          {datos.totalPaginas > 1 && control('Paginación superior', false)}
          <div className={`hidden md:grid ${COLUMNAS} gap-x-4 px-6 text-xs font-bold uppercase tracking-wide text-texto-suave`}>
            <span>Cancha</span>
            <span>Día y horario</span>
            <span>Cliente</span>
            <span>Período</span>
            <span>Estado</span>
          </div>
          <ul className="flex flex-col gap-3">
            {datos.contratos.map((contrato) => <FilaContrato key={contrato.id} contrato={contrato} />)}
          </ul>
          {control('Paginación', true)}
        </div>
      )}
    </div>
  )
}