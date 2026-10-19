import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { get } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Spinner from '../../../../shared/components/Spinner'
import PanelInscripcion from '../components/PanelInscripcion'
import { ETIQUETA_DISCIPLINA, ETIQUETA_FORMATO, precio, rangoFechas } from '../torneos'

const RUTA = '/portal/torneos'

function Dato({ etiqueta, children }) {
  return (
    <div>
      <dt className="text-[13px] text-texto-suave">{etiqueta}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  )
}

// Ficha pública del torneo para el jugador (/portal/torneos/:id): datos del torneo y panel de inscripción.
// Si el torneo está en curso, el cuadro, las zonas y el cronograma se suman en M3-FE-10, 11 y 14.
export default function FichaTorneoJugador() {
  const { id } = useParams()
  const [reintento, setReintento] = useState(0)
  const [resultado, setResultado] = useState(null) // { clave, id, torneo, error, status }
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
              <Link to={RUTA} className="underline font-semibold">Volver a los torneos</Link>
            ) : (
              <>
                {error}{' '}
                <button type="button" onClick={recargar} className="underline font-semibold cursor-pointer">Reintentar</button>
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

  const conZonas = torneo.formato === 'ZONAS_Y_ELIMINACION'
  const enCurso = torneo.estado === 'EN_CURSO'

  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col gap-6">
      {volver}

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-outfit text-[28px] font-bold break-words">{torneo.nombre}</h1>
          <EstadoBadge tipo="torneo" estado={torneo.estado} />
        </div>
        <p className="text-texto-suave text-sm mt-1">
          {ETIQUETA_DISCIPLINA[torneo.disciplina]} · {torneo.categoria} · {ETIQUETA_FORMATO[torneo.formato]}
        </p>
      </div>

      {error && (
        <Alert variante="error">
          {error}{' '}
          <button type="button" onClick={recargar} className="underline font-semibold cursor-pointer">Reintentar</button>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_22rem] gap-6">
        <div className="flex flex-col gap-6 lg:order-1 order-2">
          <section className="bg-panel border border-gray-800 rounded-2xl p-5 md:p-8">
            <h2 className="text-xs font-bold uppercase tracking-wide text-texto-suave mb-4">Detalles del torneo</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <Dato etiqueta="Disciplina">{ETIQUETA_DISCIPLINA[torneo.disciplina]}</Dato>
              <Dato etiqueta="Categoría técnica">{torneo.categoria}</Dato>
              <Dato etiqueta="Formato">{ETIQUETA_FORMATO[torneo.formato]}</Dato>
              {conZonas && <Dato etiqueta="Clasificados por zona">{torneo.clasificanPorZona}</Dato>}
              <Dato etiqueta="Fechas">{rangoFechas(torneo.fechaInicio, torneo.fechaFin)}</Dato>
              <Dato etiqueta="Precio de inscripción">{precio(torneo.precioInscripcion)}</Dato>
            </dl>
          </section>

          {enCurso && (
            <section className="bg-panel border border-gray-800 rounded-2xl p-5 md:p-8">
              <h2 className="text-xs font-bold uppercase tracking-wide text-texto-suave mb-2">Cuadro, zonas y cronograma</h2>
              <p className="text-texto-suave text-sm">El torneo está en curso. Pronto vas a poder seguir acá el cuadro, las zonas y los horarios de los partidos.</p>
            </section>
          )}
        </div>

        <div className="lg:order-2 order-1">
          <PanelInscripcion torneo={torneo} rutaInscripcion={`${RUTA}/${torneo.id}/inscripcion`} />
        </div>
      </div>
    </div>
  )
}