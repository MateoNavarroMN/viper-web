import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { get } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import EmptyState from '../../../../shared/components/EmptyState'
import Spinner from '../../../../shared/components/Spinner'
import Tabs from '../../../../shared/components/Tabs'
import { useAuth } from '../../auth/useAuth'
import ConfirmarAccionTorneo from '../components/ConfirmarAccionTorneo'
import PanelInscriptos from '../components/PanelInscriptos'
import { ETIQUETA_DISCIPLINA, ETIQUETA_FORMATO, fechaCompleta, precio } from '../torneos'

const RUTA = '/gestion/torneos'

const PESTANAS = [
  { clave: 'datos', titulo: 'Datos' },
  { clave: 'inscriptos', titulo: 'Inscriptos' },
  { clave: 'cuadro', titulo: 'Cuadro / Zonas', deshabilitada: true },
  { clave: 'cronograma', titulo: 'Cronograma', deshabilitada: true },
]

const TARJETA = 'bg-panel border border-gray-800 rounded-2xl p-5 md:p-8'
const TITULO_SECCION = 'text-xs font-bold uppercase tracking-wide text-texto-suave mb-4'

function Contador({ etiqueta, valor, resaltado = false }) {
  return (
    <div className="bg-fondo border border-gray-800 rounded-xl p-3 sm:p-4 flex flex-col justify-between gap-1">
      <p className="text-xs sm:text-[13px] text-texto-suave">{etiqueta}</p>
      <p className={`font-outfit text-2xl sm:text-3xl font-bold tabular-nums ${resaltado ? 'text-viper' : ''}`}>{valor}</p>
    </div>
  )
}

function Dato({ etiqueta, children }) {
  return (
    <div>
      <dt className="text-[13px] text-texto-suave">{etiqueta}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  )
}

function Acciones({ torneo, onAccion }) {
  const permitidas = torneo.accionesPermitidas
  const ancho = 'w-full sm:w-auto whitespace-nowrap'
  return (
    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
      {permitidas.includes('EDITAR') && (
        <Link
          to={`${RUTA}/${torneo.id}/editar`}
          className={`${ancho} font-outfit font-semibold text-center px-6 py-2 rounded-lg bg-panel border border-gray-800 hover:border-viper transition-colors`}
        >
          Editar
        </Link>
      )}
      {permitidas.includes('ABRIR_INSCRIPCIONES') && (
        <Button className={ancho} onClick={() => onAccion('ABRIR_INSCRIPCIONES')}>Abrir inscripciones</Button>
      )}
      {permitidas.includes('CERRAR_INSCRIPCIONES') && (
        <Button className={ancho} onClick={() => onAccion('CERRAR_INSCRIPCIONES')}>Cerrar inscripciones</Button>
      )}
      {permitidas.includes('CANCELAR') && (
        <Button variante="peligro-borde" className={ancho} onClick={() => onAccion('CANCELAR')}>Cancelar torneo</Button>
      )}
    </div>
  )
}

function PanelDatos({ torneo }) {
  const porcentaje = torneo.cupoMaximo > 0 ? Math.min(100, (torneo.inscriptos / torneo.cupoMaximo) * 100) : 0
  const conZonas = torneo.formato === 'ZONAS_Y_ELIMINACION'

  return (
    <div className="flex flex-col gap-6">
      <section className={TARJETA}>
        <h2 className={TITULO_SECCION}>Inscriptos</h2>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <Contador etiqueta="Inscriptos" valor={torneo.inscriptos} resaltado />
          <Contador etiqueta="Disponibles" valor={torneo.cupoDisponible} />
          <Contador etiqueta="Cupo máximo" valor={torneo.cupoMaximo} />
        </div>
        <div
          className="h-2 mt-5 rounded-full bg-gray-800 overflow-hidden"
          role="progressbar"
          aria-label="Cupo ocupado"
          aria-valuemin={0}
          aria-valuemax={torneo.cupoMaximo}
          aria-valuenow={torneo.inscriptos}
        >
          <div className="h-full rounded-full bg-viper" style={{ width: `${porcentaje}%` }} />
        </div>
      </section>

      <section className={TARJETA}>
        <h2 className={TITULO_SECCION}>Datos del torneo</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          <Dato etiqueta="Disciplina">{ETIQUETA_DISCIPLINA[torneo.disciplina]}</Dato>
          <Dato etiqueta="Categoría técnica">{torneo.categoria}</Dato>
          <Dato etiqueta="Formato">{ETIQUETA_FORMATO[torneo.formato]}</Dato>
          {conZonas && <Dato etiqueta="Clasificados por zona">{torneo.clasificanPorZona}</Dato>}
          <Dato etiqueta="Fecha de inicio">{fechaCompleta(torneo.fechaInicio)}</Dato>
          <Dato etiqueta="Fecha de fin">{fechaCompleta(torneo.fechaFin)}</Dato>
          <Dato etiqueta="Precio de inscripción">{precio(torneo.precioInscripcion)}</Dato>
        </dl>
      </section>
    </div>
  )
}

export default function FichaTorneo() {
  const { id } = useParams()
  const { rol } = useAuth()
  const [pestana, setPestana] = useState('datos')
  const [accion, setAccion] = useState(null)

  const [reintento, setReintento] = useState(0)
  const [resultado, setResultado] = useState(null)
  const clave = `${id}|${reintento}`
  const torneo = resultado?.id === id ? (resultado.torneo ?? null) : null
  const error = resultado?.clave === clave ? resultado.error : null

  useEffect(() => {
    let vigente = true
    get(`/torneos/${id}`)
      .then((r) => vigente && setResultado({ clave, id, torneo: r.torneo }))
      .catch((e) => vigente && setResultado((anterior) => ({
        clave, id, error: e.mensaje, status: e.status,
        torneo: e.status !== 404 && anterior?.id === id ? anterior.torneo : null,
      })))
    return () => {
      vigente = false
    }
  }, [id, clave])

  const cerrarAccion = useCallback(() => setAccion(null), [])
  const recargar = useCallback(() => setReintento((n) => n + 1), [])

  const volver = (
    <Link to={RUTA} className="text-sm text-texto-suave hover:text-viper transition-colors inline-flex items-center gap-1 w-fit">
      <span aria-hidden="true">‹</span> Volver a torneos
    </Link>
  )

  if (!torneo) {
    const noExiste = resultado?.status === 404
    return (
      <div className="max-w-5xl mx-auto w-full flex flex-col gap-6">
        {volver}
        {error ? (
          <Alert variante="error" titulo={noExiste ? 'No encontramos el torneo' : 'No pudimos cargar el torneo'}>
            {noExiste ? (
              <Link to={RUTA} className="underline font-semibold">Volver a la lista</Link>
            ) : (
              <>
                {error}{' '}
                <button type="button" onClick={recargar} className="underline font-semibold cursor-pointer">
                  Reintentar
                </button>
              </>
            )}
          </Alert>
        ) : (
          <div className="py-16 flex justify-center">
            <Spinner texto="Cargando torneo" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col gap-6">
      {volver}

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-outfit text-[28px] font-bold break-words">{torneo.nombre}</h1>
            <EstadoBadge tipo="torneo" estado={torneo.estado} />
          </div>
          <p className="text-texto-suave text-sm mt-1">
            {torneo.categoria} · {ETIQUETA_DISCIPLINA[torneo.disciplina]}
          </p>
        </div>
        <Acciones torneo={torneo} onAccion={setAccion} />
      </div>

      {error && (
        <Alert variante="error">
          {error}{' '}
          <button type="button" onClick={recargar} className="underline font-semibold cursor-pointer">
            Reintentar
          </button>
        </Alert>
      )}
      {torneo.estado === 'CANCELADO' && (
        <Alert variante="info">Este torneo fue cancelado: sus inscripciones se anularon y los reembolsos se gestionan fuera del sistema.</Alert>
      )}

      <Tabs pestanas={PESTANAS} activa={pestana} onCambiar={setPestana} />

      <div role="tabpanel">
        {pestana === 'datos' && <PanelDatos torneo={torneo} />}
        {pestana === 'inscriptos' && (torneo.estado === 'PLANIFICADO' ? (
          <EmptyState titulo="Todavía no hay inscripciones" descripcion="Abrí las inscripciones del torneo para que los jugadores puedan anotarse." />
        ) : (
          <PanelInscriptos torneoId={torneo.id} puedeCobrar={rol !== 'ORGANIZADOR'} precioInscripcion={torneo.precioInscripcion} />
        ))}
      </div>

      <ConfirmarAccionTorneo accion={accion} torneo={torneo} onCerrar={cerrarAccion} onHecho={recargar} />
    </div>
  )
}