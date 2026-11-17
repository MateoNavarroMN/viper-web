import { useRef, useState } from 'react'
import { post } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import Modal from '../../../../shared/components/Modal'
import { fechaCompleta, fechaLarga } from '../../torneos/torneos'
import { finDelContrato, turnosDeLaRenovacion, turnosPorDelante } from '../reservas'

// Cancelar o renovar un contrato vigente, desde su detalle. Cada acción pide confirmación; si no se confirma, no se toca nada.
//   onResultado({ variante, mensaje, fechas? }): lo que pasó (éxito, rechazo o fechas ocupadas al renovar) para mostrarlo en la pantalla.
//   onActualizar(): hay que volver a pedir el contrato, porque cambió (o porque la API dijo que ya cambió).
export default function AccionesContrato({ contrato, onResultado, onActualizar }) {
  const [dialogo, setDialogo] = useState(null) // 'cancelar' | 'renovar' | null
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const yaEnviado = useRef(false) // frena el doble clic antes de que el botón alcance a deshabilitarse

  const cerrar = () => {
    if (enviando) return
    setDialogo(null)
    setError('')
  }

  // Manda la acción y reparte el resultado: lo que dice la API (409) se muestra en la pantalla y se actualiza el contrato
  const ejecutar = async (accion, alExito) => {
    if (yaEnviado.current) return
    yaEnviado.current = true
    setEnviando(true)
    setError('')
    try {
      const respuesta = await post(`/reservas-fijas/${contrato.id}/${accion}`)
      setDialogo(null)
      onResultado({ variante: 'exito', mensaje: alExito(respuesta) })
      onActualizar()
    } catch (e) {
      if (e.status === 409 && Array.isArray(e.datos?.fechasEnConflicto)) {
        // A3a · el período nuevo tiene fechas ocupadas: el contrato no cambió
        setDialogo(null)
        onResultado({ variante: 'error', titulo: e.mensaje, mensaje: 'No se renovó el contrato. Gestioná esas reservas desde la grilla y volvé a intentar.', fechas: e.datos.fechasEnConflicto })
      } else if (e.status === 409 || e.status === 404) {
        // Ya finalizó, el aviso todavía no estaba activo, etc.: se muestra lo que dijo la API y se vuelve a pedir el contrato
        setDialogo(null)
        onResultado({ variante: 'advertencia', mensaje: e.mensaje })
        onActualizar()
      } else {
        setError(e.mensaje ?? 'No se pudo completar la acción')
      }
    } finally {
      yaEnviado.current = false
      setEnviando(false)
    }
  }

  const porDelante = turnosPorDelante(contrato)
  const renovable = contrato.avisoFinContrato
  const nuevoFin = finDelContrato(contrato.fechaFinContrato)

  return (
    <section aria-labelledby="titulo-acciones" className="bg-panel border border-gray-800 rounded-2xl p-6 md:p-8">
      <h2 id="titulo-acciones" className="text-xs font-bold uppercase tracking-wide text-texto-suave mb-4">Acciones</h2>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={() => setDialogo('renovar')} disabled={!renovable} className="w-full sm:w-auto">Renovar contrato</Button>
        <Button variante="peligro-borde" onClick={() => setDialogo('cancelar')} className="w-full sm:w-auto">Cancelar contrato</Button>
      </div>
      <p className="text-xs text-texto-suave mt-3">
        {renovable
          ? 'Ya llegó el aviso de fin de contrato: se puede renovar por otros 3 meses.'
          : `La renovación se habilita el día del último turno${contrato.ultimoTurno ? ` (${fechaLarga(contrato.ultimoTurno)})` : ''}.`}
      </p>

      {dialogo === 'cancelar' && (
        <Modal abierto titulo="Cancelar contrato" posicion="abajo-movil" onCerrar={cerrar}>
          <h2 className="font-outfit text-xl font-bold mb-2">¿Cancelar el contrato?</h2>
          <p className="text-texto-suave leading-relaxed">
            {porDelante > 0
              ? `Se cancelan los ${porDelante} ${porDelante === 1 ? 'turno que todavía no empezó' : 'turnos que todavía no empezaron'} y sus franjas quedan libres.`
              : 'No quedan turnos por delante.'}{' '}
            Los turnos que ya pasaron se conservan. El contrato queda finalizado y no se puede deshacer.
          </p>
          {error && <div className="mt-4"><Alert variante="error">{error}</Alert></div>}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-8">
            <Button variante="neutro" onClick={cerrar} disabled={enviando}>Volver</Button>
            <Button variante="peligro" onClick={() => ejecutar('cancelar', (r) => r.mensaje)} cargando={enviando}>Cancelar contrato</Button>
          </div>
        </Modal>
      )}

      {dialogo === 'renovar' && (
        <Modal abierto titulo="Renovar contrato" posicion="abajo-movil" onCerrar={cerrar}>
          <h2 className="font-outfit text-xl font-bold mb-2">¿Renovar el contrato por 3 meses?</h2>
          <p className="text-texto-suave leading-relaxed">
            Se suman {turnosDeLaRenovacion(contrato)} turnos, hasta el {fechaCompleta(nuevoFin)}, en el mismo día y horario, con el precio actual de la cancha. Si alguna de esas fechas está ocupada, no se renueva nada.
          </p>
          {contrato.respuestaCliente === 'FINALIZAR' && (
            <div className="mt-4"><Alert variante="advertencia">El cliente avisó que no continúa. Renová solo si cambió de idea.</Alert></div>
          )}
          {error && <div className="mt-4"><Alert variante="error">{error}</Alert></div>}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-8">
            <Button variante="neutro" onClick={cerrar} disabled={enviando}>Volver</Button>
            <Button onClick={() => ejecutar('renovar', (r) => r.mensaje)} cargando={enviando}>Renovar contrato</Button>
          </div>
        </Modal>
      )}
    </section>
  )
}