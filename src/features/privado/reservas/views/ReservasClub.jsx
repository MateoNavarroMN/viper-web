import GrillaReservas from '../components/GrillaReservas'

// Reservas del club para Recepción y Administrador: la grilla con el detalle de lo ocupado. Las tareas siguientes le suman
// el turno directo, el cobro y las demás acciones.
export default function ReservasClub() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-outfit text-[28px] font-bold">Reservas</h1>
        <p className="text-texto-suave mt-1">Los turnos de las canchas del club, libres y ocupados, día por día.</p>
      </div>
      <GrillaReservas />
    </div>
  )
}
