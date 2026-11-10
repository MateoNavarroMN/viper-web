import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { get } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Avatar from '../../../../shared/components/Avatar'
import Badge from '../../../../shared/components/Badge'
import EmptyState from '../../../../shared/components/EmptyState'
import Spinner from '../../../../shared/components/Spinner'
import { useAuth } from '../../auth/useAuth'
import HistorialPuntos from '../components/HistorialPuntos'
import { DISCIPLINAS, nombreCompleto, rutaRanking } from '../ranking'

const FORMATO = new Intl.NumberFormat('es-AR')
const SIN_TOPE = 999999
const VOLVER = 'font-outfit hidden sm:inline-flex items-center justify-center px-6 py-2 rounded-lg font-semibold bg-panel border border-gray-800 text-texto hover:border-viper transition-colors'

function Categoria({ categoria, puntos, lista }) {
  const { puntosMinimos: minimo, puntosMaximos: maximo } = categoria
  const siguiente = lista?.find((c) => c.puntosMinimos > minimo) ?? null
  const destino = siguiente ? siguiente.puntosMinimos : maximo < SIN_TOPE ? maximo + 1 : null
  const progreso = destino ? Math.min(100, Math.max(0, ((puntos - minimo) / (destino - minimo)) * 100)) : 100

  return (
    <section className="bg-panel border border-gray-800 rounded-2xl px-6 py-5" aria-label="Categoría técnica">
      <p className="font-semibold">Categoría técnica: {categoria.nombre}</p>
      <p className="text-sm text-texto-suave mt-1">
        {maximo >= SIN_TOPE ? `Rango de puntos: ${FORMATO.format(minimo)} o más` : `Rango de puntos: ${FORMATO.format(minimo)} – ${FORMATO.format(maximo)}`}
      </p>
      {destino ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3">
          <div
            role="progressbar"
            aria-label="Avance hacia la categoría siguiente"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progreso)}
            className="w-full sm:flex-1 h-2 rounded-full bg-fondo overflow-hidden"
          >
            <div className="h-full rounded-full bg-viper" style={{ width: `${progreso}%` }} />
          </div>
          <p className="text-sm text-texto-suave whitespace-nowrap">
            {FORMATO.format(Math.max(0, destino - puntos))} pts para {siguiente ? siguiente.nombre : 'la categoría siguiente'}
          </p>
        </div>
      ) : (
        <p className="text-sm text-texto-suave mt-3">Es la categoría más alta de la disciplina.</p>
      )}
    </section>
  )
}

export default function DetalleJugadorRanking() {
  const { disciplina: claveDisciplina, jugadorId } = useParams()
  const disciplina = DISCIPLINAS.find((d) => d.clave === claveDisciplina)
  const { usuario } = useAuth()
  const esPropio = usuario?.jugador_id === jugadorId

  const [intento, setIntento] = useState(0)
  const [respuesta, setRespuesta] = useState(null)
  const [categorias, setCategorias] = useState(null)
  const clave = `${disciplina?.api}|${jugadorId}|${intento}`
  const actual = respuesta?.clave === clave ? respuesta : null

  useEffect(() => {
    if (!disciplina) return
    let vigente = true
    get(`/ranking/${disciplina.api}/jugadores/${jugadorId}`)
      .then((datos) => vigente && setRespuesta({ clave, datos }))
      .catch((e) => vigente && setRespuesta({ clave, error: e.mensaje, noFigura: e.status === 404 }))
    return () => {
      vigente = false
    }
  }, [clave, disciplina, jugadorId])

  useEffect(() => {
    if (!disciplina) return
    let vigente = true
    get(`/categorias?disciplina=${disciplina.api}`)
      .then((r) => vigente && setCategorias({ disciplina: disciplina.api, lista: r.categorias }))
      .catch(() => {})
    return () => {
      vigente = false
    }
  }, [disciplina])

  if (!disciplina) {
    return (
      <div className="max-w-5xl mx-auto w-full flex flex-col gap-4">
        <Alert variante="error">La disciplina no es válida.</Alert>
        <Link to="/portal/ranking" className="text-sm text-viper hover:underline w-fit">
          Volver al ranking
        </Link>
      </div>
    )
  }

  const volver = rutaRanking(disciplina)
  const datos = actual?.datos
  const listaCategorias = categorias?.disciplina === disciplina.api ? categorias.lista : null

  let contenido
  if (actual?.noFigura) {
    contenido = (
      <EmptyState
        titulo={esPropio ? `Todavía no figurás en el ranking de ${disciplina.titulo}` : 'Este jugador no figura en el ranking'}
        descripcion={`Aparecerá en el ranking de ${disciplina.titulo} cuando sume puntos en un torneo del club.`}
      />
    )
  } else if (actual?.error) {
    contenido = (
      <Alert variante="error" titulo="No pudimos cargar el detalle">
        {actual.error}{' '}
        <button type="button" onClick={() => setIntento((n) => n + 1)} className="underline font-semibold cursor-pointer">
          Reintentar
        </button>
      </Alert>
    )
  } else if (!datos) {
    contenido = (
      <div className="py-16 flex justify-center">
        <Spinner texto="Cargando detalle" />
      </div>
    )
  } else {
    const hayRevertidos = datos.movimientos.some((m) => m.revertido)
    contenido = (
      <>
        <section className="bg-panel border border-gray-800 rounded-2xl px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <Avatar semilla={datos.jugador.id} tamano={56} />
            <div className="min-w-0">
              <p className="font-outfit text-xl font-bold break-words">{nombreCompleto(datos.jugador)}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variante="info">{datos.categoria.nombre}</Badge>
                {esPropio && <Badge variante="exito">Vos</Badge>}
              </div>
            </div>
          </div>
          <dl className="flex gap-10">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-texto-suave">Posición</dt>
              <dd className="font-outfit text-3xl font-bold tabular-nums">#{datos.posicion}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-texto-suave">Puntos totales</dt>
              <dd className="font-outfit text-3xl font-bold tabular-nums text-viper">{FORMATO.format(datos.puntosTotales)}</dd>
            </div>
          </dl>
        </section>

        <Categoria categoria={datos.categoria} puntos={datos.puntosTotales} lista={listaCategorias} />

        <section className="flex flex-col gap-4" aria-labelledby="titulo-historial">
          <h2 id="titulo-historial" className="font-outfit text-lg font-bold">Historial de puntos</h2>
          {datos.movimientos.length === 0 ? (
            <EmptyState titulo="Todavía no tiene movimientos de puntos" descripcion="Se mostrará su categoría inicial hasta que juegue un partido." />
          ) : (
            <>
              <HistorialPuntos movimientos={datos.movimientos} />
              {hayRevertidos && (
                <p className="text-sm text-texto-suave">Los movimientos revertidos no suman a los puntos totales: se anulan cuando se corrige el resultado de un partido.</p>
              )}
            </>
          )}
        </section>
      </>
    )
  }

  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-outfit text-[28px] font-bold break-words">{datos ? nombreCompleto(datos.jugador) : 'Detalle del jugador'}</h1>
          <p className="text-texto-suave text-sm mt-1">Detalle en {disciplina.titulo}</p>
        </div>
        <Link to={volver} className={VOLVER}>
          Volver
        </Link>
      </div>
      {contenido}
    </div>
  )
}