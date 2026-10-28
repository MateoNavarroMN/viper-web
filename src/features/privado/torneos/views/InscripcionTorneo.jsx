import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { get, post } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Spinner from '../../../../shared/components/Spinner'
import { useToast } from '../../../../shared/hooks/useToast'
import BuscarCompanero from '../components/BuscarCompanero'
import { ETIQUETA_DISCIPLINA, fechaHora, precio, rangoFechas } from '../torneos'

const RUTA = '/portal/torneos'
const RUTA_MIS_INSCRIPCIONES = `${RUTA}?vista=mias`

const TARJETA = 'bg-panel border border-gray-800 rounded-2xl p-5 md:p-8'
const TITULO_SECCION = 'text-xs font-bold uppercase tracking-wide text-texto-suave'

// Título del Alert según el error de la API
const tituloDelError = (mensaje) => {
  if (mensaje.startsWith('Cupo')) return 'Cupo completo'
  if (mensaje.includes('inscripto')) return 'Ya hay una inscripción activa'
  if (mensaje.startsWith('Categoría')) return 'Categoría incompatible'
  return 'No pudimos inscribirte'
}

// Un renglón de «Verificación de requisitos». estado: 'ok' | 'error' | 'pendiente'
function Requisito({ estado, children }) {
  const estilos = {
    ok: ['text-viper', 'M20 6 9 17l-5-5'],
    error: ['text-error', 'M18 6 6 18M6 6l12 12'],
    pendiente: ['text-texto-suave', 'M12 6v6l4 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z'],
  }[estado]
  return (
    <li className="flex items-start gap-3 text-sm">
      <svg className={`shrink-0 mt-0.5 ${estilos[0]}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={estilos[1]} />
      </svg>
      <span>
        {children}
        <span className="sr-only">{estado === 'ok' ? ' (cumplido)' : estado === 'error' ? ' (no se cumple)' : ' (se verifica al confirmar)'}</span>
      </span>
    </li>
  )
}

// Opción de medio de pago (tarjeta seleccionable)
function MedioDePago({ valor, titulo, texto, seleccionado, deshabilitado = false, onElegir, etiqueta }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={seleccionado}
      disabled={deshabilitado}
      onClick={() => onElegir(valor)}
      className={`text-left rounded-xl border p-4 transition-colors ${
        seleccionado ? 'border-viper bg-viper/10' : 'border-gray-800 bg-fondo'
      } ${deshabilitado ? 'opacity-50 cursor-not-allowed' : seleccionado ? 'cursor-pointer' : 'cursor-pointer hover:border-viper'}`}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="font-outfit font-semibold">{titulo}</span>
        {etiqueta && <span className="text-xs text-texto-suave border border-gray-700 rounded-full px-2 py-0.5">{etiqueta}</span>}
      </span>
      <span className="block text-sm text-texto-suave mt-1">{texto}</span>
    </button>
  )
}

function Fila({ etiqueta, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <dt className="text-texto-suave">{etiqueta}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  )
}

// Formulario de inscripción (/portal/torneos/:id/inscripcion).
// Pádel pide compañero por DNI; Tenis es individual. El pago en línea queda deshabilitado hasta CU 5.4.
export default function InscripcionTorneo() {
  const { id } = useParams()
  const navegar = useNavigate()
  const { mostrarToast } = useToast()

  // Carga del torneo (patrón clave/resultado)
  const [reintento, setReintento] = useState(0)
  const [resultado, setResultado] = useState(null) // { clave, id, torneo, error, status }
  const clave = `${id}|${reintento}`
  const torneo = resultado?.id === id ? (resultado.torneo ?? null) : null
  const errorCarga = resultado?.clave === clave ? resultado.error : null

  useEffect(() => {
    let vigente = true
    get(`/torneos/${id}`)
      .then((r) => vigente && setResultado({ clave, id, torneo: r.torneo }))
      .catch((e) => vigente && setResultado((anterior) => ({
        clave, id, error: e.mensaje, status: e.status,
        torneo: e.status !== 404 && anterior?.id === id ? anterior.torneo : null,
      })))
    return () => {
      vigente = false
    }
  }, [id, clave])

  const recargar = useCallback(() => setReintento((n) => n + 1), [])

  const [companero, setCompanero] = useState(null)
  const [medioPago, setMedioPago] = useState('RECEPCION')
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState(null) // mensaje de la API
  const [inscripcion, setInscripcion] = useState(null) // resultado del paso 8

  const volver = (
    <Link to={`${RUTA}/${id}`} className="text-sm text-texto-suave hover:text-viper transition-colors inline-flex items-center gap-1 w-fit">
      <span aria-hidden="true">‹</span> Volver al torneo
    </Link>
  )

  if (!torneo) {
    const noExiste = resultado?.status === 404
    return (
      <div className="max-w-5xl mx-auto w-full flex flex-col gap-6">
        {volver}
        {errorCarga ? (
          <Alert variante="error" titulo={noExiste ? 'No encontramos el torneo' : 'No pudimos cargar el torneo'}>
            {noExiste ? (
              <Link to={RUTA} className="underline font-semibold">Volver a los torneos</Link>
            ) : (
              <>
                {errorCarga}{' '}
                <button type="button" onClick={recargar} className="underline font-semibold cursor-pointer">Reintentar</button>
              </>
            )}
          </Alert>
        ) : (
          <div className="py-16 flex justify-center">
            <Spinner texto="Cargando torneo" />
          </div>
        )}
      </div>
    )
  }

  const esPadel = torneo.disciplina === 'PADEL'
  const abierto = torneo.estado === 'INSCRIPCIONES_ABIERTAS'
  const hayCupo = torneo.cupoDisponible > 0
  const yaInscripto = Boolean(torneo.miInscripcion)
  const categoriaCompanero = companero?.categorias?.[torneo.disciplina]
  // Categorías que admite el torneo: la suya y, en Pádel, la anterior y la siguiente (la API las manda en `categoriasAdmitidas`)
  const admitidas = torneo.categoriasAdmitidas ?? [{ id: torneo.categoriaId, nombre: torneo.categoria }]
  const textoAdmitidas = admitidas.length > 1 ? `las categorías ${admitidas.slice(0, -1).map((c) => c.nombre).join(', ')} y ${admitidas.at(-1).nombre}` : `la categoría ${admitidas[0].nombre}`
  const categoriaDistinta = Boolean(categoriaCompanero) && !admitidas.some((c) => c.id === categoriaCompanero.id)
  const completo = abierto && !yaInscripto && !hayCupo
  const puedeConfirmar = abierto && !yaInscripto && hayCupo && (!esPadel || Boolean(companero)) && !categoriaDistinta

  const confirmar = async () => {
    setErrorEnvio(null)
    setEnviando(true)
    try {
      const respuesta = await post(`/torneos/${id}/inscripciones`, {
        medioPago,
        ...(esPadel ? { companeroJugadorId: companero.id } : {}),
      })
      setInscripcion(respuesta.inscripcion)
      mostrarToast('Inscripción registrada', 'exito')
    } catch (e) {
      setErrorEnvio(e.mensaje)
      // Si el torneo cambió (se llenó, ya figura inscripto...) se vuelve a pedir para que la pantalla lo refleje
      if (e.status === 409) recargar()
    } finally {
      setEnviando(false)
    }
  }

  // Resultado
  if (inscripcion) {
    const pendiente = inscripcion.estadoPago === 'PENDIENTE'
    return (
      <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
        <div className={`${TARJETA} flex flex-col gap-5`}>
          <Alert variante="exito" titulo="Inscripción registrada">
            {pendiente && inscripcion.venceEn
              ? `Tu cupo queda reservado hasta el ${fechaHora(inscripcion.venceEn)}; pagá en recepción.`
              : 'Ya quedaste inscripto en el torneo.'}
          </Alert>
          <dl className="flex flex-col gap-3 border-t border-gray-800 pt-5">
            <Fila etiqueta="Torneo">{torneo.nombre}</Fila>
            {esPadel && inscripcion.companeroNombre && (
              <Fila etiqueta="Compañero">{inscripcion.companeroNombre} {inscripcion.companeroApellido}</Fila>
            )}
            <Fila etiqueta="Estado del pago"><EstadoBadge tipo="pago" estado={inscripcion.estadoPago} /></Fila>
            {pendiente && inscripcion.venceEn && <Fila etiqueta="Vence">{fechaHora(inscripcion.venceEn)}</Fila>}
          </dl>
          {pendiente && (
            <p className="text-sm text-texto-suave">Si vence sin pago, la inscripción se anula y se libera el cupo.</p>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to={RUTA_MIS_INSCRIPCIONES} className="font-outfit font-bold text-center bg-viper hover:bg-viper-hover text-black px-8 py-3 rounded-xl transition-colors">
              Ver mis inscripciones
            </Link>
            <Link to={`${RUTA}/${id}`} className="font-outfit font-semibold text-center bg-panel border border-gray-800 hover:border-viper px-8 py-3 rounded-xl transition-colors">
              Volver al torneo
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col gap-6">
      {volver}

      <div>
        <h1 className="font-outfit text-[28px] font-bold">Inscripción</h1>
        <p className="text-texto-suave text-sm mt-1">
          {torneo.nombre} · {ETIQUETA_DISCIPLINA[torneo.disciplina]} · Categoría {torneo.categoria}
        </p>
      </div>

      {errorCarga && (
        <Alert variante="error">
          {errorCarga}{' '}
          <button type="button" onClick={recargar} className="underline font-semibold cursor-pointer">Reintentar</button>
        </Alert>
      )}
      {!abierto && <Alert variante="advertencia" titulo="Inscripciones cerradas">Las inscripciones de este torneo no están abiertas.</Alert>}
      {abierto && yaInscripto && (
        <Alert variante="advertencia" titulo="Ya hay una inscripción activa">
          Vos o tu compañero ya están inscriptos en este torneo.
        </Alert>
      )}
      {completo && <Alert variante="error" titulo="Cupo completo">Ya no quedan lugares disponibles en este torneo.</Alert>}
      {errorEnvio && (
        <Alert variante="error" titulo={tituloDelError(errorEnvio)}>{errorEnvio}</Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_22rem] gap-6 items-start">
        <form
          className={`${TARJETA} flex flex-col gap-6 lg:order-1 order-2`}
          onSubmit={(e) => {
            e.preventDefault()
            if (puedeConfirmar && !enviando) confirmar()
          }}
        >
          {esPadel && (
            <section className="flex flex-col gap-4">
              <h2 className={TITULO_SECCION}>Compañero</h2>
              <BuscarCompanero disciplina={torneo.disciplina} valor={companero} onElegir={setCompanero} disabled={enviando} />
              {!companero && <p className="text-sm text-texto-suave -mt-2">En Pádel te inscribís junto a un compañero. Tiene que tener cuenta en Viper.</p>}
            </section>
          )}

          <section className="flex flex-col gap-4">
            <h2 className={TITULO_SECCION}>Verificación de requisitos</h2>
            <ul className="bg-fondo border border-gray-800 rounded-xl p-4 flex flex-col gap-3">
              <Requisito estado={hayCupo ? 'ok' : 'error'}>
                {hayCupo ? 'Hay cupo disponible' : 'Cupo completo'} ({torneo.inscriptos} / {torneo.cupoMaximo})
              </Requisito>
              <Requisito estado={yaInscripto ? 'error' : 'ok'}>
                {yaInscripto
                  ? 'Inscripción activa existente'
                  : esPadel ? 'Sin inscripción activa previa (la de tu compañero se revisa al confirmar)' : 'Sin inscripción activa previa'}
              </Requisito>
              <Requisito estado={categoriaDistinta ? 'error' : 'pendiente'}>
                {categoriaDistinta
                  ? `Tu compañero es de categoría ${categoriaCompanero.nombre}; el torneo admite ${textoAdmitidas}`
                  : `El torneo admite ${textoAdmitidas}: se verifica al confirmar`}
              </Requisito>
            </ul>
          </section>

          <section className="flex flex-col gap-4">
            <h2 id="medio-pago" className={TITULO_SECCION}>Medio de pago <span className="text-viper">*</span></h2>
            <div role="radiogroup" aria-labelledby="medio-pago" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MedioDePago
                valor="EN_LINEA"
                titulo="Pagar en línea"
                texto="Con Mercado Pago. Queda pagada al aprobarse el cobro."
                etiqueta="Próximamente"
                seleccionado={false}
                deshabilitado
                onElegir={setMedioPago}
              />
              <MedioDePago
                valor="RECEPCION"
                titulo="Pagar en recepción"
                texto="El cupo queda reservado hasta el vencimiento. Pagás en el club."
                seleccionado={medioPago === 'RECEPCION'}
                onElegir={setMedioPago}
              />
            </div>
          </section>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2 border-t border-gray-800 sm:pt-6">
            <Button variante="neutro" className="w-full sm:w-auto" disabled={enviando} onClick={() => navegar(`${RUTA}/${id}`)}>
              Cancelar
            </Button>
            <Button type="submit" className="w-full sm:w-auto" cargando={enviando} disabled={!puedeConfirmar}>
              Confirmar inscripción
            </Button>
          </div>
        </form>

        <aside className={`${TARJETA} flex flex-col gap-4 lg:order-2 order-1`} aria-label="Resumen">
          <h2 className={TITULO_SECCION}>Resumen</h2>
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-outfit text-xl font-bold">{torneo.nombre}</p>
            <EstadoBadge tipo="torneo" estado={torneo.estado} />
          </div>
          <dl className="flex flex-col gap-3 border-t border-gray-800 pt-4">
            <Fila etiqueta="Categoría">{torneo.categoria}</Fila>
            <Fila etiqueta="Fechas">{rangoFechas(torneo.fechaInicio, torneo.fechaFin)}</Fila>
            {esPadel && <Fila etiqueta="Compañero">{companero ? `${companero.nombre} ${companero.apellido}` : <span className="text-texto-suave">Sin elegir</span>}</Fila>}
            <Fila etiqueta="Cupo">{hayCupo ? `Quedan ${torneo.cupoDisponible} ${torneo.cupoDisponible === 1 ? 'lugar' : 'lugares'}` : 'Completo'}</Fila>
          </dl>
          <div className="flex items-baseline justify-between border-t border-gray-800 pt-4">
            <span className="text-texto-suave">Total</span>
            <span className="font-outfit text-2xl font-bold">{precio(torneo.precioInscripcion)}</span>
          </div>
        </aside>
      </div>
    </div>
  )
}