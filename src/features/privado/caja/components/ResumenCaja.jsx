import { importe } from '../caja'

function Tarjeta({ titulo, valor, clase = '', nota }) {
  return (
    <div className="bg-panel border border-gray-800 rounded-2xl px-5 py-4 min-w-0">
      <p className="text-xs font-bold uppercase tracking-wide text-texto-suave">{titulo}</p>
      <p className={`font-outfit text-2xl font-bold mt-1 tabular-nums truncate ${clase}`}>{valor}</p>
      {nota && <p className="text-xs text-texto-suave mt-1">{nota}</p>}
    </div>
  )
}

// Totales de los movimientos que coinciden con los filtros (solo cuentan los aprobados).
export default function ResumenCaja({ totales }) {
  return (
    <section aria-label="Totales" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Tarjeta titulo="Ingresos" valor={importe(totales.ingresos)} clase="text-exito" />
      <Tarjeta titulo="Egresos" valor={importe(totales.egresos)} clase="text-error" />
      <Tarjeta titulo="Saldo" valor={importe(totales.saldo)} clase={totales.saldo < 0 ? 'text-error' : ''} nota="Ingresos menos egresos" />
    </section>
  )
}