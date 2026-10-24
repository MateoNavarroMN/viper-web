import { useCallback, useState } from 'react'
import { useMediaQuery } from '../../../../shared/hooks/useMediaQuery'
import DetallePartido from './DetallePartido'
import ZonaCard from './ZonaCard'

// Cuántas zonas arrancan abiertas: todas hasta 6 en pantallas grandes, y la primera en el celular
const ABIERTAS_EN_ESCRITORIO = 6

// Zonas de un torneo (CU 3.4): una tarjeta por zona con su tabla de posiciones y sus partidos.
//   zonas:      `zonas` de GET /torneos/:id/cuadro → [{ id, nombre, cerrada, posiciones: [{ posicion, partidosGanados,
//               partidosPerdidos, setsGanados, setsPerdidos, gamesGanados, gamesPerdidos, clasificado, participante }],
//               partidos: [...] }]. Los partidos son los mismos que los del cuadro; `sets` es opcional.
//   disciplina: 'PADEL' habla de parejas; 'TENIS', de jugadores.
//   acciones:   las que puede hacer quien gestiona el torneo sobre un partido (ACCIONES_PARTIDO con su `onClick`).
export default function Zonas({ zonas, disciplina, acciones = [] }) {
  const esGrande = useMediaQuery('(min-width: 768px)')
  const [abiertas, setAbiertas] = useState(null) // ids de las zonas abiertas; null hasta que el usuario cambia algo
  const [seleccionado, setSeleccionado] = useState(null) // id del partido abierto en el detalle
  const unidad = disciplina === 'PADEL' ? 'parejas' : 'jugadores'

  const porDefecto = new Set(zonas.slice(0, esGrande ? ABIERTAS_EN_ESCRITORIO : 1).map((z) => z.id))
  const actuales = abiertas ?? porDefecto
  const todasAbiertas = zonas.every((z) => actuales.has(z.id))

  const alternar = (id) => {
    const nuevas = new Set(actuales)
    if (nuevas.has(id)) nuevas.delete(id)
    else nuevas.add(id)
    setAbiertas(nuevas)
  }
  const abrir = useCallback((p) => setSeleccionado(p.id), [])
  const cerrar = useCallback(() => setSeleccionado(null), [])
  // El detalle necesita saber a qué zona pertenece el partido
  const partido = zonas.flatMap((z) => z.partidos.map((p) => ({ ...p, zonaNombre: z.nombre }))).find((p) => p.id === seleccionado)

  if (zonas.length === 0) return null
  return (
    <div className="flex flex-col gap-5">
      {zonas.length > 1 && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setAbiertas(todasAbiertas ? new Set() : new Set(zonas.map((z) => z.id)))}
            className="text-sm font-semibold text-viper hover:underline cursor-pointer"
          >
            {todasAbiertas ? 'Contraer todas' : 'Expandir todas'}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {zonas.map((zona) => (
          <ZonaCard
            key={zona.id}
            zona={zona}
            unidad={unidad}
            abierta={actuales.has(zona.id)}
            onAlternar={() => alternar(zona.id)}
            onSeleccionar={abrir}
          />
        ))}
      </div>

      <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-texto-suave">
        <li className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-viper/30" aria-hidden="true" /> Clasifica a la eliminatoria
        </li>
        <li><span className="font-semibold text-advertencia">W.O.</span>: se resolvió por baja y cuenta como 6-0 6-0 para el rival</li>
        <li>PG ganados · PP perdidos · Sets y Games a favor-en contra</li>
      </ul>

      <DetallePartido partido={partido} acciones={acciones} onCerrar={cerrar} />
    </div>
  )
}