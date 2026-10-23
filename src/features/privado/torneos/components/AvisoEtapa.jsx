import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'

// Cuando la API no deja configurar las cabezas de serie todavía (409 de GET o PUT /torneos/:id/cabezas-de-serie):
//   - faltan inscriptos pagados (CU 3.3 · 2a): aviso con el mínimo y una barra de avance «3 / 6»;
//   - el torneo no está en inscripciones abiertas o cerradas: aviso con el motivo.
// `error` es el error que lanza el cliente de la API (status 409, con `datos`). `formato` es el nombre del formato del
// torneo («Zonas + Eliminación»), para el texto del aviso. `onVolver` agrega el botón de salida.
export default function AvisoEtapa({ error, formato, onVolver }) {
  const { pagadas, minimoInscriptos } = error.datos ?? {}
  const faltan = Number.isInteger(pagadas) && Number.isInteger(minimoInscriptos)
  const porcentaje = faltan ? Math.min(100, (pagadas / minimoInscriptos) * 100) : 0

  return (
    <div className="flex flex-col gap-4">
      <Alert variante="advertencia" titulo="Aún no es posible configurar esta etapa">
        {faltan
          ? `Hay ${pagadas} ${pagadas === 1 ? 'inscripción pagada' : 'inscripciones pagadas'} y ${formato ? `${formato} requiere` : 'hacen falta'} al menos ${minimoInscriptos}.`
          : error.mensaje}
      </Alert>

      {faltan && (
        <div className="bg-panel border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-texto-suave">Inscripciones con pago confirmado</p>
            <p className="font-outfit text-2xl font-bold tabular-nums text-advertencia">{pagadas} / {minimoInscriptos}</p>
          </div>
          <div
            className="h-2 mt-3 rounded-full bg-gray-800 overflow-hidden"
            role="progressbar"
            aria-label="Inscripciones con pago confirmado"
            aria-valuemin={0}
            aria-valuemax={minimoInscriptos}
            aria-valuenow={pagadas}
          >
            <div className="h-full rounded-full bg-advertencia" style={{ width: `${porcentaje}%` }} />
          </div>
        </div>
      )}

      {onVolver && (
        <div className="flex sm:justify-end">
          <Button variante="neutro" className="w-full sm:w-auto" onClick={onVolver}>Volver a la ficha del torneo</Button>
        </div>
      )}
    </div>
  )
}