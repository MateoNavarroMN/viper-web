import { useReducer } from 'react'

// Carrito del punto de venta. Cada línea guarda lo necesario del producto al momento de agregarlo (nombre, precio, stock) y:
//   cantidad  → la última cantidad válida (es la que cuenta para el total y la que se manda a la API)
//   borrador  → lo que hay escrito en el campo de cantidad (puede estar a medias o mal)
//   error     → motivo por el que el borrador no se aplicó (cantidad no entera, o más que el stock)
// Una cantidad inválida nunca modifica la línea: se avisa y se conserva la última válida.

const MENSAJE_ENTERO = 'Ingresá un número entero mayor a cero'
const MENSAJE_MAXIMO = (stock) => `Máximo ${stock} u.`

const cambiarLinea = (lineas, id, cambios) => lineas.map((l) => (l.productoId === id ? { ...l, ...cambios } : l))

function reducir(lineas, accion) {
  switch (accion.tipo) {
    case 'agregar': {
      const { producto } = accion
      return [
        ...lineas,
        {
          productoId: producto.id,
          nombre: producto.nombre,
          categoria: producto.categoria,
          imagenUrl: producto.imagenUrl,
          precio: producto.precio,
          stock: producto.stockActual,
          cantidad: 1,
          borrador: '1',
          error: null,
        },
      ]
    }
    case 'fijar': // cantidad válida (desde los botones + / −)
      return cambiarLinea(lineas, accion.id, { cantidad: accion.cantidad, borrador: String(accion.cantidad), error: null })
    case 'error': // el campo no se pudo aplicar: se conserva la cantidad anterior
      return cambiarLinea(lineas, accion.id, { borrador: accion.borrador ?? undefined, error: accion.mensaje })
    case 'escribir': // lo tipeado era válido: se aplica
      return cambiarLinea(lineas, accion.id, { cantidad: accion.cantidad, borrador: accion.borrador, error: null })
    case 'soltar': // al salir del campo, vuelve a mostrar la cantidad que vale
      return lineas.map((l) => (l.productoId === accion.id ? { ...l, borrador: String(l.cantidad), error: null } : l))
    case 'quitar':
      return lineas.filter((l) => l.productoId !== accion.id)
    case 'vaciar':
      return []
    default:
      return lineas
  }
}

// Devuelve el carrito y sus acciones. `agregar` responde 'AGREGADO' | 'MAXIMO' (ya está todo el stock en el carrito) | 'SIN_STOCK'.
export function useCarrito() {
  const [lineas, dispatch] = useReducer(reducir, [])

  const agregar = (producto) => {
    if (producto.stockActual < 1) return 'SIN_STOCK'
    const existente = lineas.find((l) => l.productoId === producto.id)
    if (!existente) {
      dispatch({ tipo: 'agregar', producto })
      return 'AGREGADO'
    }
    if (existente.cantidad + 1 > existente.stock) {
      dispatch({ tipo: 'error', id: existente.productoId, mensaje: MENSAJE_MAXIMO(existente.stock), borrador: String(existente.cantidad) })
      return 'MAXIMO'
    }
    dispatch({ tipo: 'fijar', id: existente.productoId, cantidad: existente.cantidad + 1 })
    return 'AGREGADO'
  }

  // Botones + y −: sumar o restar una unidad. Restar desde 1 no hace nada (para sacar el producto está «Quitar»).
  const sumar = (id, delta) => {
    const linea = lineas.find((l) => l.productoId === id)
    if (!linea) return
    const nueva = linea.cantidad + delta
    if (nueva < 1) return
    if (nueva > linea.stock) dispatch({ tipo: 'error', id, mensaje: MENSAJE_MAXIMO(linea.stock), borrador: String(linea.cantidad) })
    else dispatch({ tipo: 'fijar', id, cantidad: nueva })
  }

  // Campo de cantidad: se aplica solo si es un entero mayor a cero que el stock alcanza a cubrir
  const escribir = (id, texto) => {
    const linea = lineas.find((l) => l.productoId === id)
    if (!linea) return
    const limpio = texto.trim()
    if (!/^\d+$/.test(limpio) || Number(limpio) < 1) {
      dispatch({ tipo: 'error', id, mensaje: MENSAJE_ENTERO, borrador: texto })
    } else if (Number(limpio) > linea.stock) {
      dispatch({ tipo: 'error', id, mensaje: `Stock insuficiente: hay ${linea.stock} u. y pediste ${Number(limpio)}`, borrador: texto })
    } else {
      dispatch({ tipo: 'escribir', id, cantidad: Number(limpio), borrador: texto })
    }
  }

  const soltar = (id) => dispatch({ tipo: 'soltar', id })
  const quitar = (id) => dispatch({ tipo: 'quitar', id })
  const vaciar = () => dispatch({ tipo: 'vaciar' })

  // El total se suma en centavos para no arrastrar errores de decimales
  const total = lineas.reduce((suma, l) => suma + Math.round(l.precio * 100) * l.cantidad, 0) / 100
  const unidades = lineas.reduce((suma, l) => suma + l.cantidad, 0)

  return { lineas, total, unidades, agregar, sumar, escribir, soltar, quitar, vaciar }
}