import Badge from '../../../../shared/components/Badge'
import Button from '../../../../shared/components/Button'
import Modal from '../../../../shared/components/Modal'
import { fechaPartido } from '../torneos'

const TEXTOS = {
  franja: { titulo: 'Franja no disponible', icono: 'advertencia' },
  participante: { titulo: 'Participante con partido simultáneo', icono: 'advertencia' },
  concurrencia: { titulo: 'Otra reserva tomó la franja primero', icono: 'error' },
}

const ICONO = {
  advertencia: 'bg-advertencia/20 text-advertencia',
  error: 'bg-error/20 text-error',
}

// Lo que dice la API al reservar una franja que no sirve (CU 3.5 · 3a, 3b y 4a). `conflicto`:
//   { tipo: 'franja' | 'participante' | 'concurrencia', franja: { fecha, horaInicio }, sugerencia: { canchaId, fecha, horaInicio } | null }
// «Usar esta franja» reserva la sugerencia; «Elegir otra» (o «Elegir otro horario») vuelve a la grilla.
export default function ConflictoFranja({ conflicto, nombreCancha, cargando, onUsar, onElegirOtra }) {
  if (!conflicto) return null
  const { tipo, franja, sugerencia } = conflicto
  const { titulo, icono } = TEXTOS[tipo]
  const elegida = fechaPartido(franja.fecha, franja.horaInicio)

  return (
    <Modal abierto titulo={titulo} onCerrar={() => !cargando && onElegirOtra()} posicion="abajo-movil" cabecera={false}>
      <div className={`w-11 h-11 rounded-full flex items-center justify-center mb-5 ${ICONO[icono]}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        </svg>
      </div>
      <h2 className="font-outfit text-xl font-bold mb-2">{titulo}</h2>

      {tipo === 'concurrencia' ? (
        <>
          <p className="text-texto-suave leading-relaxed">Rechazamos tu solicitud. Elegí otro horario.</p>
          <div className="mt-5 bg-fondo border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
            <p className="text-sm text-texto-suave">Franja {elegida}</p>
            <div className="flex items-center justify-between gap-3">
              <span>Primera solicitud</span>
              <Badge variante="exito">Confirmada</Badge>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Tu solicitud</span>
              <Badge variante="error">Rechazada</Badge>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 mt-8">
            <Button onClick={onElegirOtra}>Elegir otro horario</Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-texto-suave leading-relaxed">
            {tipo === 'franja' ? `${elegida} no está disponible.` : `Alguno de los participantes ya juega el ${elegida}.`}
          </p>
          <div className="mt-5 bg-fondo border border-gray-800 rounded-xl p-4">
            {sugerencia ? (
              <>
                <p className="text-sm text-texto-suave">Siguiente franja disponible</p>
                <p className="font-outfit font-bold text-lg mt-1">{fechaPartido(sugerencia.fecha, sugerencia.horaInicio)}</p>
                {nombreCancha && <p className="text-sm text-texto-suave mt-0.5">{nombreCancha}</p>}
              </>
            ) : (
              <p className="text-texto-suave">No hay otra franja libre dentro del período del torneo.</p>
            )}
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-8">
            <Button variante="neutro" onClick={onElegirOtra} disabled={cargando}>Elegir otra</Button>
            {sugerencia && <Button onClick={onUsar} cargando={cargando}>Usar esta franja</Button>}
          </div>
        </>
      )}
    </Modal>
  )
}