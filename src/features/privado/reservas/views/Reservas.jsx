import { useSearchParams } from 'react-router-dom'
import EmptyState from '../../../../shared/components/EmptyState'
import Tabs from '../../../../shared/components/Tabs'

const PESTANAS = [
  { clave: 'grilla', titulo: 'Grilla' },
  { clave: 'mis-reservas', titulo: 'Mis reservas' },
]

// Reservas del Jugador: la grilla de turnos libres y sus propias reservas. La pestaña elegida queda en la URL
// (?pestana=mis-reservas) para que el enlace, el botón «atrás» y recargar vuelvan al mismo lugar.
// Cada pestaña muestra por ahora un aviso; las tareas siguientes (grilla, solicitud y Mis reservas) ponen su contenido.
export default function Reservas() {
  const [params, setParams] = useSearchParams()
  const pestana = PESTANAS.some((p) => p.clave === params.get('pestana')) ? params.get('pestana') : 'grilla'

  const cambiarPestana = (clave) => setParams(clave === 'grilla' ? {} : { pestana: clave }, { replace: true })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-outfit text-[28px] font-bold">Reservas</h1>
        <p className="text-texto-suave mt-1">Elegí un turno libre de las canchas del club o mirá tus reservas.</p>
      </div>

      <Tabs pestanas={PESTANAS} activa={pestana} onCambiar={cambiarPestana} />

      <div role="tabpanel" aria-label={PESTANAS.find((p) => p.clave === pestana).titulo}>
        {pestana === 'grilla' ? (
          <EmptyState titulo="La grilla de turnos llega pronto" descripcion="Acá vas a ver los turnos libres de cada cancha y vas a poder pedir el tuyo." />
        ) : (
          <EmptyState titulo="Tus reservas llegan pronto" descripcion="Acá vas a ver tus reservas, su estado y cuánto falta para pagarlas." />
        )}
      </div>
    </div>
  )
}