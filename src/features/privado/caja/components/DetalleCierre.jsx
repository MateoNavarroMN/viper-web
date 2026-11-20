import { useEffect, useState } from 'react'
import { get } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import BottomSheet from '../../../../shared/components/BottomSheet'
import Button from '../../../../shared/components/Button'
import Spinner from '../../../../shared/components/Spinner'
import { ETIQUETA_CONCEPTO, ETIQUETA_METODO_PAGO, diaConNombre, horaDelMovimiento, importeConSigno } from '../caja'
import DatosDelCierre from './DatosDelCierre'

// Detalle de un cierre del historial: lo que quedó registrado (el mismo resultado que se vio al cerrar) y los movimientos que
// quedaron cerrados con él. Se monta con `key={id}`.
export default function DetalleCierre({ id, onCerrar }) {
  const [reintento, setReintento] = useState(0)
  const [respuesta, setRespuesta] = useState(null) // { clave, datos, error }
  const clave = `${id}|${reintento}`
  const cargando = respuesta?.clave !== clave

  useEffect(() => {
    let vigente = true
    get(`/caja/cierres/${id}`)
      .then((datos) => vigente && setRespuesta({ clave, datos }))
      .catch((e) => vigente && setRespuesta({ clave, error: e.mensaje }))
    return () => {
      vigente = false
    }
  }, [id, clave])

  const datos = respuesta?.datos
  return (
    <BottomSheet abierto titulo={datos ? `Cierre del ${diaConNombre(datos.cierre.fecha)}` : 'Detalle del cierre'} onCerrar={onCerrar}>
      {cargando ? (
        <div className="py-10 flex justify-center">
          <Spinner texto="Cargando el cierre" />
        </div>
      ) : respuesta.error ? (
        <div className="flex flex-col gap-4">
          <Alert variante="error" titulo="No pudimos cargar el cierre">
            {respuesta.error}
          </Alert>
          <div className="flex gap-3 justify-end">
            <Button variante="secundario" onClick={onCerrar}>
              Cerrar
            </Button>
            <Button onClick={() => setReintento((n) => n + 1)}>Reintentar</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <DatosDelCierre cierre={datos.cierre} />
          <section aria-label="Movimientos del cierre" className="flex flex-col gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-texto-suave">Movimientos del cierre</h3>
            {datos.movimientos.length === 0 && <p className="text-sm text-texto-suave">Este cierre no tiene movimientos asociados.</p>}
            <ul className="flex flex-col divide-y divide-gray-800 border border-gray-800 rounded-xl">
              {datos.movimientos.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-4 px-4 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {ETIQUETA_CONCEPTO[m.concepto]} · {horaDelMovimiento(m.fechaHora)}
                    </p>
                    <p className="text-xs text-texto-suave truncate">{[ETIQUETA_METODO_PAGO[m.metodoPago], m.descripcion].filter(Boolean).join(' · ')}</p>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums whitespace-nowrap ${m.tipo === 'INGRESO' ? 'text-exito' : 'text-error'}`}>{importeConSigno(m)}</span>
                </li>
              ))}
            </ul>
          </section>
          <div className="flex justify-end">
            <Button variante="secundario" onClick={onCerrar}>
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </BottomSheet>
  )
}