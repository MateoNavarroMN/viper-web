// Helpers de la sección Tienda (catálogo y punto de venta).

export const ETIQUETA_CATEGORIA = { PRO_SHOP: 'Pro-Shop', BUFFET: 'Buffet' }

export const OPCIONES_CATEGORIA_PRODUCTO = [
  { valor: '', texto: 'Categoría: Todas' },
  { valor: 'PRO_SHOP', texto: 'Pro-Shop' },
  { valor: 'BUFFET', texto: 'Buffet' },
]

export const OPCIONES_ESTADO_PRODUCTO = [
  { valor: '', texto: 'Estado: Todos' },
  { valor: 'ACTIVO', texto: 'Activo' },
  { valor: 'INACTIVO', texto: 'Inactivo' },
]

// Con este stock o menos se avisa que queda poco (el mismo límite que usará el Dashboard)
export const STOCK_BAJO = 5

// 10 → '10 u.' · 0 → 'Sin stock'
export const textoStock = (stock) => (stock === 0 ? 'Sin stock' : `${stock} u.`)

// Color del stock: sin stock en rojo, poco stock en ámbar
export const claseStock = (stock) => (stock === 0 ? 'text-error' : stock <= STOCK_BAJO ? 'text-advertencia' : '')

// Rutas de la sección (alta y edición solo para el Administrador)
export const RUTA_TIENDA = '/gestion/tienda'
export const RUTA_NUEVO_PRODUCTO = '/gestion/tienda/productos/nuevo'
export const rutaEditarProducto = (id) => `/gestion/tienda/productos/${id}/editar`

// Imagen del producto: mismos límites que valida la API
export const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp']
export const TAMANIO_MAXIMO_IMAGEN = 2 * 1024 * 1024 // 2 MB

// Revisa el archivo elegido antes de mostrarlo. Devuelve el texto del problema, o null si está bien.
// (La API vuelve a revisarlo por su cuenta: esto solo evita esperar a que se suba para enterarse.)
export const problemaDeImagen = (archivo) => {
  if (!TIPOS_IMAGEN.includes(archivo.type)) return 'La imagen debe ser JPG, PNG o WebP'
  if (archivo.size > TAMANIO_MAXIMO_IMAGEN) return 'La imagen no puede superar los 2 MB'
  return null
}

// Números con punto decimal para mandar a la API (1500.5 → '1500.5')
export const montoParaApi = (numero) => String(numero)

// Límites del ajuste manual de stock (los mismos que valida la API)
export const STOCK_MAXIMO_AJUSTE = 1000000
export const MOTIVO_MAXIMO_AJUSTE = 200