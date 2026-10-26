import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { get, post } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Badge from '../../../../shared/components/Badge'
import Button from '../../../../shared/components/Button'
import Checkbox from '../../../../shared/components/Checkbox'
import ConfirmDialog from '../../../../shared/components/ConfirmDialog'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import FormField from '../../../../shared/components/FormField'
import Input from '../../../../shared/components/Input'
import Spinner from '../../../../shared/components/Spinner'
import { useToast } from '../../../../shared/hooks/useToast'
import WORegistrado from '../components/WORegistrado'
import { partidosDelCuadro, rivalesDe } from '../programacion'
import { textoDeSets } from '../resultado'
import { ETIQUETA_INSTANCIA, fechaPartido, nombrePareja } from '../torneos'
import { ausenteDe, efectoDelWO, ganadorPorWO, MAX_DETALLE, MOTIVOS_WO, motivoSinWO, QUIENES, textoDeWO, tituloDePartido } from '../wo'

const RUTA = '/gestion/torneos'
const TARJETA = 'bg-panel border border-gray-800 rounded-2xl p-5 md:p-8'
const TITULO_SECCION = 'text-xs font-bold uppercase tracking-wide text-texto-suave'

const LADOS = [
  { lado: 'LOCAL', clave: 'local', etiqueta: 'Local' },
  { lado: 'VISITANTE', clave: 'visitante', etiqueta: 'Visitante' },
]

// Lo que hace el sistema al confirmar (panel de la derecha, solo desde lg)
const pasosAlConfirmar = (enZona) => [
  'El partido queda en estado W.O.',
  'El rival se lleva la victoria.',
  enZona ? 'Zona: se computa 6-0 6-0 en la tabla de posiciones.' : 'Eliminatoria: el ganador avanza a la instancia siguiente.',
  'El ganador recibe los puntos de victoria vigentes.',
]

// 5a: el partido ya no admite una baja (ya tiene resultado o una baja registrada). Dice cuál es su estado y cuándo se puede registrar.
function BajaBloqueada({ torneoId, partido, motivo }) {
  const navigate = useNavigate()
  const volver = () => navigate(`${RUTA}/${torneoId}`, { state: { pestana: 'cuadro' } })
  return (
    <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
      <Alert variante="error" titulo="No se puede registrar la baja">{motivo}</Alert>
      <section className={TARJETA} aria-label="Partido">
        <h2 className={`${TITULO_SECCION} mb-4`}>{tituloDePartido(partido)}</h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-2">
          <p className="flex-1 min-w-0 font-semibold break-words">{partido.local && partido.visitante ? rivalesDe(partido) : 'Rivales por definir'}</p>
          {partido.esBye ? <Badge variante="neutro">BYE</Badge> : <EstadoBadge tipo="partido" estado={partido.estado} />}
        </div>
        {partido.estado === 'FINALIZADO' && partido.sets.length > 0 && <p className="text-sm text-texto-suave mt-2 tabular-nums">{textoDeSets(partido.sets)}</p>}
        {partido.estado === 'WO' && <p className="text-sm text-texto-suave mt-2">{textoDeWO(partido)}</p>}
      </section>
      <section className={TARJETA} aria-label="Cuándo se puede registrar">
        <h2 className={`${TITULO_SECCION} mb-4`}>Estados del partido</h2>
        <ul className="flex flex-col gap-3">
          <li className="flex flex-wrap items-center gap-x-3 gap-y-1"><EstadoBadge tipo="partido" estado="PROGRAMADO" /><span>Permite registrar W.O. y cargar resultado</span></li>
          <li className="flex flex-wrap items-center gap-x-3 gap-y-1"><EstadoBadge tipo="partido" estado="FINALIZADO" /><span>Bloqueado: ya tiene resultado</span></li>
          <li className="flex flex-wrap items-center gap-x-3 gap-y-1"><EstadoBadge tipo="partido" estado="WO" /><span>Bloqueado: ya tiene una baja registrada</span></li>
        </ul>
      </section>
      <div className="flex justify-end"><Button variante="neutro" onClick={volver}>Volver al fixture</Button></div>
    </div>
  )
}

function Formulario({ torneo, partido, onResuelto }) {
  const navigate = useNavigate()
  const { mostrarToast } = useToast()
  const volverALaFicha = () => navigate(`${RUTA}/${torneo.id}`, { state: { pestana: 'cuadro' } })
  const enZona = !partido.instancia
  const { quien, ambos, ayuda } = QUIENES[torneo.disciplina]

  const [marcados, setMarcados] = useState({ LOCAL: false, VISITANTE: false })
  const [motivo, setMotivo] = useState('')
  const [detalle, setDetalle] = useState('')
  const [intentado, setIntentado] = useState(false) // tocó «Confirmar W.O.» con algo sin completar: se muestran los errores
  const [enviando, setEnviando] = useState(false)
  const [descartando, setDescartando] = useState(false)
  const [errorApi, setErrorApi] = useState(null)
  const [registrado, setRegistrado] = useState(null) // { respuesta, cuadro } cuando ya se registró
  const cuerpo = useRef(null)

  const ausente = ausenteDe(marcados)
  const ganador = ganadorPorWO(ausente)
  const errores = {
    ausente: ausente ? null : 'Marcá quién causa la baja.',
    motivo: motivo ? null : 'Elegí el motivo de la baja.',
  }
  const hayCambios = Boolean(ausente || motivo || detalle.trim())
  const cancelar = () => (hayCambios ? setDescartando(true) : volverALaFicha())

  const alternar = (lado) => {
    setErrorApi(null)
    setMarcados((m) => ({ ...m, [lado]: !m[lado] }))
  }

  const confirmar = async () => {
    setIntentado(true)
    setErrorApi(null)
    if (errores.ausente || errores.motivo) {
      const primero = errores.ausente ? 'input[name="ausente"]' : 'input[name="motivo"]'
      cuerpo.current?.querySelector(primero)?.focus()
      return
    }
    setEnviando(true)
    try {
      const respuesta = await post(`/partidos/${partido.id}/wo`, { ausente, motivo, ...(detalle.trim() && { detalle: detalle.trim() }) })
      mostrarToast('W.O. registrado correctamente', 'exito')
      // El cuadro cambió: se pide de nuevo para mostrar cómo quedó (si falla, el resumen usa lo que devolvió la API)
      const cuadro = await get(`/torneos/${torneo.id}/cuadro`).catch(() => null)
      setRegistrado({ respuesta, cuadro })
    } catch (e) {
      // 5a: alguien más resolvió el partido mientras tanto: se vuelve a pedir y se muestra por qué ya no se puede
      if (e.status === 409 && /resuelto/.test(e.mensaje)) return onResuelto()
      setErrorApi(e.mensaje)
      setEnviando(false)
    }
  }

  const { programacion } = partido
  const botones = (
    <>
      <Button variante="neutro" onClick={cancelar} disabled={enviando}>Cancelar</Button>
      <Button cargando={enviando} onClick={confirmar}>Confirmar W.O.</Button>
    </>
  )

  if (registrado) {
    return <WORegistrado torneo={torneo} partido={partido} datos={{ ausente, motivo, detalle: detalle.trim() }} respuesta={registrado.respuesta} cuadro={registrado.cuadro} onVolver={volverALaFicha} onProgramar={(partidoId) => navigate(`${RUTA}/${torneo.id}/partidos/${partidoId}/programar`)} />
  }

  return (
    <div className="max-w-6xl mx-auto w-full flex flex-col gap-6 pb-24 sm:pb-0">
      <button type="button" onClick={cancelar} className="text-sm text-texto-suave hover:text-viper transition-colors inline-flex items-center gap-1 w-fit cursor-pointer">
        <span aria-hidden="true">‹</span> Volver a la ficha del torneo
      </button>
      <div>
        <h1 className="font-outfit text-[28px] font-bold">Registrar baja / W.O.</h1>
        <p className="text-texto-suave text-sm mt-1">{torneo.nombre} · {partido.lugar} · {rivalesDe(partido)}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem] gap-6 items-start">
        <section className={TARJETA} aria-label="Baja del partido" ref={cuerpo}>
          <h2 className={`${TITULO_SECCION} mb-4`}>Partido</h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pb-5 border-b border-gray-800">
            <EstadoBadge tipo="partido" estado={partido.estado} />
            <p className="text-sm text-texto-suave">
              {tituloDePartido(partido)}{programacion ? ` · ${programacion.cancha.nombre} · ${fechaPartido(programacion.fecha, programacion.horaInicio)}` : ' · Sin programar'}
            </p>
          </div>

          {errorApi && <div className="mt-5"><Alert variante="error" titulo="No se pudo registrar la baja">{errorApi}</Alert></div>}

          <h2 className={`${TITULO_SECCION} mt-6 mb-4`}>Quién causa la baja</h2>
          <fieldset aria-describedby="ayuda-ausente">
            <legend className="text-[13px] text-texto-suave mb-2">{quien}<span className="text-viper ml-1" aria-hidden="true">*</span></legend>
            <div className="flex flex-col sm:flex-row gap-3">
              {LADOS.map(({ lado, clave, etiqueta }) => (
                <label
                  key={lado}
                  className={`flex-1 min-w-0 flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${marcados[lado] ? 'border-error/60 bg-error/10' : intentado && errores.ausente ? 'border-error bg-fondo' : 'border-gray-800 bg-fondo hover:border-viper'}`}
                >
                  <Checkbox name="ausente" checked={marcados[lado]} onChange={() => alternar(lado)} aria-label={`${etiqueta}: ${nombrePareja(partido[clave])}`} />
                  <span className="min-w-0">
                    <span className="block text-xs font-bold uppercase tracking-wide text-texto-suave">{etiqueta}</span>
                    <span className="block break-words">{nombrePareja(partido[clave])}</span>
                  </span>
                </label>
              ))}
            </div>
            {intentado && errores.ausente ? (
              <p role="alert" className="text-error text-xs mt-2">{errores.ausente}</p>
            ) : (
              <p id="ayuda-ausente" className="text-texto-suave text-xs mt-2">{ayuda}</p>
            )}
          </fieldset>

          <h2 className={`${TITULO_SECCION} mt-8 mb-4`}>Motivo</h2>
          <fieldset>
            <legend className="text-[13px] text-texto-suave mb-2">Motivo<span className="text-viper ml-1" aria-hidden="true">*</span></legend>
            <div className="flex flex-wrap gap-2">
              {MOTIVOS_WO.map((m) => (
                <label
                  key={m.valor}
                  className="rounded-full border px-4 py-2 text-sm cursor-pointer transition-colors border-gray-800 bg-fondo text-texto-suave hover:border-viper has-checked:bg-viper/15 has-checked:border-viper has-checked:text-viper has-focus-visible:ring-2 has-focus-visible:ring-viper/50"
                >
                  <input type="radio" name="motivo" value={m.valor} checked={motivo === m.valor} onChange={() => { setErrorApi(null); setMotivo(m.valor) }} className="sr-only" />
                  {m.texto}
                </label>
              ))}
            </div>
            {intentado && errores.motivo && <p role="alert" className="text-error text-xs mt-2">{errores.motivo}</p>}
          </fieldset>

          <div className="mt-5">
            <FormField label="Detalle del motivo" id="detalle" ayuda={`Opcional · ${detalle.length}/${MAX_DETALLE}`}>
              <Input id="detalle" value={detalle} maxLength={MAX_DETALLE} placeholder="Opcional" autoComplete="off" onChange={(e) => setDetalle(e.target.value)} />
            </FormField>
          </div>

          {ausente && (
            <div className="mt-6">
              {ganador ? (
                <div className="rounded-xl border border-viper/50 bg-viper/10 px-4 py-3" role="status">
                  <p>Ganador por W.O.: <span className="font-semibold">{nombrePareja(partido[ganador.toLowerCase()])}</span></p>
                  <p className="text-sm text-texto-suave mt-1">{efectoDelWO(partido, ausente)}</p>
                </div>
              ) : (
                <Alert variante="advertencia" titulo={`${ambos} causan baja`}>{efectoDelWO(partido, ausente)}</Alert>
              )}
            </div>
          )}

          <div className="hidden sm:flex justify-between gap-3 mt-8">{botones}</div>
        </section>

        <aside className="hidden lg:block bg-panel border border-gray-800 rounded-2xl p-8 h-fit">
          <h2 className={`${TITULO_SECCION} mb-5`}>Al confirmar</h2>
          <ol className="flex flex-col gap-4">
            {pasosAlConfirmar(enZona).map((texto, i) => (
              <li key={texto} className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-viper/15 text-viper text-xs font-bold flex items-center justify-center mt-0.5" aria-hidden="true">{i + 1}</span>
                <span className="text-sm leading-relaxed">{texto}</span>
              </li>
            ))}
          </ol>
          <p className="text-sm text-texto-suave mt-6 pt-5 border-t border-gray-800">
            Si {ambos.toLowerCase()} causan baja, el partido queda en W.O. sin ganador y sin puntos.
          </p>
        </aside>
      </div>

      <div className="fixed bottom-0 inset-x-0 p-4 bg-fondo/90 backdrop-blur border-t border-gray-800 z-30 sm:hidden flex gap-3">
        <Button variante="neutro" className="flex-1" onClick={cancelar} disabled={enviando}>Cancelar</Button>
        <Button className="flex-[2] whitespace-nowrap" cargando={enviando} onClick={confirmar}>Confirmar W.O.</Button>
      </div>

      <ConfirmDialog
        abierto={descartando}
        posicion="abajo-movil"
        tipo="advertencia"
        titulo="¿Descartar el W.O.?"
        mensaje="Se pierden la selección y el motivo ingresados."
        textoConfirmar="Descartar"
        textoCancelar="Seguir editando"
        onConfirmar={volverALaFicha}
        onCancelar={() => setDescartando(false)}
      />
    </div>
  )
}

// «Registrar baja / W.O.» (CU 3.7). Pide el torneo y el cuadro (de ahí sale el partido) y arma el formulario; al confirmar
// muestra el resumen (<WORegistrado>). Un partido que ya no admite la baja muestra el motivo (5a).
export default function RegistrarWO() {
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
    if (!partido) {
      contenido = <Alert variante="error" titulo="No encontramos el partido">El partido no es de este torneo.</Alert>
    } else {
      const motivo = motivoSinWO(partido, actual.torneo)
      if (!motivo) return <Formulario key={partido.id} torneo={actual.torneo} partido={partido} onResuelto={() => setReintento((n) => n + 1)} />
      contenido = <BajaBloqueada torneoId={id} partido={partido} motivo={motivo} />
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