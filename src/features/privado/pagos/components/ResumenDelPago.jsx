// Resumen de lo que se va a pagar (concepto, detalle y total) y el aviso de que el pago se hace en un entorno externo seguro.
// `filas`: [{ titulo, valor }]. Lo comparten el pago de una reserva, de una inscripción y de una cuota.
export default function ResumenDelPago({ filas, total, medio = 'Mercado Pago' }) {
  return (
    <aside aria-label="Resumen del pago" className="bg-panel border border-gray-800 rounded-2xl p-5 flex flex-col gap-4">
      <h2 className="font-outfit text-lg font-bold">Resumen del pago</h2>
      <dl>
        {filas.map(({ titulo, valor }) => (
          <div key={titulo} className="flex items-baseline justify-between gap-4 py-2 border-b border-gray-800">
            <dt className="text-sm text-texto-suave shrink-0">{titulo}</dt>
            <dd className="text-sm font-semibold text-right break-words min-w-0">{valor}</dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-4 py-2 border-b border-gray-800">
          <dt className="text-sm text-texto-suave shrink-0">Medio de pago</dt>
          <dd className="text-sm font-semibold text-right">{medio}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4 pt-3">
          <dt className="text-sm text-texto-suave">Total a pagar</dt>
          <dd className="text-xl font-bold text-viper">{total}</dd>
        </div>
      </dl>
      <div className="rounded-xl border border-info/40 bg-info/10 px-4 py-3 text-sm">
        <p className="font-semibold">Pago seguro</p>
        <p className="text-texto-suave mt-0.5">Vas a pasar al entorno de pago de Mercado Pago. Tus datos de tarjeta se ingresan allí y Viper no los guarda.</p>
      </div>
    </aside>
  )
}