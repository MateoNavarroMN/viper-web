import { useEffect, useState } from 'react'
import { get, post } from '../../../../shared/api/client'
import ConfirmDialog from '../../../../shared/components/ConfirmDialog'
import { useToast } from '../../../../shared/hooks/useToast'

// Ruta de la API y textos de cada cambio de estado
const ACCIONES = {
  ABRIR_INSCRIPCIONES: {
    ruta: 'abrir-inscripciones',
    tipo: 'advertencia',
    variante: 'primario',
    titulo: '¿Abrir inscripciones?',
    mensaje: (t) => `Los jugadores van a poder inscribirse a «${t.nombre}». Desde ese momento el torneo ya no se puede editar.`,
    confirmar: 'Abrir inscripciones',
  },
  CERRAR_INSCRIPCIONES: {
    ruta: 'cerrar-inscripciones',
    tipo: 'advertencia',
    variante: 'primario',
    titulo: '¿Cerrar inscripciones?',
    confirmar: 'Cerrar inscripciones',
  },
  CANCELAR: {
    ruta: 'cancelar',
    tipo: 'peligro',
    titulo: '¿Cancelar torneo?',
    mensaje: () =>
      'Se van a anular todas las inscripciones y cancelar las reservas de cancha del torneo. Los reembolsos se gestionan fuera del sistema.',
    confirmar: 'Cancelar torneo',
  },
}

// Cuántas inscripciones con pago pendiente quedan fuera del cuadro
const mensajeCierre = (pendientes) => {
  if (pendientes === 0) return 'No hay inscripciones con pago pendiente. Desde ahora nadie más va a poder inscribirse.'
  if (pendientes === 1) return '1 inscripción con pago pendiente va a quedar fuera del cuadro.'
  return `${pendientes} inscripciones con pago pendiente van a quedar fuera del cuadro.`
}

// Confirmación de abrir, cerrar o cancelar un torneo. `accion` es una de `accionesPermitidas`
// (ABRIR_INSCRIPCIONES, CERRAR_INSCRIPCIONES, CANCELAR) o null si no hay nada abierto.
// `onCerrar` tiene que ser estable (useCallback): el Modal vuelve a enfocar el panel cuando cambia.
// `onHecho()` avisa que el torneo cambió (o que la API lo rechazó) para volver a cargarlo.
export default function ConfirmarAccionTorneo({ accion, torneo, onCerrar, onHecho }) {
  const { mostrarToast } = useToast()
  const [enviando, setEnviando] = useState(false)
  // Resumen del cierre y a qué torneo corresponde, para no mostrar el de otro mientras carga
  const [resumen, setResumen] = useState(null) // { id, pendientes }
  const config = accion ? ACCIONES[accion] : null
  const esCierre = accion === 'CERRAR_INSCRIPCIONES'
  const resumenListo = esCierre && resumen?.id === torneo?.id

  useEffect(() => {
    if (!esCierre) return undefined
    let vigente = true
    get(`/torneos/${torneo.id}/cerrar-inscripciones/preview`)
      .then((datos) => vigente && setResumen({ id: torneo.id, pendientes: datos.pendientes }))
      .catch((error) => {
        if (!vigente) return
        mostrarToast(error.mensaje, 'error')
        onCerrar()
        onHecho()
      })
    return () => {
      vigente = false
    }
  }, [esCierre, torneo?.id, mostrarToast, onCerrar, onHecho])

  const confirmar = async () => {
    setEnviando(true)
    try {
      const respuesta = await post(`/torneos/${torneo.id}/${config.ruta}`)
      mostrarToast(respuesta.mensaje, 'exito')
    } catch (error) {
      // Otra persona ya le cambió el estado; se recarga para mostrar el actual
      mostrarToast(error.mensaje, 'error')
    } finally {
      setEnviando(false)
      onCerrar()
      onHecho()
    }
  }

  if (!config) return null

  const mensaje = esCierre
    ? resumenListo
      ? mensajeCierre(resumen.pendientes)
      : 'Revisando las inscripciones…'
    : config.mensaje(torneo)

  return (
    <ConfirmDialog
      abierto
      posicion="abajo-movil"
      tipo={config.tipo}
      variante={config.variante}
      titulo={config.titulo}
      mensaje={mensaje}
      textoConfirmar={config.confirmar}
      textoCancelar="Volver"
      cargando={enviando || (esCierre && !resumenListo)}
      onConfirmar={confirmar}
      onCancelar={onCerrar}
    />
  )
}