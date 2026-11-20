import { ETIQUETA_CONCEPTO, importe } from '../caja'

function Linea({ texto, valor, claseValor = '', destacada = false }) {
  return (
    <div className={`flex justify-between gap-4 ${destacada ? 'font-bold text-base pt-2 border-t border-gray-800' : 'text-sm'}`}>
      <span className={destacada ? '' : 'text-texto-suave'}>{texto}</span>
      <span className={`tabular-nums whitespace-nowrap ${claseValor}`}>{valor}</span>
    </div>
  )
}

function Bloque({ titulo, children }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-bold uppercase tracking-wide text-texto-suave">{titulo}</h3>
      {children}
    </div>
  )
}

// La cuenta de la jornada: lo que entró y salió en efectivo (de ahí sale el efectivo que tendría que haber en la caja) y lo
// que entró por medios digitales. `resumen` es la respuesta de /caja/cierre/resumen.
export default function ResumenJornada({ resumen }) {
  const ingresos = resumen.porConcepto.filter((c) => c.tipo === 'INGRESO')
  const egresos = resumen.porConcepto.filter((c) => c.tipo === 'EGRESO')
  const enEfectivo = (lista) => lista.filter((c) => c.efectivo > 0)
  const digitales = ingresos.filter((c) => c.digital > 0)

  return (
    <section aria-label="Resumen de la jornada" className="bg-panel border border-gray-800 rounded-2xl p-5 md:p-6 flex flex-col gap-6">
      <h2 className="font-outfit text-lg font-bold">Resumen de la jornada</h2>

      <Bloque titulo="Efectivo">
        <Linea texto="Ingresos en efectivo" valor={importe(resumen.ingresosEfectivo)} claseValor="text-exito" />
        {enEfectivo(ingresos).map((c) => (
          <p key={`i-${c.concepto}`} className="flex justify-between gap-4 text-xs text-texto-suave pl-4">
            <span>{ETIQUETA_CONCEPTO[c.concepto]}</span>
            <span className="tabular-nums">{importe(c.efectivo)}</span>
          </p>
        ))}
        <Linea texto="Egresos en efectivo" valor={`− ${importe(resumen.egresosEfectivo)}`} claseValor="text-error" />
        {enEfectivo(egresos).map((c) => (
          <p key={`e-${c.concepto}`} className="flex justify-between gap-4 text-xs text-texto-suave pl-4">
            <span>{ETIQUETA_CONCEPTO[c.concepto]}</span>
            <span className="tabular-nums">{importe(c.efectivo)}</span>
          </p>
        ))}
        <Linea texto="Efectivo calculado" valor={importe(resumen.efectivoCalculado)} destacada />
      </Bloque>

      <Bloque titulo="Digital">
        {digitales.length === 0 && <p className="text-sm text-texto-suave">No hubo cobros por transferencia ni Mercado Pago.</p>}
        {digitales.map((c) => (
          <Linea key={c.concepto} texto={ETIQUETA_CONCEPTO[c.concepto]} valor={importe(c.digital)} />
        ))}
        <Linea texto="Total digital" valor={importe(resumen.totalDigital)} destacada />
        {resumen.egresosDigital > 0 && (
          <p className="text-xs text-texto-suave">
            Además se pagaron {importe(resumen.egresosDigital)} por transferencia: no afectan el efectivo de la caja.
          </p>
        )}
      </Bloque>
    </section>
  )
}