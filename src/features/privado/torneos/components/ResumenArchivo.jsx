import { useState } from 'react'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import { cuadroFinalDe, puntosConSigno, resultadosPorLugar } from '../archivo'
import { ETIQUETA_DISCIPLINA, ETIQUETA_FORMATO, nombrePareja, precio, rangoFechas } from '../torneos'
import Bracket from './Bracket'
import Zonas from './Zonas'

const TARJETA = 'bg-panel border border-gray-800 rounded-2xl p-5 md:p-6'
const TITULO_SECCION = 'text-xs font-bold uppercase tracking-wide text-texto-suave'
const PUESTOS_VISIBLES = 5

function Dato({ etiqueta, valor, nota }) {
  return (
    <div className="bg-fondo border border-gray-800 rounded-xl p-3 sm:p-4 flex flex-col justify-between gap-1">
      <p className="text-xs sm:text-[13px] text-texto-suave">{etiqueta}</p>
      <p className="font-outfit text-xl sm:text-2xl font-bold tabular-nums">{valor}</p>
      {nota && <p className="text-xs text-texto-suave">{nota}</p>}
    </div>
  )
}

// Botón que muestra u oculta un detalle largo
function Desplegar({ abierto, onAlternar, children }) {
  return (
    <button
      type="button"
      aria-expanded={abierto}
      onClick={onAlternar}
      className="mt-4 text-sm font-semibold text-viper hover:underline cursor-pointer inline-flex items-center gap-1"
    >
      {children}
      <span aria-hidden="true" className={`transition-transform ${abierto ? 'rotate-90' : ''}`}>›</span>
    </button>
  )
}

// Resumen de un torneo finalizado (CU 3.8 · pasos 2 y 3): datos generales, cuadro final, ranking generado y resultados.
// `resumen` es la respuesta de GET /torneos/:id/resumen.
export default function ResumenArchivo({ resumen }) {
  const { torneo, estadisticas, cuadro, resultados, puntos } = resumen
  const { campeon, finalista, resultadoFinal } = cuadroFinalDe(resumen)
  const conZonas = torneo.formato === 'ZONAS_Y_ELIMINACION'
  const [verCuadro, setVerCuadro] = useState(false)
  const [verJugadores, setVerJugadores] = useState(false)
  const [verResultados, setVerResultados] = useState(false)

  const jugadores = verJugadores ? puntos.jugadores : puntos.jugadores.slice(0, PUESTOS_VISIBLES)
  const grupos = verResultados ? resultadosPorLugar(resultados) : []

  return (
    <div className="flex flex-col gap-6">
      <section className={TARJETA} aria-label="Datos del torneo">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-outfit text-xl font-bold break-words">{torneo.nombre}</h2>
          <EstadoBadge tipo="torneo" estado={torneo.estado} />
        </div>
        <p className="text-sm text-texto-suave mt-1">
          {ETIQUETA_DISCIPLINA[torneo.disciplina]} · {torneo.categoria} · {ETIQUETA_FORMATO[torneo.formato]} · {rangoFechas(torneo.fechaInicio, torneo.fechaFin)}
        </p>
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-5">
          <Dato etiqueta="Inscripciones" valor={torneo.inscriptos} />
          <Dato
            etiqueta="Partidos jugados"
            valor={estadisticas.partidosJugados}
            nota={estadisticas.partidosPorWO > 0 ? `y ${estadisticas.partidosPorWO} por W.O.` : null}
          />
          <Dato etiqueta="Precio" valor={precio(torneo.precioInscripcion)} />
        </div>
      </section>

      <section className={TARJETA} aria-label="Cuadro final">
        <h2 className={`${TITULO_SECCION} mb-4`}>Cuadro final</h2>
        {campeon ? (
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4">
            <div>
              <dt className="text-[13px] text-texto-suave">Campeón</dt>
              <dd className="mt-1 font-semibold text-viper">{nombrePareja(campeon)}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-texto-suave">Finalista</dt>
              <dd className="mt-1">{finalista ? nombrePareja(finalista) : '—'}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-texto-suave">Resultado de la final</dt>
              <dd className="mt-1 tabular-nums">{resultadoFinal ?? '—'}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-texto-suave">El torneo terminó sin campeón: la final se resolvió sin ganador.</p>
        )}
        <Desplegar abierto={verCuadro} onAlternar={() => setVerCuadro((v) => !v)}>
          {verCuadro ? 'Ocultar el cuadro completo' : 'Ver el cuadro completo'}
        </Desplegar>
        {verCuadro && (
          <div className="mt-4 flex flex-col gap-6">
            {conZonas && cuadro.zonas.length > 0 && <Zonas zonas={cuadro.zonas} disciplina={torneo.disciplina} />}
            {cuadro.rondas.length > 0 && <Bracket rondas={cuadro.rondas} />}
          </div>
        )}
      </section>

      <section className={TARJETA} aria-label="Ranking generado">
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <h2 className={TITULO_SECCION}>Ranking generado</h2>
          {puntos.jugadores.length > 0 && <p className="text-sm text-texto-suave tabular-nums">{puntosConSigno(puntos.total)} en total</p>}
        </div>
        {puntos.jugadores.length === 0 ? (
          <p className="text-sm text-texto-suave">Este torneo no otorgó puntos: el club no tenía reglas de puntuación cargadas.</p>
        ) : (
          <>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-texto-suave text-xs font-semibold uppercase tracking-wide border-b border-gray-800">
                  <th className="py-2 w-12">#</th>
                  <th className="py-2">Jugador</th>
                  <th className="py-2 text-right">Puntos</th>
                </tr>
              </thead>
              <tbody>
                {jugadores.map((fila, i) => (
                  <tr key={fila.jugador.id} className="border-b border-gray-800 last:border-b-0">
                    <td className="py-3 tabular-nums text-texto-suave">{i + 1}</td>
                    <td className="py-3 break-words">{fila.jugador.nombre} {fila.jugador.apellido}</td>
                    <td className="py-3 text-right font-outfit font-bold tabular-nums text-viper">{puntosConSigno(fila.puntos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {puntos.jugadores.length > PUESTOS_VISIBLES && (
              <Desplegar abierto={verJugadores} onAlternar={() => setVerJugadores((v) => !v)}>
                {verJugadores ? 'Ver menos jugadores' : `Ver los ${puntos.jugadores.length} jugadores`}
              </Desplegar>
            )}
          </>
        )}
      </section>

      <section className={TARJETA} aria-label="Resultados">
        <h2 className={TITULO_SECCION}>Resultados</h2>
        <Desplegar abierto={verResultados} onAlternar={() => setVerResultados((v) => !v)}>
          {verResultados ? 'Ocultar los resultados' : `Ver los ${resultados.length} resultados`}
        </Desplegar>
        {verResultados && (
          <div className="mt-4 flex flex-col gap-5">
            {grupos.map((grupo) => (
              <div key={grupo.lugar}>
                <h3 className="text-[13px] font-semibold uppercase tracking-wide text-texto-suave mb-2">{grupo.lugar}</h3>
                <ul className="divide-y divide-gray-800 border border-gray-800 rounded-xl">
                  {grupo.filas.map((f) => (
                    <li key={f.id} className="px-4 py-3 text-sm flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <span className="min-w-0 break-words">
                        <span className={f.ganador === 'local' ? 'font-semibold' : ''}>{f.local}</span>
                        <span className="text-texto-suave"> vs </span>
                        <span className={f.ganador === 'visitante' ? 'font-semibold' : ''}>{f.visitante}</span>
                      </span>
                      <span className="text-texto-suave tabular-nums">{f.texto}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}