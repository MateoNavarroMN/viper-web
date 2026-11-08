import { useCallback, useEffect, useRef, useState } from 'react'
import { post } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import FormField from '../../../../shared/components/FormField'
import Input from '../../../../shared/components/Input'
import Modal from '../../../../shared/components/Modal'
import { precio } from '../../torneos/torneos'
import { ETIQUETA_METODO_PAGO, fechaDeHoy, nombrePeriodo } from '../socios'

const MEDIOS = ['EFECTIVO', 'TRANSFERENCIA'] // Mercado Pago llega con el pago en línea del jugador
const FECHA_MINIMA = '2020-01-01'

// Modal «Registrar pago» de una cuota pendiente (CU 4.2 · A1). Se monta al abrirlo, así cada vez empieza de cero.
// `onRegistrado(cuota, situacionCuotas)` avisa que el pago quedó registrado; `onYaPagada(mensaje)`, que la cuota ya
// no está pendiente (alguien se adelantó) y hay que refrescar el listado.
export default function RegistrarPago({ cuota, onCerrar, onRegistrado, onYaPagada }) {
  const hoy = fechaDeHoy()
  const [metodoPago, setMetodoPago] = useState('EFECTIVO')
  const [fechaPago, setFechaPago] = useState(hoy)
  const [errorFecha, setErrorFecha] = useState('')
  const [alerta, setAlerta] = useState('')
  const [enviando, setEnviando] = useState(false)

  const cerrar = () => {
    if (!enviando) onCerrar()
  }
  // El Modal vuelve a enfocar el panel cada vez que cambia `onCerrar`; con una función estable no le roba el foco al campo
  const cerrarActual = useRef(cerrar)
  useEffect(() => {
    cerrarActual.current = cerrar
  })
  const alCerrar = useCallback(() => cerrarActual.current(), [])

  const validarFecha = () => {
    if (!fechaPago) return 'Campo obligatorio'
    if (fechaPago > hoy) return 'La fecha de pago no puede ser futura'
    if (fechaPago < FECHA_MINIMA) return 'La fecha de pago no es válida'
    return ''
  }

  const confirmar = async (e) => {
    e.preventDefault()
    const mensaje = validarFecha()
    setErrorFecha(mensaje)
    if (mensaje) {
      setAlerta('Revisá los campos marcados antes de continuar')
      return
    }

    setAlerta('')
    setEnviando(true)
    try {
      const r = await post(`/cuotas/${cuota.id}/pago`, { metodoPago, fechaPago })
      onRegistrado(r.cuota, r.situacionCuotas)
    } catch (error) {
      if (error.campo === 'fechaPago') {
        setErrorFecha(error.mensaje)
        setAlerta('Revisá los campos marcados antes de continuar')
      } else if (error.status === 409 || error.status === 404) {
        // Otra persona ya la pagó (o la cuota ya no existe): se cierra el modal y el listado se refresca
        onYaPagada(error.mensaje)
      } else {
        setAlerta(error.mensaje)
      }
      setEnviando(false)
    }
  }

  return (
    <Modal abierto titulo="Registrar pago" onCerrar={alCerrar}>
      <form noValidate onSubmit={confirmar} className="flex flex-col gap-5">
        <div className="-mt-2">
          <p className="text-sm text-texto-suave">
            {cuota.nombre} {cuota.apellido} · {nombrePeriodo(cuota.mes, cuota.anio)}
          </p>
          <p className="text-sm font-semibold mt-1">Monto: {precio(Number(cuota.monto))}</p>
        </div>

        {alerta && <Alert variante="error">{alerta}</Alert>}

        <fieldset className="flex flex-col gap-5" disabled={enviando}>
          <FormField label="Medio de pago" id="pago-medio" requerido>
            <div id="pago-medio" role="radiogroup" aria-label="Medio de pago" className="grid grid-cols-2 gap-1 p-1 bg-fondo border border-gray-800 rounded-lg">
              {MEDIOS.map((medio) => {
                const activo = metodoPago === medio
                return (
                  <button
                    key={medio}
                    type="button"
                    role="radio"
                    aria-checked={activo}
                    onClick={() => setMetodoPago(medio)}
                    className={`rounded-md border py-2 text-sm font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-viper ${
                      activo ? 'bg-viper/10 border-viper text-viper' : 'border-transparent text-texto-suave hover:text-texto'
                    }`}
                  >
                    {ETIQUETA_METODO_PAGO[medio]}
                  </button>
                )
              })}
            </div>
          </FormField>

          <FormField label="Fecha de pago" id="pago-fecha" requerido error={errorFecha}>
            <Input
              id="pago-fecha"
              type="date"
              max={hoy}
              value={fechaPago}
              error={Boolean(errorFecha)}
              onChange={(e) => {
                setFechaPago(e.target.value)
                setErrorFecha('')
              }}
            />
          </FormField>
        </fieldset>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-5 border-t border-gray-800">
          <Button variante="neutro" onClick={cerrar} disabled={enviando} className="py-3">
            Cancelar
          </Button>
          <Button type="submit" cargando={enviando} className="py-3">
            Confirmar pago
          </Button>
        </div>
      </form>
    </Modal>
  )
}