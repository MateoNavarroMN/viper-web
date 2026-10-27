import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { get, post } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Badge from '../../../../shared/components/Badge'
import Button from '../../../../shared/components/Button'
import Spinner from '../../../../shared/components/Spinner'
import { useToast } from '../../../../shared/hooks/useToast'
import Requisito from '../components/Requisito'
import ResolverEmpate from '../components/ResolverEmpate'
import { resumenDeFase } from '../fase'
import { ETIQUETA_DISCIPLINA, ETIQUETA_FORMATO, nombreCorto } from '../torneos'

const RUTA = '/gestion/torneos'
const TARJETA = 'bg-panel border border-gray-800 rounded-2xl p-5 md:p-8'

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`

function Dato({ etiqueta, children }) {
  return (
    <div>
      <dt className="text-[13px] text-texto-suave">{etiqueta}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  )
}

const PASOS = [
  'Cuadro de eliminación directa con los clasificados de zona.',
  'Primeros de zona como cabezas de serie, en posiciones separadas.',
  'Cruces entre zonas distintas; byes si no es potencia de 2.',
  'Cancha y horario para la primera ronda (CU 3.5).',
]

// Panel «Qué se va a generar» (solo desde lg, como en la pantalla de generar el cuadro)
function QueSeGenera() {
  return (
    <aside className="hidden lg:block bg-panel border border-gray-800 rounded-2xl p-8 h-fit">
      <h2 className="text-xs font-bold uppercase tracking-wide text-texto-suave mb-5">Qué se va a generar</h2>
      <ol className="flex flex-col gap-4">
        {PASOS.map((texto, indice) => (
          <li key={texto} className="flex items-start gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-viper/15 text-viper text-xs font-bold flex items-center justify-center mt-0.5" aria-hidden="true">
              {indice + 1}
            </span>
            <span className="text-sm leading-relaxed">{texto}</span>
          </li>
        ))}
      </ol>
      <p className="text-sm text-texto-suave leading-relaxed mt-5 pt-5 border-t border-gray-800">
        Se puede rehacer mientras ningún partido eliminatorio tenga resultado ni W.O.
      </p>
    </aside>
  )
}

// Resumen previo y generación de la fase eliminatoria (CU 3.9). Solo Organizador y Administrador. Con las zonas cerradas muestra
// los clasificados y el tamaño del cuadro; con zonas incompletas (2a) lista lo que falta; con un empate que decide quién clasifica
// (3a) deja ordenar a los empatados. Al generar vuelve a la ficha, en la pestaña «Cuadro / Zonas» con la fase eliminatoria.
export default function GenerarFaseEliminatoria() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { mostrarToast } = useToast()

  const [reintento, setReintento] = useState(0)
  const [resultado, setResultado] = useState(null) // { clave, torneo, cuadro, error }
  const [generando, setGenerando] = useState(false)
  const [verRequisitos, setVerRequisitos] = useState(false) // solo en el celular; desde lg la lista está siempre a la vista

  const clave = `${id}|${reintento}`
  const actual = resultado?.clave === clave ? resultado : null

  // Se piden la ficha del torneo y las zonas con sus tablas y partidos
  useEffect(() => {
    let vigente = true
    Promise.allSettled([get(`/torneos/${id}`), get(`/torneos/${id}/cuadro`)]).then(([ficha, cuadro]) => {
      if (!vigente) return
      const torneo = ficha.status === 'fulfilled' ? ficha.value.torneo : null
      if (ficha.status === 'rejected') setResultado({ clave, error: ficha.reason })
      else if (cuadro.status === 'rejected' && cuadro.reason.status !== 409) setResultado({ clave, torneo, error: cuadro.reason })
      else setResultado({ clave, torneo, cuadro: cuadro.status === 'fulfilled' ? cuadro.value : null })
    })
    return () => {
      vigente = false
    }
  }, [id, clave])

  const recargar = useCallback(() => setReintento((n) => n + 1), [])
  const volverALaFicha = useCallback((estado) => navigate(`${RUTA}/${id}`, { state: estado ?? { pestana: 'cuadro' } }), [navigate, id])

  const generar = async () => {
    setGenerando(true)
    try {
      const respuesta = await post(`/torneos/${id}/fase-eliminatoria`)
      const sinProgramar = respuesta.partidosSinProgramar.length
      mostrarToast(sinProgramar > 0 ? respuesta.mensaje : 'Fase eliminatoria generada correctamente', sinProgramar > 0 ? 'advertencia' : 'exito')
      volverALaFicha({ pestana: 'cuadro', fase: 'eliminatoria' })
    } catch (e) {
      // Cambió algo desde que se abrió la pantalla (una zona, un empate o la fase): se avisa y se vuelve a pedir
      mostrarToast(e.mensaje, 'error')
      recargar()
    } finally {
      setGenerando(false)
    }
  }

  const encabezado = (
    <Link to={`${RUTA}/${id}`} state={{ pestana: 'cuadro' }} className="text-sm text-texto-suave hover:text-viper transition-colors inline-flex items-center gap-1 w-fit">
      <span aria-hidden="true">‹</span> Volver a la ficha del torneo
    </Link>
  )
  const titulo = <h1 className="font-outfit text-[28px] font-bold">Generar Fase Eliminatoria</h1>
  const pantalla = (contenido) => (
    <div className="max-w-5xl mx-auto w-full flex flex-col gap-6">
      {encabezado}
      {titulo}
      {contenido}
    </div>
  )

  if (!actual) return pantalla(<div className="py-16 flex justify-center"><Spinner texto="Cargando zonas" /></div>)

  const { torneo, cuadro, error } = actual
  if (error) {
    return error.status === 404
      ? pantalla(
        <Alert variante="error" titulo="No encontramos el torneo">
          <Link to={RUTA} className="underline font-semibold">Volver a la lista</Link>
        </Alert>
      )
      : pantalla(
        <Alert variante="error" titulo="No pudimos cargar las zonas">
          {error.mensaje}{' '}
          <button type="button" onClick={recargar} className="underline font-semibold cursor-pointer">Reintentar</button>
        </Alert>
      )
  }

  if (torneo.formato !== 'ZONAS_Y_ELIMINACION') {
    return pantalla(<Alert variante="info" titulo="No se puede generar la fase eliminatoria">Este torneo es de eliminación directa: no tiene fase de zonas.</Alert>)
  }
  if (torneo.estado !== 'EN_CURSO') {
    return pantalla(<Alert variante="info" titulo="No se puede generar la fase eliminatoria">La fase eliminatoria se genera con el torneo en curso.</Alert>)
  }
  if (torneo.faseActual === 'ELIMINATORIA' || !cuadro) {
    return pantalla(
      <Alert variante="info" titulo="La fase eliminatoria ya está generada">
        <Link to={`${RUTA}/${id}`} state={{ pestana: 'cuadro', fase: 'eliminatoria' }} className="underline font-semibold">Ver el cuadro</Link>
      </Alert>
    )
  }

  const resumen = resumenDeFase(cuadro.zonas, torneo.clasificanPorZona)
  const { zonas, cerradas, pendientes, conEmpate, clasificados, tamano, byes, puedeGenerar } = resumen
  const cumplidos = 1 + (pendientes.length === 0 ? 1 : 0) + (pendientes.length === 0 && conEmpate.length === 0 ? 1 : 0)

  const requisitos = (
    <ul className="flex flex-col gap-3">
      <Requisito estado="cumplido">Torneo En curso, en fase de zonas</Requisito>
      <Requisito estado={pendientes.length === 0 ? 'cumplido' : 'pendiente'}>Todas las zonas cerradas ({cerradas} de {zonas.length})</Requisito>
      <Requisito estado={pendientes.length === 0 && conEmpate.length === 0 ? 'cumplido' : 'pendiente'}>Clasificados definidos, sin empates</Requisito>
    </ul>
  )

  const botonGenerar = (
    <Button className="w-full sm:w-auto whitespace-nowrap" disabled={!puedeGenerar} cargando={generando} onClick={generar}>
      Generar Fase Eliminatoria
    </Button>
  )

  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col gap-6 pb-24 sm:pb-0">
      {encabezado}

      <div>
        {titulo}
        <p className="text-texto-suave text-sm mt-1">
          {torneo.nombre} · {ETIQUETA_DISCIPLINA[torneo.disciplina]} · {ETIQUETA_FORMATO[torneo.formato]}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_18rem] gap-6 items-start">
        <div className="flex flex-col gap-6">
          <section className={TARJETA}>
            <h2 className="text-xs font-bold uppercase tracking-wide text-texto-suave mb-4">Resumen previo</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <Dato etiqueta="Formato">{ETIQUETA_FORMATO[torneo.formato]}</Dato>
              <Dato etiqueta="Fase actual">{pendientes.length === 0 ? 'Zonas (todas cerradas)' : `Zonas (${cerradas} de ${zonas.length} cerradas)`}</Dato>
              <Dato etiqueta="Clasificados por zona">{torneo.clasificanPorZona}</Dato>
              <Dato etiqueta="Cuadro eliminatorio">
                {clasificados} clasificados · cuadro de {tamano}{byes > 0 ? ` · ${plural(byes, 'bye', 'byes')}` : ''}
              </Dato>
            </dl>

            <h2 className="text-xs font-bold uppercase tracking-wide text-texto-suave mt-8 mb-4">Clasificados por zona</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {zonas.map((zona) => (
                <div key={zona.id} className="bg-fondo border border-gray-800 rounded-xl p-4">
                  <p className="text-[13px] font-semibold uppercase tracking-wide text-texto-suave mb-2">{zona.nombre}</p>
                  {!zona.completa ? (
                    <p className="text-sm text-texto-suave">Todavía no terminó.</p>
                  ) : (
                    <ul className="flex flex-col gap-1.5">
                      {zona.clasificados.map((fila) => (
                        <li key={fila.participante.inscripcionId} className="text-sm flex items-baseline gap-2">
                          <span className="font-outfit font-bold text-viper tabular-nums">{fila.posicion}°</span>
                          <span className="break-words">{nombreCorto(fila.participante)}</span>
                          {zona.empates.some((e) => e.posicion === fila.posicion) && <Badge variante="advertencia">Empatado</Badge>}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            <h2 className="text-xs font-bold uppercase tracking-wide text-texto-suave mt-8 mb-4">Requisitos</h2>
            {/* En el celular se resume y se despliega; desde lg está siempre a la vista */}
            <button
              type="button"
              aria-expanded={verRequisitos}
              onClick={() => setVerRequisitos((v) => !v)}
              className="lg:hidden w-full flex items-center justify-between gap-3 bg-fondo border border-gray-800 rounded-xl px-4 py-3 text-sm font-semibold cursor-pointer"
            >
              {cumplidos === 3 ? 'Requisitos cumplidos (3 de 3)' : `Requisitos (${cumplidos} de 3)`}
              <span aria-hidden="true" className={`transition-transform ${verRequisitos ? 'rotate-90' : ''}`}>›</span>
            </button>
            <div className={`bg-fondo border border-gray-800 rounded-xl p-5 max-lg:mt-3 lg:block ${verRequisitos ? 'block' : 'hidden'}`}>{requisitos}</div>
          </section>

          {/* 2a: zonas con partidos sin jugar */}
          {pendientes.length > 0 && (
            <section className="flex flex-col gap-4" aria-label="Zonas con partidos pendientes">
              <Alert variante="error" titulo="No se puede generar la fase eliminatoria">
                Cerrá todos los partidos de zona antes de continuar.
              </Alert>
              <ul className="bg-panel border border-gray-800 rounded-xl divide-y divide-gray-800">
                {pendientes.map((zona) => (
                  <li key={zona.id} className="flex items-center gap-4 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p>{zona.nombre}</p>
                      <p className="text-xs text-texto-suave mt-0.5">{plural(zona.pendientes, 'partido pendiente', 'partidos pendientes')}</p>
                    </div>
                    <Badge variante="advertencia">Pendiente</Badge>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 3a: empates que decide quién clasifica */}
          {conEmpate.map((zona) => (
            <ResolverEmpate key={zona.id} zona={zona} onHecho={recargar} />
          ))}

          {generando && (
            <Alert variante="info" titulo="Generando la fase eliminatoria">
              Armando el cuadro y asignando cancha y horario a la primera ronda. Puede tardar unos segundos.
            </Alert>
          )}

          {/* Escritorio y tablet: botones al final de la tarjeta; en el celular van en la barra fija de abajo */}
          <div className="hidden sm:flex sm:justify-between gap-3">
            <Button variante="neutro" disabled={generando} onClick={() => volverALaFicha()}>{puedeGenerar ? 'Cancelar' : 'Volver a la ficha del torneo'}</Button>
            {botonGenerar}
          </div>
        </div>

        <QueSeGenera />
      </div>

      <div className="fixed bottom-0 inset-x-0 p-4 bg-fondo/90 backdrop-blur border-t border-gray-800 z-30 sm:hidden flex flex-col gap-3">
        {botonGenerar}
        {!puedeGenerar && <Button variante="neutro" className="w-full" onClick={() => volverALaFicha()}>Volver a la ficha del torneo</Button>}
      </div>
    </div>
  )
}