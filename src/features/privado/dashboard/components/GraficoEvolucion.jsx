import { useEffect, useRef, useState } from 'react'
import { fechaDelDia } from '../../caja/caja'
import { dinero, escalaVertical, indicesDeRotulos, montoCompacto } from '../dashboard'
import BloqueBalance from './BloqueBalance'

// Gráfico de líneas de la evolución diaria (ingresos y egresos), dibujado con SVG: sin librerías, con los colores del diseño
// (variables CSS), así se lee igual en modo claro y oscuro. El dibujo toma el ancho real del bloque (1 unidad = 1 píxel), así los
// textos de los ejes miden siempre lo mismo, también a 360 px.
// Se puede recorrer con el mouse, el dedo o las flechas del teclado: muestra el día con su ingreso, egreso y saldo.
const MARGEN = { izquierda: 52, derecha: 14, arriba: 14, abajo: 28 }

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
const diaDeLaSemana = (fecha) => DIAS[new Date(`${fecha}T12:00:00Z`).getUTCDay()]

function Leyenda() {
  return (
    <ul className="flex items-center gap-4 text-sm text-texto-suave">
      <li className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-exito" aria-hidden="true" />Ingresos</li>
      <li className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-advertencia" aria-hidden="true" />Egresos</li>
    </ul>
  )
}

export default function GraficoEvolucion({ evolucion }) {
  const [activo, setActivo] = useState(null)
  const [ancho, setAncho] = useState(640)
  const svg = useRef(null)
  const contenedor = useRef(null)

  // Ancho real del bloque: el dibujo se rehace al cambiar el tamaño de la ventana
  useEffect(() => {
    const observador = new ResizeObserver(([entrada]) => setAncho(Math.max(280, Math.round(entrada.contentRect.width))))
    observador.observe(contenedor.current)
    return () => observador.disconnect()
  }, [])

  const ANCHO = ancho
  const ALTO = ancho < 480 ? 220 : 280
  const AREA_X = ANCHO - MARGEN.izquierda - MARGEN.derecha
  const AREA_Y = ALTO - MARGEN.arriba - MARGEN.abajo

  const maximo = Math.max(0, ...evolucion.flatMap((d) => [d.ingresos, d.egresos]))
  const escala = escalaVertical(maximo)
  const cantidad = evolucion.length
  const x = (i) => MARGEN.izquierda + (cantidad === 1 ? AREA_X / 2 : (i / (cantidad - 1)) * AREA_X)
  const y = (valor) => MARGEN.arriba + AREA_Y - (valor / escala.tope) * AREA_Y
  const linea = (campo) => evolucion.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(d[campo]).toFixed(1)}`).join(' ')
  const conPuntos = cantidad <= 31

  const alMover = (e) => {
    const caja = svg.current.getBoundingClientRect()
    const dibujoX = e.clientX - caja.left
    const i = Math.round(((dibujoX - MARGEN.izquierda) / AREA_X) * (cantidad - 1))
    setActivo(cantidad === 1 ? 0 : Math.min(cantidad - 1, Math.max(0, i)))
  }
  const alTeclear = (e) => {
    if (e.key === 'ArrowRight') setActivo((a) => Math.min(cantidad - 1, (a ?? -1) + 1))
    else if (e.key === 'ArrowLeft') setActivo((a) => Math.max(0, (a ?? cantidad) - 1))
    else if (e.key === 'Escape') setActivo(null)
    else return
    e.preventDefault()
  }

  const dia = activo === null ? null : evolucion[activo]
  const resumen = `Evolución diaria del ${fechaDelDia(evolucion[0].fecha)} al ${fechaDelDia(evolucion[cantidad - 1].fecha)}: ingresos y egresos por día.`

  return (
    <BloqueBalance titulo="Evolución diaria" derecha={<Leyenda />}>
      <div ref={contenedor} className="relative">
        <svg
          ref={svg}
          viewBox={`0 0 ${ANCHO} ${ALTO}`}
          className="block w-full h-auto touch-pan-y select-none rounded-lg focus-visible:outline-2 focus-visible:outline-viper"
          role="img"
          aria-label={resumen}
          tabIndex={0}
          onPointerMove={alMover}
          onPointerDown={alMover}
          onPointerLeave={() => setActivo(null)}
          onBlur={() => setActivo(null)}
          onKeyDown={alTeclear}
        >
          {escala.valores.map((valor) => (
            <g key={valor}>
              <line x1={MARGEN.izquierda} x2={ANCHO - MARGEN.derecha} y1={y(valor)} y2={y(valor)} stroke="var(--color-gray-800)" strokeWidth="1" />
              <text x={MARGEN.izquierda - 8} y={y(valor) + 4} textAnchor="end" fontSize="12" fill="var(--text-muted)">{montoCompacto(valor)}</text>
            </g>
          ))}
          {indicesDeRotulos(cantidad).map((i) => (
            <text key={i} x={x(i)} y={ALTO - 8} textAnchor="middle" fontSize="12" fill="var(--text-muted)">{Number(evolucion[i].fecha.slice(8))}</text>
          ))}
          <path d={linea('ingresos')} fill="none" stroke="var(--success-color)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          <path d={linea('egresos')} fill="none" stroke="var(--warning-color)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          {conPuntos && evolucion.map((d, i) => (
            <g key={d.fecha}>
              <circle cx={x(i)} cy={y(d.ingresos)} r="3" fill="var(--success-color)" />
              <circle cx={x(i)} cy={y(d.egresos)} r="3" fill="var(--warning-color)" />
            </g>
          ))}
          {dia && (
            <g pointerEvents="none">
              <line x1={x(activo)} x2={x(activo)} y1={MARGEN.arriba} y2={MARGEN.arriba + AREA_Y} stroke="var(--text-muted)" strokeWidth="1" strokeDasharray="4 4" />
              <circle cx={x(activo)} cy={y(dia.ingresos)} r="5" fill="var(--success-color)" stroke="var(--surface-color)" strokeWidth="2" />
              <circle cx={x(activo)} cy={y(dia.egresos)} r="5" fill="var(--warning-color)" stroke="var(--surface-color)" strokeWidth="2" />
            </g>
          )}
        </svg>

        {dia && (
          <div
            className="absolute top-2 z-10 bg-fondo border border-gray-800 rounded-lg px-3 py-2 text-xs shadow-lg pointer-events-none w-max max-w-[60%]"
            style={{ left: `${(x(activo) / ANCHO) * 100}%`, transform: `translateX(${activo > cantidad / 2 ? 'calc(-100% - 12px)' : '12px'})` }}
          >
            <p className="font-semibold mb-1">{diaDeLaSemana(dia.fecha)} {fechaDelDia(dia.fecha).slice(0, 5)}</p>
            <p className="text-exito tabular-nums">Ingresos {dinero(dia.ingresos)}</p>
            <p className="text-advertencia tabular-nums">Egresos {dinero(dia.egresos)}</p>
            <p className="text-texto-suave tabular-nums">Saldo {dinero(dia.saldo)}</p>
          </div>
        )}
        <p className="sr-only" aria-live="polite">
          {dia ? `${fechaDelDia(dia.fecha)}: ingresos ${dinero(dia.ingresos)}, egresos ${dinero(dia.egresos)}, saldo ${dinero(dia.saldo)}` : ''}
        </p>
      </div>
      <p className="text-xs text-texto-suave mt-3">Pasá el mouse, tocá el gráfico o usá las flechas del teclado para ver cada día.</p>
    </BloqueBalance>
  )
}