import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { get, put } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import Checkbox from '../../../../shared/components/Checkbox'
import ConfirmDialog from '../../../../shared/components/ConfirmDialog'
import EmptyState from '../../../../shared/components/EmptyState'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Spinner from '../../../../shared/components/Spinner'
import { useToast } from '../../../../shared/hooks/useToast'
import AvisoEtapa from '../components/AvisoEtapa'
import { BadgeCabeza } from '../components/PanelCabezas'
import { ETIQUETA_DISCIPLINA, ETIQUETA_FORMATO, nombrePareja, puntosTexto, REGLA_CABEZAS } from '../torneos'

const RUTA = '/gestion/torneos'

// Columnas de la tabla (desde lg): casilla · pos. · pareja · [categoría, desde xl] · puntos · pago
const COLUMNAS = 'lg:grid-cols-[1.5rem_3rem_minmax(0,1fr)_7rem_14rem] xl:grid-cols-[1.5rem_3rem_minmax(0,1fr)_7rem_7rem_15rem]'

const idsMarcados = (inscripciones) => new Set(inscripciones.filter((i) => i.cabezaDeSerie).map((i) => i.id))

// Una inscripción de la lista. La fila entera es un <label> con una sola casilla, así se marca tocando en cualquier parte.
// Es una grilla: en escritorio (lg+) son las columnas de la tabla; en el celular una tarjeta con la casilla a la izquierda.
function Fila({ inscripcion: i, posicion, categoria, marcada, guardada, onAlternar }) {
  const nombre = nombrePareja(i)
  // Los reinicios `lg:` devuelven cada elemento a su lugar automático en la tabla
  const celda = 'lg:col-auto lg:row-auto'

  return (
    <li className={`border-gray-800 max-lg:border max-lg:rounded-2xl lg:border-b lg:last:border-b-0 transition-colors ${marcada ? 'bg-viper/5 max-lg:border-viper/50' : 'max-lg:bg-panel'}`}>
      <label className={`grid items-center gap-x-4 gap-y-2 p-4 cursor-pointer grid-cols-[1.5rem_minmax(0,1fr)_auto] ${COLUMNAS} lg:px-6 lg:hover:bg-fondo/50 transition-colors`}>
        <Checkbox
          checked={marcada}
          onChange={() => onAlternar(i.id)}
          aria-label={`Cabeza de serie: ${nombre}`}
          className="row-span-2 self-start lg:row-auto lg:self-center"
        />
        <span className={`col-start-2 row-start-2 text-sm text-texto-suave ${celda} lg:font-outfit lg:text-base lg:font-bold tabular-nums`}>
          {posicion}°<span className="lg:hidden"> · {categoria}</span>
        </span>
        <div className={`col-start-2 row-start-1 min-w-0 ${celda}`}>
          <p className="font-semibold break-words">{nombre}</p>
          <p className="hidden lg:block text-sm text-texto-suave">Inscripción activa<span className="xl:hidden"> · {categoria}</span></p>
        </div>
        <span className="hidden xl:block">{categoria}</span>
        <span className={`col-start-3 row-start-1 text-sm lg:text-base tabular-nums whitespace-nowrap ${celda}`}>{puntosTexto(i.puntos)}</span>
        {/* En el celular solo se muestra la insignia de cabeza de serie */}
        <div className={`flex flex-wrap items-center gap-2 col-start-2 col-span-2 row-start-3 lg:col-span-1 ${celda} ${guardada ? '' : 'max-lg:hidden'}`}>
          <span className="max-lg:hidden"><EstadoBadge tipo="pago" estado="PAGADO" /></span>
          {guardada && <BadgeCabeza />}
        </div>
      </label>
    </li>
  )
}

// Selección de cabezas de serie (CU 3.3 · pasos 3 a 7): las inscripciones pagadas de mayor a menor puntaje, con una casilla
// cada una. El máximo se avisa en pantalla (5a) y también lo valida la API; «Cancelar» con cambios pide confirmación (4a).
export default function CabezasDeSerie() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { mostrarToast } = useToast()

  const [reintento, setReintento] = useState(0)
  const [resultado, setResultado] = useState(null) // { clave, datos, torneo, error }
  const [seleccion, setSeleccion] = useState(() => new Set())
  const [guardando, setGuardando] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState(null)
  const [descartando, setDescartando] = useState(false)

  const clave = `${id}|${reintento}`
  const actual = resultado?.clave === clave ? resultado : null

  // Se piden la ficha del torneo (categoría y formato) y las cabezas de serie; el aviso de la 2a también usa el formato
  useEffect(() => {
    let vigente = true
    Promise.allSettled([get(`/torneos/${id}`), get(`/torneos/${id}/cabezas-de-serie`)]).then(([ficha, cabezas]) => {
      if (!vigente) return
      const torneo = ficha.status === 'fulfilled' ? ficha.value.torneo : null
      if (cabezas.status === 'fulfilled' && cabezas.value.editable === false) {
        // Con el cuadro generado la API solo deja consultar: se muestra el mismo aviso que con un 409
        const mensaje = 'Las cabezas de serie se configuran con las inscripciones abiertas o cerradas'
        setResultado({ clave, torneo, error: Object.assign(new Error(mensaje), { status: 409, mensaje, datos: {} }) })
      } else if (cabezas.status === 'fulfilled') {
        setResultado({ clave, torneo, datos: cabezas.value })
        setSeleccion(idsMarcados(cabezas.value.inscripciones))
      } else {
        setResultado({ clave, torneo, error: cabezas.reason })
      }
    })
    return () => {
      vigente = false
    }
  }, [id, clave])

  const volverALaFicha = useCallback(() => navigate(`${RUTA}/${id}`, { state: { pestana: 'cabezas' } }), [navigate, id])
  const alternar = useCallback((inscripcionId) => {
    setErrorGuardar(null)
    setSeleccion((anterior) => {
      const nueva = new Set(anterior)
      if (nueva.has(inscripcionId)) nueva.delete(inscripcionId)
      else nueva.add(inscripcionId)
      return nueva
    })
  }, [])

  if (!actual || actual.error) {
    const error = actual?.error
    return (
      <div className="max-w-5xl mx-auto w-full flex flex-col gap-6">
        <Link to={`${RUTA}/${id}`} state={{ pestana: 'cabezas' }} className="text-sm text-texto-suave hover:text-viper transition-colors inline-flex items-center gap-1 w-fit">
          <span aria-hidden="true">‹</span> Volver a la ficha del torneo
        </Link>
        <h1 className="font-outfit text-[28px] font-bold">Configurar Cabezas de Serie</h1>
        {!actual ? (
          <div className="py-16 flex justify-center">
            <Spinner texto="Cargando inscripciones" />
          </div>
        ) : error.status === 409 ? (
          <AvisoEtapa error={error} formato={ETIQUETA_FORMATO[actual.torneo?.formato]} onVolver={volverALaFicha} />
        ) : error.status === 404 ? (
          <Alert variante="error" titulo="No encontramos el torneo">
            <Link to={RUTA} className="underline font-semibold">Volver a la lista</Link>
          </Alert>
        ) : (
          <Alert variante="error" titulo="No pudimos cargar las inscripciones">
            {error.mensaje}{' '}
            <button type="button" onClick={() => setReintento((n) => n + 1)} className="underline font-semibold cursor-pointer">Reintentar</button>
          </Alert>
        )}
      </div>
    )
  }

  const { torneo: resumen, inscripciones, maximoPermitido } = actual.datos
  const categoria = actual.torneo?.categoria ?? '—'
  const guardadas = idsMarcados(inscripciones)
  const cambios = guardadas.size !== seleccion.size || [...seleccion].some((x) => !guardadas.has(x))
  const sobran = seleccion.size - maximoPermitido
  const excedido = sobran > 0
  const pareja = resumen.disciplina === 'PADEL'
  const regla = REGLA_CABEZAS[resumen.formato]
  const etiquetaContador = !cambios && seleccion.size > 0 ? 'Cabezas de serie guardadas' : 'Cabezas de serie seleccionadas'
  const porcentaje = maximoPermitido > 0 ? Math.min(100, (seleccion.size / maximoPermitido) * 100) : 0

  const guardar = async () => {
    setGuardando(true)
    setErrorGuardar(null)
    try {
      const respuesta = await put(`/torneos/${id}/cabezas-de-serie`, { inscripcionIds: [...seleccion] })
      setResultado({ clave, torneo: actual.torneo, datos: respuesta })
      setSeleccion(idsMarcados(respuesta.inscripciones))
      mostrarToast(respuesta.mensaje, 'exito')
    } catch (e) {
      setErrorGuardar(e.mensaje)
    } finally {
      setGuardando(false)
    }
  }

  // Cancelar / volver: con cambios sin guardar pregunta antes de salir (4a)
  const salir = () => (cambios ? setDescartando(true) : volverALaFicha())
  const botonGuardar = (
    <Button className="w-full sm:w-auto whitespace-nowrap" disabled={!cambios || excedido} cargando={guardando} onClick={guardar}>
      Guardar Cabezas de Serie
    </Button>
  )

  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col gap-6 pb-24 sm:pb-0">
      <button type="button" onClick={salir} className="text-sm text-texto-suave hover:text-viper transition-colors inline-flex items-center gap-1 w-fit cursor-pointer">
        <span aria-hidden="true">‹</span> Volver a la ficha del torneo
      </button>

      <div>
        <h1 className="font-outfit text-[28px] font-bold">Configurar Cabezas de Serie</h1>
        <p className="text-texto-suave text-sm mt-1">
          {resumen.nombre} · {ETIQUETA_DISCIPLINA[resumen.disciplina]} · {ETIQUETA_FORMATO[resumen.formato]}
        </p>
      </div>

      <Alert variante="info">
        Podés elegir hasta {maximoPermitido} cabezas de serie ({regla}).{' '}
        {resumen.formato === 'ZONAS_Y_ELIMINACION' ? 'Se distribuyen en zonas distintas' : 'Se ubican separadas en el cuadro'} al generar la competencia.
      </Alert>

      {excedido && (
        <Alert variante="error" titulo="Superaste el máximo de cabezas de serie">
          El máximo es {maximoPermitido} ({regla}). Quitá {sobran} para poder guardar.
        </Alert>
      )}
      {errorGuardar && <Alert variante="error">{errorGuardar}</Alert>}

      {/* Celular: el contador va arriba; en escritorio está en el pie de la tabla */}
      <div className={`sm:hidden bg-panel border rounded-2xl px-5 py-4 flex items-center justify-between gap-4 ${excedido ? 'border-error/50' : 'border-gray-800'}`}>
        <p className="text-sm">{etiquetaContador}</p>
        <p className={`font-outfit text-2xl font-bold tabular-nums ${excedido ? 'text-error' : 'text-viper'}`} aria-live="polite">
          {seleccion.size} / {maximoPermitido}
        </p>
      </div>

      {inscripciones.length === 0 ? (
        <EmptyState titulo="No hay inscripciones pagadas" descripcion="Cuando haya inscripciones con el pago confirmado vas a poder elegir las cabezas de serie." />
      ) : (
        <div className="lg:bg-panel lg:border lg:border-gray-800 lg:rounded-2xl">
          <div className={`hidden lg:grid ${COLUMNAS} gap-x-4 px-6 py-4 border-b border-gray-800 text-xs font-semibold uppercase tracking-wide text-texto-suave`}>
            <span className="sr-only">Cabeza de serie</span>
            <span className="col-start-2">Pos.</span>
            <span>{pareja ? 'Pareja' : 'Jugador'}</span>
            <span className="hidden xl:block">Categoría</span>
            <span>{pareja ? 'Puntos (suma)' : 'Puntos'}</span>
            <span>Pago</span>
          </div>
          <ul className="flex flex-col gap-3 lg:gap-0">
            {inscripciones.map((i, indice) => (
              <Fila
                key={i.id}
                inscripcion={i}
                posicion={indice + 1}
                categoria={categoria}
                marcada={seleccion.has(i.id)}
                guardada={guardadas.has(i.id)}
                onAlternar={alternar}
              />
            ))}
          </ul>

          {/* Escritorio y tablet: contador con barra a la izquierda, botones a la derecha */}
          <div className="hidden sm:flex items-center justify-between gap-6 mt-4 lg:mt-0 lg:px-6 lg:py-5 lg:border-t lg:border-gray-800">
            <div className="min-w-0">
              <div className="flex items-center gap-4">
                <span className="text-sm text-texto-suave">{!cambios && seleccion.size > 0 ? 'Guardadas' : 'Seleccionadas'}</span>
                <span className={`font-outfit text-2xl font-bold tabular-nums ${excedido ? 'text-error' : ''}`} aria-live="polite">
                  {seleccion.size} / {maximoPermitido}
                </span>
                <div className="h-2 w-28 rounded-full bg-gray-800 overflow-hidden" aria-hidden="true">
                  <div className={`h-full rounded-full ${excedido ? 'bg-error' : 'bg-viper'}`} style={{ width: `${porcentaje}%` }} />
                </div>
              </div>
              <p className="text-sm text-texto-suave mt-1">
                Mostrando {inscripciones.length} {inscripciones.length === 1 ? 'inscripción pagada' : 'inscripciones pagadas'}, de mayor a menor puntaje
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Button variante="neutro" onClick={salir}>{cambios ? 'Cancelar' : 'Volver'}</Button>
              {botonGuardar}
            </div>
          </div>
        </div>
      )}

      {/* Celular: barra fija abajo con el botón de guardar */}
      <div className="fixed bottom-0 inset-x-0 p-4 bg-fondo/90 backdrop-blur border-t border-gray-800 z-30 sm:hidden">
        {botonGuardar}
      </div>

      <ConfirmDialog
        abierto={descartando}
        posicion="abajo-movil"
        tipo="advertencia"
        titulo="¿Descartar la selección?"
        mensaje="Si salís ahora, se pierden los cambios sin guardar."
        textoConfirmar="Descartar"
        textoCancelar="Seguir editando"
        onConfirmar={volverALaFicha}
        onCancelar={() => setDescartando(false)}
      />
    </div>
  )
}