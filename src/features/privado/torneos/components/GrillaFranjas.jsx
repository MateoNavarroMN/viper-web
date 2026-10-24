import { aHora, franja, horasDelDia, ocupacionesDeParticipantes } from '../programacion'
import { diaCorto } from '../torneos'

const ESTILOS = {
  libre: 'border border-dashed border-gray-700 bg-fondo text-texto-suave hover:border-viper hover:text-viper cursor-pointer',
  noentra: 'border border-gray-800/60 bg-fondo/40 text-gray-600',
  alquiler: 'border border-info/40 bg-info/15 text-info',
  fija: 'border border-violeta/40 bg-violeta/15 text-violeta',
  torneo: 'border border-viper/40 bg-viper/10 text-viper',
  actual: 'border border-dashed border-viper bg-viper/10 text-viper cursor-pointer',
  participante: 'border border-error/40 bg-error/10 text-error',
  seleccionada: 'border border-advertencia bg-advertencia/20 text-advertencia',
}

const ETIQUETA_ESTADO = {
  libre: 'libre',
  noentra: 'no entra un partido completo',
  alquiler: 'alquiler',
  fija: 'reserva fija',
  torneo: 'partido de torneo',
  actual: 'horario actual del partido',
  participante: 'participante ocupado',
  seleccionada: 'seleccionada',
}

// Grilla de franjas de una cancha: una columna por día y una fila cada 30 minutos (hora de inicio posible de un partido
// de 90). `dias` son las fechas a mostrar y `datos` las respuestas de /canchas/disponibilidad por fecha (las que ya llegaron).
// Se puede elegir una franja libre (o la del horario actual del partido): `onElegir(fecha, minutos)`.
export default function GrillaFranjas({ dias, datos, canchaId, partido, partidos, etiquetas, periodo, seleccion, onElegir }) {
  const referencia = datos[dias[0]] ?? Object.values(datos)[0]
  if (!referencia) return null
  const horas = horasDelDia(referencia.horario)

  return (
    <div className="sin-barra overflow-x-auto">
      <div className={`grid gap-1 ${dias.length > 1 ? 'min-w-[28rem]' : ''}`} style={{ gridTemplateColumns: `3rem repeat(${dias.length}, minmax(0, 1fr))` }}>
        <div />
        {dias.map((fecha) => (
          <p key={fecha} className="text-center text-sm font-semibold pb-2">{diaCorto(fecha)}</p>
        ))}

        {horas.map((minutos) => (
          <FilaHora key={minutos} minutos={minutos}>
            {dias.map((fecha) => {
              const dia = datos[fecha]
              if (!dia) return <div key={fecha} className="h-8 rounded-md bg-gray-800/40 animate-pulse" />
              const celda = franja({
                minutos, fecha, dia, canchaId, partido, etiquetas, seleccion,
                participantes: ocupacionesDeParticipantes(partido, partidos, fecha),
                enPeriodo: fecha >= periodo.inicio && fecha <= periodo.fin,
              })
              const elegible = celda.tipo === 'libre' || celda.tipo === 'actual'
              const clases = `h-8 rounded-md px-2 text-xs flex items-center gap-1 min-w-0 text-left ${ESTILOS[celda.tipo]}`
              const contenido = (
                <>
                  {celda.texto && <span className="font-semibold shrink-0 max-w-full truncate">{celda.texto}</span>}
                  {celda.detalle && <span className="truncate opacity-80 hidden sm:inline">{celda.detalle}</span>}
                  {celda.tipo === 'libre' && <span>Libre</span>}
                </>
              )
              const nombre = `${diaCorto(fecha)} ${aHora(minutos)}, ${ETIQUETA_ESTADO[celda.tipo]}`
              const completo = [celda.texto, celda.detalle].filter(Boolean).join(' · ') || undefined // con 5 días el texto se recorta: el texto entero queda al pasar el mouse
              return elegible ? (
                <button key={fecha} type="button" aria-label={nombre} title={completo} onClick={() => onElegir(fecha, minutos)} className={clases}>
                  {contenido}
                </button>
              ) : (
                <div key={fecha} role="img" aria-label={nombre} title={completo} className={clases}>
                  {contenido}
                </div>
              )
            })}
          </FilaHora>
        ))}
      </div>
    </div>
  )
}

// La hora a la izquierda y las franjas de la fila, como celdas sueltas de la misma grilla
function FilaHora({ minutos, children }) {
  return (
    <>
      <p className="h-8 flex items-center text-xs text-texto-suave tabular-nums">{aHora(minutos)}</p>
      {children}
    </>
  )
}