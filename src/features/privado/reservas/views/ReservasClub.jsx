import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import GrillaReservas from '../components/GrillaReservas'
import ResumenReserva from '../components/ResumenReserva'

// Reservas del club para Recepción y Administrador: la grilla con el detalle de lo ocupado y el turno directo. Las tareas
// siguientes le suman el cobro y las demás acciones.
export default function ReservasClub() {
  const location = useLocation()
  const navigate = useNavigate()
  // Lo que deja la pantalla del turno directo: la reserva recién cargada. Se guarda acá y se saca de la navegación para que
  // recargar la página no lo repita.
  const [novedad, setNovedad] = useState(() => location.state ?? null)
  useEffect(() => {
    if (location.state) navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
  }, [location, navigate])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-outfit text-[28px] font-bold">Reservas</h1>
        <p className="text-texto-suave mt-1">Los turnos de las canchas del club, libres y ocupados, día por día.</p>
      </div>

      {novedad?.reservaNueva && (
        <section aria-label="Turno registrado" className="bg-panel border border-exito/50 rounded-2xl p-5 flex flex-col gap-3">
          <Alert variante="exito">{novedad.mensaje}</Alert>
          <ResumenReserva reserva={novedad.reservaNueva} conCliente />
          <div className="flex justify-end"><Button variante="neutro" onClick={() => setNovedad(null)}>Entendido</Button></div>
        </section>
      )}

      <GrillaReservas />
    </div>
  )
}