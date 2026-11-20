import { Link, useNavigate } from 'react-router-dom'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import PagoEnLinea from './PagoEnLinea'
import ResumenDelPago from './ResumenDelPago'

// Pantalla de pago en línea de una inscripción o una cuota: lo que se paga, la elección del medio y el resumen.
// (La de reservas, M5-FE-13, tiene la misma estructura.) Si `motivo` viene, lo que se quería pagar ya no se puede pagar:
// se muestra el aviso y no se ofrece pagar.
//  · concepto, origenId     qué se paga ('INSCRIPCION' | 'CUOTA' y su id)
//  · titulo, subtitulo      encabezado de la pantalla
//  · volverA, textoVolver   a dónde vuelve la persona (una ruta) y cómo se llama ese lugar
//  · etiquetaOrigen         «Inscripción a pagar», «Cuota a pagar»…
//  · tituloOrigen, lineas   nombre de lo que se paga y renglones de detalle (texto)
//  · insignia               estado de lo que se paga (opcional)
//  · total, filas           importe ya formateado y filas del resumen [{ titulo, valor }]
export default function PantallaDePago({
  concepto, origenId, titulo, subtitulo, volverA, textoVolver, etiquetaOrigen, tituloOrigen, lineas = [], insignia, total, filas, motivo, nombreOrigen,
}) {
  const navigate = useNavigate()
  const volver = () => navigate(volverA)

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div>
        <Link to={volverA} className="text-sm text-texto-suave hover:text-viper transition-colors">← {textoVolver}</Link>
        <h1 className="font-outfit text-[28px] font-bold mt-2">{titulo}</h1>
        <p className="text-texto-suave mt-1">{motivo ? subtitulo.noPagable : subtitulo.pagable}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px] items-start">
        <div className="flex flex-col gap-4 lg:col-start-1 lg:row-start-1">
          <section aria-label={etiquetaOrigen} className="bg-panel border border-gray-800 rounded-2xl p-5 flex flex-col gap-2">
            <h2 className="text-xs font-semibold tracking-wide text-texto-suave uppercase">{etiquetaOrigen}</h2>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-outfit text-lg font-bold">{tituloOrigen}</p>
              {insignia}
            </div>
            {lineas.map((linea) => <p key={linea} className="text-sm text-texto-suave">{linea}</p>)}
            <p className="text-xl font-bold text-viper">{total}</p>
          </section>

          {motivo ? (
            <section aria-label="No se puede iniciar el pago" className="flex flex-col gap-4">
              <Alert variante="advertencia" titulo="No se puede iniciar el pago">{motivo}</Alert>
              <div className="flex justify-end"><Button onClick={volver}>{textoVolver}</Button></div>
            </section>
          ) : (
            <PagoEnLinea concepto={concepto} origenId={origenId} total={total} nombreOrigen={nombreOrigen} textoVolver={textoVolver} onRecepcion={volver} onVolver={volver} />
          )}
        </div>

        {!motivo && (
          <div className="lg:col-start-2 lg:row-start-1">
            <ResumenDelPago filas={filas} total={total} />
          </div>
        )}
      </div>
    </div>
  )
}