import { useState } from 'react'
import { put } from '../../../../shared/api/client'
import Button from '../../../../shared/components/Button'
import FormField from '../../../../shared/components/FormField'
import Input from '../../../../shared/components/Input'
import Modal from '../../../../shared/components/Modal'
import { useToast } from '../../../../shared/hooks/useToast'
import { diaSiguiente, fechaCompleta } from '../torneos'

const partidos = (n) => (n === 1 ? '1 partido' : `${n} partidos`)

// «Ampliar fecha de fin» (CU 3.4 · 5a). La API alarga el período del torneo y programa con él los partidos que
// habían quedado sin franja. Se monta solo mientras está abierto, así el campo arranca vacío cada vez.
// `onHecho` se llama cuando se amplió (la pantalla recarga el torneo y el cuadro); `onCerrar` cierra sin cambios.
export default function AmpliarFechaFin({ torneo, onHecho, onCerrar }) {
  const { mostrarToast } = useToast()
  const [fecha, setFecha] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const minimo = diaSiguiente(torneo.fechaFin)

  const ampliar = async (evento) => {
    evento.preventDefault()
    if (!fecha || fecha < minimo) {
      setError(`Elegí una fecha posterior al ${fechaCompleta(torneo.fechaFin)}`)
      return
    }
    setEnviando(true)
    try {
      const r = await put(`/torneos/${torneo.id}/fecha-fin`, { fechaFin: fecha })
      mostrarToast(
        r.sinProgramar > 0
          ? `Fecha de fin ampliada: se programaron ${partidos(r.programados)} y ${partidos(r.sinProgramar)} siguen sin franja`
          : r.programados > 0
            ? `Fecha de fin ampliada: se programaron ${partidos(r.programados)}`
            : 'Fecha de fin ampliada',
        r.sinProgramar > 0 ? 'advertencia' : 'exito',
      )
      onHecho()
    } catch (e) {
      if (e.campo === 'fechaFin') {
        setError(e.mensaje)
      } else {
        // El torneo cambió de estado desde que se abrió la ficha: se avisa y se recarga lo que se ve
        mostrarToast(e.mensaje, 'error')
        onHecho()
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal abierto titulo="Ampliar fecha de fin" onCerrar={enviando ? () => {} : onCerrar}>
      <form onSubmit={ampliar} noValidate className="flex flex-col gap-5">
        <p className="text-texto-suave leading-relaxed">
          El torneo termina el {fechaCompleta(torneo.fechaFin)}. Con una fecha posterior, programamos los partidos que quedaron sin franja.
        </p>
        <FormField label="Nueva fecha de fin" id="nuevaFechaFin" requerido error={error}>
          <Input
            id="nuevaFechaFin"
            type="date"
            min={minimo}
            value={fecha}
            onChange={(e) => {
              setFecha(e.target.value)
              setError('')
            }}
            error={!!error}
          />
        </FormField>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button variante="neutro" onClick={onCerrar} disabled={enviando}>Cancelar</Button>
          <Button type="submit" cargando={enviando}>Ampliar fecha de fin</Button>
        </div>
      </form>
    </Modal>
  )
}