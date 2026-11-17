import { Link } from 'react-router-dom'
import Modal from '../../../../shared/components/Modal'
import { fechaLarga, precio } from '../../torneos/torneos'

const TEXTOS = { alquiler: 'Alquiler', fija: 'Reserva fija', torneo: 'Torneo' }
const ESTADOS = { PENDIENTE: 'Pendiente de pago', CONFIRMADA: 'Confirmada' }
const ENLACE = 'inline-flex items-center justify-center px-6 py-2 rounded-lg font-semibold transition-colors'

function Dato({ titulo, children }) {
  return (
    <div className="flex justify-between gap-4 py-2 border-b border-gray-800 last:border-0">
      <dt className="text-sm text-texto-suave shrink-0">{titulo}</dt>
      <dd className="text-sm font-semibold text-right break-words min-w-0">{children}</dd>
    </div>
  )
}

// Detalle de una franja ocupada del calendario. `franja` = { cancha, ocupada, tipo, rivales, deporte }.
// El Jugador no entra acá; el Organizador ve tipo, horario y torneo, sin cliente ni precio (los trae la API solo para el personal de recepción).
export default function DetalleFranja({ franja, dia, rol, rutaTorneo, onCerrar }) {
  if (!franja) return null
  const { cancha, ocupada: o, tipo, rivales, deporte } = franja
  const recepcion = rol === 'RECEPCIONISTA' || rol === 'ADMINISTRADOR'
  const gestion = `/gestion/reservas?fecha=${dia}&deporte=${deporte}&cancha=${cancha.id}&hora=${o.horaInicio.slice(0, 2)}:00`

  return (
    <Modal abierto titulo={TEXTOS[tipo]} posicion="abajo-movil" onCerrar={onCerrar}>
      <dl>
        <Dato titulo="Cancha">{cancha.nombre}</Dato>
        <Dato titulo="Día">{fechaLarga(dia)}</Dato>
        <Dato titulo="Horario">{o.horaInicio} – {o.horaFin}</Dato>
        {tipo !== 'torneo' && ESTADOS[o.estado] && <Dato titulo="Estado">{ESTADOS[o.estado]}</Dato>}
        {tipo === 'torneo' && (
          <>
            <Dato titulo="Torneo">{o.torneo ?? 'Torneo'}</Dato>
            {rivales && <Dato titulo="Partido">{rivales}</Dato>}
          </>
        )}
        {recepcion && tipo !== 'torneo' && o.cliente && <Dato titulo="Cliente">{o.cliente.nombre} {o.cliente.apellido}</Dato>}
        {recepcion && tipo !== 'torneo' && o.precioAplicado != null && <Dato titulo="Precio">{precio(Number(o.precioAplicado))}</Dato>}
      </dl>

      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        {tipo === 'torneo' && o.torneoId && o.torneo && (
          <Link to={rutaTorneo(o.torneoId)} className={`${ENLACE} bg-viper hover:bg-viper-hover text-sobre-viper`}>Ver el torneo</Link>
        )}
        {recepcion && tipo === 'fija' && o.contratoId && (
          <Link to={`/gestion/alquileres-fijos/${o.contratoId}`} className={`${ENLACE} bg-transparent border border-viper text-viper hover:bg-viper/20`}>Ver contrato</Link>
        )}
        {recepcion && tipo !== 'torneo' && (
          <Link to={gestion} className={`${ENLACE} bg-viper hover:bg-viper-hover text-sobre-viper`}>Gestionar reserva</Link>
        )}
      </div>
    </Modal>
  )
}