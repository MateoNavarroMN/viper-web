import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { get, post } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import ConfirmDialog from '../../../../shared/components/ConfirmDialog'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Spinner from '../../../../shared/components/Spinner'
import { useToast } from '../../../../shared/hooks/useToast'
import { analizarMarcador, marcadorVacio, SETS } from '../marcador'
import { partidosDelCuadro, rivalesDe } from '../programacion'
import { ETIQUETA_INSTANCIA, fechaPartido, nombreCorto, nombrePareja } from '../torneos'

const RUTA = '/gestion/torneos'
const TARJETA = 'bg-panel border border-gray-800 rounded-2xl p-5 md:p-8'
const TITULO_SECCION = 'text-xs font-bold uppercase tracking-wide text-texto-suave'
const CASILLA = 'w-14 h-14 sm:w-[4.5rem] sm:h-16 rounded-xl border bg-fondo text-center font-outfit text-2xl font-bold tabular-nums focus:outline-none focus:ring-2 disabled:bg-panel disabled:text-gray-600 disabled:cursor-not-allowed placeholder:text-gray-600'

function Marca() {
  return (
    <span className="shrink-0 w-7 h-7 rounded-full bg-viper/15 text-viper flex items-center justify-center" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>
    </span>
  )
}

// Una de las dos partes del partido (local o visitante)
function Rival({ etiqueta, participante }) {
  return (
    <div className="flex-1 min-w-0 rounded-xl border border-gray-800 bg-fondo px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-texto-suave">{etiqueta}</p>
      <p className="mt-1 flex items-center gap-2 break-words">
        <span className="min-w-0">{nombrePareja(participante)}</span>
        {participante.cabezaDeSerie && (
          <svg className="shrink-0 text-violeta" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" role="img" aria-label="Cabeza de serie">
            <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
          </svg>
        )}
      </p>
    </div>
  )
}

// Los pasos que hace el sistema al guardar (panel de la derecha, solo desde lg). En una zona se recalcula la tabla; en la
// eliminatoria, el ganador avanza.
const pasosAlGuardar = (enZona) => [
  'Se define el ganador del partido.',
  enZona ? 'Se recalcula la tabla de posiciones de la zona.' : 'El ganador avanza a la instancia siguiente.',
  'Se otorgan puntos según las reglas vigentes.',
  'Se actualizan el ranking y la categoría técnica.',
]

function Programador({ torneo, partido }) {
  const navigate = useNavigate()
  const { mostrarToast } = useToast()
  const volverALaFicha = () => navigate(`${RUTA}/${torneo.id}`, { state: { pestana: 'cuadro' } })
  const enZona = !partido.instancia

  const [valores, setValores] = useState(marcadorVacio)
  const [intentado, setIntentado] = useState(false) // tocó «Guardar Resultado» con el marcador mal: se muestran todos los errores
  const [guardando, setGuardando] = useState(false)
  const [descartando, setDescartando] = useState(false)
  const [errorApi, setErrorApi] = useState(null) // { mensaje, errores: [{ set, motivo }] } de la API
  const cuerpo = useRef(null)

  const analisis = analizarMarcador(valores)
  const visibles = analisis.errores.filter((e) => intentado || e.enVivo)
  const conError = new Set([...visibles, ...(errorApi?.errores ?? [])].map((e) => e.set).filter(Boolean))

  const cambiar = (set, lado, texto) => {
    const digitos = texto.replace(/\D/g, '').slice(0, 2)
    setErrorApi(null)
    setValores((anteriores) => {
      const nuevos = anteriores.map((s, i) => (i === set ? { ...s, [lado]: digitos } : s))
      // Si el set 3 deja de corresponder (los sets ya no están 1 a 1), se borra
      if (!analizarMarcador(nuevos).tercero) nuevos[2] = { local: '', visitante: '' }
      return nuevos
    })
  }

  const cancelar = () => (analisis.hayDatos ? setDescartando(true) : volverALaFicha())

  const guardar = async () => {
    setIntentado(true)
    setErrorApi(null)
    if (!analisis.valido) {
      const primero = analisis.errores.find((e) => e.set !== null)?.set ?? 1
      cuerpo.current?.querySelector(`[data-set="${primero}"]`)?.focus()
      return
    }
    setGuardando(true)
    try {
      await post(`/partidos/${partido.id}/resultado`, { sets: analisis.sets })
      mostrarToast('Resultado guardado correctamente', 'exito')
      volverALaFicha()
    } catch (e) {
      setErrorApi({ mensaje: e.mensaje, errores: Array.isArray(e.datos?.errores) ? e.datos.errores : [] })
      setGuardando(false)
    }
  }

  const { programacion } = partido
  const nombres = { LOCAL: nombreCorto(partido.local), VISITANTE: nombreCorto(partido.visitante) }
  const botones = (
    <>
      <Button variante="neutro" onClick={cancelar} disabled={guardando}>Cancelar</Button>
      <Button cargando={guardando} onClick={guardar}>Guardar Resultado</Button>
    </>
  )

  return (
    <div className="max-w-6xl mx-auto w-full flex flex-col gap-6 pb-24 sm:pb-0">
      <button type="button" onClick={cancelar} className="text-sm text-texto-suave hover:text-viper transition-colors inline-flex items-center gap-1 w-fit cursor-pointer">
        <span aria-hidden="true">‹</span> Volver a la ficha del torneo
      </button>
      <div>
        <h1 className="font-outfit text-[28px] font-bold">Cargar resultado</h1>
        <p className="text-texto-suave text-sm mt-1">{torneo.nombre} · {partido.lugar} · {rivalesDe(partido)}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem] gap-6 items-start">
        <section className={TARJETA} aria-label="Resultado del partido" ref={cuerpo}>
          <h2 className={`${TITULO_SECCION} mb-4`}>Partido</h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Rival etiqueta="Local" participante={partido.local} />
            <span className="self-center text-sm font-bold text-texto-suave" aria-hidden="true">VS</span>
            <Rival etiqueta="Visitante" participante={partido.visitante} />
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-4 pb-5 border-b border-gray-800">
            <EstadoBadge tipo="partido" estado={partido.estado} />
            <p className="text-sm text-texto-suave">
              {partido.lugar}{programacion ? ` · ${programacion.cancha.nombre} · ${fechaPartido(programacion.fecha, programacion.horaInicio)}` : ''}
            </p>
          </div>

          <h2 className={`${TITULO_SECCION} mt-6 mb-4`}>Marcador (games por set)</h2>
          {(visibles.length > 0 || errorApi) && (
            <div className="mb-5">
              <Alert variante="error" titulo={errorApi ? errorApi.mensaje : 'El marcador no es válido'}>
                {(errorApi ? errorApi.errores : visibles).map((e, i) => (
                  <span key={`${e.set}-${i}`} className="block">{e.set && !e.motivo.startsWith(`El set ${e.set}`) && !e.motivo.startsWith('Falta') ? `Set ${e.set}: ` : ''}{e.motivo}</span>
                ))}
                {errorApi && errorApi.errores.length === 0 && 'Revisá los games e intentá de nuevo.'}
              </Alert>
            </div>
          )}

          <div className="grid grid-cols-[minmax(0,1fr)_repeat(3,auto)_2.5rem] sm:grid-cols-[minmax(0,1fr)_repeat(3,auto)_4rem] items-center gap-x-2 sm:gap-x-4 gap-y-3">
            <span />
            {Array.from({ length: SETS }, (_, i) => (
              <span key={i} className="text-center text-xs font-bold uppercase tracking-wide text-texto-suave">Set {i + 1}</span>
            ))}
            <span className="text-center text-xs font-bold uppercase tracking-wide text-texto-suave">Sets</span>
            {['local', 'visitante'].map((lado) => (
              <FilaMarcador
                key={lado}
                nombre={nombres[lado.toUpperCase()]}
                lado={lado}
                valores={valores}
                tercero={analisis.tercero}
                conError={conError}
                ganados={analisis.setsGanados[lado]}
                gana={analisis.valido && analisis.ganador === lado.toUpperCase()}
                onCambiar={cambiar}
              />
            ))}
          </div>
          <p className="text-sm text-texto-suave mt-4">El Set 3 solo se carga si los sets quedan 1 a 1.</p>

          {analisis.valido && (
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-viper/50 bg-viper/10 px-4 py-3" role="status">
              <Marca />
              <p>Ganador: {nombres[analisis.ganador]} ({analisis.setsGanados[analisis.ganador.toLowerCase()]} – {analisis.setsGanados[analisis.ganador === 'LOCAL' ? 'visitante' : 'local']})</p>
            </div>
          )}

          <div className="hidden sm:flex justify-between gap-3 mt-8">{botones}</div>
        </section>

        <aside className="hidden lg:block bg-panel border border-gray-800 rounded-2xl p-8 h-fit">
          <h2 className={`${TITULO_SECCION} mb-5`}>Al guardar</h2>
          <ol className="flex flex-col gap-4">
            {pasosAlGuardar(enZona).map((texto, i) => (
              <li key={texto} className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-viper/15 text-viper text-xs font-bold flex items-center justify-center mt-0.5" aria-hidden="true">{i + 1}</span>
                <span className="text-sm leading-relaxed">{texto}</span>
              </li>
            ))}
          </ol>
        </aside>
      </div>

      <div className="fixed bottom-0 inset-x-0 p-4 bg-fondo/90 backdrop-blur border-t border-gray-800 z-30 sm:hidden">
        <Button className="w-full" cargando={guardando} onClick={guardar}>Guardar Resultado</Button>
      </div>

      <ConfirmDialog
        abierto={descartando}
        posicion="abajo-movil"
        tipo="advertencia"
        titulo="¿Descartar el resultado?"
        mensaje="Se pierden los games ingresados."
        textoConfirmar="Descartar"
        textoCancelar="Seguir editando"
        onConfirmar={volverALaFicha}
        onCancelar={() => setDescartando(false)}
      />
    </div>
  )
}

// Una fila de la tabla del marcador: el nombre, los tres sets de ese lado y los sets ganados
function FilaMarcador({ nombre, lado, valores, tercero, conError, ganados, gana, onCambiar }) {
  return (
    <>
      <p className={`min-w-0 break-words text-sm sm:text-base ${gana ? 'font-semibold' : ''}`}>{nombre}</p>
      {valores.map((s, i) => {
        const deshabilitada = i === 2 && !tercero
        return (
          <input
            key={i}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            maxLength={2}
            data-set={i + 1}
            aria-label={`${nombre}, set ${i + 1}`}
            aria-invalid={conError.has(i + 1) || undefined}
            disabled={deshabilitada}
            placeholder={deshabilitada ? '–' : undefined}
            value={s[lado]}
            onChange={(e) => onCambiar(i, lado, e.target.value)}
            onFocus={(e) => e.target.select()}
            className={`${CASILLA} ${conError.has(i + 1) ? 'border-error focus:border-error focus:ring-error/30' : 'border-gray-800 focus:border-viper focus:ring-viper/30'}`}
          />
        )
      })}
      <p className={`text-center font-outfit text-2xl font-bold tabular-nums ${gana ? 'text-viper' : 'text-texto-suave'}`}>{ganados}</p>
    </>
  )
}

// «Cargar resultado» (CU 3.6 · pasos 1 a 5). Pide el torneo y el cuadro (de ahí sale el partido) y arma la pantalla de carga.
export default function CargarResultado() {
  const { id, partidoId } = useParams()
  const [reintento, setReintento] = useState(0)
  const [resultado, setResultado] = useState(null) // { clave, torneo, cuadro, error }
  const clave = `${id}|${reintento}`
  const actual = resultado?.clave === clave ? resultado : null

  useEffect(() => {
    let vigente = true
    Promise.allSettled([get(`/torneos/${id}`), get(`/torneos/${id}/cuadro`)]).then(([ficha, cuadro]) => {
      if (!vigente) return
      if (ficha.status === 'rejected') return setResultado({ clave, error: ficha.reason })
      if (cuadro.status === 'rejected') return setResultado({ clave, error: cuadro.reason })
      setResultado({ clave, torneo: ficha.value.torneo, cuadro: cuadro.value })
    })
    return () => {
      vigente = false
    }
  }, [id, clave])

  let contenido
  if (!actual) {
    contenido = <div className="py-16 flex justify-center"><Spinner texto="Cargando partido" /></div>
  } else if (actual.error) {
    contenido = (
      <Alert variante="error" titulo="No pudimos cargar el partido">
        {actual.error.mensaje}{' '}
        {actual.error.status !== 404 && <button type="button" onClick={() => setReintento((n) => n + 1)} className="underline font-semibold cursor-pointer">Reintentar</button>}
      </Alert>
    )
  } else {
    const partido = partidosDelCuadro(actual.cuadro, ETIQUETA_INSTANCIA).find((p) => p.id === partidoId)
    const admite = partido && !partido.esBye && partido.local && partido.visitante && partido.estado === 'PROGRAMADO'
    if (!partido) {
      contenido = <Alert variante="error" titulo="No encontramos el partido">El partido no es de este torneo.</Alert>
    } else if (actual.torneo.estado !== 'EN_CURSO' || !admite) {
      contenido = <Alert variante="info" titulo="Este partido no admite carga de resultado">Solo se carga el resultado de partidos programados, con los dos rivales, de un torneo en curso.</Alert>
    } else {
      return <Programador key={partido.id} torneo={actual.torneo} partido={partido} />
    }
  }

  return (
    <div className="max-w-6xl mx-auto w-full flex flex-col gap-6">
      <Link to={`${RUTA}/${id}`} state={{ pestana: 'cuadro' }} className="text-sm text-texto-suave hover:text-viper transition-colors inline-flex items-center gap-1 w-fit">
        <span aria-hidden="true">‹</span> Volver a la ficha del torneo
      </Link>
      {contenido}
    </div>
  )
}