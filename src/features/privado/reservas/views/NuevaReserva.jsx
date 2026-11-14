import { useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { post } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import EmptyState from '../../../../shared/components/EmptyState'
import Spinner from '../../../../shared/components/Spinner'
import { esDia, hoy } from '../../calendario/calendario'
import { ETIQUETA_DISCIPLINA, fechaLarga, precio } from '../../torneos/torneos'
import { MEDIOS_PAGO, fechaHoraCorta, finDeTurno, plazoDePago } from '../reservas'
import { useGrilla } from '../useGrilla'

const REGEX_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const FRANJA_OCUPADA = 'Franja ocupada, elegí otro horario'

function Fila({ titulo, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 border-b border-gray-800 last:border-b-0">
      <dt className="text-sm text-texto-suave shrink-0">{titulo}</dt>
      <dd className="text-sm font-semibold text-right break-words min-w-0">{children}</dd>
    </div>
  )
}

// Una opción de pago. Las no disponibles se ven apagadas y dicen «Próximamente».
function OpcionPago({ medio, elegido, onElegir }) {
  const { clave, titulo, detalle, disponible } = medio
  const marcado = elegido === clave
  return (
    <label
      className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${
        disponible ? 'cursor-pointer hover:border-viper' : 'opacity-60 cursor-not-allowed'
      } ${marcado ? 'border-viper bg-viper/10' : 'border-gray-800 bg-fondo'} has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-viper`}
    >
      <input
        type="radio"
        name="medioPago"
        value={clave}
        checked={marcado}
        disabled={!disponible}
        onChange={() => onElegir(clave)}
        className="mt-1 accent-[var(--color-viper)] size-4 shrink-0"
      />
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2 font-semibold">
          {titulo}
          {!disponible && <span className="text-xs font-medium text-texto-suave border border-gray-800 rounded-full px-2 py-0.5">Próximamente</span>}
        </span>
        <span className="block text-sm text-texto-suave mt-0.5">{detalle}</span>
      </span>
    </label>
  )
}

// Solicitud de reserva del Jugador: revisa el turno elegido en la grilla, elige cómo va a pagar y confirma. La reserva queda
// Pendiente hasta que recepción registre el pago o venza el plazo. El turno viaja en la URL
// (?canchaId=…&fecha=AAAA-MM-DD&hora=19:00&deporte=TENIS) para que recargar o compartir el enlace vuelva al mismo turno.
export default function NuevaReserva() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const canchaId = params.get('canchaId') ?? ''
  const hora = params.get('hora') ?? ''
  const deporte = ['TENIS', 'PADEL'].includes(params.get('deporte')) ? params.get('deporte') : ''
  const valido = REGEX_ID.test(canchaId) && esDia(params.get('fecha')) && /^([01]\d|2[0-3]):00$/.test(hora)
  const fecha = valido ? params.get('fecha') : hoy()

  const { cargando, error, datos, reintentar } = useGrilla(fecha, deporte)
  const [medioPago, setMedioPago] = useState('RECEPCION')
  const [enviando, setEnviando] = useState(false)
  const [problema, setProblema] = useState(null) // { mensaje, definitivo }
  const yaEnviado = useRef(false) // frena el doble clic antes de que el botón alcance a deshabilitarse

  const volverALaGrilla = (estado) => {
    const vuelta = new URLSearchParams({ fecha })
    if (deporte) vuelta.set('deporte', deporte)
    navigate(`/portal/reservas?${vuelta}`, estado ? { state: estado } : undefined)
  }

  const cancha = datos?.canchas.find((c) => c.id === canchaId)
  const franja = cancha?.franjas.find((f) => f.horaInicio === hora)

  const confirmar = async () => {
    if (yaEnviado.current) return
    yaEnviado.current = true
    setEnviando(true)
    setProblema(null)
    try {
      const respuesta = await post('/reservas', { canchaId, fecha, horaInicio: hora, medioPago })
      navigate('/portal/reservas?pestana=mis-reservas', {
        replace: true,
        state: { reservaNueva: respuesta.reserva, mensaje: respuesta.mensaje, pagoEnLinea: respuesta.pagoEnLinea },
      })
    } catch (e) {
      yaEnviado.current = false
      setEnviando(false)
      if (e.status === 409 && e.mensaje === FRANJA_OCUPADA) {
        // Alguien se llevó el turno: se vuelve a la grilla (que se pide de nuevo) para elegir otro
        volverALaGrilla({ aviso: 'Ese turno ya no está disponible. Elegí otro horario.' })
        return
      }
      // Fecha pasada o cancha dada de baja: no tiene arreglo en esta pantalla. Un corte de red o un error del servidor se puede reintentar.
      setProblema({ mensaje: e.mensaje ?? 'No se pudo solicitar la reserva', definitivo: e.status === 400 || e.status === 404 || e.status === 409 })
    }
  }

  if (!valido) {
    return <EmptyState titulo="No encontramos ese turno" descripcion="Elegí un turno libre desde la grilla de reservas." accion={<Button onClick={() => navigate('/portal/reservas')}>Ir a la grilla</Button>} />
  }
  if (cargando) return <div className="py-16 flex justify-center"><Spinner texto="Cargando el turno" /></div>
  if (error) {
    return (
      <Alert variante="error" titulo="No pudimos cargar el turno">
        {error}{' '}
        <button type="button" onClick={reintentar} className="underline font-semibold cursor-pointer">Reintentar</button>
      </Alert>
    )
  }
  if (!cancha || !franja) {
    return <EmptyState titulo="No encontramos ese turno" descripcion="La cancha o el horario ya no están disponibles. Elegí otro desde la grilla." accion={<Button onClick={() => volverALaGrilla()}>Volver a la grilla</Button>} />
  }

  const libre = franja.estado === 'LIBRE'
  const hastaInicio = plazoDePago(fecha, hora)
  const bloqueado = !libre || Boolean(problema?.definitivo)
  const aviso = !libre
    ? franja.estado === 'PASADA' ? 'Ese turno ya pasó.' : 'Ese turno ya no está disponible.'
    : problema?.mensaje

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <Link to={`/portal/reservas?${new URLSearchParams(deporte ? { fecha, deporte } : { fecha })}`} className="text-sm text-texto-suave hover:text-viper transition-colors">← Volver a la grilla</Link>
        <h1 className="font-outfit text-[28px] font-bold mt-2">Nueva reserva</h1>
        <p className="text-texto-suave mt-1">Revisá los datos y elegí cómo pagar.</p>
      </div>

      {aviso && (
        <Alert variante={libre && !problema?.definitivo ? 'error' : 'advertencia'} titulo={libre ? 'No se pudo reservar' : undefined}>{aviso}</Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] items-start">
        <section aria-label="Resumen" className="bg-panel border border-gray-800 rounded-2xl p-5 lg:col-start-2 lg:row-start-1">
          <h2 className="font-outfit text-lg font-bold mb-2">Resumen</h2>
          <dl>
            <Fila titulo="Cancha">{cancha.nombre}</Fila>
            <Fila titulo="Fecha">{fechaLarga(fecha)}</Fila>
            <Fila titulo="Horario">{hora} – {finDeTurno(hora)}</Fila>
            <Fila titulo="Duración">1 hora</Fila>
            <Fila titulo="Plazo de pago">{hastaInicio.hastaInicio ? `Hasta el inicio del turno (${fechaHoraCorta(hastaInicio.limite.toISOString())})` : '24 horas'}</Fila>
            <Fila titulo="Total"><span className="text-base text-viper">{precio(cancha.precioHora)}</span></Fila>
          </dl>
        </section>

        <div className="flex flex-col gap-6 lg:col-start-1 lg:row-start-1">
          <section aria-label="Franja elegida" className="bg-panel border border-gray-800 rounded-2xl p-5">
            <h2 className="font-outfit text-lg font-bold mb-2">Franja elegida</h2>
            <dl>
              <Fila titulo="Cancha">{cancha.nombre}</Fila>
              <Fila titulo="Deporte">{ETIQUETA_DISCIPLINA[cancha.deporte]} · {cancha.tipoSuperficie}</Fila>
              <Fila titulo="Fecha">{fechaLarga(fecha)}</Fila>
              <Fila titulo="Horario">{hora} – {finDeTurno(hora)}</Fila>
              <Fila titulo="Precio por hora">{precio(cancha.precioHora)}</Fila>
            </dl>
            <div className="mt-3">
              <Alert variante="info">
                {hastaInicio.hastaInicio
                  ? 'El turno empieza en menos de 24 horas: tenés tiempo de pagar hasta que empiece. Si no, el turno se libera.'
                  : 'Tenés 24 horas para abonar; si no, el turno se libera.'}
              </Alert>
            </div>
          </section>

          <fieldset className="bg-panel border border-gray-800 rounded-2xl p-5">
            <legend className="sr-only">Medio de pago</legend>
            <h2 className="font-outfit text-lg font-bold mb-3" aria-hidden="true">Medio de pago</h2>
            <div className="flex flex-col gap-3">
              {MEDIOS_PAGO.map((medio) => (
                <OpcionPago key={medio.clave} medio={medio} elegido={medioPago} onElegir={setMedioPago} />
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Button variante="neutro" onClick={() => volverALaGrilla()} disabled={enviando} className="w-full sm:w-auto">Cancelar</Button>
            {bloqueado ? (
              <Button onClick={() => volverALaGrilla()} className="w-full sm:w-auto">Elegir otro turno</Button>
            ) : (
              <Button onClick={confirmar} cargando={enviando} className="w-full sm:w-auto">Confirmar reserva</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}