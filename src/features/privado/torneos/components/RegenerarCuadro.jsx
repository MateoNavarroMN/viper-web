import { useState } from 'react'
import { post } from '../../../../shared/api/client'
import Button from '../../../../shared/components/Button'
import ConfirmDialog from '../../../../shared/components/ConfirmDialog'
import { useToast } from '../../../../shared/hooks/useToast'

const MOTIVO = 'Ya hay resultados cargados: el cuadro no se puede regenerar.'

// «Regenerar cuadro» (CU 3.4 · 6a): borra el cuadro y deja el torneo en Inscripciones cerradas para generarlo de nuevo.
// Con partidos jugados (`conResultados`) el botón queda deshabilitado y dice por qué. `onHecho` se llama al regenerar
// y también si la API avisa que algo cambió (409), para que la ficha recargue lo que muestra.
export default function RegenerarCuadro({ torneo, conResultados, onHecho }) {
  const { mostrarToast } = useToast()
  const [confirmando, setConfirmando] = useState(false)
  const [regenerando, setRegenerando] = useState(false)

  const regenerar = async () => {
    setRegenerando(true)
    try {
      const r = await post(`/torneos/${torneo.id}/regenerar-cuadro`)
      mostrarToast(r.mensaje, 'exito')
    } catch (e) {
      mostrarToast(e.mensaje, 'error')
    } finally {
      setRegenerando(false)
      setConfirmando(false)
      onHecho()
    }
  }

  const eliminado = torneo.formato === 'ZONAS_Y_ELIMINACION' ? 'las zonas y los partidos' : 'el cuadro y los partidos'
  return (
    <div className="flex flex-col items-stretch sm:items-start gap-2">
      <Button variante="neutro" disabled={conResultados} aria-describedby={conResultados ? 'motivo-regenerar' : undefined} onClick={() => setConfirmando(true)}>
        Regenerar cuadro
      </Button>
      {conResultados && <p id="motivo-regenerar" className="text-xs text-texto-suave">{MOTIVO}</p>}

      <ConfirmDialog
        abierto={confirmando}
        posicion="abajo-movil"
        tipo="peligro"
        titulo="¿Regenerar la competencia?"
        mensaje={`Se eliminan ${eliminado}, y se cancelan las reservas de tipo Torneo. El torneo vuelve a Inscripciones cerradas.`}
        textoConfirmar="Regenerar cuadro"
        textoCancelar="Volver"
        cargando={regenerando}
        onConfirmar={regenerar}
        onCancelar={() => !regenerando && setConfirmando(false)}
      />
    </div>
  )
}