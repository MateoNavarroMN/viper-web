// Panel «Qué se va a generar» de la pantalla de generar cuadro (CU 3.4 · paso 1; solo desde lg, el Figma móvil no lo trae): explica en cuatro pasos qué hace el
// sistema según el formato. `disciplina` define si se habla de parejas (Pádel) o de jugadores (Tenis).
const PASOS = {
  ZONAS_Y_ELIMINACION: (unidad) => [
    `Zonas de 3 o 4 ${unidad}, con reparto equilibrado.`,
    'Una cabeza de serie por zona; el resto se sortea.',
    'Fixture todos contra todos dentro de cada zona.',
    'Cancha y horario para cada partido.',
  ],
  ELIMINACION_DIRECTA: () => [
    'Un cuadro del tamaño de la siguiente potencia de 2, con byes si hace falta.',
    'Las cabezas de serie quedan en posiciones separadas.',
    'Los byes avanzan solos a la ronda siguiente.',
    'Cancha y horario para los partidos con ambos rivales.',
  ],
}

const NOTA = {
  ZONAS_Y_ELIMINACION: 'Al terminar las zonas se arma la fase eliminatoria con los clasificados.',
  ELIMINACION_DIRECTA: 'Los partidos de las rondas siguientes se programan a medida que se definen los rivales.',
}

export default function QueSeGenera({ formato, disciplina }) {
  const unidad = disciplina === 'PADEL' ? 'parejas' : 'jugadores'
  return (
    <aside className="hidden lg:block bg-panel border border-gray-800 rounded-2xl p-8 h-fit">
      <h2 className="text-xs font-bold uppercase tracking-wide text-texto-suave mb-5">Qué se va a generar</h2>
      <ol className="flex flex-col gap-4">
        {PASOS[formato](unidad).map((texto, indice) => (
          <li key={texto} className="flex items-start gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-viper/15 text-viper text-xs font-bold flex items-center justify-center mt-0.5" aria-hidden="true">
              {indice + 1}
            </span>
            <span className="text-sm leading-relaxed">{texto}</span>
          </li>
        ))}
      </ol>
      <p className="text-sm text-texto-suave leading-relaxed mt-5 pt-5 border-t border-gray-800">{NOTA[formato]}</p>
    </aside>
  )
}