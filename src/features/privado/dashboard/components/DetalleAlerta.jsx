import { useState } from 'react'
import { Link } from 'react-router-dom'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import ConfirmDialog from '../../../../shared/components/ConfirmDialog'
import EmptyState from '../../../../shared/components/EmptyState'
import Spinner from '../../../../shared/components/Spinner'
import { post } from '../../../../shared/api/client'
import { useToast } from '../../../../shared/hooks/useToast'
import { useConsulta } from '../useConsulta'
import { nombreDeDestino, textoDeAlerta } from '../dashboard'
import DetalleDashboard from './DetalleDashboard'

// Detalle de una alerta: los elementos afectados, cada uno con acceso a la pantalla donde se atiende. En los pagos para devolver,
// además, se puede marcar cada devolución como gestionada (una vez hecha la devolución desde Mercado Pago).
export default function DetalleAlerta({ tipo, onVolver }) {
  const { mostrarToast } = useToast()
  const { datos, cargando, error, reintentar } = useConsulta(`/dashboard/alertas/${tipo}`)
  const [aGestionar, setAGestionar] = useState(null)
  const [gestionando, setGestionando] = useState(false)

  const gestionar = async () => {
    setGestionando(true)
    try {
      await post(`/dashboard/devoluciones/${aGestionar.id}/gestionar`)
      mostrarToast('La devolución quedó marcada como gestionada', 'exito')
    } catch (e) {
      // Un 409 quiere decir que ya estaba gestionada (otra persona, otra pestaña): se informa y se actualiza la lista igual
      mostrarToast(e.mensaje, e.status === 409 ? 'advertencia' : 'error')
    } finally {
      setGestionando(false)
      setAGestionar(null)
      reintentar()
    }
  }

  return (
    <DetalleDashboard onVolver={onVolver}>
      {!datos && cargando && <div className="py-16 flex justify-center"><Spinner texto="Cargando el detalle" /></div>}
      {!datos && error && (
        <Alert variante="error" titulo="No se pudo cargar el detalle de la alerta">
          {error}{' '}
          <Button variante="neutro" onClick={reintentar} className="ml-2">Reintentar</Button>
        </Alert>
      )}
      {datos && (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-outfit text-[28px] font-bold">{textoDeAlerta(datos)}</h1>
              <p className="text-texto-suave text-sm mt-1">{datos.titulo}</p>
            </div>
            <Link to={datos.destino}>
              <Button>Ir a {nombreDeDestino(datos.destino)}</Button>
            </Link>
          </div>

          {error && (
            <Alert variante="error" titulo="No se pudo actualizar la lista">
              {error}{' '}
              <Button variante="neutro" onClick={reintentar} className="ml-2">Reintentar</Button>
            </Alert>
          )}

          {datos.elementos.length === 0 ? (
            <EmptyState titulo="Ya no hay nada pendiente" descripcion="Esta alerta se resolvió: no quedan elementos afectados." accion={<Button onClick={onVolver}>Volver al Dashboard</Button>} />
          ) : (
            <ul className={`flex flex-col gap-3 transition-opacity ${cargando ? 'opacity-60' : ''}`} aria-busy={cargando}>
              {datos.elementos.map((e) => (
                <li key={e.id} className="bg-panel border border-gray-800 rounded-2xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <Link to={e.destino} className="flex-1 min-w-0 group focus-visible:outline-2 focus-visible:outline-viper rounded">
                    <span className="block font-medium break-words group-hover:underline">{e.titulo}</span>
                    <span className="block text-sm text-texto-suave mt-0.5 break-words">{e.detalle}</span>
                  </Link>
                  {tipo === 'DEVOLUCIONES_PENDIENTES' && (
                    <Button variante="neutro" onClick={() => setAGestionar(e)} className="shrink-0">Marcar como gestionada</Button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {datos.hayMas && (
            <p className="text-sm text-texto-suave">Se muestran los primeros {datos.elementos.length} de {datos.cantidad}. Resolvé estos y volvé a mirar.</p>
          )}
        </>
      )}

      <ConfirmDialog
        abierto={Boolean(aGestionar)}
        posicion="abajo-movil"
        titulo="¿Marcar la devolución como gestionada?"
        mensaje={`Confirmá que ya devolviste el pago «${aGestionar?.titulo ?? ''}» desde Mercado Pago. Va a dejar de figurar entre las alertas.`}
        textoConfirmar="Sí, ya la devolví"
        variante="primario"
        cargando={gestionando}
        onConfirmar={gestionar}
        onCancelar={() => setAGestionar(null)}
      />
    </DetalleDashboard>
  )
}