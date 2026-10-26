import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { get } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import EmptyState from '../../../../shared/components/EmptyState'
import Spinner from '../../../../shared/components/Spinner'
import Tabs from '../../../../shared/components/Tabs'
import { useAuth } from '../../auth/useAuth'
import TablaRanking from '../components/TablaRanking'
import { PESTANAS, buscarEnRanking, cantidadJugadores, disciplinaDe } from '../ranking'

const CHIP = 'px-4 py-1.5 rounded-full border text-sm font-medium whitespace-nowrap transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-viper'

// Filtro por categoría técnica: «Todas» y una opción por categoría de la disciplina
function FiltroCategoria({ categorias, elegida, onCambiar }) {
  const opciones = [{ id: '', nombre: 'Todas' }, ...categorias]
  return (
    <div role="group" aria-label="Filtrar por categoría" className="sin-barra flex gap-2 overflow-x-auto">
      {opciones.map(({ id, nombre }) => (
        <button
          key={id || 'todas'}
          type="button"
          aria-pressed={id === elegida}
          onClick={() => onCambiar(id)}
          className={`${CHIP} ${id === elegida ? 'bg-viper/15 border-viper text-viper' : 'bg-panel border-gray-800 text-texto-suave hover:text-viper hover:border-viper'}`}
        >
          {nombre}
        </button>
      ))}
    </div>
  )
}

// Búsqueda por nombre o apellido (se filtra en el front: la lista ya está completa)
function Buscador({ valor, onCambiar }) {
  return (
    <div className="relative md:max-w-sm">
      <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-texto-suave pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="search"
        aria-label="Buscar jugador por nombre"
        placeholder="Buscar jugador por nombre"
        maxLength={100}
        value={valor}
        onChange={(e) => onCambiar(e.target.value)}
        className="w-full bg-fondo text-texto placeholder:text-texto-suave border border-gray-800 focus:border-viper rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none transition-colors"
      />
    </div>
  )
}

// Resumen de la posición de quien mira, si está en la lista que se ve
function MiPosicion({ fila }) {
  return (
    <div className="bg-viper/10 border border-viper/40 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-texto-suave">Tu posición</p>
        <p className="font-outfit text-3xl font-bold text-viper tabular-nums">{fila.posicion}°</p>
      </div>
      <div className="text-right">
        <p className="font-outfit text-2xl font-bold tabular-nums">{fila.puntos} <span className="text-sm font-normal text-texto-suave">pts</span></p>
        <p className="text-sm text-texto-suave">{fila.categoria.nombre}</p>
      </div>
    </div>
  )
}

// Ranking del club (/portal/ranking). La disciplina y la categoría viven en la URL (?disciplina=padel&categoria=…)
// para que se pueda volver o compartir el enlace. Lo ven todos los roles; el jugador ve su fila resaltada.
export default function RankingJugador() {
  const { usuario } = useAuth()
  const jugadorId = usuario?.jugador_id ?? null
  const [parametros, setParametros] = useSearchParams()
  const disciplina = disciplinaDe(parametros.get('disciplina'))
  const categoriaId = parametros.get('categoria') ?? ''

  const [busqueda, setBusqueda] = useState('')
  const [reintento, setReintento] = useState(0)
  const [categorias, setCategorias] = useState(null) // { clave, lista }
  const [resultado, setResultado] = useState(null) // { clave, ranking, error }
  const clave = `${disciplina.api}|${categoriaId}|${reintento}`
  const error = resultado?.clave === clave ? resultado.error : null
  const filas = resultado?.clave === clave ? (resultado.ranking ?? null) : null
  const categoriasDeLaDisciplina = categorias?.clave === disciplina.api ? categorias.lista : []

  useEffect(() => {
    let vigente = true
    get(`/categorias?disciplina=${disciplina.api}`)
      .then((r) => vigente && setCategorias({ clave: disciplina.api, lista: r.categorias }))
      .catch(() => {}) // sin categorías el filtro no se muestra, pero el ranking sigue andando
    return () => {
      vigente = false
    }
  }, [disciplina.api])

  useEffect(() => {
    let vigente = true
    const consulta = categoriaId ? `?categoriaId=${encodeURIComponent(categoriaId)}` : ''
    get(`/ranking/${disciplina.api}${consulta}`)
      .then((r) => vigente && setResultado({ clave, ranking: r.ranking }))
      .catch((e) => vigente && setResultado({ clave, error: e.mensaje }))
    return () => {
      vigente = false
    }
  }, [clave, disciplina.api, categoriaId])

  const recargar = useCallback(() => setReintento((n) => n + 1), [])
  // Tenis es la disciplina por defecto: no hace falta escribirla en la URL
  const cambiarDisciplina = (nueva) => setParametros(nueva === 'tenis' ? {} : { disciplina: nueva })
  const cambiarCategoria = (id) => {
    const nuevos = {}
    if (disciplina.clave !== 'tenis') nuevos.disciplina = disciplina.clave
    if (id) nuevos.categoria = id
    setParametros(nuevos)
  }

  const propia = filas?.find((f) => f.jugador.id === jugadorId) ?? null
  const visibles = filas ? buscarEnRanking(filas, busqueda) : null
  const sinRanking = jugadorId && filas && !categoriaId && !propia

  let contenido
  if (error) {
    contenido = (
      <Alert variante="error" titulo="No pudimos cargar el ranking">
        {error}{' '}
        <button type="button" onClick={recargar} className="underline font-semibold cursor-pointer">Reintentar</button>
      </Alert>
    )
  } else if (!filas) {
    contenido = (
      <div className="py-16 flex justify-center">
        <Spinner texto="Cargando ranking" />
      </div>
    )
  } else if (filas.length === 0) {
    contenido = categoriaId
      ? <EmptyState titulo="No hay jugadores en esta categoría" descripcion="Probá con otra categoría o mirá el ranking completo." />
      : <EmptyState titulo={`Todavía no hay ranking de ${disciplina.titulo}`} descripcion="El ranking se arma con los resultados de los torneos del club." />
  } else {
    contenido = (
      <>
        {propia && <MiPosicion fila={propia} />}
        {sinRanking && (
          <Alert variante="info">Todavía no sumaste puntos en {disciplina.titulo}. Jugá un torneo del club para entrar al ranking.</Alert>
        )}
        <p className="text-sm text-texto-suave">
          {visibles.length === filas.length ? cantidadJugadores(filas.length) : `${visibles.length} de ${cantidadJugadores(filas.length)}`}
        </p>
        {visibles.length === 0
          ? <EmptyState titulo="No encontramos jugadores" descripcion={`Nadie coincide con «${busqueda.trim()}». Revisá el nombre o probá con el apellido.`} />
          : <TablaRanking filas={visibles} jugadorId={jugadorId} />}
      </>
    )
  }

  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col gap-6">
      <div>
        <h1 className="font-outfit text-[28px] font-bold">Ranking</h1>
        <p className="text-texto-suave text-sm mt-1">Puntos de cada jugador por disciplina. La categoría técnica se actualiza con los resultados.</p>
      </div>

      <Tabs pestanas={PESTANAS} activa={disciplina.clave} onCambiar={cambiarDisciplina} />

      <Buscador valor={busqueda} onCambiar={setBusqueda} />

      {categoriasDeLaDisciplina.length > 0 && (
        <FiltroCategoria categorias={categoriasDeLaDisciplina} elegida={categoriaId} onCambiar={cambiarCategoria} />
      )}

      {contenido}
    </div>
  )
}