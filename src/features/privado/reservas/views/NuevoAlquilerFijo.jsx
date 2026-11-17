import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { post } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import BuscarJugador from '../../../../shared/components/BuscarJugador'
import Button from '../../../../shared/components/Button'
import ConfirmDialog from '../../../../shared/components/ConfirmDialog'
import FormField from '../../../../shared/components/FormField'
import Input from '../../../../shared/components/Input'
import Select from '../../../../shared/components/Select'
import Spinner from '../../../../shared/components/Spinner'
import { esDia, hoy } from '../../calendario/calendario'
import { ETIQUETA_DISCIPLINA, fechaCompleta, fechaLarga, precio, sumarDias } from '../../torneos/torneos'
import {
  DIA_DE_LA_SEMANA,
  HORARIOS_CLUB,
  MESES_ALQUILER_FIJO,
  OPCIONES_DIA_SEMANA,
  diaDeLaSemana,
  duracionEntre,
  finDeUnaHora,
  finDelContrato,
  finesDesdeInicio,
  iniciosPara,
  precioDelTurno,
  proximaFechaDelDia,
  textoDuracion,
  turnoYaEmpezo,
  turnosDelContrato,
} from '../reservas'
import { useGrilla } from '../useGrilla'

const RUTA_LISTADO = '/gestion/alquileres-fijos'
const SIN_CUENTA = 'El cliente debe tener una cuenta para alquilar una cancha fija'
const AYUDA_SIN_CUENTA = 'Pedile que se registre primero en el sitio (con su correo y DNI) y volvé a buscarlo.'
const opciones = (horas) => horas.map((h) => ({ valor: h, texto: h }))
// El campo que informa la API → el campo de este formulario
const CAMPO_DE_API = { clienteJugadorId: 'cliente', canchaId: 'canchaId', diaSemana: 'diaSemana', horaInicio: 'horaInicio', horaFin: 'horaFin', fechaInicio: 'fechaInicio' }

function Fila({ titulo, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 border-b border-gray-800 last:border-b-0">
      <dt className="text-sm text-texto-suave shrink-0">{titulo}</dt>
      <dd className="text-sm font-semibold text-right break-words min-w-0">{children}</dd>
    </div>
  )
}

// Alta de un alquiler fijo: un turno semanal, siempre el mismo día y a la misma hora, durante 3 meses, para un cliente con cuenta.
// Muestra el resumen («Se reservarán N turnos hasta…») antes de guardar. Si alguna fecha está ocupada, la API no crea nada y devuelve
// cuáles son: se listan, con el formulario intacto, para cambiar el horario o la cancha, o gestionar esas reservas desde la grilla.
export default function NuevoAlquilerFijo() {
  const navigate = useNavigate()
  // Solo se necesita la lista de canchas; la grilla de hoy la trae
  const { cargando, error, datos, reintentar } = useGrilla(hoy(), '')
  const mañana = sumarDias(hoy(), 1)

  const [cliente, setCliente] = useState(null)
  const [canchaId, setCanchaId] = useState('')
  const [fechaInicio, setFechaInicio] = useState(mañana)
  const [diaSemana, setDiaSemana] = useState(diaDeLaSemana(mañana))
  const [horaInicio, setHoraInicio] = useState('19:00')
  const [horaFin, setHoraFin] = useState('20:00')
  const [errores, setErrores] = useState({})
  const [problema, setProblema] = useState('')
  const [conflicto, setConflicto] = useState(null) // 8a: las fechas ocupadas que informó la API
  const [enviando, setEnviando] = useState(false)
  const [pideDescartar, setPideDescartar] = useState(false)
  const yaEnviado = useRef(false) // frena el doble clic antes de que el botón alcance a deshabilitarse

  const canchas = datos?.canchas ?? []
  const cancha = canchas.find((c) => c.id === canchaId)
  const hayCambios = Boolean(cliente || canchaId || fechaInicio !== mañana || horaInicio !== '19:00' || horaFin !== '20:00')

  // Cualquier cambio en el formulario saca los avisos del intento anterior
  const editar = (campo) => {
    setErrores((previo) => ({ ...previo, [campo]: undefined }))
    setProblema('')
    setConflicto(null)
  }
  const cambiarFecha = (nueva) => {
    setFechaInicio(nueva)
    if (esDia(nueva)) setDiaSemana(diaDeLaSemana(nueva))
    editar('fechaInicio')
  }
  const cambiarDia = (nuevo) => {
    // La fecha de inicio tiene que caer en el día elegido: se pasa a la primera fecha de ese día desde la actual
    setDiaSemana(Number(nuevo))
    if (esDia(fechaInicio)) setFechaInicio(proximaFechaDelDia(Number(nuevo), fechaInicio >= hoy() ? fechaInicio : hoy()))
    editar('fechaInicio')
  }
  const cambiarInicio = (nuevo) => {
    setHoraInicio(nuevo)
    if (horaFin <= nuevo) setHoraFin(finDeUnaHora(nuevo))
    editar('horaInicio')
    editar('horaFin')
  }

  const guardar = async () => {
    if (yaEnviado.current) return
    // 7a · lo que se puede revisar sin ir al servidor; lo ingresado se conserva
    const nuevos = {}
    if (!cliente) nuevos.cliente = 'Elegí el cliente del contrato'
    if (!canchaId) nuevos.canchaId = 'Elegí una cancha'
    if (!esDia(fechaInicio)) nuevos.fechaInicio = 'Elegí la fecha de inicio'
    else if (fechaInicio < hoy()) nuevos.fechaInicio = 'La fecha de inicio ya pasó'
    else if (turnoYaEmpezo(fechaInicio, horaInicio)) nuevos.fechaInicio = 'El primer turno ya empezó: elegí otra fecha u otro horario'
    if (horaFin <= horaInicio) nuevos.horaFin = 'La hora de fin tiene que ser posterior a la de inicio'
    setErrores(nuevos)
    setProblema('')
    setConflicto(null)
    if (Object.keys(nuevos).length > 0) return

    yaEnviado.current = true
    setEnviando(true)
    try {
      const respuesta = await post('/reservas-fijas', { clienteJugadorId: cliente.id, canchaId, diaSemana, horaInicio, horaFin, fechaInicio })
      navigate(RUTA_LISTADO, { replace: true, state: { contratoNuevo: respuesta.contrato, mensaje: respuesta.mensaje } })
    } catch (e) {
      yaEnviado.current = false
      setEnviando(false)
      if (e.status === 409 && Array.isArray(e.datos?.fechasEnConflicto)) {
        // 8a · no se creó nada; se listan las fechas ocupadas y se conserva todo lo cargado
        setConflicto(e.datos.fechasEnConflicto)
      } else if (e.status === 404 && e.campo === 'clienteJugadorId') {
        // 5a · el cliente no tiene cuenta
        setCliente(null)
        setErrores({ cliente: `${SIN_CUENTA}. ${AYUDA_SIN_CUENTA}` })
      } else if (e.status === 400 && CAMPO_DE_API[e.campo]) {
        setErrores({ [CAMPO_DE_API[e.campo]]: e.mensaje })
      } else {
        setProblema(e.mensaje ?? 'No se pudo registrar el alquiler fijo')
      }
    }
  }

  if (cargando) return <div className="py-16 flex justify-center"><Spinner texto="Cargando las canchas" /></div>
  if (error) {
    return (
      <Alert variante="error" titulo="No pudimos cargar las canchas">
        {error}{' '}
        <button type="button" onClick={reintentar} className="underline font-semibold cursor-pointer">Reintentar</button>
      </Alert>
    )
  }

  const duracion = duracionEntre(horaInicio, horaFin)
  const fechaValida = esDia(fechaInicio)
  const turnos = fechaValida ? turnosDelContrato(fechaInicio) : null
  const total = cancha && duracion > 0 ? precioDelTurno(cancha.precioHora, horaInicio, horaFin) : null

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <Link to={RUTA_LISTADO} className="text-sm text-texto-suave hover:text-viper transition-colors">← Volver a alquileres fijos</Link>
        <h1 className="font-outfit text-[28px] font-bold mt-2">Nuevo alquiler fijo</h1>
        <p className="text-texto-suave mt-1">Un turno por semana, el mismo día y a la misma hora, durante {MESES_ALQUILER_FIJO} meses.</p>
      </div>

      {problema && <Alert variante="error" titulo="No se pudo registrar el alquiler fijo">{problema}</Alert>}
      {conflicto && (
        <Alert variante="error" titulo="Hay fechas ocupadas en ese horario">
          <span className="block">
            {conflicto.length === 1 ? 'Esta fecha ya tiene' : `Estas ${conflicto.length} fechas ya tienen`} una reserva en {cancha?.nombre} de {horaInicio} a {horaFin}. No se registró nada.
            Cambiá el horario o la cancha, o gestioná esas reservas desde la grilla.
          </span>
          <span className="flex flex-wrap gap-2 mt-3">
            {conflicto.map((fecha) => (
              <Link
                key={fecha}
                to={`/gestion/reservas?${new URLSearchParams({ fecha, ...(cancha ? { deporte: cancha.deporte } : {}) })}`}
                className="inline-block rounded-full bg-fondo/60 border border-gray-700 hover:border-viper px-3 py-1 text-sm tabular-nums transition-colors"
              >
                {fechaLarga(fecha)}
              </Link>
            ))}
          </span>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] items-start">
        <section aria-label="Resumen" className="bg-panel border border-gray-800 rounded-2xl p-5 lg:col-start-2 lg:row-start-1">
          <h2 className="font-outfit text-lg font-bold mb-2">Resumen</h2>
          <dl>
            <Fila titulo="Cliente">{cliente ? `${cliente.nombre} ${cliente.apellido}` : '—'}</Fila>
            <Fila titulo="Cancha">{cancha ? cancha.nombre : '—'}</Fila>
            <Fila titulo="Día y horario">{DIA_DE_LA_SEMANA[diaSemana]} {horaInicio} – {horaFin}</Fila>
            <Fila titulo="Duración">{duracion > 0 ? textoDuracion(duracion) : '—'}</Fila>
            <Fila titulo="Desde">{fechaValida ? fechaLarga(fechaInicio) : '—'}</Fila>
            <Fila titulo="Precio por turno"><span className="text-base text-viper">{total !== null ? precio(total) : '—'}</span></Fila>
          </dl>
          {turnos !== null && (
            <p className="mt-4 rounded-xl bg-viper/10 border border-viper/40 px-4 py-3 text-sm font-semibold" aria-live="polite">
              Se reservarán {turnos} turnos hasta el {fechaCompleta(finDelContrato(fechaInicio))}.
            </p>
          )}
          <p className="text-xs text-texto-suave mt-3">Los turnos quedan confirmados. El cobro se arregla con el cliente fuera del sistema.</p>
        </section>

        <div className="flex flex-col gap-6 lg:col-start-1 lg:row-start-1">
          <section aria-label="Cliente" className="bg-panel border border-gray-800 rounded-2xl p-5">
            <h2 className="font-outfit text-lg font-bold mb-3">Cliente</h2>
            <BuscarJugador
              etiqueta="Buscar cliente"
              valor={cliente}
              onElegir={(jugador) => { setCliente(jugador); editar('cliente') }}
              error={errores.cliente}
              disabled={enviando}
              sinResultados={{ titulo: SIN_CUENTA, detalle: AYUDA_SIN_CUENTA }}
            />
          </section>

          <section aria-label="Turno semanal" className="bg-panel border border-gray-800 rounded-2xl p-5 flex flex-col gap-4">
            <h2 className="font-outfit text-lg font-bold">Turno semanal</h2>
            <FormField label="Cancha" id="alq-cancha" error={errores.canchaId} requerido>
              <Select
                id="alq-cancha"
                opciones={[{ valor: '', texto: 'Elegí una cancha' }, ...canchas.map((c) => ({ valor: c.id, texto: `${c.nombre} · ${ETIQUETA_DISCIPLINA[c.deporte]}` }))]}
                value={canchaId}
                error={Boolean(errores.canchaId)}
                disabled={enviando}
                onChange={(e) => { setCanchaId(e.target.value); editar('canchaId') }}
              />
            </FormField>
            <div className="grid sm:grid-cols-2 gap-4">
              <FormField label="Día de la semana" id="alq-dia" requerido>
                <Select id="alq-dia" opciones={OPCIONES_DIA_SEMANA} value={String(diaSemana)} disabled={enviando} onChange={(e) => cambiarDia(e.target.value)} />
              </FormField>
              <FormField label="Fecha de inicio" id="alq-fecha" error={errores.fechaInicio} requerido>
                <Input id="alq-fecha" type="date" min={hoy()} value={fechaInicio} error={Boolean(errores.fechaInicio)} disabled={enviando} onChange={(e) => cambiarFecha(e.target.value)} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Desde" id="alq-inicio" error={errores.horaInicio} requerido>
                <Select id="alq-inicio" opciones={opciones(iniciosPara(true))} value={horaInicio} error={Boolean(errores.horaInicio)} disabled={enviando} onChange={(e) => cambiarInicio(e.target.value)} />
              </FormField>
              <FormField label="Hasta" id="alq-fin" error={errores.horaFin} requerido>
                <Select
                  id="alq-fin"
                  opciones={opciones(finesDesdeInicio(horaInicio))}
                  value={horaFin}
                  error={Boolean(errores.horaFin)}
                  disabled={enviando}
                  onChange={(e) => { setHoraFin(e.target.value); editar('horaFin') }}
                />
              </FormField>
            </div>
            <p className="text-xs text-texto-suave -mt-2">Cualquier horario del día, cada 30 minutos (de {HORARIOS_CLUB[0]} a {HORARIOS_CLUB.at(-1)}). Si cambiás el día, la fecha de inicio pasa al próximo {DIA_DE_LA_SEMANA[diaSemana].toLowerCase()}.</p>
          </section>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Button variante="neutro" onClick={() => (hayCambios ? setPideDescartar(true) : navigate(RUTA_LISTADO))} disabled={enviando} className="w-full sm:w-auto">Cancelar</Button>
            <Button onClick={guardar} cargando={enviando} className="w-full sm:w-auto">Guardar alquiler fijo</Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        abierto={pideDescartar}
        posicion="abajo-movil"
        titulo="¿Descartar el alquiler fijo?"
        mensaje="Todavía no se registró nada. Si salís ahora, se pierden los datos que cargaste."
        textoConfirmar="Descartar"
        textoCancelar="Seguir cargando"
        onConfirmar={() => navigate(RUTA_LISTADO)}
        onCancelar={() => setPideDescartar(false)}
      />
    </div>
  )
}