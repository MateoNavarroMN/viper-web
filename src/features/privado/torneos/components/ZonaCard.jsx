import { useState } from 'react'
import Badge from '../../../../shared/components/Badge'
import { fechaPartido, nombreCorto } from '../torneos'

// Columnas de la tabla de posiciones: posición · pareja · [PJ] · PG · PP · sets · [games]. En el celular se ocultan los
// partidos jugados y los games para que entre lo importante.
const COLUMNAS = 'grid-cols-[2.25rem_minmax(0,1fr)_1.75rem_1.75rem_3rem] sm:grid-cols-[2.25rem_minmax(0,1fr)_1.75rem_1.75rem_1.75rem_3rem_4rem]'
const OCULTA_EN_CELULAR = 'hidden sm:block'
const PARTIDOS_VISIBLES = 3

// La letra de la zona: «Zona A» → «A»
const letraDe = (nombre) => nombre.replace(/^zona\s+/i, '')

const sinNada = (n) => (n === 0 ? 'text-texto-suave' : '')

export function Tabla({ zona, unidad }) {
  return (
    <div role="table" aria-label={`Posiciones de ${zona.nombre}`} className="text-sm">
      <div role="row" className={`grid ${COLUMNAS} gap-x-2 px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-texto-suave`}>
        <span role="columnheader">Pos.</span>
        <span role="columnheader">{unidad === 'parejas' ? 'Pareja' : 'Jugador'}</span>
        <span role="columnheader" className={`${OCULTA_EN_CELULAR} text-center`} title="Partidos jugados">PJ</span>
        <span role="columnheader" className="text-center" title="Partidos ganados">PG</span>
        <span role="columnheader" className="text-center" title="Partidos perdidos">PP</span>
        <span role="columnheader" className="text-center" title="Sets ganados y perdidos">Sets</span>
        <span role="columnheader" className={`${OCULTA_EN_CELULAR} text-center`} title="Games ganados y perdidos">Games</span>
      </div>
      <div className="flex flex-col gap-1">
        {zona.posiciones.map((fila, i) => (
          <div
            key={fila.participante.inscripcionId}
            role="row"
            className={`grid ${COLUMNAS} gap-x-2 items-center rounded-lg px-3 py-2 ${fila.clasificado ? 'bg-viper/10' : 'bg-fondo'}`}
          >
            {/* Antes de jugar no hay posición: se muestra el lugar de la zona (A1, A2…) */}
            <span role="cell" className={`font-outfit font-bold tabular-nums ${fila.clasificado ? 'text-viper' : 'text-texto-suave'}`}>
              {fila.posicion ? `${fila.posicion}°` : `${letraDe(zona.nombre)}${i + 1}`}
            </span>
            <span role="cell" className="min-w-0">
              <span className={`block break-words sm:truncate ${fila.clasificado ? 'font-semibold' : ''}`} title={nombreCorto(fila.participante)}>
                {nombreCorto(fila.participante)}
              </span>
              {fila.clasificado && <span className="block text-[11px] font-semibold text-viper">Clasifica</span>}
            </span>
            <span role="cell" className={`${OCULTA_EN_CELULAR} text-center tabular-nums ${sinNada(fila.partidosGanados + fila.partidosPerdidos)}`}>
              {fila.partidosGanados + fila.partidosPerdidos}
            </span>
            <span role="cell" className={`text-center tabular-nums ${sinNada(fila.partidosGanados)}`}>{fila.partidosGanados}</span>
            <span role="cell" className={`text-center tabular-nums ${sinNada(fila.partidosPerdidos)}`}>{fila.partidosPerdidos}</span>
            <span role="cell" className={`text-center tabular-nums ${sinNada(fila.setsGanados + fila.setsPerdidos)}`}>{fila.setsGanados}-{fila.setsPerdidos}</span>
            <span role="cell" className={`${OCULTA_EN_CELULAR} text-center tabular-nums ${sinNada(fila.gamesGanados + fila.gamesPerdidos)}`}>{fila.gamesGanados}-{fila.gamesPerdidos}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Un partido de la zona: los dos rivales (el ganador en negrita) y, a la derecha, el marcador, el W.O. o cuándo y dónde se juega.
function FilaPartido({ partido, onSeleccionar }) {
  const esWO = partido.estado === 'WO'
  const nombre = (p) => (p ? nombreCorto(p) : 'Por definir')
  const gana = (p) => Boolean(p) && partido.ganadorInscripcionId === p.inscripcionId
  const marcador = partido.sets?.length > 0 ? partido.sets.map((s) => `${s.local}-${s.visitante}`).join(' ') : null
  const { programacion } = partido

  return (
    <button
      type="button"
      onClick={() => onSeleccionar(partido)}
      aria-label={`Partido: ${nombre(partido.local)} contra ${nombre(partido.visitante)}. Ver detalle`}
      className={`w-full flex items-center gap-3 text-left rounded-lg border px-3 py-2 cursor-pointer transition-colors hover:border-viper focus-visible:outline-2 focus-visible:outline-viper ${esWO ? 'border-advertencia/60 bg-advertencia/5' : 'border-gray-800 bg-fondo'}`}
    >
      <span className="flex-1 min-w-0 text-[13px] leading-5">
        {[partido.local, partido.visitante].map((p, i) => (
          <span key={i} className={`block truncate ${gana(p) ? 'font-semibold text-texto' : partido.ganadorInscripcionId ? 'text-texto-suave' : ''}`}>
            {nombre(p)}
          </span>
        ))}
      </span>
      <span className="shrink-0 text-right text-xs leading-5">
        {esWO ? (
          <>
            <Badge variante="advertencia">W.O.</Badge>
            {partido.ganadorInscripcionId && <span className="block text-error">Baja del rival</span>}
          </>
        ) : marcador ? (
          <span className="block font-semibold tabular-nums text-texto text-[13px]">{marcador}</span>
        ) : programacion ? (
          <>
            <span className="block text-texto">{fechaPartido(programacion.fecha, programacion.horaInicio)}</span>
            <span className="block text-texto-suave">{programacion.cancha.nombre}</span>
          </>
        ) : (
          <span className="text-advertencia">Sin programar</span>
        )}
      </span>
    </button>
  )
}

// Tarjeta de una zona (CU 3.4): tabla de posiciones con los clasificados resaltados y los partidos de la zona.
// `abierta` y `onAlternar` los maneja <Zonas>, que sabe cuántas zonas hay.
export default function ZonaCard({ zona, unidad, abierta, onAlternar, onSeleccionar }) {
  const [verTodos, setVerTodos] = useState(false)
  const total = zona.partidos.length
  const terminados = zona.partidos.filter((p) => p.estado === 'FINALIZADO' || p.estado === 'WO').length
  const visibles = verTodos ? zona.partidos : zona.partidos.slice(0, PARTIDOS_VISIBLES)
  const cuantos = zona.posiciones.length
  const resumen = `${cuantos} ${unidad === 'parejas' ? 'parejas' : 'jugadores'} · ${total} partidos${terminados > 0 ? ` · ${terminados} ${terminados === 1 ? 'jugado' : 'jugados'}` : ''}`

  return (
    <section className="bg-panel border border-gray-800 rounded-2xl overflow-hidden" aria-label={zona.nombre}>
      <h3>
        <button
          type="button"
          aria-expanded={abierta}
          onClick={onAlternar}
          className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left cursor-pointer hover:bg-fondo/40 transition-colors"
        >
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-outfit text-lg font-bold">{zona.nombre}</span>
              {zona.cerrada && <Badge variante="exito">Zona cerrada</Badge>}
            </span>
            <span className="block text-sm text-texto-suave mt-0.5">{resumen}</span>
          </span>
          <svg className={`shrink-0 text-texto-suave transition-transform ${abierta ? 'rotate-180' : ''}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </h3>

      {abierta && (
        <div className="px-3 sm:px-5 pb-5 flex flex-col gap-5">
          <Tabla zona={zona} unidad={unidad} />

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-texto-suave mb-3 px-1">
              {verTodos || total <= PARTIDOS_VISIBLES ? `Partidos (${total})` : `Primeros partidos (${PARTIDOS_VISIBLES} de ${total})`}
            </h4>
            <ul className="flex flex-col gap-2">
              {visibles.map((partido) => (
                <li key={partido.id}>
                  <FilaPartido partido={partido} onSeleccionar={onSeleccionar} />
                </li>
              ))}
            </ul>
            {total > PARTIDOS_VISIBLES && (
              <button type="button" onClick={() => setVerTodos((v) => !v)} className="mt-3 px-1 text-sm font-semibold text-viper hover:underline cursor-pointer">
                {verTodos ? 'Ver menos' : `Ver los ${total} partidos`}
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  )
}