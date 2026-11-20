import { useEffect, useMemo, useState } from 'react'
import { get, post } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import BottomSheet from '../../../../shared/components/BottomSheet'
import Button from '../../../../shared/components/Button'
import ConfirmDialog from '../../../../shared/components/ConfirmDialog'
import Spinner from '../../../../shared/components/Spinner'
import { useMediaQuery } from '../../../../shared/hooks/useMediaQuery'
import { useToast } from '../../../../shared/hooks/useToast'
import { useAuth } from '../../auth/useAuth'
import { normalizar, precio } from '../../torneos/torneos'
import { useCarrito } from '../useCarrito'
import CarritoVenta from './CarritoVenta'
import PieVenta from './PieVenta'
import ProductoVenta from './ProductoVenta'
import ResumenVenta from './ResumenVenta'

const CATEGORIAS = [
  { valor: '', texto: 'Todos' },
  { valor: 'PRO_SHOP', texto: 'Pro-Shop' },
  { valor: 'BUFFET', texto: 'Buffet' },
]

// Pestaña «Punto de venta» (Recepcionista y Administrador): los productos activos a la izquierda y la venta actual a la derecha
// (en el celular, un panel que sube desde abajo). Los productos se piden una vez; la búsqueda y la categoría filtran en pantalla.
// Confirmar registra la venta en la API (caja, detalle y stock en una sola operación): se muestra el resumen, se vacía el carrito y
// se vuelve a pedir la lista para ver el stock nuevo. Si la API la rechaza o falla, el carrito se conserva para corregir o reintentar.
export default function PuntoDeVenta() {
  const { mostrarToast } = useToast()
  const { usuario } = useAuth()
  const esEscritorio = useMediaQuery('(min-width: 768px)')
  const carrito = useCarrito()
  const [estado, setEstado] = useState({ cargando: true, productos: [], error: null })
  const [reintento, setReintento] = useState(0)
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState('')
  const [panelAbierto, setPanelAbierto] = useState(false)
  const [metodoPago, setMetodoPago] = useState('EFECTIVO')
  const [enviando, setEnviando] = useState(false)
  const [alerta, setAlerta] = useState(null) // { titulo, texto } de lo que salió mal al confirmar
  const [fallo, setFallo] = useState(false) // el último intento falló por un error de registro: el botón pasa a «Reintentar»
  const [venta, setVenta] = useState(null) // resumen de la última venta registrada
  const [cancelando, setCancelando] = useState(false)

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

  // Cualquier cambio en el carrito deja atrás el aviso anterior y el resumen de la venta ya registrada
  const empezarOtra = () => {
    setVenta(null)
    setAlerta(null)
    setFallo(false)
  }

  const agregar = (producto) => {
    empezarOtra()
    const resultado = carrito.agregar(producto)
    if (resultado === 'MAXIMO') mostrarToast(`Ya agregaste todo el stock disponible de ${producto.nombre}`, 'advertencia')
  }

  const nombreOperador = `${usuario.nombre} ${usuario.apellido}`

  const confirmar = async () => {
    if (enviando || carrito.lineas.length === 0 || carrito.hayPendientes) return
    setAlerta(null)
    setEnviando(true)
    try {
      const r = await post('/pos/ventas', { lineas: carrito.lineas.map((l) => ({ productoId: l.productoId, cantidad: l.cantidad })), metodoPago })
      setVenta(r.venta)
      setFallo(false)
      carrito.vaciar()
      setReintento((n) => n + 1) // el stock cambió: se vuelve a pedir la lista
      mostrarToast('Venta registrada correctamente')
    } catch (error) {
      setFallo(false)
      if (error.status === 409 && Array.isArray(error.datos?.lineas)) {
        // El stock cambió desde que se agregó el producto: se marcan las líneas a corregir y no se registra nada
        carrito.marcarProblemas(error.datos.lineas)
        const primera = error.datos.lineas[0]
        const texto = error.datos.lineas
          .map((l) => (l.motivo === 'NO_DISPONIBLE' ? `${l.nombre ?? 'Un producto'} ya no está disponible.` : `${l.nombre}: ahora quedan ${l.stockDisponible} u. y el carrito tiene ${l.cantidad}.`))
          .join(' ')
        setAlerta({ titulo: 'No se pudo confirmar la venta', texto: primera ? texto : error.mensaje })
        setReintento((n) => n + 1)
      } else if (error.status === 409 || error.status === 400) {
        // Caja cerrada o un dato que la API no aceptó: el carrito queda como estaba
        setAlerta({ titulo: 'No se pudo confirmar la venta', texto: error.mensaje })
      } else {
        // Error del servidor o sin conexión: no se registró nada y el carrito se conserva
        setFallo(true)
        setAlerta({ titulo: 'No se pudo registrar la venta', texto: 'No se guardó el movimiento ni se descontó stock. Tu carrito se conservó: podés reintentar.' })
      }
    } finally {
      setEnviando(false)
    }
  }

  const hayFiltros = Boolean(busqueda.trim() || categoria)
  const limpiar = () => {
    setBusqueda('')
    setCategoria('')
  }

  // La venta actual: el carrito con su pie, o el resumen de la venta recién registrada
  const panelVenta = venta ? (
    <ResumenVenta venta={venta} operador={nombreOperador} onNueva={empezarOtra} />
  ) : (
    <CarritoVenta carrito={carrito}>
      <PieVenta carrito={carrito} metodoPago={metodoPago} onMetodo={setMetodoPago} enviando={enviando} alerta={alerta} reintentar={fallo} onConfirmar={confirmar} onCancelar={() => setCancelando(true)} />
    </CarritoVenta>
  )

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
      <aside className="hidden lg:block bg-panel border border-gray-800 rounded-2xl p-6 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
        <h2 className="font-outfit text-lg font-bold mb-4">Venta actual</h2>
        {panelVenta}
      </aside>

      {/* Celular: barra fija abajo que abre la venta actual */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 p-4 bg-fondo/90 backdrop-blur border-t border-gray-800 z-30">
        <Button onClick={() => setPanelAbierto(true)} className="w-full justify-between">
          <span>{carrito.lineas.length === 0 ? 'Ver venta' : `Ver venta (${carrito.lineas.length} ${carrito.lineas.length === 1 ? 'producto' : 'productos'})`}</span>
          <span className="tabular-nums">{carrito.total > 0 ? precio(carrito.total) : '$ 0,00'}</span>
        </Button>
      </div>
      <BottomSheet abierto={panelAbierto} titulo="Venta actual" onCerrar={() => setPanelAbierto(false)}>
        {panelVenta}
      </BottomSheet>
      <ConfirmDialog
        abierto={cancelando}
        posicion={esEscritorio ? 'centro' : 'abajo-movil'}
        titulo="¿Cancelar la venta?"
        mensaje="Se va a vaciar el carrito y no se va a registrar ningún movimiento."
        textoConfirmar="Cancelar venta"
        textoCancelar="Seguir vendiendo"
        onCancelar={() => setCancelando(false)}
        onConfirmar={() => {
          carrito.vaciar()
          empezarOtra()
          setCancelando(false)
        }}
      />
    </div>
  )
}