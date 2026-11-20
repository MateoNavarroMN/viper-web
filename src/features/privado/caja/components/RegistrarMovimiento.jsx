import { useState } from 'react'
import { post } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import FormField from '../../../../shared/components/FormField'
import Input from '../../../../shared/components/Input'
import Modal from '../../../../shared/components/Modal'
import Select from '../../../../shared/components/Select'
import { useToast } from '../../../../shared/hooks/useToast'
import { leerPrecio } from '../../torneos/torneos'
import { montoParaApi } from '../../tienda/tienda'
import { DESCRIPCION_MAXIMA, OPCIONES_CONCEPTO_COBRO, OPCIONES_CONCEPTO_EGRESO, OPCIONES_MEDIO_REGISTRO } from '../caja'
import BuscarOrigen from './BuscarOrigen'

const TIPOS = [
  { clave: 'COBRO', texto: 'Cobro' },
  { clave: 'EGRESO', texto: 'Egreso' },
]

// Formulario «Registrar movimiento» (Recepción y Administrador): un cobro de una reserva, inscripción o cuota (el importe y el
// cliente salen del origen elegido y no se editan) o un egreso (proveedor, servicios u otro gasto).
// Se monta al abrirlo y se desmonta al cerrarlo: cancelar descarta todo lo cargado.
// onRegistrado(respuesta) se llama cuando la API lo guardó.
export default function RegistrarMovimiento({ onCerrar, onRegistrado }) {
  const { mostrarToast } = useToast()
  const [tipo, setTipo] = useState('COBRO')
  const [concepto, setConcepto] = useState('RESERVA')
  const [origen, setOrigen] = useState(null) // { cliente, origen }
  const [monto, setMonto] = useState('')
  const [metodoPago, setMetodoPago] = useState('EFECTIVO')
  const [descripcion, setDescripcion] = useState('')
  const [errores, setErrores] = useState({})
  const [avisoGeneral, setAvisoGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [recarga, setRecarga] = useState(0)

  const esCobro = tipo === 'COBRO'
  const quitarError = (campo) => setErrores((previos) => ({ ...previos, [campo]: undefined }))

  const cambiarTipo = (nuevo) => {
    if (nuevo === tipo) return
    setTipo(nuevo)
    setConcepto(nuevo === 'COBRO' ? 'RESERVA' : 'PROVEEDOR')
    setOrigen(null)
    setErrores({})
    setAvisoGeneral('')
  }
  const cambiarConcepto = (nuevo) => {
    setConcepto(nuevo)
    setOrigen(null)
    quitarError('origenId')
    setAvisoGeneral('')
  }

  const guardar = async (e) => {
    e.preventDefault()
    const conError = {}
    const texto = descripcion.trim()
    const montoNumero = leerPrecio(monto)
    if (esCobro) {
      if (!origen) conError.origenId = 'Elegí qué se está cobrando'
    } else {
      if (!montoNumero) conError.monto = monto.trim() ? 'Ingresá un monto mayor a cero, con hasta dos decimales' : 'Completá este campo'
      if (!texto) conError.descripcion = 'Ingresá una descripción del movimiento'
    }
    if (texto.length > DESCRIPCION_MAXIMA) conError.descripcion = `La descripción no puede superar los ${DESCRIPCION_MAXIMA} caracteres`
    setErrores(conError)
    setAvisoGeneral('')
    if (Object.keys(conError).length > 0) return

    const cuerpo = esCobro
      ? { tipo: 'INGRESO', concepto, origenId: origen.origen.id, metodoPago, ...(texto && { descripcion: texto }) }
      : { tipo: 'EGRESO', concepto, monto: montoParaApi(montoNumero), metodoPago, descripcion: texto }

    setEnviando(true)
    try {
      const respuesta = await post('/caja/movimientos', cuerpo)
      mostrarToast(respuesta.situacionCuotas === 'AL_DIA' ? 'Movimiento registrado correctamente. El socio quedó al día.' : 'Movimiento registrado correctamente')
      onRegistrado(respuesta)
    } catch (error) {
      if (error.campo === 'origenId') {
        // El origen ya no se puede cobrar (ya pagado, vencido, cancelado...): se dice por qué y se vuelve a buscar para ver cómo está ahora
        setErrores({ origenId: error.mensaje })
        setOrigen(null)
        setRecarga((n) => n + 1)
      } else if (error.campo) {
        setErrores({ [error.campo]: error.mensaje })
      } else {
        setAvisoGeneral(error.mensaje) // por ejemplo, la caja de hoy ya fue cerrada
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal abierto titulo="Registrar movimiento" onCerrar={() => !enviando && onCerrar()}>
      <form onSubmit={guardar} noValidate className="flex flex-col gap-5">
        {avisoGeneral && <Alert variante="error">{avisoGeneral}</Alert>}

        <div role="group" aria-label="Tipo de movimiento" className="grid grid-cols-2 gap-2 bg-fondo border border-gray-800 rounded-xl p-1">
          {TIPOS.map(({ clave, texto }) => (
            <button
              key={clave}
              type="button"
              aria-pressed={tipo === clave}
              disabled={enviando}
              onClick={() => cambiarTipo(clave)}
              className={`rounded-lg py-2 text-sm font-semibold transition-colors cursor-pointer ${tipo === clave ? 'bg-viper text-sobre-viper' : 'text-texto-suave hover:text-texto'}`}
            >
              {texto}
            </button>
          ))}
        </div>

        <FormField label={esCobro ? '¿Qué se cobra?' : 'Concepto'} id="concepto" requerido error={errores.concepto}>
          <Select id="concepto" opciones={esCobro ? OPCIONES_CONCEPTO_COBRO : OPCIONES_CONCEPTO_EGRESO} value={concepto} onChange={(e) => cambiarConcepto(e.target.value)} disabled={enviando} />
        </FormField>

        {esCobro ? (
          <div className="flex flex-col gap-2">
            <span className="text-[13px] text-texto-suave">
              Cliente y origen<span className="text-viper ml-1" aria-hidden="true">*</span>
            </span>
            <BuscarOrigen key={concepto} concepto={concepto} valor={origen} onElegir={(v) => { setOrigen(v); quitarError('origenId') }} error={errores.origenId} recarga={recarga} disabled={enviando} />
          </div>
        ) : (
          <FormField label="Monto" id="monto" requerido error={errores.monto}>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-texto-suave text-sm" aria-hidden="true">$</span>
              <Input
                id="monto"
                inputMode="decimal"
                autoComplete="off"
                placeholder="0,00"
                className="pl-8 tabular-nums"
                value={monto}
                error={Boolean(errores.monto)}
                disabled={enviando}
                onChange={(e) => {
                  const limpio = e.target.value.replace(/[^0-9.,]/g, '')
                  setMonto(limpio)
                  quitarError('monto')
                }}
              />
            </div>
          </FormField>
        )}

        <FormField label="Medio de pago" id="metodoPago" requerido error={errores.metodoPago}>
          <Select id="metodoPago" opciones={OPCIONES_MEDIO_REGISTRO} value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} disabled={enviando} />
        </FormField>

        <FormField
          label="Descripción"
          id="descripcion"
          requerido={!esCobro}
          error={errores.descripcion}
          ayuda={esCobro ? 'Opcional: si la dejás vacía se arma sola con los datos del cobro' : `Hasta ${DESCRIPCION_MAXIMA} caracteres`}
        >
          <Input
            id="descripcion"
            autoComplete="off"
            placeholder={esCobro ? 'Por ejemplo: pagó en el mostrador' : 'Por ejemplo: bebidas del buffet'}
            maxLength={DESCRIPCION_MAXIMA + 50}
            value={descripcion}
            error={Boolean(errores.descripcion)}
            disabled={enviando}
            onChange={(e) => {
              setDescripcion(e.target.value)
              quitarError('descripcion')
            }}
          />
        </FormField>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button type="button" variante="secundario" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" cargando={enviando}>
            Registrar movimiento
          </Button>
        </div>
      </form>
    </Modal>
  )
}