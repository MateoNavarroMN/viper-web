import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { get } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Spinner from '../../../../shared/components/Spinner'
import { useAuth } from '../../auth/useAuth'
import PanelInscriptos from '../components/PanelInscriptos'
import { ETIQUETA_DISCIPLINA } from '../torneos'

const RUTA = '/gestion/inscripciones'

// Inscriptos de un torneo (/gestion/inscripciones/:id), la entrada de Recepción. Cobra el Recepcionista y el
// Administrador; el Organizador ve la lista (Anexo C).
export default function InscriptosTorneo() {
  const { id } = useParams()
  const { rol } = useAuth()
  const [resultado, setResultado] = useState(null) // { id, torneo, error, status }
  const torneo = resultado?.id === id ? (resultado.torneo ?? null) : null

  useEffect(() => {
    let vigente = true
    get(`/torneos/${id}`)
      .then((r) => vigente && setResultado({ id, torneo: r.torneo }))
      .catch((e) => vigente && setResultado({ id, error: e.mensaje, status: e.status }))
    return () => {
      vigente = false
    }
  }, [id])

  const volver = (
    <Link to={RUTA} className="text-sm text-texto-suave hover:text-viper transition-colors inline-flex items-center gap-1 w-fit">
      <span aria-hidden="true">‹</span> Volver a inscripciones
    </Link>
  )

  if (!torneo) {
    const error = resultado?.id === id ? resultado.error : null
    const noExiste = resultado?.status === 404
    return (
      <div className="max-w-5xl mx-auto w-full flex flex-col gap-6">
        {volver}
        {error ? (
          <Alert variante="error" titulo={noExiste ? 'No encontramos el torneo' : 'No pudimos cargar el torneo'}>
            {noExiste ? <Link to={RUTA} className="underline font-semibold">Volver a la lista</Link> : error}
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
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-outfit text-[28px] font-bold break-words">{torneo.nombre}</h1>
          <EstadoBadge tipo="torneo" estado={torneo.estado} />
        </div>
        <p className="text-texto-suave text-sm mt-1">
          {torneo.categoria} · {ETIQUETA_DISCIPLINA[torneo.disciplina]} · {torneo.inscriptos} / {torneo.cupoMaximo} inscriptos
        </p>
      </div>
      <PanelInscriptos torneoId={id} puedeCobrar={rol !== 'ORGANIZADOR'} precioInscripcion={torneo.precioInscripcion} />
    </div>
  )
}