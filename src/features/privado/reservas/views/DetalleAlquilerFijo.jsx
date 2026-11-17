import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Alert from '../../../../shared/components/Alert'
import Badge from '../../../../shared/components/Badge'
import Button from '../../../../shared/components/Button'
import EmptyState from '../../../../shared/components/EmptyState'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Spinner from '../../../../shared/components/Spinner'
import AccionesContrato from '../components/AccionesContrato'
import { dniConPuntos } from '../../../../shared/utils/dni'
import { ETIQUETA_DISCIPLINA, fechaCompleta, fechaHora, fechaLarga, precio } from '../../torneos/torneos'
import { TEXTO_RESPUESTA_CLIENTE, horarioDelContrato } from '../reservas'
import { useAlquilerFijo } from '../useAlquileresFijos'

const TARJETA = 'bg-panel border border-gray-800 rounded-2xl p-6 md:p-8'
const TITULO_SECCION = 'text-xs font-bold uppercase tracking-wide text-texto-suave mb-4'

const Dato = ({ titulo, children }) => (
  <div className="flex flex-col gap-1 min-w-0">
    <dt className="text-xs text-texto-suave">{titulo}</dt>
    <dd className="text-sm font-semibold break-words">{children}</dd>
  </div>
)

// Detalle de un contrato (solo lectura): sus datos y cada fecha con su estado. Las fechas canceladas se ven apagadas y tachadas.
export default function DetalleAlquilerFijo() {
  const { id } = useParams()
  const { cargando, error, noExiste, contrato, reintentar, refrescar } = useAlquilerFijo(id)
  const [resultado, setResultado] = useState(null) // { variante, titulo?, mensaje, fechas? } de la última acción
  const volver = <Link to="/gestion/alquileres-fijos" className="text-sm text-viper hover:underline w-fit">← Volver a alquileres fijos</Link>

  if (cargando) return <div className="py-16 flex justify-center"><Spinner texto="Cargando el contrato" /></div>
  if (noExiste) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col gap-5">
        {volver}
        <EmptyState titulo="Contrato no encontrado" descripcion="Puede que se haya eliminado o que el enlace esté mal." accion={<Link to="/gestion/alquileres-fijos"><Button variante="secundario">Ver todos los contratos</Button></Link>} />
      </div>
    )
  }
  if (error) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col gap-5">
        {volver}
        <Alert variante="error" titulo="No pudimos cargar el contrato">
          {error}{' '}
          <button type="button" onClick={reintentar} className="underline font-semibold cursor-pointer">Reintentar</button>
        </Alert>
      </div>
    )
  }

  const { cancha, cliente, reservas } = contrato
  const confirmadas = reservas.filter((r) => r.estado === 'CONFIRMADA').length
  const canceladas = reservas.length - confirmadas
  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      {volver}

      {resultado && (
        <Alert variante={resultado.variante} titulo={resultado.titulo}>
          {resultado.mensaje}
          {resultado.fechas && (
            <span className="flex flex-wrap gap-2 mt-3">
              {resultado.fechas.map((fecha) => (
                <Link
                  key={fecha}
                  to={`/gestion/reservas?${new URLSearchParams({ fecha, deporte: cancha.deporte })}`}
                  className="inline-block rounded-full bg-fondo/60 border border-gray-700 hover:border-viper px-3 py-1 text-sm tabular-nums transition-colors"
                >
                  {fechaLarga(fecha)}
                </Link>
              ))}
            </span>
          )}
        </Alert>
      )}

      <section aria-labelledby="titulo-contrato" className={TARJETA}>
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <h1 id="titulo-contrato" className="font-outfit text-2xl font-bold">{cancha.nombre} · {horarioDelContrato(contrato)}</h1>
          <EstadoBadge tipo="contratoFijo" estado={contrato.estado} />
          {contrato.avisoFinContrato && <Badge variante="advertencia">Último turno</Badge>}
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Dato titulo="Cliente">
            {cliente ? <>{cliente.nombre} {cliente.apellido}<span className="block text-xs font-normal text-texto-suave">{cliente.email}{cliente.dni && ` · DNI ${dniConPuntos(cliente.dni)}`}</span></> : 'Sin cliente'}
          </Dato>
          <Dato titulo="Cancha">{cancha.nombre}<span className="block text-xs font-normal text-texto-suave">{ETIQUETA_DISCIPLINA[cancha.deporte]}</span></Dato>
          <Dato titulo="Período">{fechaCompleta(contrato.fechaInicio)} al {fechaCompleta(contrato.fechaFinContrato)}</Dato>
          <Dato titulo="Precio por turno">{precio(Number(contrato.precioPorTurno))}</Dato>
          <Dato titulo="Último turno">{contrato.ultimoTurno ? fechaLarga(contrato.ultimoTurno) : 'Ya no quedan turnos'}</Dato>
          <Dato titulo="Respuesta del cliente">{TEXTO_RESPUESTA_CLIENTE[contrato.respuestaCliente ?? 'NINGUNA']}</Dato>
          {contrato.canceladoEn && <Dato titulo="Cancelado el">{fechaHora(contrato.canceladoEn)}</Dato>}
        </dl>
      </section>

      {contrato.estado === 'VIGENTE' && <AccionesContrato contrato={contrato} onResultado={setResultado} onActualizar={refrescar} />}

      <section aria-labelledby="titulo-fechas" className={TARJETA}>
        <h2 id="titulo-fechas" className={TITULO_SECCION}>Fechas del contrato</h2>
        <p className="text-sm text-texto-suave mb-4">
          {reservas.length === 0
            ? 'Este contrato no tiene fechas.'
            : `${confirmadas} ${confirmadas === 1 ? 'confirmada' : 'confirmadas'}${canceladas > 0 ? ` · ${canceladas} ${canceladas === 1 ? 'cancelada' : 'canceladas'}` : ''}`}
        </p>
        {reservas.length > 0 && (
          <ul className="flex flex-col divide-y divide-gray-800 border border-gray-800 rounded-xl">
            {reservas.map((r) => {
              const cancelada = r.estado === 'CANCELADA'
              return (
                <li key={r.id} className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 ${cancelada ? 'text-texto-suave bg-fondo/40' : ''}`}>
                  <span className={`text-sm tabular-nums ${cancelada ? 'line-through' : 'font-semibold'}`}>{fechaLarga(r.fecha)} · {r.horaInicio} – {r.horaFin}</span>
                  <span className="flex items-center gap-3">
                    <span className="text-sm tabular-nums">{precio(Number(r.precioAplicado))}</span>
                    <EstadoBadge tipo="reserva" estado={r.estado} />
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}