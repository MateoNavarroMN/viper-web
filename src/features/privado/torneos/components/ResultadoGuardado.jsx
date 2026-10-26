import Alert from '../../../../shared/components/Alert'
import Badge from '../../../../shared/components/Badge'
import Button from '../../../../shared/components/Button'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import { agruparPuntos, filasDeRanking, motivoSinCorreccion, nombreJugador, setsGanadosDe, textoDeSets } from '../resultado'
import { ETIQUETA_DISCIPLINA, ETIQUETA_INSTANCIA, FASE_ELIMINATORIA_DISPONIBLE, fechaPartido, nombreCorto } from '../torneos'
import { Tabla } from './ZonaCard'

const TARJETA = 'bg-panel border border-gray-800 rounded-2xl p-5 md:p-6'
const TITULO_SECCION = 'text-xs font-bold uppercase tracking-wide text-texto-suave'

const jugadoresDe = (participante) => [participante.titular.id, participante.companero?.id].filter(Boolean)

// Subió o bajó puestos en el ranking
function Cambio({ cambio }) {
  if (cambio === null) return <Badge variante="info">Nuevo</Badge>
  if (cambio === 0) return <span className="text-texto-suave" aria-label="Sin cambios">–</span>
  const sube = cambio > 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-sm font-semibold ${sube ? 'text-viper' : 'text-error'}`} aria-label={`${sube ? 'Subió' : 'Bajó'} ${Math.abs(cambio)}`}>
      <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor" aria-hidden="true">{sube ? <path d="M5 0 10 6H0z" /> : <path d="M5 6 0 0h10z" />}</svg>
      {Math.abs(cambio)}
    </span>
  )
}

function FilaRanking({ fila }) {
  return (
    <li className={`rounded-lg px-3 py-2 ${fila.involucrado ? 'bg-viper/10' : ''}`}>
      <div className="flex items-center gap-3">
        <span className="w-8 font-outfit font-bold tabular-nums text-texto-suave">{fila.posicion}°</span>
        <span className={`flex-1 min-w-0 truncate ${fila.involucrado ? 'font-semibold' : ''}`}>{nombreJugador(fila.jugador)}</span>
        <span className="tabular-nums">{fila.puntos}</span>
        <span className="w-9 text-right"><Cambio cambio={fila.cambio} /></span>
      </div>
      {fila.categoriaAnterior && (
        <p className="ml-11 mt-0.5 text-xs text-viper">Categoría: {fila.categoriaAnterior} → {fila.categoria.nombre}</p>
      )}
    </li>
  )
}

// «Resultado guardado» (CU 3.6 · pasos 9 a 12) y «Resultado corregido» (6a): lo que pasó al guardar. Muestra la tabla de la
// zona o a dónde avanzó el ganador, los puntos otorgados, el ranking antes y después, el aviso de zonas cerradas y el campeón.
//   respuesta:      lo que devolvió POST/PUT /partidos/:id/resultado
//   partido:        el partido como estaba en el cuadro antes de guardar (con `lugar`)
//   cuadro:         el cuadro ya actualizado ({ zonas, rondas }) o null si no se pudo pedir
//   rankingAntes / rankingDespues: `ranking` de GET /ranking/:disciplina antes y después (null si no se pudo pedir)
export default function ResultadoGuardado({ torneo, partido, respuesta, cuadro, rankingAntes, rankingDespues, corrigiendo, onVolver, onCorregir, onProgramar, onGenerarFase }) {
  const { zona, siguiente, torneoFinalizado, cambiosDeCategoria = [], anterior } = respuesta
  const marcador = respuesta.partido
  const ganador = partido[marcador.ganador === 'LOCAL' ? 'local' : 'visitante']
  const ganados = setsGanadosDe(marcador.sets)
  const enZona = Boolean(zona)

  const titulo = enZona ? zona.nombre : `${ETIQUETA_INSTANCIA[partido.instancia] ?? partido.lugar} · Partido ${partido.posicion}`
  const subtitulo = `${torneo.nombre} · ${corrigiendo ? 'Resultado corregido' : 'Resultado guardado'}${enZona ? ' · Tabla de posiciones recalculada' : ''}`

  // Cuántos partidos de la zona se jugaron (del cuadro ya actualizado)
  const zonaDelCuadro = enZona ? cuadro?.zonas.find((z) => z.id === zona.id) : null
  const jugados = zonaDelCuadro?.partidos.filter((p) => p.estado === 'FINALIZADO' || p.estado === 'WO').length
  const clasifican = enZona ? zona.posiciones.filter((p) => p.clasificado).length : 0

  // ¿Se puede volver a corregir? (el mismo criterio que en el cuadro)
  const despues = { ...partido, estado: 'FINALIZADO', sets: marcador.sets }
  const motivoCorreccion = cuadro ? motivoSinCorreccion(despues, cuadro, { ...torneo, estado: torneoFinalizado ? 'FINALIZADO' : torneo.estado }) : null

  const siguienteDelCuadro = siguiente && cuadro ? cuadro.rondas.flatMap((r) => r.partidos).find((p) => p.id === siguiente.partidoId) : null
  const programacionSiguiente = siguienteDelCuadro?.programacion ?? siguiente?.programacion ?? null

  const grupos = agruparPuntos(respuesta.puntosOtorgados)
  const ranking = rankingDespues
    ? filasDeRanking(rankingAntes, rankingDespues, [...jugadoresDe(partido.local), ...jugadoresDe(partido.visitante)])
    : null

  const ganadorAnterior = anterior && (anterior.ganadorInscripcionId === partido.local.inscripcionId ? partido.local : partido.visitante)

  return (
    <div className="max-w-6xl mx-auto w-full flex flex-col gap-6 pb-24 sm:pb-0">
      <button type="button" onClick={onVolver} className="text-sm text-texto-suave hover:text-viper transition-colors inline-flex items-center gap-1 w-fit cursor-pointer">
        <span aria-hidden="true">‹</span> Volver a la ficha del torneo
      </button>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-outfit text-[28px] font-bold">{titulo}</h1>
          <p className="text-texto-suave text-sm mt-1">{subtitulo}</p>
        </div>
        <div className="hidden sm:block"><Button className="whitespace-nowrap" onClick={onVolver}>Volver al fixture</Button></div>
      </div>

      {torneoFinalizado && (
        <Alert variante="exito" titulo={`¡Tenemos campeón! ${nombreCorto(ganador)}`}>
          {corrigiendo ? 'El torneo sigue en estado Finalizado con el nuevo campeón.' : 'Se cargó la final: el torneo pasó a Finalizado automáticamente.'}{' '}
          <span className="inline-block align-middle"><EstadoBadge tipo="torneo" estado="FINALIZADO" /></span>
        </Alert>
      )}

      {corrigiendo && (
        <Alert variante="info" titulo="Resultado corregido">
          Se revirtieron los puntos del resultado anterior{anterior ? ` (${textoDeSets(anterior.sets)})` : ''} y se recalculó todo.
          {respuesta.cambioGanador && ` Ahora gana ${nombreCorto(ganador)}${ganadorAnterior ? ` en lugar de ${nombreCorto(ganadorAnterior)}` : ''}.`}
        </Alert>
      )}

      {enZona && zona.empateSinResolver && (
        <Alert variante="advertencia" titulo="Hay un empate que decide quién clasifica">
          La zona no se cierra hasta resolverlo: se resuelve a mano al generar la fase eliminatoria.
        </Alert>
      )}

      {respuesta.todasLasZonasCerradas && (
        <div className="rounded-xl border border-exito/50 bg-exito/10 px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-semibold">Todas las zonas quedaron cerradas</p>
            <p className="text-sm text-texto-suave">Los clasificados ya están determinados.</p>
            {cuadro && (
              <div className="flex flex-wrap gap-2 mt-3">
                {cuadro.zonas.map((z) => <Badge key={z.id} variante="exito">{z.nombre} cerrada</Badge>)}
              </div>
            )}
          </div>
          {FASE_ELIMINATORIA_DISPONIBLE && <Button onClick={onGenerarFase} className="w-full sm:w-auto">Generar fase eliminatoria</Button>}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_22rem] gap-6 items-start">
        <div className="flex flex-col gap-6 min-w-0">
          {enZona && (
            <section className={TARJETA} aria-label="Tabla de posiciones">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h2 className="font-outfit text-lg font-bold">Tabla de posiciones</h2>
                <div className="flex items-center gap-3">
                  {zona.cerrada && <Badge variante="exito">Zona cerrada</Badge>}
                  {jugados !== undefined && <p className="text-sm text-texto-suave">{jugados} de {zonaDelCuadro.partidos.length} partidos jugados</p>}
                </div>
              </div>
              <Tabla zona={zona} unidad={torneo.disciplina === 'PADEL' ? 'parejas' : 'jugadores'} />
              {clasifican > 0 && <p className="text-xs text-viper font-semibold mt-3 px-1">Clasifican {clasifican} por zona</p>}
            </section>
          )}

          {siguiente && (
            <section className={TARJETA} aria-label="Partido siguiente">
              <h2 className={`${TITULO_SECCION} mb-3`}>El ganador avanza</h2>
              <p>
                <span className="font-semibold">{nombreCorto(ganador)}</span> pasa a {ETIQUETA_INSTANCIA[siguiente.instancia] ?? siguiente.instancia}
                {!siguiente.rivalesDefinidos && ' y espera al otro rival.'}
                {siguiente.rivalesDefinidos && programacionSiguiente && '.'}
              </p>
              {programacionSiguiente && (
                <p className="text-sm text-texto-suave mt-1">
                  Programado: {fechaPartido(programacionSiguiente.fecha, programacionSiguiente.horaInicio)}
                  {programacionSiguiente.cancha ? ` · ${programacionSiguiente.cancha.nombre}` : ''}
                </p>
              )}
              {siguiente.rivalesDefinidos && !programacionSiguiente && (
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1"><Alert variante="advertencia">No hay una franja libre para el partido siguiente: programalo a mano.</Alert></div>
                  <Button variante="neutro" onClick={() => onProgramar(siguiente.partidoId)}>Programar partido</Button>
                </div>
              )}
            </section>
          )}

          <section className={TARJETA} aria-label="Resultado cargado">
            <h2 className={`${TITULO_SECCION} mb-3`}>{corrigiendo ? 'Resultado corregido' : 'Último resultado cargado'}</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-x-6 gap-y-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold break-words">{nombreCorto(partido.local)} vs {nombreCorto(partido.visitante)}</p>
                <p className="text-sm text-texto-suave mt-1">
                  <span className="font-semibold text-texto tabular-nums">{textoDeSets(marcador.sets)}</span>
                  {' · '}Ganó {nombreCorto(ganador)} ({ganados[marcador.ganador.toLowerCase()]} – {ganados[marcador.ganador === 'LOCAL' ? 'visitante' : 'local']})
                </p>
                {corrigiendo && anterior && <p className="text-sm text-texto-suave mt-1">Antes: {textoDeSets(anterior.sets)}</p>}
              </div>
              <Button variante="neutro" onClick={onCorregir} disabled={Boolean(motivoCorreccion)} className="w-full sm:w-auto">Corregir resultado</Button>
            </div>
            {motivoCorreccion && <p className="text-sm text-texto-suave mt-3">No se puede volver a corregir: {motivoCorreccion}</p>}
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className={TARJETA} aria-label="Puntos otorgados">
            <h2 className={`${TITULO_SECCION} mb-4`}>Puntos otorgados</h2>
            {grupos.length === 0 ? (
              <p className="text-sm text-texto-suave">Este resultado no otorgó puntos: el club todavía no cargó las reglas de puntuación de esta instancia.</p>
            ) : (
              <div className="flex flex-col gap-5">
                {grupos.map((g) => (
                  <div key={g.instancia}>
                    <Badge variante={g.instancia === 'PARTICIPACION' ? 'neutro' : g.instancia === 'CAMPEON' ? 'violeta' : 'exito'}>{g.etiqueta}</Badge>
                    <ul className="mt-3 flex flex-col gap-2">
                      {g.filas.map((f) => (
                        <li key={f.jugador.id} className="flex items-center justify-between gap-3">
                          <span className="min-w-0 truncate">{nombreJugador(f.jugador)}</span>
                          <span className="font-outfit font-bold tabular-nums text-viper">+{f.puntos} pts</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            {corrigiendo && <p className="text-xs text-texto-suave mt-4">Los puntos del resultado anterior quedaron revertidos.</p>}
            {cambiosDeCategoria.length > 0 && (
              <ul className="mt-4 pt-4 border-t border-gray-800 flex flex-col gap-1 text-sm">
                {cambiosDeCategoria.map((c) => (
                  <li key={c.jugador.id}><span className="font-semibold">{nombreJugador(c.jugador)}</span>: {c.categoriaAnterior} → {c.categoriaNueva}</li>
                ))}
              </ul>
            )}
          </section>

          {ranking && (
            <section className={TARJETA} aria-label={`Ranking de ${ETIQUETA_DISCIPLINA[torneo.disciplina]}`}>
              <h2 className={`${TITULO_SECCION} mb-4`}>Ranking de {ETIQUETA_DISCIPLINA[torneo.disciplina]}</h2>
              <ol className="flex flex-col gap-1">
                {ranking.arriba.map((f) => <FilaRanking key={f.jugador.id} fila={f} />)}
              </ol>
              {ranking.abajo.length > 0 && (
                <>
                  <p className="text-center text-texto-suave my-1" aria-hidden="true">···</p>
                  <ol className="flex flex-col gap-1">
                    {ranking.abajo.map((f) => <FilaRanking key={f.jugador.id} fila={f} />)}
                  </ol>
                </>
              )}
              <p className="text-xs text-texto-suave mt-4">La categoría técnica se recalcula con los puntos.</p>
            </section>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 p-4 bg-fondo/90 backdrop-blur border-t border-gray-800 z-30 sm:hidden">
        <Button className="w-full" onClick={onVolver}>Volver al fixture</Button>
      </div>
    </div>
  )
}