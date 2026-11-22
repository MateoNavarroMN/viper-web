import { useState } from 'react'
import { Link } from 'react-router-dom'
import Badge from '../../../../shared/components/Badge'
import { ETAPA_DEL_TORNEO, TEXTO_DISCIPLINA } from '../portal'
import { usePortal } from '../usePortal'
import BloquePortal from './BloquePortal'
import DetalleTorneoEnCurso from './DetalleTorneoEnCurso'

// Una línea con el lugar del jugador en su zona: «Zona A · 2° puesto». Antes de jugar la zona no tiene posiciones numeradas.
const resumenDeZona = (torneo) => {
  if (!torneo.miZona) return null
  const mia = torneo.miZona.posiciones.find((f) => f.participante?.inscripcionId === torneo.miInscripcionId)
  return mia?.posicion ? `${torneo.miZona.nombre} · ${mia.posicion}° puesto` : torneo.miZona.nombre
}

// Bloque «Mis torneos en curso». Al tocar uno se abre su detalle: cronograma y posiciones de la zona.
export default function TorneosEnCurso() {
  const portal = usePortal('/portal/torneos')
  const [abierto, setAbierto] = useState(null)
  const torneos = portal.datos?.torneos ?? []
  const detalle = torneos.find((t) => t.id === abierto)

  return (
    <>
      <BloquePortal titulo="Mis torneos en curso" estado={portal}>
        {portal.datos && torneos.length === 0 ? (
          <div className="text-center py-6 flex flex-col items-center gap-2">
            <p className="text-sm text-texto-suave">No estás jugando ningún torneo en este momento.</p>
            <Link to="/portal/torneos" className="text-sm font-semibold text-viper hover:underline">
              Ver los torneos con inscripción abierta
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {torneos.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setAbierto(t.id)}
                  className="w-full text-left bg-fondo border border-gray-800 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:border-viper transition-colors focus-visible:outline-2 focus-visible:outline-viper"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold break-words">{t.nombre}</p>
                    <p className="text-xs text-texto-suave mt-1 break-words">
                      {ETAPA_DEL_TORNEO[t.faseActual] ?? 'En curso'}
                      {resumenDeZona(t) && ` · ${resumenDeZona(t)}`}
                    </p>
                  </div>
                  <Badge variante="info">{TEXTO_DISCIPLINA[t.disciplina]}</Badge>
                  <span aria-hidden="true" className="text-texto-suave">›</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </BloquePortal>
      {detalle && <DetalleTorneoEnCurso torneo={detalle} onCerrar={() => setAbierto(null)} />}
    </>
  )
}