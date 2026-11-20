import Button from '../../../../shared/components/Button'
import { precio } from '../../torneos/torneos'

const ETIQUETA_MEDIO = { EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia' }

// '2026-11-20T21:42:00Z' → 'Hoy · 18:42' (hora local del navegador)
const horaDeHoy = (iso) => {
  const f = new Date(iso)
  const dos = (n) => String(n).padStart(2, '0')
  return `Hoy · ${dos(f.getHours())}:${dos(f.getMinutes())}`
}

// Resumen de la venta recién registrada (lo que devolvió la API): productos, total, medio de pago y estado.
export default function ResumenVenta({ venta, operador, onNueva }) {
  return (
    <section aria-label="Venta registrada" className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-exito/20 text-exito flex items-center justify-center shrink-0">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m5 12 5 5L20 7" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="font-outfit text-lg font-bold">Venta registrada</p>
          <p className="text-texto-suave text-xs">
            {horaDeHoy(venta.fechaHora)} · Operador: {operador}
          </p>
        </div>
      </div>

      <ul className="divide-y divide-gray-800 border-y border-gray-800">
        {venta.lineas.map((l) => (
          <li key={l.productoId} className="py-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold break-words">{l.nombre}</p>
              <p className="text-xs text-texto-suave tabular-nums">{l.cantidad} × {precio(l.precioUnitario)}</p>
            </div>
            <p className="text-sm font-semibold tabular-nums">{precio(l.subtotal)}</p>
          </li>
        ))}
      </ul>

      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm text-texto-suave">Total</span>
        <span className="font-outfit text-2xl font-bold tabular-nums">{precio(venta.total)}</span>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-texto-suave">Medio de pago</dt>
        <dd className="text-right">{ETIQUETA_MEDIO[venta.metodoPago]}</dd>
        <dt className="text-texto-suave">Cliente</dt>
        <dd className="text-right">Consumidor final</dd>
        <dt className="text-texto-suave">Estado</dt>
        <dd className="text-right">Aprobado</dd>
      </dl>

      <Button onClick={onNueva} className="w-full">
        Nueva venta
      </Button>
    </section>
  )
}