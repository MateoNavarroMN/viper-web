import { useState } from 'react'
import { post } from '../../../../shared/api/client'
import Button from '../../../../shared/components/Button'
import ConfirmDialog from '../../../../shared/components/ConfirmDialog'
import { useToast } from '../../../../shared/hooks/useToast'

const MOTIVO = 'Ya hay resultados en la fase eliminatoria: no se puede regenerar.'

// «Regenerar fase eliminatoria» (CU 3.9 · 8a): borra los partidos eliminatorios, cancela sus reservas y vuelve a la fase de zonas.
// Con partidos jugados o con W.O. (`conResultados`) el botón queda deshabilitado y dice por qué. `onHecho` se llama al regenerar
// y también si la API avisa que algo cambió (409), para que la ficha recargue lo que muestra.
export default function RegenerarFase({ torneo, conResultados, onHecho }) {
  const { mostrarToast } = useToast()
  const [confirmando, setConfirmando] = useState(false)
  const [regenerando, setRegenerando] = useState(false)

  const regenerar = async () => {
    setRegenerando(true)
    try {
      const r = await post(`/torneos/${torneo.id}/fase-eliminatoria/regenerar`)
      mostrarToast(r.mensaje, 'exito')
    } catch (e) {
      mostrarToast(e.mensaje, 'error')
    } finally {
      setRegenerando(false)
      setConfirmando(false)
      onHecho()
    }
  }

  return (
    <div className="flex flex-col items-stretch sm:items-end gap-2">
      <Button variante="neutro" disabled={conResultados} aria-describedby={conResultados ? 'motivo-regenerar-fase' : undefined} onClick={() => setConfirmando(true)}>
        Regenerar fase eliminatoria
      </Button>
      {conResultados && <p id="motivo-regenerar-fase" className="text-xs text-texto-suave sm:text-right">{MOTIVO}</p>}

      <ConfirmDialog
        abierto={confirmando}
        posicion="abajo-movil"
        tipo="peligro"
        titulo="¿Regenerar la fase eliminatoria?"
        mensaje="Se eliminan los partidos eliminatorios y se cancelan sus reservas de tipo Torneo. La fase vuelve a Zonas."
        textoConfirmar="Regenerar fase"
        textoCancelar="Volver"
        cargando={regenerando}
        onConfirmar={regenerar}
        onCancelar={() => !regenerando && setConfirmando(false)}
      />
    </div>
  )
}