import { useEffect, useMemo, useState } from 'react'
import { get } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import BottomSheet from '../../../../shared/components/BottomSheet'
import Button from '../../../../shared/components/Button'
import Spinner from '../../../../shared/components/Spinner'
import { useToast } from '../../../../shared/hooks/useToast'
import { normalizar, precio } from '../../torneos/torneos'
import { useCarrito } from '../useCarrito'
import CarritoVenta from './CarritoVenta'
import ProductoVenta from './ProductoVenta'

const CATEGORIAS = [
  { valor: '', texto: 'Todos' },
  { valor: 'PRO_SHOP', texto: 'Pro-Shop' },
  { valor: 'BUFFET', texto: 'Buffet' },
]

// Pestaña «Punto de venta» (Recepcionista y Administrador): los productos activos a la izquierda y la venta actual a la derecha
// (en el celular, un panel que sube desde abajo). Los productos se piden una vez; la búsqueda y la categoría filtran en pantalla.
// El medio de pago y la confirmación de la venta se agregan en M5-FE-05.
export default function PuntoDeVenta() {
  const { mostrarToast } = useToast()
  const carrito = useCarrito()
  const [estado, setEstado] = useState({ cargando: true, productos: [], error: null })
  const [reintento, setReintento] = useState(0)
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState('')
  const [panelAbierto, setPanelAbierto] = useState(false)

  useEffect(() => {
    let vigente = true
    get('/pos/productos')
      .then((r) => vigente && setEstado({ cargando: false, productos: r.productos, error: null }))
      .catch((e) => vigente && setEstado({ cargando: false, productos: [], error: e.mensaje }))
    return () => {
      vigente = false
    }
  }, [reintento])

  const { cargando, productos, error } = estado
  const visibles = useMemo(() => {
    const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean)
    return productos.filter((p) => (!categoria || p.categoria === categoria) && palabras.every((palabra) => normalizar(p.nombre).includes(palabra)))
  }, [productos, busqueda, categoria])
  const enCarrito = (id) => carrito.lineas.find((l) => l.productoId === id)?.cantidad ?? 0

  const agregar = (producto) => {
    const resultado = carrito.agregar(producto)
    if (resultado === 'MAXIMO') mostrarToast(`Ya agregaste todo el stock disponible de ${producto.nombre}`, 'advertencia')
  }

  const hayFiltros = Boolean(busqueda.trim() || categoria)
  const limpiar = () => {
    setBusqueda('')
    setCategoria('')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_22rem] gap-6 items-start">
      <div className="flex flex-col gap-4 min-w-0">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1 sm:max-w-sm">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-texto-suave pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              aria-label="Buscar producto"
              placeholder="Buscar producto"
              maxLength={100}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-fondo text-texto placeholder:text-texto-suave border border-gray-800 focus:border-viper rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none transition-colors"
            />
          </div>
          <div role="group" aria-label="Filtrar por categoría" className="grid grid-cols-3 gap-1 bg-fondo border border-gray-800 rounded-lg p-1 sm:w-72">
            {CATEGORIAS.map(({ valor, texto }) => (
              <button
                key={valor}
                type="button"
                aria-pressed={categoria === valor}
                onClick={() => setCategoria(valor)}
                className={`py-2 rounded-md text-sm transition-colors cursor-pointer border ${categoria === valor ? 'bg-viper/15 border-viper text-viper font-semibold' : 'border-transparent text-texto-suave hover:text-texto'}`}
              >
                {texto}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <Alert variante="error" titulo="No pudimos cargar los productos">
            {error}{' '}
            <button type="button" onClick={() => { setEstado((p) => ({ ...p, cargando: true, error: null })); setReintento((n) => n + 1) }} className="underline font-semibold cursor-pointer">
              Reintentar
            </button>
          </Alert>
        ) : cargando ? (
          <div className="py-16 flex justify-center">
            <Spinner texto="Cargando productos" />
          </div>
        ) : visibles.length === 0 ? (
          <div className="bg-panel border border-gray-800 rounded-2xl px-6 py-12 text-center flex flex-col items-center gap-3">
            <h2 className="font-outfit text-lg font-bold">{productos.length === 0 ? 'No hay productos para vender' : 'No se encontraron productos'}</h2>
            <p className="text-texto-suave text-sm">
              {productos.length === 0 ? 'El Administrador tiene que cargar productos en el catálogo.' : 'Probá con otro nombre o quitá los filtros.'}
            </p>
            {hayFiltros && <Button variante="secundario" onClick={limpiar}>Limpiar filtros</Button>}
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-3">
            {visibles.map((producto) => (
              <ProductoVenta key={producto.id} producto={producto} enCarrito={enCarrito(producto.id)} onAgregar={agregar} />
            ))}
          </ul>
        )}
      </div>

      {/* Escritorio: la venta actual queda a la vista al costado */}
      <aside className="hidden lg:block bg-panel border border-gray-800 rounded-2xl p-6 lg:sticky lg:top-6">
        <h2 className="font-outfit text-lg font-bold mb-4">Venta actual</h2>
        <CarritoVenta carrito={carrito} />
      </aside>

      {/* Celular: barra fija abajo que abre la venta actual */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 p-4 bg-fondo/90 backdrop-blur border-t border-gray-800 z-30">
        <Button onClick={() => setPanelAbierto(true)} className="w-full justify-between">
          <span>{carrito.lineas.length === 0 ? 'Ver venta' : `Ver venta (${carrito.lineas.length} ${carrito.lineas.length === 1 ? 'producto' : 'productos'})`}</span>
          <span className="tabular-nums">{carrito.total > 0 ? precio(carrito.total) : '$ 0,00'}</span>
        </Button>
      </div>
      <BottomSheet abierto={panelAbierto} titulo="Venta actual" onCerrar={() => setPanelAbierto(false)}>
        <CarritoVenta carrito={carrito} />
      </BottomSheet>
    </div>
  )
}