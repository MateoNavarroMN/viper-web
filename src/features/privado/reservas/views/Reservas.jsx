import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import EmptyState from '../../../../shared/components/EmptyState'
import Tabs from '../../../../shared/components/Tabs'
import GrillaReservas from '../components/GrillaReservas'
import ResumenReserva from '../components/ResumenReserva'

const PESTANAS = [
  { clave: 'grilla', titulo: 'Grilla' },
  { clave: 'mis-reservas', titulo: 'Mis reservas' },
]

// Reservas del Jugador: la grilla de turnos libres y sus propias reservas. La pestaña elegida queda en la URL
// (?pestana=mis-reservas) para que el enlace, el botón «atrás» y recargar vuelvan al mismo lugar.
// «Mis reservas» muestra por ahora un aviso; las tareas siguientes (solicitud y Mis reservas) ponen su contenido.
export default function Reservas() {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  // Lo que deja la pantalla de solicitud: la reserva recién pedida (éxito) o un aviso (el turno ya no estaba libre).
  // Se guarda acá y se saca de la navegación para que recargar la página no lo repita.
  const [novedad, setNovedad] = useState(() => location.state ?? null)
  useEffect(() => {
    if (location.state) navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
  }, [location, navigate])
  const pestana = PESTANAS.some((p) => p.clave === params.get('pestana')) ? params.get('pestana') : 'grilla'

  const cambiarPestana = (clave) => setParams(clave === 'grilla' ? {} : { pestana: clave }, { replace: true })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-outfit text-[28px] font-bold">Reservas</h1>
        <p className="text-texto-suave mt-1">Elegí un turno libre de las canchas del club o mirá tus reservas.</p>
      </div>

      {novedad?.aviso && <Alert variante="advertencia">{novedad.aviso}</Alert>}
      {novedad?.reservaNueva && (
        <section aria-label="Reserva solicitada" className="bg-panel border border-exito/50 rounded-2xl p-5 flex flex-col gap-3">
          <Alert variante="exito">{novedad.mensaje}</Alert>
          {novedad.pagoEnLinea && <Alert variante="info">{novedad.pagoEnLinea.mensaje}</Alert>}
          <ResumenReserva reserva={novedad.reservaNueva} />
          <div className="flex justify-end"><Button variante="neutro" onClick={() => setNovedad(null)}>Entendido</Button></div>
        </section>
      )}

      <Tabs pestanas={PESTANAS} activa={pestana} onCambiar={cambiarPestana} />

      <div role="tabpanel" aria-label={PESTANAS.find((p) => p.clave === pestana).titulo}>
        {pestana === 'grilla' ? (
          <GrillaReservas />
        ) : (
          <EmptyState titulo="Tus reservas llegan pronto" descripcion="Acá vas a ver tus reservas, su estado y cuánto falta para pagarlas." />
        )}
      </div>
    </div>
  )
}
