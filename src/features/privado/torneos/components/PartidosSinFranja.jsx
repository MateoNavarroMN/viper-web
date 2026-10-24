import Alert from '../../../../shared/components/Alert'
import Badge from '../../../../shared/components/Badge'
import Button from '../../../../shared/components/Button'
import { nombreCorto } from '../torneos'

const SIN_GRILLA = 'Disponible cuando se pueda programar sobre la grilla de canchas'

// Aviso del flujo 5a del CU 3.4 (y 6a del CU 3.9): partidos con los dos rivales que no entraron en el período del torneo.
// `partidos` son partidos del cuadro con `lugar` (la zona o la instancia). Cada uno se puede programar a mano con
// `onProgramar(partido)`; «Ampliar fecha de fin» abre `onAmpliar`. Sin `onProgramar` los botones de programar quedan deshabilitados.
export default function PartidosSinFranja({ partidos, onProgramar, onAmpliar }) {
    const cantidad = partidos.length
    const programar = (partido) => onProgramar(partido)
    return (
        <section className="flex flex-col gap-4" aria-label="Partidos sin franja">
            <Alert variante="error" titulo="Faltan franjas para programar todos los partidos">
                {cantidad === 1
                    ? 'Hay 1 partido sin cancha ni horario dentro del período del torneo.'
                    : `Hay ${cantidad} partidos sin cancha ni horario dentro del período del torneo.`}
            </Alert>

            <ul className="bg-panel border border-gray-800 rounded-xl divide-y divide-gray-800 max-h-80 overflow-y-auto">
                {partidos.map((partido) => (
                    <li key={partido.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                        <div className="min-w-0 flex-1 basis-56">
                            <p className="break-words">{nombreCorto(partido.local)} vs {nombreCorto(partido.visitante)}</p>
                            <p className="text-xs text-texto-suave mt-0.5">{partido.lugar}</p>
                        </div>
                        <Badge variante="error">Sin franja</Badge>
                        <Button
                            variante="neutro"
                            disabled={!onProgramar}
                            title={onProgramar ? undefined : SIN_GRILLA}
                            onClick={() => programar(partido)}
                            aria-label={`Programar ${nombreCorto(partido.local)} vs ${nombreCorto(partido.visitante)}`}
                        >
                            Programar
                        </Button>
                    </li>
                ))}
            </ul>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <Button
                    variante="neutro"
                    disabled={!onProgramar}
                    title={onProgramar ? undefined : SIN_GRILLA}
                    onClick={() => programar(partidos[0])}
                >
                    Reprogramar manualmente
                </Button>
                <Button onClick={onAmpliar}>Ampliar fecha de fin</Button>
            </div>
        </section>
    )
}