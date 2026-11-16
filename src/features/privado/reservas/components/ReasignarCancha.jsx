import { useEffect, useRef, useState } from 'react'
import { get, patch } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import Modal from '../../../../shared/components/Modal'
import Spinner from '../../../../shared/components/Spinner'
import { ETIQUETA_DISCIPLINA, fechaLarga, precio } from '../../torneos/torneos'

const FRANJA_OCUPADA = 'Franja ocupada, elegí otro horario'

// Mover una reserva a otra cancha del mismo deporte con la franja libre (solo Recepción y Administrador). Pide a la API las canchas
// disponibles y deja elegir una; muestra el precio que tendría en cada una. Si ninguna tiene la franja libre, lo informa y no cambia nada.
//   onReasignada(respuesta): se movió; `respuesta.reserva` es la reserva con su cancha y precio nuevos.
//   onRechazada(mensaje): la API dijo que ya no se puede (cancelada, venció...): se cierra y se avisa afuera.
//   onCerrar(): «Volver», sin tocar nada.
export default function ReasignarCancha({ reserva, onReasignada, onRechazada, onCerrar }) {
  const [estado, setEstado] = useState({ cargando: true })
  const [intento, setIntento] = useState(0)
  const [elegida, setElegida] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [problema, setProblema] = useState('')
  const yaEnviado = useRef(false)

  useEffect(() => {
    let vigente = true
    get(`/reservas/${reserva.id}/canchas-disponibles`)
      .then((r) => vigente && setEstado({ canchas: r.canchas }))
      .catch((e) => vigente && (e.status === 409 || e.status === 404 ? onRechazada(e.mensaje) : setEstado({ error: e.mensaje })))
    return () => {
      vigente = false
    }
    // Se pide una vez por apertura (y de nuevo con «Reintentar»)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reserva.id, intento])

  const reasignar = async () => {
    if (yaEnviado.current || !elegida) return
    yaEnviado.current = true
    setEnviando(true)
    setProblema('')
    try {
      onReasignada(await patch(`/reservas/${reserva.id}/cancha`, { canchaId: elegida }))
    } catch (e) {
      yaEnviado.current = false
      setEnviando(false)
      if (e.status === 409 && e.mensaje === FRANJA_OCUPADA) {
        // Alguien tomó la franja de esa cancha mientras se elegía: se vuelve a pedir la lista
        setProblema(`${FRANJA_OCUPADA}. La reserva sigue en su cancha.`)
        setElegida('')
        setEstado({ cargando: true })
        setIntento((n) => n + 1)
      } else if (e.status === 409 || e.status === 404) {
        onRechazada(e.mensaje)
      } else {
        setProblema(e.mensaje ?? 'No se pudo reasignar la cancha')
      }
    }
  }

  const { cargando, error, canchas } = estado
  return (
    <Modal abierto titulo="Reasignar cancha" posicion="abajo-movil" onCerrar={enviando ? () => {} : onCerrar}>
      <h2 className="font-outfit text-xl font-bold mb-1">Reasignar cancha</h2>
      <p className="text-texto-suave text-sm mb-4">
        {reserva.cancha.nombre} · {fechaLarga(reserva.fecha)}, {reserva.horaInicio} – {reserva.horaFin}
        {reserva.cliente && <> · {reserva.cliente.nombre} {reserva.cliente.apellido}</>}
      </p>

      {cargando && <div className="py-8 flex justify-center"><Spinner texto="Buscando canchas libres" /></div>}

      {error && (
        <Alert variante="error" titulo="No pudimos buscar las canchas">
          {error}{' '}
          <button type="button" onClick={() => { setEstado({ cargando: true }); setIntento((n) => n + 1) }} className="underline font-semibold cursor-pointer">Reintentar</button>
        </Alert>
      )}

      {canchas?.length === 0 && (
        <Alert variante="info" titulo="No hay otra cancha libre">
          Ninguna cancha de {ETIQUETA_DISCIPLINA[reserva.cancha.deporte]} tiene libre este horario. La reserva sigue en {reserva.cancha.nombre}.
        </Alert>
      )}

      {canchas?.length > 0 && (
        <fieldset>
          <legend className="text-[13px] text-texto-suave mb-2">Canchas de {ETIQUETA_DISCIPLINA[reserva.cancha.deporte]} con este horario libre</legend>
          <div className="flex flex-col gap-3">
            {canchas.map((c) => (
              <label
                key={c.id}
                className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors hover:border-viper ${elegida === c.id ? 'border-viper bg-viper/10' : 'border-gray-800 bg-fondo'} has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-viper`}
              >
                <input type="radio" name="cancha" value={c.id} checked={elegida === c.id} disabled={enviando} onChange={() => { setElegida(c.id); setProblema('') }} className="mt-1 accent-[var(--color-viper)] size-4 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{c.nombre}</span>
                  <span className="block text-sm text-texto-suave">{c.tipoSuperficie} · {precio(c.precioHora)} la hora</span>
                </span>
                <span className="text-right shrink-0">
                  <span className="block text-xs text-texto-suave">Precio de la reserva</span>
                  <span className="block font-semibold text-viper">{precio(c.precioNuevo)}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {reserva.estado === 'CONFIRMADA' && canchas?.length > 0 && (
        <div className="mt-4"><Alert variante="advertencia">Si el precio cambia en una reserva ya paga, la diferencia se arregla fuera del sistema.</Alert></div>
      )}
      {problema && <div className="mt-4"><Alert variante="error">{problema}</Alert></div>}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
        <Button variante="neutro" onClick={onCerrar} disabled={enviando}>{canchas?.length === 0 ? 'Cerrar' : 'Volver'}</Button>
        {canchas?.length > 0 && <Button onClick={reasignar} cargando={enviando} disabled={!elegida}>Reasignar cancha</Button>}
      </div>
    </Modal>
  )
}