import Alert from '../../../../shared/components/Alert'
import Badge from '../../../../shared/components/Badge'
import Button from '../../../../shared/components/Button'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import { agruparPuntos, nombreJugador, textoDeSets } from '../resultado'
import { ETIQUETA_INSTANCIA, fechaPartido, nombreCorto, nombrePareja } from '../torneos'
import { ETIQUETA_MOTIVO_WO, ganadorPorWO, QUIENES, textoDeWO, tituloDePartido } from '../wo'
import { Tabla } from './ZonaCard'

const TARJETA = 'bg-panel border border-gray-800 rounded-2xl p-5 md:p-6'
const TITULO_SECCION = 'text-xs font-bold uppercase tracking-wide text-texto-suave'

// Lo que se ve de un partido de la zona en la lista: el marcador, la baja o cuándo se juega
const estadoDe = (partido) => {
  if (partido.estado === 'WO') return textoDeWO(partido)
  if (partido.estado === 'FINALIZADO') return textoDeSets(partido.sets)
  if (partido.programacion) return fechaPartido(partido.programacion.fecha, partido.programacion.horaInicio)
  return 'Sin programar'
}

// «W.O. registrado» (CU 3.7 · pasos 7 a 9): lo que pasó al confirmar. Muestra la tabla de la zona o a dónde avanzó el ganador,
// los partidos que se resolvieron solos por la baja, los puntos otorgados y, si fue la final, el cierre del torneo.
//   datos:      lo que se mandó { ausente, motivo, detalle }
//   respuesta:  lo que devolvió POST /partidos/:id/wo
//   partido:    el partido como estaba en el cuadro antes de registrar (con `lugar`)
//   cuadro:     el cuadro ya actualizado ({ zonas, rondas }) o null si no se pudo pedir
export default function WORegistrado({ torneo, partido, datos, respuesta, cuadro, onVolver, onProgramar }) {
  const { zona, siguiente, torneoFinalizado, encadenados = [] } = respuesta
  const { ausente } = datos
  const ganador = ganadorPorWO(ausente)
  const quienGana = ganador ? partido[ganador.toLowerCase()] : null
  const enZona = Boolean(zona)
  const unidad = torneo.disciplina === 'PADEL' ? 'parejas' : 'jugadores'
  const { ambos } = QUIENES[torneo.disciplina]

  const titulo = enZona ? zona.nombre : tituloDePartido(partido)
  const subtitulo = `${torneo.nombre} · W.O. registrado${enZona ? ' · Tabla de posiciones recalculada' : ''}`

  const zonaDelCuadro = enZona ? cuadro?.zonas.find((z) => z.id === zona.id) : null
  const jugados = zonaDelCuadro?.partidos.filter((p) => p.estado === 'FINALIZADO' || p.estado === 'WO').length
  const clasifican = enZona ? zona.posiciones.filter((p) => p.clasificado).length : 0

  const todos = cuadro ? [...cuadro.zonas.flatMap((z) => z.partidos), ...cuadro.rondas.flatMap((r) => r.partidos)] : []
  const siguienteDelCuadro = siguiente ? todos.find((p) => p.id === siguiente.partidoId) : null
  const programacionSiguiente = siguienteDelCuadro?.programacion ?? siguiente?.programacion ?? null

  // Los partidos que se resolvieron solos: el rival que quedó sigue de largo (o nadie, si no había)
  const avanzaron = encadenados.map((e) => {
    const p = todos.find((x) => x.id === e.partidoId)
    const rival = p && [p.local, p.visitante].find((x) => x?.inscripcionId === e.ganadorInscripcionId)
    return { ...e, nombre: rival ? nombreCorto(rival) : null }
  })

  const sigueDeLargo = Boolean(siguiente) && avanzaron.some((a) => a.partidoId === siguiente.partidoId)

  // El campeón: quien ganó esta final, o quien llegó a la final sin rival por las bajas de las rondas anteriores
  const campeon = partido.instancia === 'FINAL' && quienGana ? nombreCorto(quienGana) : avanzaron.find((a) => a.instancia === 'FINAL')?.nombre

  const grupos = agruparPuntos(respuesta.puntosOtorgados, torneo.disciplina)
  const cambiaronDeCategoria = respuesta.puntosOtorgados.filter((p) => p.cambioCategoria)
  const ausentes = ausente === 'AMBOS' ? [partido.local, partido.visitante] : [partido[ausente.toLowerCase()]]

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
        campeon ? (
          <Alert variante="exito" titulo={`¡Tenemos campeón! ${campeon}`}>
            El torneo pasó a Finalizado automáticamente.{' '}
            <span className="inline-block align-middle"><EstadoBadge tipo="torneo" estado="FINALIZADO" /></span>
          </Alert>
        ) : (
          <Alert variante="advertencia" titulo="El torneo terminó sin campeón">
            Ningún participante llegó a la final: el torneo pasó a Finalizado automáticamente.{' '}
            <span className="inline-block align-middle"><EstadoBadge tipo="torneo" estado="FINALIZADO" /></span>
          </Alert>
        )
      )}

      {ausente === 'AMBOS' && (
        <Alert variante="advertencia" titulo={`${ambos} causaron baja`}>
          {enZona ? 'El partido quedó en W.O. sin ganador y sin puntos: no suma victorias a ninguno.' : 'El partido quedó en W.O. sin ganador y sin puntos.'}
        </Alert>
      )}

      {avanzaron.length > 0 && (
        <Alert variante="info" titulo="Avanzaron por baja del rival">
          {avanzaron.map((a) => (
            <span key={a.partidoId} className="block">
              {ETIQUETA_INSTANCIA[a.instancia] ?? a.instancia}: {a.nombre ? `${a.nombre} pasa de largo` : 'el partido también queda en W.O. sin ganador'}.
            </span>
          ))}
        </Alert>
      )}

      {enZona && zona.empateSinResolver && (
        <Alert variante="advertencia" titulo="Hay un empate que decide quién clasifica">
          La zona no se cierra hasta resolverlo: se resuelve a mano al generar la fase eliminatoria.
        </Alert>
      )}

      {respuesta.todasLasZonasCerradas && (
        <div className="rounded-xl border border-exito/50 bg-exito/10 px-4 py-4">
          <p className="font-semibold">Todas las zonas quedaron cerradas</p>
          <p className="text-sm text-texto-suave">Los clasificados ya están determinados.</p>
          {cuadro && (
            <div className="flex flex-wrap gap-2 mt-3">
              {cuadro.zonas.map((z) => <Badge key={z.id} variante="exito">{z.nombre} cerrada</Badge>)}
            </div>
          )}
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
              <Tabla zona={zona} unidad={unidad} />
              {clasifican > 0 && <p className="text-xs text-viper font-semibold mt-3 px-1">Clasifican {clasifican} por zona</p>}
            </section>
          )}

          {enZona && zonaDelCuadro && (
            <section className={TARJETA} aria-label="Partidos de la zona">
              <h2 className={`${TITULO_SECCION} mb-3`}>Partidos de la zona</h2>
              <ul className="flex flex-col gap-2">
                {zonaDelCuadro.partidos.map((p) => (
                  <li key={p.id} className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 ${p.id === partido.id ? 'border-advertencia/60 bg-advertencia/5' : 'border-gray-800 bg-fondo'}`}>
                    <span className="flex-1 min-w-0 break-words text-sm">{nombreCorto(p.local)} vs {nombreCorto(p.visitante)}</span>
                    <span className="text-xs text-texto-suave">{estadoDe(p)}</span>
                    <EstadoBadge tipo="partido" estado={p.estado} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {siguiente && (
            <section className={TARJETA} aria-label="Partido siguiente">
              <h2 className={`${TITULO_SECCION} mb-3`}>El ganador avanza</h2>
              <p>
                <span className="font-semibold">{nombreCorto(quienGana)}</span> pasa a {ETIQUETA_INSTANCIA[siguiente.instancia] ?? siguiente.instancia}
                {sigueDeLargo && ' y, como no va a tener rival, sigue de largo.'}
                {!sigueDeLargo && !siguiente.rivalesDefinidos && ' y espera al otro rival.'}
                {!sigueDeLargo && siguiente.rivalesDefinidos && programacionSiguiente && '.'}
              </p>
              {programacionSiguiente && (
                <p className="text-sm text-texto-suave mt-1">
                  Programado: {fechaPartido(programacionSiguiente.fecha, programacionSiguiente.horaInicio)}
                  {programacionSiguiente.cancha ? ` · ${programacionSiguiente.cancha.nombre}` : ''}
                </p>
              )}
              {!sigueDeLargo && siguiente.rivalesDefinidos && !programacionSiguiente && (
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1"><Alert variante="advertencia">No hay una franja libre para el partido siguiente: programalo a mano.</Alert></div>
                  <Button variante="neutro" onClick={() => onProgramar(siguiente.partidoId)}>Programar partido</Button>
                </div>
              )}
            </section>
          )}

          <section className={TARJETA} aria-label="Baja registrada">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h2 className={TITULO_SECCION}>Partido {nombreCorto(partido.local)} vs {nombreCorto(partido.visitante)}</h2>
              <EstadoBadge tipo="partido" estado="WO" />
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <dt className="text-[13px] text-texto-suave">{ausente === 'AMBOS' ? 'Ausentes' : 'Ausente'}</dt>
                <dd className="mt-1 break-words">{ausentes.map(nombrePareja).join(' y ')}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-texto-suave">Ganador</dt>
                <dd className="mt-1 break-words">{quienGana ? nombrePareja(quienGana) : 'Sin ganador'}</dd>
              </div>
              <div>
                <dt className="text-[13px] text-texto-suave">Motivo</dt>
                <dd className="mt-1">{ETIQUETA_MOTIVO_WO[datos.motivo]}</dd>
              </div>
              {datos.detalle && (
                <div>
                  <dt className="text-[13px] text-texto-suave">Detalle</dt>
                  <dd className="mt-1 break-words">{datos.detalle}</dd>
                </div>
              )}
            </dl>
            {enZona && quienGana && <p className="text-sm text-texto-suave mt-4">Se computa 6-0 6-0 a favor de {nombreCorto(quienGana)}.</p>}
            <p className="text-sm text-texto-suave mt-2">Un W.O. no se puede corregir.</p>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className={TARJETA} aria-label="Puntos otorgados">
            <h2 className={`${TITULO_SECCION} mb-4`}>Puntos otorgados</h2>
            {grupos.length === 0 ? (
              <p className="text-sm text-texto-suave">
                {ausente === 'AMBOS'
                  ? 'El partido quedó sin ganador: no se otorgaron puntos.'
                  : 'Este W.O. no otorgó puntos: el club todavía no cargó las reglas de puntuación de esta instancia.'}
              </p>
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
            {grupos.length > 0 && <p className="text-xs text-texto-suave mt-4">Quien causó la baja no suma puntos.</p>}
            {cambiaronDeCategoria.length > 0 && (
              <ul className="mt-4 pt-4 border-t border-gray-800 flex flex-col gap-1 text-sm">
                {cambiaronDeCategoria.map((c) => (
                  <li key={c.jugador.id}><span className="font-semibold">{nombreJugador(c.jugador)}</span>: cambió de categoría</li>
                ))}
              </ul>
            )}
            {grupos.length > 0 && <p className="text-xs text-texto-suave mt-4">Ranking y categoría actualizados.</p>}
          </section>
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 p-4 bg-fondo/90 backdrop-blur border-t border-gray-800 z-30 sm:hidden">
        <Button className="w-full" onClick={onVolver}>Volver al fixture</Button>
      </div>
    </div>
  )
}