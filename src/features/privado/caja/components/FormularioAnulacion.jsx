import { useState } from 'react'
import { post } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import FormField from '../../../../shared/components/FormField'
import Input from '../../../../shared/components/Input'
import { useToast } from '../../../../shared/hooks/useToast'
import { EFECTO_DE_ANULAR, ETIQUETA_CONCEPTO, MOTIVO_ANULACION_MAXIMO, importeConSigno } from '../caja'

// Paso «Anular»: dentro del panel del detalle. Explica qué va a pasar, pide el motivo (obligatorio) y confirma.
//  · onVolver(): vuelve al detalle sin cambiar nada
//  · onAnulado(movimiento, respuesta): la API anuló el movimiento
//  · onDesactualizado(): la API respondió que ya no se puede anular (ya estaba anulado, caja cerrada...): el detalle se vuelve a pedir
export default function FormularioAnulacion({ movimiento, onVolver, onAnulado, onDesactualizado }) {
  const { mostrarToast } = useToast()
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const anular = async (e) => {
    e.preventDefault()
    const texto = motivo.trim().replace(/\s+/g, ' ')
    if (!texto) {
      setError('Ingresá el motivo de la anulación')
      return
    }
    if (texto.length > MOTIVO_ANULACION_MAXIMO) {
      setError(`El motivo no puede superar los ${MOTIVO_ANULACION_MAXIMO} caracteres`)
      return
    }
    setError('')
    setEnviando(true)
    try {
      const respuesta = await post(`/caja/movimientos/${movimiento.id}/anular`, { motivo: texto })
      mostrarToast('Movimiento anulado')
      onAnulado(respuesta.movimiento)
    } catch (e2) {
      if (e2.campo === 'motivo') {
        setError(e2.mensaje)
        setEnviando(false)
      } else {
        // Ya no se puede anular (otra persona lo anuló, se cerró la caja, el turno ya empezó...): se dice por qué y se actualiza el detalle
        mostrarToast(e2.mensaje, 'error')
        onDesactualizado()
      }
    }
  }

  return (
    <form onSubmit={anular} noValidate className="flex flex-col gap-5">
      <div>
        <p className="text-sm text-texto-suave">{ETIQUETA_CONCEPTO[movimiento.concepto]}</p>
        <p className="font-outfit text-2xl font-bold tabular-nums">{importeConSigno(movimiento)}</p>
      </div>

      <Alert variante="advertencia" titulo="Esto no se puede deshacer">
        El movimiento queda en el historial como anulado y deja de contar en la caja. {EFECTO_DE_ANULAR[movimiento.concepto]}
      </Alert>

      <FormField label="Motivo de la anulación" id="motivo-anulacion" requerido error={error} ayuda={`Hasta ${MOTIVO_ANULACION_MAXIMO} caracteres`}>
        <Input
          id="motivo-anulacion"
          autoComplete="off"
          placeholder="Por ejemplo: se cargó dos veces"
          maxLength={MOTIVO_ANULACION_MAXIMO + 50}
          value={motivo}
          error={Boolean(error)}
          disabled={enviando}
          onChange={(e) => {
            setMotivo(e.target.value)
            setError('')
          }}
        />
      </FormField>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <Button type="button" variante="neutro" onClick={onVolver} disabled={enviando}>
          Volver
        </Button>
        <Button type="submit" variante="peligro" cargando={enviando}>
          Anular movimiento
        </Button>
      </div>
    </form>
  )
}