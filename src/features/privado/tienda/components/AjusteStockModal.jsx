import { useState } from 'react'
import { post } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import BottomSheet from '../../../../shared/components/BottomSheet'
import Button from '../../../../shared/components/Button'
import FormField from '../../../../shared/components/FormField'
import Input from '../../../../shared/components/Input'
import { ETIQUETA_CATEGORIA, MOTIVO_MAXIMO_AJUSTE, STOCK_MAXIMO_AJUSTE, textoStock } from '../tienda'

const SENTIDOS = [
  { valor: 'sumar', texto: 'Sumar' },
  { valor: 'restar', texto: 'Restar' },
]

// Ajuste manual del stock de un producto: reposición (suma) o corrección (resta), siempre con su motivo.
// Muestra el stock actual y el que va a quedar antes de confirmar, y no deja confirmar si quedaría por debajo de cero.
// `producto` = fila del catálogo (o null con el panel cerrado). `onAjustado(id, stockNuevo)` avisa que se guardó;
// `onStockDesactualizado(id, stock)` avisa que el stock real es otro (alguien lo cambió mientras tanto).
export default function AjusteStockModal({ producto, onCerrar, onAjustado, onStockDesactualizado }) {
  if (!producto) return null
  // key: cada producto abre el panel con los campos en blanco
  return <Formulario key={producto.id} producto={producto} onCerrar={onCerrar} onAjustado={onAjustado} onStockDesactualizado={onStockDesactualizado} />
}

function Formulario({ producto, onCerrar, onAjustado, onStockDesactualizado }) {
  const [sentido, setSentido] = useState('sumar')
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState('')
  const [stockActual, setStockActual] = useState(producto.stockActual)
  const [errores, setErrores] = useState({})
  const [alerta, setAlerta] = useState(null)
  const [enviando, setEnviando] = useState(false)

  const numero = /^\d+$/.test(cantidad.trim()) ? Number(cantidad.trim()) : null
  const firmada = numero === null ? null : sentido === 'restar' ? -numero : numero
  const resultante = firmada === null ? null : stockActual + firmada
  const quedaNegativo = resultante !== null && resultante < 0

  const cambiarCantidad = (e) => {
    setCantidad(e.target.value)
    setErrores((previos) => ({ ...previos, cantidad: undefined }))
  }
  const cambiarMotivo = (e) => {
    setMotivo(e.target.value)
    setErrores((previos) => ({ ...previos, motivo: undefined }))
  }

  const confirmar = async (evento) => {
    evento.preventDefault()
    setAlerta(null)
    const conError = {}
    if (!cantidad.trim()) conError.cantidad = 'Completá este campo'
    else if (numero === null || numero === 0 || numero > STOCK_MAXIMO_AJUSTE) conError.cantidad = `Ingresá un número entero de 1 a ${STOCK_MAXIMO_AJUSTE.toLocaleString('es-AR')}`
    else if (quedaNegativo) conError.cantidad = 'El stock no puede quedar negativo'
    if (!motivo.trim()) conError.motivo = 'Indicá el motivo del ajuste'
    if (Object.keys(conError).length > 0) {
      setErrores(conError)
      document.getElementById(conError.cantidad ? 'cantidad' : 'motivo')?.focus()
      return
    }

    setEnviando(true)
    try {
      const r = await post(`/productos/${producto.id}/stock`, { cantidad: firmada, motivo: motivo.trim().replace(/\s+/g, ' ') })
      onAjustado(producto.id, r.stockActual)
    } catch (error) {
      if (error.status === 409 && error.campo === 'cantidad') {
        // Otro ajuste o una venta cambió el stock: se muestra el real para que la persona decida
        const real = error.datos?.stockActual
        if (typeof real === 'number') {
          setStockActual(real)
          onStockDesactualizado?.(producto.id, real)
        }
        setErrores({ cantidad: 'El stock no puede quedar negativo' })
        setAlerta({ titulo: 'El stock cambió mientras tanto', texto: typeof real === 'number' ? `Ahora hay ${textoStock(real)}. Revisá la cantidad.` : undefined })
      } else if (error.status === 404) {
        setAlerta({ titulo: 'Este producto ya no existe', texto: 'Cerrá esta ventana y actualizá el catálogo.' })
      } else if (error.campo === 'cantidad' || error.campo === 'motivo') {
        setErrores({ [error.campo]: error.mensaje })
      } else {
        setAlerta({ titulo: 'No pudimos ajustar el stock', texto: error.mensaje })
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <BottomSheet abierto titulo="Ajustar stock" onCerrar={enviando ? () => {} : onCerrar}>
      <form onSubmit={confirmar} noValidate className="flex flex-col gap-5">
        <div className="bg-fondo border border-gray-800 rounded-xl px-4 py-3">
          <p className="text-sm font-semibold break-words">{producto.nombre}</p>
          <p className="text-xs text-texto-suave mt-1">
            {ETIQUETA_CATEGORIA[producto.categoria]} · Stock actual: <span className="tabular-nums">{textoStock(stockActual)}</span>
          </p>
        </div>

        {alerta && (
          <Alert variante="error" titulo={alerta.titulo}>
            {alerta.texto}
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-1 bg-fondo border border-gray-800 rounded-lg p-1" role="group" aria-label="Tipo de ajuste">
          {SENTIDOS.map(({ valor, texto }) => (
            <button
              key={valor}
              type="button"
              aria-pressed={sentido === valor}
              disabled={enviando}
              onClick={() => setSentido(valor)}
              className={`py-2 rounded-md text-sm transition-colors cursor-pointer border ${sentido === valor ? 'bg-viper/15 border-viper text-viper font-semibold' : 'border-transparent text-texto-suave hover:text-texto'}`}
            >
              {texto}
            </button>
          ))}
        </div>

        <FormField label="Cantidad de unidades" id="cantidad" requerido error={errores.cantidad}>
          <Input id="cantidad" name="cantidad" inputMode="numeric" autoComplete="off" placeholder="0" className="tabular-nums" value={cantidad} onChange={cambiarCantidad} error={Boolean(errores.cantidad)} disabled={enviando} />
        </FormField>

        <FormField label="Motivo" id="motivo" requerido error={errores.motivo} ayuda="Por ejemplo: reposición de mercadería, corrección de inventario, rotura">
          <Input id="motivo" name="motivo" maxLength={MOTIVO_MAXIMO_AJUSTE} autoComplete="off" placeholder="Motivo del ajuste" value={motivo} onChange={cambiarMotivo} error={Boolean(errores.motivo)} disabled={enviando} />
        </FormField>

        <p className={`text-sm ${quedaNegativo ? 'text-error' : 'text-texto-suave'}`} aria-live="polite">
          Stock resultante: <span className="font-semibold tabular-nums">{resultante === null ? '—' : quedaNegativo ? `${resultante} u.` : textoStock(resultante)}</span>
        </p>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
          <Button type="button" variante="neutro" onClick={onCerrar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" cargando={enviando} disabled={quedaNegativo}>
            Confirmar ajuste
          </Button>
        </div>
      </form>
    </BottomSheet>
  )
}