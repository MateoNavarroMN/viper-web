import { useCallback, useState } from 'react'
import { useMediaQuery } from '../../../../shared/hooks/useMediaQuery'
import { ETIQUETA_INSTANCIA } from '../torneos'
import DetallePartido from './DetallePartido'
import PartidoCard from './PartidoCard'

// Alto que ocupa cada partido de la primera ronda en la grilla de escritorio (el partido mide 52 y el resto es la
// programación de abajo y el aire entre partidos). Las rondas siguientes ocupan el doble, partido a partido.
const ALTO_PARTIDO = 76
const LINEA = 'border-gray-700'

const tituloDe = (ronda) => ETIQUETA_INSTANCIA[ronda.instancia] ?? `Ronda ${ronda.ronda}`

// Escritorio y tablet: una columna por ronda, unidas con conectores. Si no entra, se desplaza dentro de su recuadro
// (la página no se desplaza).
function Grilla({ rondas, onSeleccionar }) {
  const alto = rondas[0].partidos.length * ALTO_PARTIDO
  return (
    <div className="sin-barra overflow-x-auto overflow-y-hidden pb-6">
      <div className="flex w-max gap-14">
        {rondas.map((ronda, i) => (
          <section key={ronda.ronda} className="w-[200px] shrink-0" aria-label={tituloDe(ronda)}>
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-texto-suave mb-3.5">{tituloDe(ronda)}</h3>
            <ul className="flex flex-col" style={{ height: alto }}>
              {ronda.partidos.map((partido, j) => (
                <li key={partido.id} className="relative flex-1 flex items-center">
                  <div className="w-full">
                    <PartidoCard partido={partido} flotante onSeleccionar={onSeleccionar} />
                  </div>
                  {/* Conectores: la entrada viene de los dos partidos de la ronda anterior; la salida baja o sube al par */}
                  {i > 0 && <span className={`absolute right-full top-1/2 w-7 border-t ${LINEA}`} aria-hidden="true" />}
                  {i < rondas.length - 1 && (
                    <>
                      <span className={`absolute left-full top-1/2 w-7 border-t ${LINEA}`} aria-hidden="true" />
                      <span className={`absolute left-full ml-7 border-l ${LINEA} ${j % 2 === 0 ? 'top-1/2 bottom-0' : 'top-0 bottom-1/2'}`} aria-hidden="true" />
                    </>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

// Celular: un selector de ronda y los partidos de la ronda elegida, uno debajo del otro.
function PorRonda({ rondas, onSeleccionar }) {
  const [elegida, setElegida] = useState(rondas[0].ronda)
  const actual = rondas.find((r) => r.ronda === elegida) ?? rondas[0]
  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" aria-label="Ronda" className="sin-barra flex gap-2 overflow-x-auto pb-1">
        {rondas.map((r) => {
          const seleccionada = r.ronda === actual.ronda
          return (
            <button
              key={r.ronda}
              type="button"
              role="tab"
              aria-selected={seleccionada}
              onClick={() => setElegida(r.ronda)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${seleccionada
                  ? 'bg-viper/15 border-viper text-viper'
                  : 'bg-panel border-gray-800 text-texto-suave hover:border-viper'
                }`}
            >
              {tituloDe(r)}
            </button>
          )
        })}
      </div>
      <ul className="flex flex-col gap-4" aria-label={tituloDe(actual)}>
        {actual.partidos.map((partido) => (
          <li key={partido.id}>
            <PartidoCard partido={partido} onSeleccionar={onSeleccionar} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function Leyenda() {
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-texto-suave">
      <li className="flex items-center gap-2">
        <svg className="text-violeta" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
        </svg>
        Cabeza de serie
      </li>
      <li><span className="font-semibold tracking-wide">BYE</span>: avanza a la ronda siguiente sin jugar</li>
      <li>Tocá un partido para ver el detalle</li>
    </ul>
  )
}

// Cuadro de eliminación (CU 3.4 y 3.9). Reutilizable: lo usan la ficha de gestión y, más adelante, las vistas del jugador.
//   rondas:   `rondas` de GET /torneos/:id/cuadro → [{ ronda, instancia, partidos: [{ id, posicion, instancia, estado, esBye,
//             local, visitante, ganadorInscripcionId, programacion, sets? }] }], de la primera ronda a la final.
//             `sets` ([{ local, visitante }]) es opcional: sin él no se muestra marcador.
//   acciones: acciones que puede hacer quien gestiona el torneo sobre un partido (ACCIONES_PARTIDO con su `onClick`).
//             Sin acciones (jugadores), el detalle solo se mira.
// Desde md se dibuja la grilla con conectores; en el celular, un selector de ronda con la lista de partidos.
export default function Bracket({ rondas, acciones = [] }) {
  const esGrande = useMediaQuery('(min-width: 768px)')
  const [seleccionado, setSeleccionado] = useState(null) // id del partido abierto en el detalle
  const partido = rondas.flatMap((r) => r.partidos).find((p) => p.id === seleccionado)
  const abrir = useCallback((p) => setSeleccionado(p.id), [])
  const cerrar = useCallback(() => setSeleccionado(null), [])

  if (rondas.length === 0) return null
  return (
    <div className="flex flex-col gap-6">
      {esGrande ? <Grilla rondas={rondas} onSeleccionar={abrir} /> : <PorRonda rondas={rondas} onSeleccionar={abrir} />}
      <Leyenda />
      <DetallePartido partido={partido} acciones={acciones} onCerrar={cerrar} />
    </div>
  )
}