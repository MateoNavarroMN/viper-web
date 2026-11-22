import { useState } from 'react'
import { post } from '../../../shared/api/client'
import ConfirmDialog from '../../../shared/components/ConfirmDialog'
import { useMediaQuery } from '../../../shared/hooks/useMediaQuery'
import { useToast } from '../../../shared/hooks/useToast'
import { TEXTO_PUBLICO } from './comunicados'

// Publicar un borrador y retirar un comunicado publicado, cada uno con su confirmación. Lo usan el listado y el detalle.
//   alTerminar(comunicado) → se llama cuando la acción salió bien, con el comunicado ya actualizado
//   alFallar(mensaje)      → se llama con el motivo cuando la API rechaza (por ejemplo, otro administrador ya lo retiró)
// Devuelve { pedirPublicar(c), pedirRetirar(c), dialogo }: `dialogo` se dibuja en cualquier parte de la pantalla.
export function useAccionesComunicado({ alTerminar, alFallar }) {
  const { mostrarToast } = useToast()
  const esEscritorio = useMediaQuery('(min-width: 768px)')
  const [pendiente, setPendiente] = useState(null) // { accion: 'publicar' | 'retirar', comunicado }
  const [procesando, setProcesando] = useState(false)

  const confirmar = async () => {
    const { accion, comunicado } = pendiente
    setProcesando(true)
    try {
      const respuesta = await post(`/comunicados/${comunicado.id}/${accion}`)
      setPendiente(null)
      mostrarToast(respuesta.mensaje)
      alTerminar(respuesta.comunicado)
    } catch (error) {
      setPendiente(null)
      alFallar(error.mensaje)
    } finally {
      setProcesando(false)
    }
  }

  const publicando = pendiente?.accion === 'publicar'
  const dialogo = pendiente && (
    <ConfirmDialog
      abierto
      posicion={esEscritorio ? 'centro' : 'abajo-movil'}
      tipo={publicando ? 'advertencia' : 'peligro'}
      variante={publicando ? 'primario' : undefined}
      titulo={publicando ? '¿Publicar el comunicado?' : '¿Retirar el comunicado?'}
      mensaje={
        publicando
          ? `Se va a mostrar en la cartelera del Portal del Jugador. Visible para: ${TEXTO_PUBLICO[pendiente.comunicado.alcance].toLowerCase()}.`
          : 'Deja de mostrarse en la cartelera del Portal del Jugador y queda en el historial. No se puede volver a publicar.'
      }
      textoCancelar="Volver"
      textoConfirmar={publicando ? 'Publicar' : 'Retirar'}
      cargando={procesando}
      onCancelar={() => setPendiente(null)}
      onConfirmar={confirmar}
    />
  )

  return {
    pedirPublicar: (comunicado) => setPendiente({ accion: 'publicar', comunicado }),
    pedirRetirar: (comunicado) => setPendiente({ accion: 'retirar', comunicado }),
    dialogo,
  }
}   