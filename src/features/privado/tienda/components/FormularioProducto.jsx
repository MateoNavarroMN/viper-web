import { useEffect, useRef, useState } from 'react'
import Alert from '../../../../shared/components/Alert'
import Badge from '../../../../shared/components/Badge'
import Button from '../../../../shared/components/Button'
import Checkbox from '../../../../shared/components/Checkbox'
import ConfirmDialog from '../../../../shared/components/ConfirmDialog'
import FormField from '../../../../shared/components/FormField'
import Input from '../../../../shared/components/Input'
import Select from '../../../../shared/components/Select'
import { useMediaQuery } from '../../../../shared/hooks/useMediaQuery'
import { leerPrecio, textoDePrecio } from '../../canchas/canchas'
import { OPCIONES_CATEGORIA_PRODUCTO, TIPOS_IMAGEN, montoParaApi, problemaDeImagen, textoStock } from '../tienda'
import ImagenProducto from './ImagenProducto'

const CAMPOS = ['imagen', 'nombre', 'categoria', 'precio', 'stockActual', 'precioAlquiler']
const NOMBRE_MAXIMO = 80
const STOCK_MAXIMO = 1000000
const ETIQUETA_CAMPO = 'text-[13px] text-texto-suave'
const OPCIONES_CATEGORIA = OPCIONES_CATEGORIA_PRODUCTO.filter((o) => o.valor)

const limpiarNombre = (texto) => texto.trim().replace(/\s+/g, ' ')

// Campo de monto con el signo «$» adelante (se muestra con coma decimal al salir del campo)
function CampoMonto({ id, valor, onChange, onBlur, error, disabled }) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-texto-suave text-sm" aria-hidden="true">$</span>
      <Input id={id} name={id} inputMode="decimal" autoComplete="off" placeholder="0,00" className="pl-8 tabular-nums" value={valor} onChange={onChange} onBlur={onBlur} error={error} disabled={disabled} />
    </div>
  )
}

// Formulario de un producto (alta y edición).
// `inicial` = { imagenUrl, nombre, categoria, precio (número o ''), stockActual, disponibleParaAlquiler, precioAlquiler (número o ''), activo }.
// `guardar(formData)` hace el pedido a la API (multipart) y devuelve la promesa; si la API rechaza, el error trae `campo` y `mensaje`.
// `onTerminar()` se llama cuando se guardó bien; `onCancelar()` cuando se vuelve al catálogo sin guardar.
// - El stock se carga solo al crear el producto; después se ajusta desde el catálogo, con motivo.
// - Guardar sin cambios no hace ningún pedido. Con cambios sin guardar, «Cancelar» pide confirmación.
// - Todo error se muestra sin perder lo escrito: arriba el aviso y, en cada campo, su motivo.
export default function FormularioProducto({ modo = 'alta', inicial, guardar, onTerminar, onCancelar, textoGuardar = 'Guardar producto' }) {
  const [valores, setValores] = useState(() => ({
    nombre: inicial.nombre,
    categoria: inicial.categoria,
    precio: inicial.precio === '' ? '' : textoDePrecio(inicial.precio),
    stock: String(inicial.stockActual),
    alquilable: inicial.disponibleParaAlquiler,
    precioAlquiler: inicial.precioAlquiler === '' ? '' : textoDePrecio(inicial.precioAlquiler),
  }))
  const [archivo, setArchivo] = useState(null) // imagen nueva elegida (File)
  const [previa, setPrevia] = useState(null) // dirección temporal para mostrar el archivo elegido
  const [quitarImagen, setQuitarImagen] = useState(false)
  const [errores, setErrores] = useState({})
  const [alerta, setAlerta] = useState(null) // { titulo, texto }
  const [enviando, setEnviando] = useState(false)
  const [descartar, setDescartar] = useState(false)
  const formulario = useRef(null)
  const selector = useRef(null)
  const esEscritorio = useMediaQuery('(min-width: 768px)')
  const posicion = esEscritorio ? 'centro' : 'abajo-movil'

  // La dirección temporal de la vista previa se libera al cambiarla y al salir de la pantalla
  useEffect(() => () => previa && URL.revokeObjectURL(previa), [previa])

  const nombreLimpio = limpiarNombre(valores.nombre)
  const precioNumero = leerPrecio(valores.precio)
  const alquilerNumero = leerPrecio(valores.precioAlquiler)
  const hayCambios =
    nombreLimpio !== inicial.nombre ||
    valores.categoria !== inicial.categoria ||
    precioNumero !== (inicial.precio === '' ? null : inicial.precio) ||
    valores.alquilable !== inicial.disponibleParaAlquiler ||
    (valores.alquilable && alquilerNumero !== (inicial.precioAlquiler === '' ? null : inicial.precioAlquiler)) ||
    archivo !== null ||
    quitarImagen ||
    (modo === 'alta' && valores.stock.trim() !== String(inicial.stockActual))

  const cambiar = (campo) => (evento) => {
    const valor = evento.target.value
    setValores((previos) => ({ ...previos, [campo]: valor }))
    if (errores[campo]) setErrores((previos) => ({ ...previos, [campo]: undefined }))
  }
  const alCerrarMonto = (campo) => () => {
    const numero = leerPrecio(valores[campo])
    if (numero !== null) setValores((previos) => ({ ...previos, [campo]: textoDePrecio(numero) }))
  }

  const alternarAlquiler = () => {
    setValores((previos) => ({ ...previos, alquilable: !previos.alquilable }))
    setErrores((previos) => ({ ...previos, precioAlquiler: undefined }))
  }

  const elegirImagen = (evento) => {
    const elegido = evento.target.files?.[0]
    evento.target.value = '' // permite volver a elegir el mismo archivo después de quitarlo
    if (!elegido) return
    const problema = problemaDeImagen(elegido)
    if (problema) {
      setErrores((previos) => ({ ...previos, imagen: problema })) // la imagen anterior se conserva
      return
    }
    setErrores((previos) => ({ ...previos, imagen: undefined }))
    setArchivo(elegido)
    setPrevia(URL.createObjectURL(elegido))
    setQuitarImagen(false)
  }

  // «Quitar» descarta la imagen recién elegida o, si no había ninguna elegida, marca la guardada para borrarla
  const quitar = () => {
    setErrores((previos) => ({ ...previos, imagen: undefined }))
    if (archivo) {
      setArchivo(null)
      setPrevia(null)
    } else {
      setQuitarImagen(true)
    }
  }

  const urlMostrada = archivo ? previa : quitarImagen ? null : inicial.imagenUrl
  const campoEnfocable = (campo) => formulario.current?.querySelector(campo === 'imagen' ? '#imagen-elegir' : `[name="${campo}"]`)
  const enfocarPrimerError = (conError) => {
    const primero = CAMPOS.find((campo) => conError[campo])
    if (primero) campoEnfocable(primero)?.focus()
  }

  const validar = () => {
    const conError = {}
    if (!nombreLimpio) conError.nombre = 'Completá este campo'
    else if (nombreLimpio.length > NOMBRE_MAXIMO) conError.nombre = `El nombre admite hasta ${NOMBRE_MAXIMO} caracteres`
    if (!valores.categoria) conError.categoria = 'Elegí una categoría'
    if (!valores.precio.trim()) conError.precio = 'Completá este campo'
    else if (precioNumero === null) conError.precio = 'Ingresá un monto mayor o igual a cero'
    if (modo === 'alta') {
      const stock = valores.stock.trim()
      if (!stock) conError.stockActual = 'Completá este campo'
      else if (!/^\d+$/.test(stock) || Number(stock) > STOCK_MAXIMO) conError.stockActual = `Ingresá un número entero de 0 a ${STOCK_MAXIMO.toLocaleString('es-AR')}`
    }
    if (valores.alquilable) {
      if (!valores.precioAlquiler.trim()) conError.precioAlquiler = 'Ingresá el precio de alquiler por turno'
      else if (!alquilerNumero) conError.precioAlquiler = 'Ingresá un monto mayor a cero'
    }
    return conError
  }

  const enviar = async (evento) => {
    evento.preventDefault()
    setAlerta(null)
    const conError = validar()
    if (Object.keys(conError).length > 0) {
      setErrores(conError)
      setAlerta({ titulo: 'Revisá los campos marcados antes de continuar' })
      enfocarPrimerError(conError)
      return
    }
    // En edición, sin cambios no hay nada que guardar
    if (modo === 'edicion' && !hayCambios) {
      onCancelar()
      return
    }
    setErrores({})
    setEnviando(true)
    try {
      const datos = new FormData()
      datos.append('nombre', nombreLimpio)
      datos.append('precio', montoParaApi(precioNumero))
      datos.append('categoria', valores.categoria)
      if (modo === 'alta') datos.append('stockActual', valores.stock.trim())
      datos.append('disponibleParaAlquiler', String(valores.alquilable))
      if (valores.alquilable) datos.append('precioAlquiler', montoParaApi(alquilerNumero))
      if (archivo) datos.append('imagen', archivo)
      else if (quitarImagen) datos.append('quitarImagen', 'true')
      await guardar(datos)
      onTerminar()
    } catch (error) {
      if (error.status === 409 && error.campo === 'nombre') {
        setErrores({ nombre: 'Ya existe un producto activo con ese nombre en la categoría' })
        setAlerta({ titulo: 'Ya existe un producto activo con ese nombre en la categoría', texto: 'Cambiá el nombre o la categoría para poder guardar.' })
        enfocarPrimerError({ nombre: true })
      } else if (error.campo && CAMPOS.includes(error.campo)) {
        setErrores({ [error.campo]: error.mensaje })
        setAlerta({ titulo: error.campo === 'imagen' ? 'No pudimos usar la imagen' : 'Revisá los campos marcados antes de continuar', texto: error.campo === 'imagen' ? 'Probá con otra imagen o guardá el producto sin imagen.' : undefined })
        enfocarPrimerError({ [error.campo]: true })
      } else {
        setAlerta({ titulo: 'No pudimos guardar el producto', texto: error.mensaje })
      }
    } finally {
      setEnviando(false)
    }
  }

  const cancelar = () => (hayCambios ? setDescartar(true) : onCancelar())

  return (
    <>
      <form ref={formulario} onSubmit={enviar} noValidate className="bg-panel border border-gray-800 rounded-2xl p-6 md:p-8 flex flex-col gap-6 min-w-0">
        {alerta && (
          <Alert variante="error" titulo={alerta.titulo}>
            {alerta.texto}
          </Alert>
        )}

        <div className="flex flex-col gap-2">
          <span id="imagen-etiqueta" className={ETIQUETA_CAMPO}>Imagen del producto</span>
          <div className="flex items-center gap-4">
            <ImagenProducto key={urlMostrada ?? 'sin-imagen'} url={urlMostrada} className="w-24 h-24" />
            <div className="flex flex-col items-start gap-2 min-w-0">
              <input ref={selector} type="file" accept={TIPOS_IMAGEN.join(',')} onChange={elegirImagen} disabled={enviando} className="sr-only" tabIndex={-1} aria-labelledby="imagen-etiqueta" />
              <div className="flex flex-wrap gap-2">
                <Button id="imagen-elegir" type="button" variante="neutro" onClick={() => selector.current?.click()} disabled={enviando}>
                  {urlMostrada ? 'Cambiar imagen' : 'Elegir imagen'}
                </Button>
                {urlMostrada && (
                  <Button type="button" variante="peligro-borde" onClick={quitar} disabled={enviando}>
                    Quitar
                  </Button>
                )}
              </div>
              {errores.imagen ? (
                <p role="alert" className="text-error text-xs">{errores.imagen}</p>
              ) : (
                <p className="text-texto-suave text-xs">Opcional · JPG, PNG o WebP · hasta 2 MB</p>
              )}
            </div>
          </div>
        </div>

        <FormField label="Nombre del producto" id="nombre" requerido error={errores.nombre}>
          <Input id="nombre" name="nombre" placeholder="Nombre del producto" maxLength={NOMBRE_MAXIMO} autoComplete="off" value={valores.nombre} onChange={cambiar('nombre')} error={Boolean(errores.nombre)} disabled={enviando} />
        </FormField>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
          <FormField label="Categoría" id="categoria" requerido error={errores.categoria}>
            <Select id="categoria" name="categoria" opciones={OPCIONES_CATEGORIA} placeholder="Elegí una categoría" value={valores.categoria} onChange={cambiar('categoria')} error={Boolean(errores.categoria)} disabled={enviando} />
          </FormField>
          <FormField label="Precio de venta" id="precio" requerido error={errores.precio}>
            <CampoMonto id="precio" valor={valores.precio} onChange={cambiar('precio')} onBlur={alCerrarMonto('precio')} error={Boolean(errores.precio)} disabled={enviando} />
          </FormField>
        </div>

        {modo === 'alta' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <FormField label="Stock inicial" id="stockActual" requerido error={errores.stockActual} ayuda="Unidades disponibles hoy">
              <Input id="stockActual" name="stockActual" inputMode="numeric" autoComplete="off" placeholder="0" className="tabular-nums" value={valores.stock} onChange={cambiar('stock')} error={Boolean(errores.stockActual)} disabled={enviando} />
            </FormField>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
            <div className="flex flex-col gap-2">
              <span className={ETIQUETA_CAMPO}>Stock actual</span>
              <p className="bg-fondo border border-gray-800 rounded-lg px-4 py-3 text-sm tabular-nums">{textoStock(inicial.stockActual)}</p>
              <p className="text-texto-suave text-xs">El stock se ajusta desde el catálogo, con su motivo</p>
            </div>
            <div className="flex flex-col gap-2">
              <span className={ETIQUETA_CAMPO}>Estado</span>
              <div><Badge variante={inicial.activo ? 'exito' : 'neutro'}>{inicial.activo ? 'Activo' : 'Inactivo'}</Badge></div>
              <p className="text-texto-suave text-xs">Se da de baja o se reactiva desde el catálogo</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4 bg-fondo border border-gray-800 rounded-xl p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox name="disponibleParaAlquiler" checked={valores.alquilable} onChange={alternarAlquiler} disabled={enviando} />
            <span className="text-sm">
              Disponible para alquiler
              <span className="block text-texto-suave text-xs mt-1">Se podrá sumar a una reserva de cancha (por ejemplo, una raqueta) con su precio por turno.</span>
            </span>
          </label>
          {valores.alquilable && (
            <div className="sm:max-w-xs">
              <FormField label="Precio de alquiler por turno" id="precioAlquiler" requerido error={errores.precioAlquiler}>
                <CampoMonto id="precioAlquiler" valor={valores.precioAlquiler} onChange={cambiar('precioAlquiler')} onBlur={alCerrarMonto('precioAlquiler')} error={Boolean(errores.precioAlquiler)} disabled={enviando} />
              </FormField>
            </div>
          )}
        </div>

        {modo === 'edicion' && <p className="text-texto-suave text-xs -mt-2">Un precio nuevo rige para las ventas futuras: las ventas ya registradas conservan el suyo.</p>}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-2 max-md:sticky max-md:bottom-0 max-md:-mx-6 max-md:px-6 max-md:py-3 max-md:bg-panel max-md:border-t max-md:border-gray-800 max-md:rounded-b-2xl">
          <Button type="button" variante="neutro" onClick={cancelar} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" cargando={enviando}>
            {textoGuardar}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        abierto={descartar}
        posicion={posicion}
        titulo="¿Descartar cambios?"
        mensaje="Si salís ahora, vas a perder los cambios sin guardar."
        textoCancelar="Seguir editando"
        textoConfirmar="Descartar"
        onCancelar={() => setDescartar(false)}
        onConfirmar={() => {
          setDescartar(false)
          onCancelar()
        }}
      />
    </>
  )
}