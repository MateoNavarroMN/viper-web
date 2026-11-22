import { useEffect, useState } from 'react'
import { get } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Modal from '../../../../shared/components/Modal'
import Spinner from '../../../../shared/components/Spinner'
import { fechaYHora } from '../../comunicados/comunicados'

// Texto completo de un comunicado de la cartelera. Pide el detalle al abrirse (la lista solo trae un extracto).
// Si el comunicado se retiró mientras tanto, avisa que ya no está disponible.
export default function DetalleNovedad({ id, onCerrar }) {
  const [estado, setEstado] = useState({ cargando: true, comunicado: null, error: null })

  useEffect(() => {
    let vigente = true
    get(`/portal/comunicados/${id}`)
      .then((r) => vigente && setEstado({ cargando: false, comunicado: r.comunicado, error: null }))
      .catch((e) => vigente && setEstado({ cargando: false, comunicado: null, error: e.status === 404 ? 'Este comunicado ya no está disponible.' : e.mensaje }))
    return () => {
      vigente = false
    }
  }, [id])

  const { cargando, comunicado, error } = estado
  return (
    <Modal abierto titulo={comunicado?.titulo ?? 'Comunicado'} posicion="abajo-movil" onCerrar={onCerrar}>
      {cargando ? (
        <div className="py-8 flex justify-center"><Spinner texto="Cargando el comunicado" /></div>
      ) : error ? (
        <Alert variante="advertencia">{error}</Alert>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <EstadoBadge tipo="alcanceComunicado" estado={comunicado.alcance} />
            <span className="text-xs text-texto-suave">Publicado el {fechaYHora(comunicado.fechaPublicacion)}</span>
          </div>
          <p className="whitespace-pre-line break-words leading-relaxed">{comunicado.mensaje}</p>
        </div>
      )}
    </Modal>
  )
}