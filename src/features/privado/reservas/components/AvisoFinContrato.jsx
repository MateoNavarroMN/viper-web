import { useRef, useState } from 'react'
import { post } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import ConfirmDialog from '../../../../shared/components/ConfirmDialog'
import { hoy } from '../../calendario/calendario'
import { fechaLarga } from '../../torneos/torneos'
import { diaEnPlural } from '../reservas'
import { useMisContratos } from '../useMisContratos'

// Una tarjeta por cada contrato que llegó a su último turno. Sin cuenta regresiva ni notificaciones: la API avisa (`avisoFinContrato`)
// desde el día del último turno. El cliente responde si quiere seguir otros 3 meses; Recepción es quien renueva el contrato.
function TarjetaAviso({ contrato, onRespondido, onRechazada }) {
  const [enviando, setEnviando] = useState(false)
  const [mensaje, setMensaje] = useState(null) // { variante, texto }
  const [cambio, setCambio] = useState(null) // la respuesta nueva, mientras se pide confirmar el cambio
  const yaEnviado = useRef(false) // frena el doble clic antes de que el botón alcance a deshabilitarse

  const termino = contrato.ultimoTurno < hoy()
  const respondio = contrato.respuesta !== null
  const quiereContinuar = contrato.respuesta === 'CONTINUAR'

  const responder = async (continuar) => {
    if (yaEnviado.current) return
    yaEnviado.current = true
    setEnviando(true)
    setMensaje(null)
    try {
      const respuesta = await post(`/reservas-fijas/${contrato.id}/respuesta`, { continuar })
      setCambio(null)
      setMensaje({ variante: 'exito', texto: respuesta.mensaje })
      onRespondido()
    } catch (e) {
      setCambio(null)
      if (e.status === 409 || e.status === 404) {
        // El contrato ya finalizó, o el aviso ya no está activo: la tarjeta va a desaparecer, así que el mensaje se muestra afuera
        onRechazada(e.mensaje)
        onRespondido()
      } else {
        setMensaje({ variante: 'error', texto: e.mensaje ?? 'No se pudo guardar tu respuesta' })
      }
    } finally {
      yaEnviado.current = false
      setEnviando(false)
    }
  }

  // Elegir lo contrario de lo ya respondido pide confirmar el cambio; la primera respuesta se guarda directo
  const elegir = (continuar) => (respondio ? setCambio(continuar) : responder(continuar))

  return (
    <section aria-label="Aviso de fin de contrato" className="bg-panel border border-advertencia/50 rounded-2xl p-5 flex flex-col gap-4">
      <div>
        <h2 className="font-outfit text-lg font-bold">Aviso de fin de alquiler fijo</h2>
        <p className="text-texto-suave mt-1">
          Tu alquiler fijo de los {diaEnPlural(contrato.diaSemana)} a las {contrato.horaInicio} en {contrato.cancha.nombre} {termino ? 'terminó' : 'termina'} el {fechaLarga(contrato.ultimoTurno)}.
          {' '}¿Querés seguir otros 3 meses?
        </p>
      </div>

      {mensaje && <Alert variante={mensaje.variante}>{mensaje.texto}</Alert>}

      {respondio ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-sm font-semibold flex-1">
            {quiereContinuar ? 'Tu respuesta: querés continuar otros 3 meses. El club se va a ocupar de renovar tu contrato.' : 'Tu respuesta: no vas a continuar.'}
          </p>
          <Button variante="neutro" onClick={() => elegir(!quiereContinuar)} disabled={enviando} className="w-full sm:w-auto">
            {quiereContinuar ? 'Mejor no continuar' : 'Mejor quiero continuar'}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => elegir(true)} cargando={enviando} className="w-full sm:w-auto">Quiero continuar</Button>
          <Button variante="neutro" onClick={() => elegir(false)} disabled={enviando} className="w-full sm:w-auto">No continuar</Button>
        </div>
      )}

      <ConfirmDialog
        abierto={cambio !== null}
        posicion="abajo-movil"
        titulo="¿Cambiar tu respuesta?"
        mensaje={cambio ? 'Ya avisaste que no vas a continuar. ¿Querés cambiar y continuar otros 3 meses?' : 'Ya avisaste que querés continuar. ¿Querés cambiar y no continuar?'}
        textoConfirmar="Sí, cambiar"
        textoCancelar="Dejar como estaba"
        cargando={enviando}
        onConfirmar={() => responder(cambio)}
        onCancelar={() => setCambio(null)}
      />
    </section>
  )
}

// Aviso de fin de contrato en «Mis reservas». Sin contratos vigentes, o sin ninguno que haya llegado a su último turno, no muestra nada.
export default function AvisoFinContrato() {
  const { contratos, refrescar } = useMisContratos()
  const [rechazo, setRechazo] = useState('') // lo que dijo la API cuando ya no se podía responder
  const avisos = contratos.filter((c) => c.avisoFinContrato)
  if (avisos.length === 0 && !rechazo) return null
  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      {rechazo && <Alert variante="advertencia">{rechazo}</Alert>}
      {avisos.map((contrato) => <TarjetaAviso key={contrato.id} contrato={contrato} onRespondido={refrescar} onRechazada={setRechazo} />)}
    </div>
  )
}