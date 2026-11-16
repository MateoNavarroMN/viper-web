import { useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { post } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import BuscarJugador from '../../../../shared/components/BuscarJugador'
import Button from '../../../../shared/components/Button'
import ConfirmDialog from '../../../../shared/components/ConfirmDialog'
import EmptyState from '../../../../shared/components/EmptyState'
import FormField from '../../../../shared/components/FormField'
import Select from '../../../../shared/components/Select'
import Spinner from '../../../../shared/components/Spinner'
import { esDia, hoy } from '../../calendario/calendario'
import { ETIQUETA_DISCIPLINA, fechaLarga, precio } from '../../torneos/torneos'
import {
  FORMAS_DE_COBRO,
  HORARIOS_CLUB,
  METODOS_DE_COBRO,
  TEXTO_METODO_PAGO,
  duracionEntre,
  fechaHoraCorta,
  plazoDePago,
  precioDelTurno,
  textoDuracion,
  turnoYaEmpezo,
} from '../reservas'
import { useGrilla } from '../useGrilla'

const REGEX_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const FRANJA_OCUPADA = 'Franja ocupada, elegí otro horario'
const SIN_CUENTA = 'El cliente debe tener una cuenta para reservar'
const AYUDA_SIN_CUENTA = 'Pedile que se registre primero en el sitio (con su correo y DNI) y volvé a buscarlo.'

const INICIOS = HORARIOS_CLUB.slice(0, -1).map((h) => ({ valor: h, texto: h }))
const finesDesde = (inicio) => HORARIOS_CLUB.filter((h) => h > inicio).map((h) => ({ valor: h, texto: h }))

function Fila({ titulo, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 border-b border-gray-800 last:border-b-0">
      <dt className="text-sm text-texto-suave shrink-0">{titulo}</dt>
      <dd className="text-sm font-semibold text-right break-words min-w-0">{children}</dd>
    </div>
  )
}

// Una forma de cobro (Cobrar ahora / Queda pendiente)
function OpcionCobro({ forma, elegida, onElegir, disabled }) {
  const marcada = elegida === forma.clave
  return (
    <label
      className={`flex items-start gap-3 rounded-xl border p-4 transition-colors cursor-pointer hover:border-viper ${
        marcada ? 'border-viper bg-viper/10' : 'border-gray-800 bg-fondo'
      } has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-viper`}
    >
      <input
        type="radio"
        name="formaCobro"
        value={forma.clave}
        checked={marcada}
        disabled={disabled}
        onChange={() => onElegir(forma.clave)}
        className="mt-1 accent-[var(--color-viper)] size-4 shrink-0"
      />
      <span className="min-w-0">
        <span className="block font-semibold">{forma.titulo}</span>
        <span className="block text-sm text-texto-suave mt-0.5">{forma.detalle}</span>
      </span>
    </label>
  )
}

// CU 2.3 · turno directo. Recepción y Administrador cargan un turno libre de la grilla para un cliente con cuenta, con el horario que
// pidió (cada 30 minutos) y cobrándolo ahora o dejándolo pendiente 24 horas. El turno viaja en la URL
// (?canchaId=…&fecha=AAAA-MM-DD&hora=19:00&deporte=TENIS) para que recargar o compartir el enlace vuelva al mismo turno.
export default function NuevoTurnoDirecto() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const canchaId = params.get('canchaId') ?? ''
  const horaUrl = params.get('hora') ?? ''
  const deporte = ['TENIS', 'PADEL'].includes(params.get('deporte')) ? params.get('deporte') : ''
  const valido = REGEX_ID.test(canchaId) && esDia(params.get('fecha')) && HORARIOS_CLUB.slice(0, -1).includes(horaUrl)
  const fecha = valido ? params.get('fecha') : hoy()

  const { cargando, error, datos, reintentar, refrescar } = useGrilla(fecha, deporte)
  const [cliente, setCliente] = useState(null)
  const [horaInicio, setHoraInicio] = useState(horaUrl)
  const [horaFin, setHoraFin] = useState(() => HORARIOS_CLUB[HORARIOS_CLUB.indexOf(horaUrl) + 2] ?? '23:00')
  const [formaCobro, setFormaCobro] = useState('PENDIENTE')
  const [metodoPago, setMetodoPago] = useState('EFECTIVO')
  const [errores, setErrores] = useState({})
  const [problema, setProblema] = useState(null) // { mensaje, ocupada }
  const [enviando, setEnviando] = useState(false)
  const [pideDescartar, setPideDescartar] = useState(false) // 5a
  const yaEnviado = useRef(false) // frena el doble clic antes de que el botón alcance a deshabilitarse

  const vuelta = new URLSearchParams(deporte ? { fecha, deporte } : { fecha })
  const rutaGrilla = `/gestion/reservas?${vuelta}`
  const hayCambios = Boolean(cliente) || formaCobro !== 'PENDIENTE' || horaInicio !== horaUrl

  const cancha = datos?.canchas.find((c) => c.id === canchaId)
  const franja = cancha?.franjas.find((f) => f.horaInicio === horaUrl)

  const cambiarInicio = (nuevo) => {
    setHoraInicio(nuevo)
    // Si el fin quedó antes (o igual) que el nuevo inicio, se acomoda a una hora después
    if (horaFin <= nuevo) setHoraFin(HORARIOS_CLUB[HORARIOS_CLUB.indexOf(nuevo) + 2] ?? '23:00')
    setErrores((previo) => ({ ...previo, horaInicio: undefined, horaFin: undefined }))
    setProblema(null)
  }

  const guardar = async () => {
    if (yaEnviado.current) return
    // 6a · lo que se puede revisar sin ir al servidor; los datos ingresados se conservan
    const nuevos = {}
    if (!cliente) nuevos.cliente = 'Elegí el cliente del turno'
    if (horaFin <= horaInicio) nuevos.horaFin = 'La hora de fin tiene que ser posterior a la de inicio'
    else if (turnoYaEmpezo(fecha, horaInicio)) nuevos.horaInicio = 'La fecha y la hora ya pasaron'
    setErrores(nuevos)
    setProblema(null)
    if (Object.keys(nuevos).length > 0) return

    yaEnviado.current = true
    setEnviando(true)
    try {
      const cobro = formaCobro === 'AHORA' ? { registrar: true, metodoPago } : { registrar: false }
      const respuesta = await post('/reservas/directa', { clienteJugadorId: cliente.id, canchaId, fecha, horaInicio, horaFin, cobro })
      navigate(rutaGrilla, { replace: true, state: { reservaNueva: respuesta.reserva, mensaje: respuesta.mensaje } })
    } catch (e) {
      yaEnviado.current = false
      setEnviando(false)
      if (e.status === 409 && e.mensaje === FRANJA_OCUPADA) {
        // 6b · alguien tomó la franja: se avisa, se vuelve a pedir la grilla y lo ingresado se conserva para elegir otro horario
        setProblema({ mensaje: FRANJA_OCUPADA, ocupada: true })
        refrescar()
      } else if (e.status === 404 && e.campo === 'clienteJugadorId') {
        // 3a · el cliente no tiene cuenta: se vuelve a buscar
        setCliente(null)
        setErrores({ cliente: `${SIN_CUENTA}. ${AYUDA_SIN_CUENTA}` })
      } else if (e.status === 400 && e.mensaje?.includes('ya pasaron')) {
        setErrores({ horaInicio: e.mensaje })
      } else if (e.status === 400 && ['horaInicio', 'horaFin', 'metodoPago'].includes(e.campo)) {
        setErrores({ [e.campo]: e.mensaje })
      } else if (e.status === 400 && e.campo === 'clienteJugadorId') {
        setErrores({ cliente: e.mensaje })
      } else {
        setProblema({ mensaje: e.mensaje ?? 'No se pudo registrar el turno' })
      }
    }
  }

  if (!valido) {
    return <EmptyState titulo="No encontramos ese turno" descripcion="Elegí un turno libre desde la grilla de reservas." accion={<Button onClick={() => navigate('/gestion/reservas')}>Ir a la grilla</Button>} />
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
    return <EmptyState titulo="No encontramos ese turno" descripcion="La cancha o el horario ya no están disponibles. Elegí otro desde la grilla." accion={<Button onClick={() => navigate(rutaGrilla)}>Volver a la grilla</Button>} />
  }

  const libre = franja.estado === 'LIBRE'
  const duracion = duracionEntre(horaInicio, horaFin)
  const total = duracion > 0 ? precio(precioDelTurno(cancha.precioHora, horaInicio, horaFin)) : '—'
  const plazo = plazoDePago(fecha, horaInicio)
  const aviso = !libre ? (franja.estado === 'PASADA' ? 'Ese turno ya pasó.' : 'Ese turno ya no está disponible.') : null

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <Link to={rutaGrilla} className="text-sm text-texto-suave hover:text-viper transition-colors">← Volver a la grilla</Link>
        <h1 className="font-outfit text-[28px] font-bold mt-2">Turno directo</h1>
        <p className="text-texto-suave mt-1">Cargá un turno para un cliente que ya tiene cuenta.</p>
      </div>

      {aviso && <Alert variante="advertencia">{aviso}</Alert>}
      {problema && (
        <Alert variante="error" titulo={problema.ocupada ? 'La franja ya está ocupada' : 'No se pudo registrar el turno'}>
          {problema.mensaje}
          {problema.ocupada && (
            <>
              {' '}Cambiá el horario o{' '}
              <Link to={rutaGrilla} className="underline font-semibold">volvé a la grilla</Link>.
            </>
          )}
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] items-start">
        <section aria-label="Resumen" className="bg-panel border border-gray-800 rounded-2xl p-5 lg:col-start-2 lg:row-start-1">
          <h2 className="font-outfit text-lg font-bold mb-2">Resumen</h2>
          <dl>
            <Fila titulo="Cliente">{cliente ? `${cliente.nombre} ${cliente.apellido}` : '—'}</Fila>
            <Fila titulo="Cancha">{cancha.nombre}</Fila>
            <Fila titulo="Fecha">{fechaLarga(fecha)}</Fila>
            <Fila titulo="Horario">{horaInicio} – {horaFin}</Fila>
            <Fila titulo="Duración">{duracion > 0 ? textoDuracion(duracion) : '—'}</Fila>
            <Fila titulo="Cobro">
              {formaCobro === 'AHORA' ? `Cobrado · ${TEXTO_METODO_PAGO[metodoPago]}` : (
                <>Pendiente<span className="block text-xs font-normal text-texto-suave">{plazo.hastaInicio ? `Vence al empezar el turno (${fechaHoraCorta(plazo.limite.toISOString())})` : 'Vence en 24 horas'}</span></>
              )}
            </Fila>
            <Fila titulo="Total"><span className="text-base text-viper">{total}</span></Fila>
          </dl>
        </section>

        <div className="flex flex-col gap-6 lg:col-start-1 lg:row-start-1">
          <section aria-label="Franja" className="bg-panel border border-gray-800 rounded-2xl p-5">
            <h2 className="font-outfit text-lg font-bold mb-2">Franja</h2>
            <dl>
              <Fila titulo="Cancha">{cancha.nombre}</Fila>
              <Fila titulo="Deporte">{ETIQUETA_DISCIPLINA[cancha.deporte]} · {cancha.tipoSuperficie}</Fila>
              <Fila titulo="Fecha">{fechaLarga(fecha)}</Fila>
              <Fila titulo="Precio por hora">{precio(cancha.precioHora)}</Fila>
            </dl>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <FormField label="Desde" id="hora-inicio" error={errores.horaInicio} requerido>
                <Select id="hora-inicio" opciones={INICIOS} value={horaInicio} error={Boolean(errores.horaInicio)} disabled={enviando || !libre} onChange={(e) => cambiarInicio(e.target.value)} />
              </FormField>
              <FormField label="Hasta" id="hora-fin" error={errores.horaFin} requerido>
                <Select
                  id="hora-fin"
                  opciones={finesDesde(horaInicio)}
                  value={horaFin}
                  error={Boolean(errores.horaFin)}
                  disabled={enviando || !libre}
                  onChange={(e) => { setHoraFin(e.target.value); setErrores((previo) => ({ ...previo, horaFin: undefined })); setProblema(null) }}
                />
              </FormField>
            </div>
            <p className="text-xs text-texto-suave mt-2">Podés elegir cualquier horario del día, cada 30 minutos (de 08:00 a 23:00).</p>
          </section>

          <section aria-label="Cliente" className="bg-panel border border-gray-800 rounded-2xl p-5">
            <h2 className="font-outfit text-lg font-bold mb-3">Cliente</h2>
            <BuscarJugador
              etiqueta="Buscar cliente"
              valor={cliente}
              onElegir={(jugador) => { setCliente(jugador); setErrores((previo) => ({ ...previo, cliente: undefined })) }}
              error={errores.cliente}
              disabled={enviando || !libre}
              sinResultados={{ titulo: SIN_CUENTA, detalle: AYUDA_SIN_CUENTA }}
            />
          </section>

          <fieldset className="bg-panel border border-gray-800 rounded-2xl p-5">
            <legend className="sr-only">Cobro</legend>
            <h2 className="font-outfit text-lg font-bold mb-3" aria-hidden="true">Cobro</h2>
            <div className="flex flex-col gap-3">
              {FORMAS_DE_COBRO.map((forma) => (
                <OpcionCobro key={forma.clave} forma={forma} elegida={formaCobro} onElegir={setFormaCobro} disabled={enviando || !libre} />
              ))}
            </div>
            {formaCobro === 'AHORA' && (
              <div className="mt-4 max-w-xs">
                <FormField label="Medio de pago" id="medio-pago" error={errores.metodoPago} requerido>
                  <Select id="medio-pago" opciones={METODOS_DE_COBRO} value={metodoPago} error={Boolean(errores.metodoPago)} disabled={enviando} onChange={(e) => setMetodoPago(e.target.value)} />
                </FormField>
              </div>
            )}
          </fieldset>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Button variante="neutro" onClick={() => (hayCambios ? setPideDescartar(true) : navigate(rutaGrilla))} disabled={enviando} className="w-full sm:w-auto">Cancelar</Button>
            {libre ? (
              <Button onClick={guardar} cargando={enviando} className="w-full sm:w-auto">Guardar turno</Button>
            ) : (
              <Button onClick={() => navigate(rutaGrilla)} className="w-full sm:w-auto">Elegir otro turno</Button>
            )}
          </div>
        </div>
      </div>

      {/* 5a · con datos cargados, pide confirmar antes de descartar */}
      <ConfirmDialog
        abierto={pideDescartar}
        posicion="abajo-movil"
        titulo="¿Descartar el turno?"
        mensaje="Todavía no se registró nada. Si salís ahora, se pierden los datos que cargaste."
        textoConfirmar="Descartar"
        textoCancelar="Seguir cargando"
        onConfirmar={() => navigate(rutaGrilla)}
        onCancelar={() => setPideDescartar(false)}
      />
    </div>
  )
}