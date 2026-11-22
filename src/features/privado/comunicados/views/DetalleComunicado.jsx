import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { get } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Spinner from '../../../../shared/components/Spinner'
import { fechaYHora, nombreDelAutor } from '../comunicados'
import { useAccionesComunicado } from '../useAccionesComunicado'

const LISTADO = '/gestion/comunicados'

function Dato({ titulo, children }) {
  return (
    <div>
      <dt className="text-xs text-texto-suave">{titulo}</dt>
      <dd className="text-sm mt-1">{children}</dd>
    </div>
  )
}

// Detalle de un comunicado (solo Administrador): el texto completo, a quiénes se muestra, el autor y las fechas.
// Un borrador se puede editar y publicar; uno publicado, retirar; uno retirado queda solo para consulta.
export default function DetalleComunicado() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [estado, setEstado] = useState({ cargando: true, comunicado: null, noExiste: false, error: null })
  const [aviso, setAviso] = useState(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    get(`/comunicados/${id}`)
      .then((r) => vigente && setEstado({ cargando: false, comunicado: r.comunicado, noExiste: false, error: null }))
      .catch((e) => vigente && setEstado({ cargando: false, comunicado: null, noExiste: e.status === 404, error: e.status === 404 ? null : e.mensaje }))
    return () => {
      vigente = false
    }
  }, [id, intento])

  const { pedirPublicar, pedirRetirar, dialogo } = useAccionesComunicado({
    alTerminar: (comunicado) => setEstado((previo) => ({ ...previo, comunicado })),
    // Si otra persona ya lo cambió, se muestra el motivo y se vuelve a pedir el comunicado
    alFallar: (mensaje) => {
      setAviso(mensaje)
      setIntento((n) => n + 1)
    },
  })

  const { cargando, comunicado, noExiste, error } = estado

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <Link to={LISTADO} className="text-sm text-texto-suave hover:text-viper transition-colors inline-flex items-center gap-1 w-fit">
        <span aria-hidden="true">‹</span> Volver a comunicados
      </Link>

      {cargando && !comunicado ? (
        <div className="py-16 flex justify-center"><Spinner texto="Cargando el comunicado" /></div>
      ) : noExiste ? (
        <Alert variante="error" titulo="Comunicado no encontrado">
          No existe un comunicado con ese enlace.{' '}
          <Button variante="neutro" onClick={() => navigate(LISTADO)} className="ml-2">Volver al listado</Button>
        </Alert>
      ) : error && !comunicado ? (
        <Alert variante="error" titulo="No pudimos cargar el comunicado">
          {error}{' '}
          <Button variante="neutro" onClick={() => { setEstado((p) => ({ ...p, cargando: true })); setIntento((n) => n + 1) }} className="ml-2">Reintentar</Button>
        </Alert>
      ) : (
        <>
          {aviso && <Alert variante="advertencia">{aviso}</Alert>}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <EstadoBadge tipo="comunicado" estado={comunicado.estado} />
              <EstadoBadge tipo="alcanceComunicado" estado={comunicado.alcance} />
            </div>
            <h1 className="font-outfit text-[28px] font-bold break-words">{comunicado.titulo}</h1>
          </div>

          <section aria-label="Texto del comunicado" className="bg-panel border border-gray-800 rounded-2xl p-6 md:p-8">
            {comunicado.mensaje ? (
              <p className="whitespace-pre-line break-words leading-relaxed">{comunicado.mensaje}</p>
            ) : (
              <p className="text-texto-suave">Este borrador todavía no tiene mensaje.</p>
            )}
          </section>

          <dl className="bg-panel border border-gray-800 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Dato titulo="Autor">{nombreDelAutor(comunicado.autor)}</Dato>
            <Dato titulo="Visible para">{comunicado.alcance === 'TODOS' ? 'Todos los jugadores y socios' : 'Solo los socios'}</Dato>
            <Dato titulo="Fecha de publicación">{fechaYHora(comunicado.fechaPublicacion)}</Dato>
          </dl>

          {comunicado.estado === 'BORRADOR' && (
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <Button variante="secundario" onClick={() => navigate(`${LISTADO}/${id}/editar`)}>Editar</Button>
              <Button onClick={() => pedirPublicar(comunicado)}>Publicar</Button>
            </div>
          )}
          {comunicado.estado === 'PUBLICADO' && (
            <div className="flex sm:justify-end">
              <Button variante="peligro-borde" onClick={() => pedirRetirar(comunicado)} className="w-full sm:w-auto">Retirar</Button>
            </div>
          )}
          {comunicado.estado === 'RETIRADO' && (
            <Alert variante="info">Este comunicado fue retirado: ya no se muestra en la cartelera y queda en el historial.</Alert>
          )}
        </>
      )}
      {dialogo}
    </div>
  )
}