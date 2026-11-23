import { useConsulta } from '../useConsulta'
import { cuandoVence } from '../dashboard'
import BloqueOperativo, { Barra } from './BloqueOperativo'

const DEPORTE = { TENIS: 'Tenis', PADEL: 'Pádel' }

// Canchas de hoy: franjas ocupadas por cancha, reservas del día y reservas pendientes de pago con su plazo.
// Sin reservas (6a) todas las franjas figuran libres y la ocupación en cero.
export default function BloqueCanchas() {
  const consulta = useConsulta('/dashboard/canchas')
  return (
    <BloqueOperativo titulo="Canchas hoy" ruta="/gestion/reservas" consulta={consulta}>
      {(d) => (
        <>
          {d.canchas.length === 0 ? (
            <p className="text-sm text-texto-suave text-center py-4">No hay canchas activas.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {d.canchas.map((c) => (
                <li key={c.id}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span>{c.nombre} <span className="text-sm text-texto-suave ml-2">{DEPORTE[c.deporte]}</span></span>
                    <span className="text-sm text-texto-suave tabular-nums whitespace-nowrap">{c.ocupadas} de {c.total} franjas</span>
                  </div>
                  <div className="mt-2"><Barra porcentaje={c.porcentaje} /></div>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-gray-800 pt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
            <span>Reservas del día: <strong className="tabular-nums">{d.reservas.length}</strong></span>
            {d.pendientes.length > 0 ? (
              <span className="text-advertencia">
                Pendientes de pago: {d.pendientes.length} · la primera vence {cuandoVence(d.pendientes[0].venceEn)}
              </span>
            ) : (
              <span className="text-texto-suave">Sin reservas pendientes de pago</span>
            )}
          </div>
        </>
      )}
    </BloqueOperativo>
  )
}