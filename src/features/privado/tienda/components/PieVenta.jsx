import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'

const MEDIOS_DE_PAGO = [
  { valor: 'EFECTIVO', texto: 'Efectivo' },
  { valor: 'TRANSFERENCIA', texto: 'Transferencia' },
]

// Pie del carrito: aviso de lo que salió mal, medio de pago y los botones «Confirmar venta» / «Cancelar venta».
// - Sin productos (o con líneas por corregir) no se puede confirmar y se dice por qué.
// - Después de un error de registro el botón pasa a «Reintentar»: el carrito se conserva tal cual.
export default function PieVenta({ carrito, metodoPago, onMetodo, enviando, alerta, reintentar, onConfirmar, onCancelar }) {
  const vacio = carrito.lineas.length === 0
  const bloqueado = vacio || carrito.hayPendientes
  return (
    <div className="flex flex-col gap-4">
      {alerta && (
        <Alert variante="error" titulo={alerta.titulo}>
          {alerta.texto}
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <span id="medio-pago-etiqueta" className="text-[13px] text-texto-suave">Medio de pago</span>
        <div role="group" aria-labelledby="medio-pago-etiqueta" className="grid grid-cols-2 gap-1 bg-fondo border border-gray-800 rounded-lg p-1">
          {MEDIOS_DE_PAGO.map(({ valor, texto }) => (
            <button
              key={valor}
              type="button"
              aria-pressed={metodoPago === valor}
              disabled={enviando}
              onClick={() => onMetodo(valor)}
              className={`py-2 rounded-md text-sm transition-colors cursor-pointer border ${metodoPago === valor ? 'bg-viper/15 border-viper text-viper font-semibold' : 'border-transparent text-texto-suave hover:text-texto'}`}
            >
              {texto}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Button onClick={onConfirmar} cargando={enviando} disabled={bloqueado} className="w-full">
          {reintentar ? 'Reintentar' : 'Confirmar venta'}
        </Button>
        {vacio ? (
          <p className="text-texto-suave text-xs text-center">Agregá al menos un producto para confirmar</p>
        ) : (
          carrito.hayPendientes && <p className="text-texto-suave text-xs text-center">Corregí las líneas marcadas para confirmar</p>
        )}
        <Button variante="neutro" onClick={onCancelar} disabled={enviando || vacio} className="w-full">
          Cancelar venta
        </Button>
      </div>
    </div>
  )
}