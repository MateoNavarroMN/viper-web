import Button from '../../../../shared/components/Button'
import { Link } from 'react-router-dom'
import { ETIQUETA_DISCIPLINA, fechaHora, precio } from '../torneos'

// Panel «Inscripción» de la ficha pública: cupo, precio y el botón según el estado del jugador.
// Mismo contenido en escritorio (tarjeta a la derecha) y celular (bloque bajo los datos).
export default function PanelInscripcion({ torneo, rutaInscripcion }) {
  const { cupoDisponible, cupoMaximo, inscriptos, miInscripcion, accionesPermitidas, estado } = torneo
  const abierto = estado === 'INSCRIPCIONES_ABIERTAS'
  const puede = accionesPermitidas.includes('INSCRIBIRSE')
  const porcentaje = cupoMaximo > 0 ? Math.min(100, (inscriptos / cupoMaximo) * 100) : 0

  return (
    <section className="bg-panel border border-gray-800 rounded-2xl p-5 md:p-8 flex flex-col gap-5 h-fit">
      <h2 className="text-xs font-bold uppercase tracking-wide text-texto-suave">Inscripción</h2>

      {abierto ? (
        <div>
          <p className="text-[13px] text-texto-suave">Cupo disponible</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className={`font-outfit text-5xl font-bold tabular-nums ${cupoDisponible > 0 ? 'text-viper' : 'text-error'}`}>{cupoDisponible}</span>
            <span className="text-texto-suave">{cupoDisponible === 1 ? 'lugar libre' : 'lugares libres'}</span>
          </p>
          <div
            className="h-2 mt-3 rounded-full bg-gray-800 overflow-hidden"
            role="progressbar"
            aria-label="Cupo ocupado"
            aria-valuemin={0}
            aria-valuemax={cupoMaximo}
            aria-valuenow={inscriptos}
          >
            <div className="h-full rounded-full bg-viper" style={{ width: `${porcentaje}%` }} />
          </div>
          <p className="text-sm text-texto-suave mt-2 tabular-nums">{inscriptos} de {cupoMaximo} lugares ocupados</p>
        </div>
      ) : (
        <div>
          <p className="text-[13px] text-texto-suave">Inscriptos</p>
          <p className="font-outfit text-5xl font-bold tabular-nums mt-1">{inscriptos}</p>
        </div>
      )}

      <div>
        <p className="text-[13px] text-texto-suave">Precio de inscripción</p>
        <p className="font-outfit text-3xl font-bold mt-1">{precio(torneo.precioInscripcion)}</p>
      </div>

      {miInscripcion ? (
        <div className="bg-fondo border border-exito/40 rounded-xl p-4 text-sm">
          <p className="font-semibold text-exito">Ya estás inscripto</p>
          <p className="text-texto-suave mt-1">
            {miInscripcion.companeroNombre &&
              `Pareja: ${miInscripcion.esTitular
                ? `${miInscripcion.companeroNombre} ${miInscripcion.companeroApellido}`
                : `${miInscripcion.titularNombre} ${miInscripcion.titularApellido}`}. `}
            {miInscripcion.estadoPago === 'PAGADO'
              ? 'El pago está confirmado.'
              : miInscripcion.venceEn
                ? `Pagá en recepción hasta el ${fechaHora(miInscripcion.venceEn)}.`
                : 'Falta el pago en recepción.'}
          </p>
        </div>
      ) : abierto ? (
        <>
          {torneo.disciplina === 'PADEL' && <p className="text-sm text-texto-suave">En Pádel te inscribís junto a un compañero.</p>}
          {puede ? (
            <Link to={rutaInscripcion} className="font-outfit font-bold text-center bg-viper hover:bg-viper-hover text-black px-8 py-4 rounded-xl text-lg transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              Inscribirme
            </Link>
          ) : (
            <Button tamano="grande" disabled className="w-full">Cupo completo</Button>
          )}
        </>
      ) : (
        <p className="text-sm text-texto-suave">
          {estado === 'EN_CURSO' || estado === 'INSCRIPCIONES_CERRADAS'
            ? 'Las inscripciones de este torneo están cerradas.'
            : `Este torneo de ${ETIQUETA_DISCIPLINA[torneo.disciplina]} ya no recibe inscripciones.`}
        </p>
      )}
    </section>
  )
}