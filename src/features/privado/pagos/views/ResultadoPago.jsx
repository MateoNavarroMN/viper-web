import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import EmptyState from '../../../../shared/components/EmptyState'
import Spinner from '../../../../shared/components/Spinner'
import { useAuth } from '../../auth/useAuth'
import { rutaInicio } from '../../auth/rutaInicio'
import { fechaHoraCorta } from '../../reservas/reservas'
import { precio } from '../../torneos/torneos'
import {
  DESTINO_DEL_ORIGEN, ESTADO_ORIGEN_PAGADO, ETIQUETA_CONCEPTO, MENSAJE_APROBADO, cancelarPago, detalleDelPago, iniciarPagoEnLinea,
} from '../pagos'
import { usePago } from '../usePago'

const REGEX_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const CIRCULO = {
  exito: 'bg-exito/15 text-exito',
  advertencia: 'bg-advertencia/15 text-advertencia',
  error: 'bg-error/15 text-error',
  neutro: 'bg-gray-800 text-texto-suave',
}
const ICONOS = {
  exito: 'M20 6 9 17l-5-5',
  advertencia: 'M12 6v6l4 2',
  error: 'M18 6 6 18M6 6l12 12',
  neutro: 'M5 12h14',
}

function Fila({ titulo, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 border-b border-gray-800 last:border-b-0">
      <dt className="text-sm text-texto-suave shrink-0">{titulo}</dt>
      <dd className="text-sm font-semibold text-right break-words min-w-0">{children}</dd>
    </div>
  )
}

// Tarjeta del resultado: ícono, título y texto
function Encabezado({ tono, titulo, texto }) {
  return (
    <div className="flex flex-col items-center text-center gap-3">
      <span className={`size-14 rounded-full flex items-center justify-center ${CIRCULO[tono]}`}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d={ICONOS[tono]} />
        </svg>
      </span>
      <h1 className="font-outfit text-[26px] font-bold">{titulo}</h1>
      {texto && <p className="text-texto-suave">{texto}</p>}
    </div>
  )
}

// Botones de la pantalla. En el celular quedan fijos abajo, al alcance del pulgar (el espacio de arriba evita que tapen el contenido);
// en pantallas grandes van debajo de la tarjeta.
function Acciones({ children }) {
  return (
    <>
      <div className="h-40 sm:hidden" aria-hidden="true" />
      <div className="fixed inset-x-0 bottom-0 z-30 px-4 py-3 bg-fondo/95 backdrop-blur border-t border-gray-800 sm:static sm:z-auto sm:p-0 sm:bg-transparent sm:backdrop-blur-none sm:border-t-0">
        <div className="flex flex-col sm:flex-row sm:justify-center gap-3 [&>*]:w-full sm:[&>*]:w-auto">{children}</div>
      </div>
    </>
  )
}

// Pantalla a la que vuelve la persona desde Mercado Pago (/portal/pago/resultado?estado=…&ref=<id del pago>).
// El estado sale siempre de la API, no de la dirección: sirve igual si vuelve más tarde, sin conexión o desde otro dispositivo.
export default function ResultadoPago() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const ref = params.get('ref') ?? ''
  const valido = REGEX_ID.test(ref)
  const { cargando, pago, noExiste, error, sinConexion, agotado, actualizar } = usePago(valido ? ref : '')
  const [trabajando, setTrabajando] = useState(false)
  const [problema, setProblema] = useState(null)

  const quien = usuario.rol === 'JUGADOR' ? 'JUGADOR' : 'PERSONAL'
  const inicio = rutaInicio(usuario.rol)

  if (!valido || noExiste) {
    return (
      <div className="max-w-xl mx-auto w-full">
        <EmptyState titulo="No encontramos ese pago" descripcion="Revisá tus reservas, inscripciones y cuotas para ver cómo quedó." accion={<Button onClick={() => navigate(inicio)}>Ir al inicio</Button>} />
      </div>
    )
  }
  // Sin respuesta todavía: ni cargó nunca (primera vez) ni hay un estado anterior que mostrar
  if (cargando) return <div className="py-16 flex justify-center"><Spinner texto="Consultando tu pago" /></div>
  if (!pago) {
    return (
      <div className="max-w-xl mx-auto w-full flex flex-col gap-6">
        <Encabezado tono={sinConexion ? 'advertencia' : 'error'} titulo={sinConexion ? 'Sin conexión' : 'No pudimos consultar el pago'} texto={sinConexion ? 'Tu pago se está procesando. Cuando vuelva la conexión vas a ver el estado actualizado.' : error} />
        <Acciones>
          <Button onClick={actualizar}>Reintentar</Button>
          <Button variante="neutro" onClick={() => navigate(inicio)}>Volver al inicio</Button>
        </Acciones>
      </div>
    )
  }

  const destino = DESTINO_DEL_ORIGEN[quien][pago.concepto]
  const reintentable = quien === 'JUGADOR' && pago.puedeReintentar
  const hintRechazo = params.get('estado') === 'rechazado'

  const reintentar = async () => {
    setTrabajando(true)
    setProblema(null)
    try {
      const { urlPago } = await iniciarPagoEnLinea(pago.concepto, pago.origen.id)
      window.location.assign(urlPago)
    } catch (e) {
      setProblema(e.status === 409 || e.status === 404 ? e.mensaje : 'No pudimos iniciar el pago. Probá de nuevo o pagá en recepción.')
      setTrabajando(false)
    }
  }

  const cancelar = async () => {
    setTrabajando(true)
    setProblema(null)
    try {
      await cancelarPago(pago.transaccionId)
    } catch (e) {
      setProblema(e.mensaje ?? 'No pudimos cancelar el pago')
    }
    actualizar()
    setTrabajando(false)
  }

  const filas = (
    <dl className="bg-panel border border-gray-800 rounded-2xl px-5 py-2">
      <Fila titulo="Concepto">{ETIQUETA_CONCEPTO[pago.concepto]}</Fila>
      <Fila titulo="Detalle">{detalleDelPago(pago.descripcion)}</Fila>
      <Fila titulo={pago.estado === 'PAGADO' ? 'Monto pagado' : 'Monto'}>{precio(pago.monto)}</Fila>
      <Fila titulo="Medio de pago">{pago.medioDePago}</Fila>
      {pago.estado === 'PAGADO' && (
        <>
          {pago.numeroOperacion && <Fila titulo="N.º de operación">{pago.numeroOperacion}</Fila>}
          <Fila titulo="Fecha del pago">{fechaHoraCorta(pago.fecha).replace(', ', ' · ')}</Fila>
          <Fila titulo={`Estado de la ${ETIQUETA_CONCEPTO[pago.concepto].toLowerCase()}`}>{pago.origen.pagado ? ESTADO_ORIGEN_PAGADO[pago.concepto] : 'Pendiente'}</Fila>
        </>
      )}
    </dl>
  )

  const avisos = (
    <>
      {sinConexion && <Alert variante="advertencia" titulo="Sin conexión">No pudimos actualizar el estado. Mostramos lo último que sabemos y lo volvemos a intentar.</Alert>}
      {problema && <Alert variante="error">{problema}</Alert>}
    </>
  )

  // ---- Aprobado
  if (pago.estado === 'PAGADO') {
    return (
      <div className="max-w-xl mx-auto w-full flex flex-col gap-6">
        <Encabezado tono="exito" titulo="Pago aprobado" texto={MENSAJE_APROBADO[quien][pago.concepto]} />
        {pago.requiereDevolucion && (
          <Alert variante="advertencia" titulo="Hay que devolverte el pago">
            El pago se acreditó, pero {pago.concepto === 'RESERVA' ? 'la reserva' : pago.concepto === 'INSCRIPCION' ? 'la inscripción' : 'la cuota'} ya no estaba disponible. El club se va a comunicar para devolver el dinero.
          </Alert>
        )}
        {avisos}
        {filas}
        <Acciones>
          <Link to={destino.ruta} className="font-outfit font-semibold text-center bg-viper hover:bg-viper-hover text-sobre-viper px-6 py-2 rounded-lg transition-colors">{destino.texto}</Link>
          <Button variante="neutro" onClick={() => navigate(inicio)}>Volver al inicio</Button>
        </Acciones>
      </div>
    )
  }

  // ---- Pendiente de acreditación (o la persona volvió sin pagar)
  if (pago.estado === 'PENDIENTE') {
    const volvioSinPagar = hintRechazo
    return (
      <div className="max-w-xl mx-auto w-full flex flex-col gap-6">
        <Encabezado
          tono="advertencia"
          titulo={volvioSinPagar ? 'El pago no se completó' : 'Pago pendiente de acreditación'}
          texto={volvioSinPagar
            ? 'Todavía no figura acreditado. Si no llegaste a pagar, podés cancelarlo y volver a intentar.'
            : 'Te avisamos cuando se acredite. Si pagaste en efectivo en un punto de cobro, puede demorar.'}
        />
        {avisos}
        {filas}
        {!agotado ? (
          <p className="text-sm text-texto-suave text-center inline-flex items-center justify-center gap-2"><Spinner tamano="chico" texto="Actualizando" /> Actualizando el estado cada pocos segundos</p>
        ) : (
          <p className="text-sm text-texto-suave text-center">Dejamos de actualizar solos. Tocá «Actualizar» para volver a consultar.</p>
        )}
        <Acciones>
          <Button onClick={actualizar} disabled={trabajando}>Actualizar</Button>
          <Button variante="peligro-borde" onClick={cancelar} cargando={trabajando}>Cancelar el pago</Button>
          <Button variante="neutro" onClick={() => navigate(destino.ruta)}>{destino.texto}</Button>
        </Acciones>
      </div>
    )
  }

  // ---- Rechazado, cancelado o vencido
  const TITULOS = {
    RECHAZADO: { tono: 'error', titulo: 'Mercado Pago rechazó el pago' },
    CANCELADO: { tono: 'neutro', titulo: 'El pago se canceló' },
    VENCIDO: { tono: 'neutro', titulo: 'El pago venció' },
  }[pago.estado]
  const queSigue = pago.puedeReintentar ? 'Podés intentarlo de nuevo o pagar en recepción.' : 'Revisá cómo quedó desde el listado.'
  return (
    <div className="max-w-xl mx-auto w-full flex flex-col gap-6">
      <Encabezado tono={TITULOS.tono} titulo={TITULOS.titulo} texto={pago.motivo ? `${pago.motivo}. ${queSigue}` : `${pago.mensaje}. ${queSigue}`} />
      {avisos}
      {filas}
      <Acciones>
        {reintentable && <Button onClick={reintentar} cargando={trabajando}>Reintentar el pago</Button>}
        <Button variante={reintentable ? 'neutro' : 'primario'} onClick={() => navigate(destino.ruta)}>
          {reintentable ? 'Pagar en recepción' : destino.texto}
        </Button>
      </Acciones>
    </div>
  )
}