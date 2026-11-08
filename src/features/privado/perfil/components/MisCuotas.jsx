import Button from '../../../../shared/components/Button'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import { escribirPrecio, fechaCompleta } from '../../torneos/torneos'
import { estadoDeCuota, fechaDePago, nombrePeriodo } from '../../socios/socios'

const NOTA_PAGO_EN_LINEA = 'Próximamente: por ahora abonala en recepción'

// Lo que dice debajo del período, según el estado de la cuota
const detalleDeCuota = (cuota, estado) => {
  if (estado === 'PAGADA') return `Pagada el ${fechaDePago(cuota.fechaPago)}`
  if (estado === 'VENCIDA') return `Venció el ${fechaCompleta(cuota.fechaVencimiento)}`
  return `Vence el ${fechaCompleta(cuota.fechaVencimiento)}`
}

function FilaCuota({ cuota }) {
  const estado = estadoDeCuota(cuota)
  const pendiente = cuota.estadoPago === 'PENDIENTE'
  return (
    <li className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-5 py-3 border-t border-gray-800 first:border-t-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm break-words">{nombrePeriodo(cuota.mes, cuota.anio)}</p>
        <p className="text-xs text-texto-suave break-words">{detalleDeCuota(cuota, estado)}</p>
      </div>
      <div className="flex flex-wrap items-center sm:justify-end gap-2">
        <span className="text-sm tabular-nums whitespace-nowrap mr-1">$ {escribirPrecio(Number(cuota.monto))}</span>
        <EstadoBadge tipo="cuota" estado={estado} />
        {/* El pago en línea llega con el Módulo 5: por ahora el botón se ve, pero deshabilitado */}
        {pendiente && (
          <Button
            tamano="compacto"
            disabled
            title={NOTA_PAGO_EN_LINEA}
            aria-describedby="nota-pago-en-linea"
            className="text-xs whitespace-nowrap !px-3 !py-1.5"
          >
            Pagar en línea
          </Button>
        )}
      </div>
    </li>
  )
}

// Sección «Mis cuotas» de Mi actividad (solo socios; la API manda `cuotas: null` si el jugador no lo es).
// `cuotas` es { situacion: 'AL_DIA' | 'ADEUDADO', cuotas: [...], pagoEnLinea } (GET /api/perfil/actividad).
export default function MisCuotas({ cuotas }) {
  const lista = cuotas.cuotas ?? []
  const vencidas = lista.filter((c) => c.vencida).length
  const hayPendientes = lista.some((c) => c.estadoPago === 'PENDIENTE')

  return (
    <section aria-labelledby="titulo-mis-cuotas" className="border-b border-gray-800 last:border-b-0">
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-2">
        <h3 id="titulo-mis-cuotas" className="text-xs font-bold uppercase tracking-wide text-texto-suave">
          Mis cuotas
        </h3>
        <EstadoBadge tipo="cuotasSocio" estado={cuotas.situacion} />
      </div>
      {lista.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-texto-suave">Todavía no tenés cuotas generadas. Cuando el club las genere, las vas a ver acá.</p>
      ) : (
        <>
          <p className="px-5 pb-3 text-sm text-texto-suave">
            {vencidas > 0 ? `Tenés ${vencidas} ${vencidas === 1 ? 'cuota vencida' : 'cuotas vencidas'}` : 'No tenés cuotas vencidas'}
          </p>
          <ul>
            {lista.map((cuota) => (
              <FilaCuota key={cuota.id} cuota={cuota} />
            ))}
          </ul>
          {hayPendientes && (
            <p id="nota-pago-en-linea" className="px-5 py-3 border-t border-gray-800 text-xs text-texto-suave">
              {NOTA_PAGO_EN_LINEA}
            </p>
          )}
        </>
      )}
    </section>
  )
}