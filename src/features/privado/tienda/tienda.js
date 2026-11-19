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