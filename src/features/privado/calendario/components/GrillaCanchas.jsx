import { ESTILOS } from '../../torneos/estilosFranja'
import { PASO, aHora, aMinutos, horasDelDia } from '../../torneos/programacion'

const TIPOS = { OCASIONAL: 'alquiler', FIJA: 'fija', TORNEO: 'torneo' }
const TEXTOS = { alquiler: 'Alquiler', fija: 'Reserva fija', torneo: 'Torneo' }
// Una franja libre acá solo informa: no se elige (reservar es de otra pantalla)
const LIBRE = 'border border-dashed border-gray-700 bg-fondo text-texto-suave'

// Las canchas de una disciplina en un día, con la misma grilla de franjas de «Programar partido»: una columna por cancha y una
// fila cada 30 minutos. `disponibilidad` es la respuesta de GET /canchas/disponibilidad y `etiquetas` { [partidoId]: 'A vs B' }.
export default function GrillaCanchas({ disponibilidad, etiquetas }) {
  const { horario, canchas } = disponibilidad
  const horas = horasDelDia(horario)
  const desde = aMinutos(horario.desde)

  return (
    <div className="sin-barra overflow-x-auto">
      <div className="grid gap-1" style={{ gridTemplateColumns: `3rem repeat(${canchas.length}, minmax(6.5rem, 1fr))` }}>
        <div />
        {canchas.map((c) => (
          <p key={c.id} className="text-center text-sm font-semibold pb-2 truncate">{c.nombre}</p>
        ))}

        {horas.map((minutos) => (
          <FilaHora key={minutos} minutos={minutos}>
            {canchas.map((cancha) => {
              const ocupada = cancha.ocupadas
                .map((o) => ({ ...o, ini: aMinutos(o.horaInicio), fin: aMinutos(o.horaFin) }))
                .find((o) => o.ini < minutos + PASO && o.fin > minutos)
              const nombre = `${cancha.nombre} ${aHora(minutos)}`
              if (!ocupada) {
                return (
                  <div key={cancha.id} role="img" aria-label={`${nombre}, libre`} className={`h-8 rounded-md px-2 text-xs flex items-center ${LIBRE}`}>
                    Libre
                  </div>
                )
              }
              const tipo = TIPOS[ocupada.tipo] ?? 'alquiler'
              const empieza = (ocupada.ini >= minutos && ocupada.ini < minutos + PASO) || (minutos === desde && ocupada.ini < minutos)
              const detalle = tipo === 'torneo' ? (etiquetas[ocupada.partidoId] ?? ocupada.torneo) : null
              const completo = [TEXTOS[tipo], detalle, tipo === 'torneo' ? ocupada.torneo : null, `${ocupada.horaInicio} – ${ocupada.horaFin}`].filter(Boolean).join(' · ')
              return (
                <div key={cancha.id} role="img" aria-label={`${nombre}, ${completo}`} title={completo} className={`h-8 rounded-md px-2 text-xs flex items-center gap-1 min-w-0 ${ESTILOS[tipo]}`}>
                  {empieza && <span className="font-semibold shrink-0 max-w-full truncate">{TEXTOS[tipo]}</span>}
                  {empieza && detalle && <span className="truncate opacity-80">{detalle}</span>}
                </div>
              )
            })}
          </FilaHora>
        ))}
      </div>
    </div>
  )
}

function FilaHora({ minutos, children }) {
  return (
    <>
      <p className="h-8 flex items-center text-xs text-texto-suave tabular-nums">{aHora(minutos)}</p>
      {children}
    </>
  )
}