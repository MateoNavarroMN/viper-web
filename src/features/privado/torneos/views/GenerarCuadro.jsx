import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { get, post } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import ConfirmDialog from '../../../../shared/components/ConfirmDialog'
import Spinner from '../../../../shared/components/Spinner'
import { useToast } from '../../../../shared/hooks/useToast'
import QueSeGenera from '../components/QueSeGenera'
import { ETIQUETA_DISCIPLINA, ETIQUETA_FORMATO, fechaCompleta, REGLA_CABEZAS } from '../torneos'

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

// Un requisito de la lista: cumplido (tilde verde), sin cumplir (cruz roja) u opcional sin configurar (guion ámbar)
const ESTILOS = {
  cumplido: { clases: 'bg-viper/15 text-viper', trazo: 'm5 12 5 5L20 7' },
  pendiente: { clases: 'bg-error/15 text-error', trazo: 'M6 6l12 12M18 6 6 18' },
  opcional: { clases: 'bg-advertencia/15 text-advertencia', trazo: 'M6 12h12' },
}

function Requisito({ estado, children }) {
  const { clases, trazo } = ESTILOS[estado]
  return (
    <li className="flex items-center gap-3 text-sm">
      <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${clases}`} aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d={trazo} />
        </svg>
      </span>
      <span>{children}</span>
    </li>
  )
}

// Motivo por el que la API no deja generar el cuadro todavía (`bloqueo` del resumen)
const textoBloqueo = (bloqueo, formato) => {
  if (bloqueo.resultado === 'INSUFICIENTES') {
    return `Hay ${plural(bloqueo.pagadas, 'inscripción pagada', 'inscripciones pagadas')} y ${formato} requiere al menos ${bloqueo.minimoInscriptos}.`
  }
  if (bloqueo.resultado === 'CUADRO_MUY_GRANDE') {
    return `El cuadro de eliminación directa admite hasta ${bloqueo.maximoParticipantes} participantes y hay ${bloqueo.pagadas}.`
  }
  return `Hay ${plural(bloqueo.cabezas, 'cabeza de serie', 'cabezas de serie')} y el máximo es ${bloqueo.maximoPermitido}. Quitá ${bloqueo.cabezas - bloqueo.maximoPermitido} para poder generar.`
}

// Resumen previo y confirmación de la generación del cuadro (CU 3.4 · pasos 1 y 2). Solo Organizador y Administrador.
// Con el torneo en inscripciones cerradas muestra el resumen, los requisitos y lo que queda fuera; «Generar» pide
// confirmación y, al terminar, vuelve a la ficha en la pestaña «Cuadro / Zonas».
export default function GenerarCuadro() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { mostrarToast } = useToast()

  const [reintento, setReintento] = useState(0)
  const [resultado, setResultado] = useState(null) // { clave, torneo, resumen, error }
  const [confirmando, setConfirmando] = useState(false)
  const [generando, setGenerando] = useState(false)
  const [verRequisitos, setVerRequisitos] = useState(false) // solo en el celular; desde lg la lista está siempre a la vista

  const clave = `${id}|${reintento}`
  const actual = resultado?.clave === clave ? resultado : null

  // Se piden la ficha del torneo (categoría, fechas, clasificados) y el resumen previo de la generación
  useEffect(() => {
    let vigente = true
    Promise.allSettled([get(`/torneos/${id}`), get(`/torneos/${id}/generar-cuadro/preview`)]).then(([ficha, resumen]) => {
      if (!vigente) return
      const torneo = ficha.status === 'fulfilled' ? ficha.value.torneo : null
      setResultado(resumen.status === 'fulfilled' ? { clave, torneo, resumen: resumen.value } : { clave, torneo, error: resumen.reason })
    })
    return () => {
      vigente = false
    }
  }, [id, clave])

  const volverALaFicha = useCallback((estado) => navigate(`${RUTA}/${id}`, { state: estado ?? { pestana: 'cuadro' } }), [navigate, id])
  const cerrarConfirmacion = useCallback(() => setConfirmando(false), [])

  const generar = async () => {
    setGenerando(true)
    try {
      const respuesta = await post(`/torneos/${id}/generar-cuadro`)
      const sinProgramar = respuesta.partidosSinProgramar.length
      mostrarToast(sinProgramar > 0 ? respuesta.mensaje : 'Cuadro generado correctamente', sinProgramar > 0 ? 'advertencia' : 'exito')
      volverALaFicha({ pestana: 'cuadro' })
    } catch (e) {
      // Cambió algo desde que se abrió la pantalla (estado, pagos o cabezas): se avisa y se vuelve a pedir el resumen
      mostrarToast(e.mensaje, 'error')
      setConfirmando(false)
      setReintento((n) => n + 1)
    } finally {
      setGenerando(false)
    }
  }

  const encabezado = (
    <Link to={`${RUTA}/${id}`} className="text-sm text-texto-suave hover:text-viper transition-colors inline-flex items-center gap-1 w-fit">
      <span aria-hidden="true">‹</span> Volver a la ficha del torneo
    </Link>
  )

  if (!actual || actual.error) {
    const error = actual?.error
    return (
      <div className="max-w-5xl mx-auto w-full flex flex-col gap-6">
        {encabezado}
        <h1 className="font-outfit text-[28px] font-bold">Generar Cuadro de Competencia</h1>
        {!actual ? (
          <div className="py-16 flex justify-center">
            <Spinner texto="Cargando resumen" />
          </div>
        ) : error.status === 404 ? (
          <Alert variante="error" titulo="No encontramos el torneo">
            <Link to={RUTA} className="underline font-semibold">Volver a la lista</Link>
          </Alert>
        ) : error.status === 409 ? (
          <Alert variante="info" titulo="No se puede generar la competencia">
            {error.datos?.estado === 'EN_CURSO' ? 'Este torneo ya tiene el cuadro generado.' : error.mensaje}
          </Alert>
        ) : (
          <Alert variante="error" titulo="No pudimos cargar el resumen">
            {error.mensaje}{' '}
            <button type="button" onClick={() => setReintento((n) => n + 1)} className="underline font-semibold cursor-pointer">Reintentar</button>
          </Alert>
        )}
      </div>
    )
  }

  const { resumen, torneo } = actual
  const { pagadas, pendientes, cabezasDeSerie, minimoInscriptos, puedeGenerar, bloqueo } = resumen
  const conZonas = resumen.torneo.formato === 'ZONAS_Y_ELIMINACION'
  const formato = ETIQUETA_FORMATO[resumen.torneo.formato]
  const minimoCumplido = pagadas >= minimoInscriptos
  const cumplidos = 1 + (minimoCumplido ? 1 : 0) + (cabezasDeSerie > 0 ? 1 : 0)
  const porcentaje = Math.min(100, (pagadas / minimoInscriptos) * 100)

  const requisitos = (
    <ul className="flex flex-col gap-3">
      <Requisito estado="cumplido">Torneo en Inscripciones cerradas</Requisito>
      <Requisito estado={minimoCumplido ? 'cumplido' : 'pendiente'}>Mínimo de inscripciones pagadas ({pagadas} / {minimoInscriptos})</Requisito>
      <Requisito estado={cabezasDeSerie > 0 ? 'cumplido' : 'opcional'}>
        {cabezasDeSerie > 0 ? 'Cabezas de serie configuradas' : 'Sin cabezas de serie (opcional): los lugares se sortean. '}
        {cabezasDeSerie === 0 && (
          <Link to={`${RUTA}/${id}/cabezas-de-serie`} className="underline font-semibold hover:text-viper">Configurar</Link>
        )}
      </Requisito>
    </ul>
  )

  const botonGenerar = (
    <Button className="w-full sm:w-auto whitespace-nowrap" disabled={!puedeGenerar} onClick={() => setConfirmando(true)}>
      Generar Cuadro de Competencia
    </Button>
  )

  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col gap-6 pb-24 sm:pb-0">
      {encabezado}

      <div>
        <h1 className="font-outfit text-[28px] font-bold">Generar Cuadro de Competencia</h1>
        <p className="text-texto-suave text-sm mt-1">
          {resumen.torneo.nombre} · {ETIQUETA_DISCIPLINA[resumen.torneo.disciplina]} · {formato}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_18rem] gap-6 items-start">
        <div className="flex flex-col gap-6">
          <section className={TARJETA}>
            <h2 className="text-xs font-bold uppercase tracking-wide text-texto-suave mb-4">Resumen previo</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <Dato etiqueta="Formato">{formato}</Dato>
              {torneo && <Dato etiqueta="Categoría técnica">{torneo.categoria}</Dato>}
              <Dato etiqueta="Inscripciones consideradas">{pagadas} con pago confirmado</Dato>
              <Dato etiqueta="Cabezas de serie">
                {cabezasDeSerie > 0 ? `${cabezasDeSerie} (${REGLA_CABEZAS[resumen.torneo.formato]})` : 'Ninguna'}
              </Dato>
              {torneo && <Dato etiqueta="Período de programación">{fechaCompleta(torneo.fechaInicio)} – {fechaCompleta(torneo.fechaFin)}</Dato>}
              {conZonas && torneo && <Dato etiqueta="Clasificados por zona">{torneo.clasificanPorZona}</Dato>}
            </dl>

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

          {bloqueo && (
            <div className="flex flex-col gap-4">
              <Alert variante="advertencia" titulo="No se puede generar la competencia">
                {textoBloqueo(bloqueo, formato)}
                {bloqueo.resultado === 'INSUFICIENTES' && ' Ajustá las inscripciones para continuar.'}
              </Alert>
              {bloqueo.resultado === 'INSUFICIENTES' && (
                <div className="bg-panel border border-gray-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-texto-suave">Inscripciones con pago confirmado</p>
                    <p className="font-outfit text-2xl font-bold tabular-nums text-advertencia">{pagadas} / {minimoInscriptos}</p>
                  </div>
                  <div
                    className="h-2 mt-3 rounded-full bg-gray-800 overflow-hidden"
                    role="progressbar"
                    aria-label="Inscripciones con pago confirmado"
                    aria-valuemin={0}
                    aria-valuemax={minimoInscriptos}
                    aria-valuenow={pagadas}
                  >
                    <div className="h-full rounded-full bg-advertencia" style={{ width: `${porcentaje}%` }} />
                  </div>
                </div>
              )}
              {bloqueo.resultado === 'DEMASIADAS_CABEZAS' && (
                <div className="flex">
                  <Link
                    to={`${RUTA}/${id}/cabezas-de-serie`}
                    className="w-full sm:w-auto font-outfit font-semibold text-center px-6 py-2 rounded-lg bg-panel border border-gray-800 hover:border-viper transition-colors"
                  >
                    Editar cabezas de serie
                  </Link>
                </div>
              )}
            </div>
          )}

          {pendientes > 0 && (
            <Alert variante="advertencia" titulo={`${plural(pendientes, 'inscripción con pago pendiente queda', 'inscripciones con pago pendiente quedan')} fuera del cuadro`}>
              Solo participan las inscripciones activas y con pago confirmado.
            </Alert>
          )}

          {/* Escritorio y tablet: botones al final de la tarjeta; en el celular van en la barra fija de abajo */}
          <div className="hidden sm:flex sm:justify-between gap-3">
            <Button variante="neutro" onClick={() => volverALaFicha()}>{puedeGenerar ? 'Cancelar' : 'Volver a la ficha del torneo'}</Button>
            {botonGenerar}
          </div>
        </div>

        <QueSeGenera formato={resumen.torneo.formato} disciplina={resumen.torneo.disciplina} />
      </div>

      <div className="fixed bottom-0 inset-x-0 p-4 bg-fondo/90 backdrop-blur border-t border-gray-800 z-30 sm:hidden flex flex-col gap-3">
        {botonGenerar}
        {!puedeGenerar && <Button variante="neutro" className="w-full" onClick={() => volverALaFicha()}>Volver a la ficha del torneo</Button>}
      </div>

      <ConfirmDialog
        abierto={confirmando}
        posicion="abajo-movil"
        tipo="advertencia"
        variante="primario"
        titulo="¿Generar el cuadro de competencia?"
        mensaje={
          generando
            ? 'Armando el cuadro y asignando cancha y horario a los partidos. Puede tardar unos segundos.'
            : `Se arma ${conZonas ? 'el sorteo de zonas' : 'el cuadro'} y se programan los partidos. El torneo pasa a En curso y las inscripciones y las cabezas de serie ya no se pueden modificar. Mientras no haya resultados, se puede regenerar.`
        }
        textoConfirmar="Generar cuadro"
        textoCancelar="Volver"
        cargando={generando}
        onConfirmar={generar}
        onCancelar={cerrarConfirmacion}
      />
    </div>
  )
}