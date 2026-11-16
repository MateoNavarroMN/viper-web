import { useRef, useState } from 'react'
import { patch } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import FormField from '../../../../shared/components/FormField'
import Input from '../../../../shared/components/Input'
import Modal from '../../../../shared/components/Modal'
import Select from '../../../../shared/components/Select'
import { esDia, hoy } from '../../calendario/calendario'
import { fechaLarga, precio } from '../../torneos/torneos'
import { duracionEntre, finDeUnaHora, finesDesdeInicio, iniciosPara, precioDelTurno, textoDuracion, turnoYaEmpezo } from '../reservas'

const FRANJA_OCUPADA = 'Franja ocupada, elegí otro horario'
const opciones = (horas) => horas.map((h) => ({ valor: h, texto: h }))

// Cambiar el día y el horario de una reserva, en la misma cancha (la usan «Mis reservas» y el panel de la grilla del club).
// El Jugador mantiene turnos de 1 hora en punto (elige solo el inicio); Recepción elige inicio y fin, cada 30 minutos.
// El precio nuevo que se muestra es una estimación (precio por hora × duración): el definitivo lo devuelve la API.
//   onModificada(respuesta): se cambió; `respuesta.reserva` es la reserva con su horario y precio nuevos.
//   onRechazada(mensaje): la API dijo que ya no se puede (cancelada, venció, faltan menos de 3 horas...): se cierra y se avisa afuera.
//   onCerrar(): «Volver», sin tocar nada.
export default function ModificarHorario({ reserva, personal, onModificada, onRechazada, onCerrar }) {
  const [fecha, setFecha] = useState(reserva.fecha)
  const [horaInicio, setHoraInicio] = useState(reserva.horaInicio)
  const [horaFin, setHoraFin] = useState(reserva.horaFin)
  const [errores, setErrores] = useState({})
  const [problema, setProblema] = useState('')
  const [enviando, setEnviando] = useState(false)
  const yaEnviado = useRef(false) // frena el doble clic antes de que el botón alcance a deshabilitarse

  // La reserva guarda el precio del turno, y el precio es precio por hora × duración: de ahí sale el precio por hora de la cancha
  const duracionActual = duracionEntre(reserva.horaInicio, reserva.horaFin)
  const precioHora = duracionActual > 0 ? (Number(reserva.precioAplicado) * 60) / duracionActual : 0
  const duracion = duracionEntre(horaInicio, horaFin)
  const precioNuevo = duracion > 0 ? precioDelTurno(precioHora, horaInicio, horaFin) : null
  const sinCambios = fecha === reserva.fecha && horaInicio === reserva.horaInicio && horaFin === reserva.horaFin

  const cambiarInicio = (nuevo) => {
    setHoraInicio(nuevo)
    // El Jugador siempre tiene 1 hora; Recepción conserva la duración si cabe, y si no se acomoda a una hora
    if (!personal) setHoraFin(finDeUnaHora(nuevo))
    else if (horaFin <= nuevo) setHoraFin(finDeUnaHora(nuevo))
    setErrores((previo) => ({ ...previo, horaInicio: undefined, horaFin: undefined }))
    setProblema('')
  }

  const guardar = async () => {
    if (yaEnviado.current) return
    // A1b · lo que se puede revisar sin ir al servidor; lo ingresado se conserva
    const nuevos = {}
    if (!esDia(fecha)) nuevos.fecha = 'Elegí una fecha'
    else if (fecha < hoy()) nuevos.fecha = 'La fecha ya pasó'
    if (horaFin <= horaInicio) nuevos.horaFin = 'La hora de fin tiene que ser posterior a la de inicio'
    else if (!nuevos.fecha && turnoYaEmpezo(fecha, horaInicio)) nuevos.horaInicio = 'La fecha y la hora ya pasaron'
    setErrores(nuevos)
    setProblema('')
    if (Object.keys(nuevos).length > 0) return

    yaEnviado.current = true
    setEnviando(true)
    try {
      onModificada(await patch(`/reservas/${reserva.id}/horario`, { fecha, horaInicio, horaFin }))
    } catch (e) {
      yaEnviado.current = false
      setEnviando(false)
      if (e.status === 409 && e.mensaje === FRANJA_OCUPADA) {
        // A1a · la reserva sigue como estaba; se puede elegir otro horario
        setProblema(FRANJA_OCUPADA)
      } else if (e.status === 400 && ['fecha', 'horaInicio', 'horaFin'].includes(e.campo)) {
        setErrores({ [e.campo]: e.mensaje })
      } else if (e.status === 409 || e.status === 404) {
        onRechazada(e.mensaje)
      } else {
        setProblema(e.mensaje ?? 'No se pudo modificar el horario')
      }
    }
  }

  return (
    <Modal abierto titulo="Modificar horario" posicion="abajo-movil" onCerrar={enviando ? () => {} : onCerrar}>
      <h2 className="font-outfit text-xl font-bold mb-1">Modificar horario</h2>
      <p className="text-texto-suave text-sm mb-4">
        {reserva.cancha.nombre} · hoy: {fechaLarga(reserva.fecha)}, {reserva.horaInicio} – {reserva.horaFin}
        {reserva.cliente && <> · {reserva.cliente.nombre} {reserva.cliente.apellido}</>}
      </p>

      <div className="flex flex-col gap-4">
        <FormField label="Nueva fecha" id="mod-fecha" error={errores.fecha} requerido>
          <Input
            id="mod-fecha"
            type="date"
            min={hoy()}
            value={fecha}
            error={Boolean(errores.fecha)}
            disabled={enviando}
            onChange={(e) => { setFecha(e.target.value); setErrores((previo) => ({ ...previo, fecha: undefined, horaInicio: undefined })); setProblema('') }}
          />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Desde" id="mod-inicio" error={errores.horaInicio} requerido>
            <Select id="mod-inicio" opciones={opciones(iniciosPara(personal))} value={horaInicio} error={Boolean(errores.horaInicio)} disabled={enviando} onChange={(e) => cambiarInicio(e.target.value)} />
          </FormField>
          <FormField label="Hasta" id="mod-fin" error={errores.horaFin} requerido>
            {personal ? (
              <Select
                id="mod-fin"
                opciones={opciones(finesDesdeInicio(horaInicio))}
                value={horaFin}
                error={Boolean(errores.horaFin)}
                disabled={enviando}
                onChange={(e) => { setHoraFin(e.target.value); setErrores((previo) => ({ ...previo, horaFin: undefined })); setProblema('') }}
              />
            ) : (
              <Input id="mod-fin" value={horaFin} readOnly disabled />
            )}
          </FormField>
        </div>
        {!personal && <p className="text-xs text-texto-suave -mt-2">Tu turno dura 1 hora: elegís cuándo empieza.</p>}
      </div>

      <dl className="mt-4 bg-fondo/60 border border-gray-800 rounded-xl px-4 py-2">
        <div className="flex items-baseline justify-between gap-4 py-2 border-b border-gray-800">
          <dt className="text-sm text-texto-suave">Duración</dt>
          <dd className="text-sm font-semibold">{duracion > 0 ? textoDuracion(duracion) : '—'}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 py-2">
          <dt className="text-sm text-texto-suave">Precio</dt>
          <dd className="text-sm font-semibold text-right">
            {precioNuevo !== null && precioNuevo !== Number(reserva.precioAplicado) && <span className="text-texto-suave font-normal line-through mr-2">{precio(reserva.precioAplicado)}</span>}
            <span className="text-base text-viper">{precioNuevo !== null ? precio(precioNuevo) : '—'}</span>
          </dd>
        </div>
      </dl>

      {reserva.estado === 'PENDIENTE' && <div className="mt-4"><Alert variante="info">Conserva su plazo de pago: si el turno nuevo empieza antes, vence al empezar.</Alert></div>}
      {reserva.estado === 'CONFIRMADA' && precioNuevo !== null && precioNuevo !== Number(reserva.precioAplicado) && (
        <div className="mt-4"><Alert variante="advertencia">La reserva ya está paga y el precio cambia: la diferencia se arregla fuera del sistema.</Alert></div>
      )}
      {problema && <div className="mt-4"><Alert variante="error" titulo={problema === FRANJA_OCUPADA ? 'Ese horario no está disponible' : undefined}>{problema === FRANJA_OCUPADA ? `${problema}. La reserva sigue con su horario original.` : problema}</Alert></div>}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
        <Button variante="neutro" onClick={onCerrar} disabled={enviando}>Volver</Button>
        <Button onClick={guardar} cargando={enviando} disabled={sinCambios}>Guardar horario</Button>
      </div>
    </Modal>
  )
}