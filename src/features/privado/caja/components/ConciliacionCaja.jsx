import { Link } from 'react-router-dom'
import Button from '../../../../shared/components/Button'
import Alert from '../../../../shared/components/Alert'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import FormField from '../../../../shared/components/FormField'
import Input from '../../../../shared/components/Input'
import { diferenciaConSigno, diferenciaDeCaja, faltaOSobra, importe } from '../caja'

function Fila({ titulo, valor, clase = '' }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-texto-suave">{titulo}</span>
      <span className={`font-semibold tabular-nums ${clase}`}>{valor}</span>
    </div>
  )
}

// Contá el efectivo de la caja y escribilo: la diferencia con el efectivo calculado se ve en el momento. Un monto que no se entiende
// no muestra diferencia. Es un componente de presentación: el estado vive en Jornada.
//  · texto / onTexto: lo que se escribió en el campo · declarado: ese texto como número (null si no es un monto válido)
//  · error: mensaje bajo el campo · onCerrar: el botón de cerrar · campoRef: para volver a enfocar el campo al recontar
export default function ConciliacionCaja({ calculado, texto, onTexto, declarado, error, deshabilitado, campoRef, enlaceMovimientos, onCerrar }) {
  const hayMonto = declarado !== null
  const diferencia = hayMonto ? diferenciaDeCaja(declarado, calculado) : null
  const descuadrada = hayMonto && diferencia !== 0
  const estado = !hayMonto ? null : descuadrada ? 'DESCUADRADO' : 'CUADRADO'

  const recontar = () => {
    campoRef.current?.focus()
    campoRef.current?.select()
  }

  return (
    <section aria-label="Conciliación" className="bg-panel border border-gray-800 rounded-2xl p-5 md:p-6 flex flex-col gap-5">
      <h2 className="font-outfit text-lg font-bold">Conciliación</h2>

      <FormField label="Efectivo declarado" id="efectivo-declarado" error={error} ayuda="Contá el efectivo de la caja e ingresalo" requerido>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-texto-suave text-sm" aria-hidden="true">
            $
          </span>
          <Input
            id="efectivo-declarado"
            ref={campoRef}
            inputMode="decimal"
            autoComplete="off"
            placeholder="0,00"
            value={texto}
            error={Boolean(error)}
            disabled={deshabilitado}
            onChange={(e) => onTexto(e.target.value)}
            className="pl-8"
          />
        </div>
      </FormField>

      <div className="flex flex-col gap-2 bg-fondo border border-gray-800 rounded-xl p-4">
        <Fila titulo="Efectivo calculado" valor={importe(calculado)} />
        <Fila titulo="Efectivo declarado" valor={hayMonto ? importe(declarado) : '—'} />
        <Fila titulo="Diferencia" valor={hayMonto ? diferenciaConSigno(diferencia) : '—'} clase={descuadrada ? 'text-error' : ''} />
        <div className="flex justify-between items-center gap-4 text-sm pt-2 border-t border-gray-800">
          <span className="text-texto-suave">Estado de la caja</span>
          {estado ? <EstadoBadge tipo="cierre" estado={estado} /> : <span aria-label="Sin estado todavía">—</span>}
        </div>
      </div>

      {descuadrada && (
        <div className="flex flex-col gap-3">
          <Alert variante="error" titulo={faltaOSobra(diferencia)}>
            Calculado {importe(calculado)} · Declarado {importe(declarado)} · Diferencia {diferenciaConSigno(diferencia)}
          </Alert>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to={enlaceMovimientos}
              className="font-outfit inline-flex items-center justify-center px-6 py-2 rounded-lg font-semibold bg-panel border border-gray-800 text-texto hover:border-viper transition-colors"
            >
              Revisar movimientos
            </Link>
            <Button variante="neutro" onClick={recontar}>
              Recontar efectivo
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Button onClick={onCerrar} disabled={deshabilitado} variante={descuadrada ? 'peligro' : 'primario'}>
          {descuadrada ? 'Cerrar igualmente' : 'Cerrar caja'}
        </Button>
        {descuadrada && <p className="text-xs text-texto-suave">Si cerrás igualmente, la caja queda con estado «Descuadrado».</p>}
      </div>
    </section>
  )
}