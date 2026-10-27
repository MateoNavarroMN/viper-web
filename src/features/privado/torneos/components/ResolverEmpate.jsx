import { useState } from 'react'
import { put } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import { useToast } from '../../../../shared/hooks/useToast'
import { estadisticaCorta } from '../fase'
import { nombreCorto } from '../torneos'

function Flecha({ hacia, deshabilitado, etiqueta, onClick }) {
  return (
    <button
      type="button"
      disabled={deshabilitado}
      onClick={onClick}
      aria-label={etiqueta}
      className="w-9 h-9 rounded-lg border border-gray-800 bg-panel flex items-center justify-center text-texto-suave enabled:hover:border-viper enabled:hover:text-viper enabled:cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={hacia === 'arriba' ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'} />
      </svg>
    </button>
  )
}

// Desempate a mano de una zona (CU 3.9 · 3a): los criterios no definen un puesto que clasifica, así que quien gestiona el torneo
// ordena a los empatados con las flechas y confirma. `zona` es una zona de `estadoDeZonas` con empates. `onHecho` se llama al
// guardar y también si la API avisa que algo cambió (409), para que la pantalla vuelva a pedir las zonas.
export default function ResolverEmpate({ zona, onHecho }) {
  const { mostrarToast } = useToast()
  // Un orden por cada grupo empatado (en la práctica hay uno solo por zona), del mejor al peor
  const [grupos, setGrupos] = useState(() => zona.empates.map((e) => e.filas.map((f) => f.participante.inscripcionId)))
  const [guardando, setGuardando] = useState(false)

  const mover = (indiceGrupo, desde, hasta) =>
    setGrupos((actuales) =>
      actuales.map((ids, i) => {
        if (i !== indiceGrupo) return ids
        const copia = [...ids]
        ;[copia[desde], copia[hasta]] = [copia[hasta], copia[desde]]
        return copia
      })
    )

  const confirmar = async () => {
    setGuardando(true)
    try {
      await put(`/zonas/${zona.id}/orden-manual`, { orden: grupos.flat() })
      mostrarToast(`Empate resuelto en la ${zona.nombre}`, 'exito')
    } catch (e) {
      mostrarToast(e.mensaje, 'error')
    } finally {
      setGuardando(false)
      onHecho()
    }
  }

  const primero = zona.empates[0].posicion
  return (
    <section className="flex flex-col gap-4" aria-label={`Empate en la ${zona.nombre}`}>
      <Alert variante="advertencia" titulo={`Empate sin resolver en la ${zona.nombre}`}>
        {zona.empates.length === 1 && zona.empates[0].filas.length === 2 && primero > 1
          ? `Los criterios de desempate no definen el ${primero}° puesto. Elegí quién clasifica para continuar.`
          : 'Los criterios de desempate no definen el orden de los empatados. Ordenalos para continuar.'}
      </Alert>

      {zona.empates.map((empate, g) => (
        <div key={empate.posicion} className="bg-panel border border-gray-800 rounded-2xl p-5 flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wide text-texto-suave">Empatados en el {empate.posicion}° puesto</h3>
          <ol className="flex flex-col gap-2">
            {grupos[g].map((inscripcionId, i) => {
              const fila = empate.filas.find((f) => f.participante.inscripcionId === inscripcionId)
              const nombre = nombreCorto(fila.participante)
              return (
                <li key={inscripcionId} className="flex items-center gap-3 bg-fondo border border-gray-800 rounded-xl px-4 py-3">
                  <span className="shrink-0 w-8 font-outfit font-bold text-viper tabular-nums">{empate.posicion + i}°</span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words">{nombre}</p>
                    <p className="text-xs text-texto-suave mt-0.5">{estadisticaCorta(fila)}</p>
                  </div>
                  <Flecha hacia="arriba" deshabilitado={i === 0 || guardando} etiqueta={`Subir a ${nombre}`} onClick={() => mover(g, i, i - 1)} />
                  <Flecha hacia="abajo" deshabilitado={i === grupos[g].length - 1 || guardando} etiqueta={`Bajar a ${nombre}`} onClick={() => mover(g, i, i + 1)} />
                </li>
              )
            })}
          </ol>
        </div>
      ))}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <Button cargando={guardando} onClick={confirmar} className="w-full sm:w-auto">Confirmar y continuar</Button>
      </div>
    </section>
  )
}