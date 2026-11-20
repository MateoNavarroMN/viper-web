import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { get } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Badge from '../../../../shared/components/Badge'
import Button from '../../../../shared/components/Button'
import Spinner from '../../../../shared/components/Spinner'
import ImagenProducto from '../../tienda/components/ImagenProducto'
import { ETIQUETA_CATEGORIA } from '../../tienda/tienda'
import { precio } from '../../torneos/torneos'
import { RUTA_TIENDA_JUGADOR } from '../tiendaJugador'

// Detalle de un producto de la tienda del Jugador: solo para mirar (no hay compra ni alquiler desde la app). Si el producto se dio
// de baja mientras se lo miraba, la API responde 404 y se vuelve al listado con un aviso; el listado se pide de nuevo al abrirse.
export default function DetalleProducto() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [estado, setEstado] = useState({ id: null, producto: null, error: null })
  const [reintento, setReintento] = useState(0)

  useEffect(() => {
    let vigente = true
    get(`/tienda/catalogo/${encodeURIComponent(id)}`)
      .then((r) => vigente && setEstado({ id, producto: r.producto, error: null }))
      .catch((e) => {
        if (!vigente) return
        if (e.status === 404) navigate(RUTA_TIENDA_JUGADOR, { replace: true, state: { aviso: e.mensaje } })
        else setEstado({ id, producto: null, error: e.mensaje })
      })
    return () => {
      vigente = false
    }
  }, [id, reintento, navigate])

  // «Volver» regresa al listado tal como estaba (con sus filtros). Si se entró directo al enlace, va al listado.
  const volver = () => (location.key !== 'default' ? navigate(-1) : navigate(RUTA_TIENDA_JUGADOR))
  const cargando = estado.id !== id
  const { producto, error } = estado

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <Button variante="neutro" onClick={volver}>← Volver a la tienda</Button>
      </div>

      {cargando ? (
        <div className="py-16 flex justify-center">
          <Spinner texto="Cargando producto" />
        </div>
      ) : error ? (
        <Alert variante="error" titulo="No pudimos cargar el producto">
          {error}{' '}
          <button type="button" onClick={() => { setEstado({ id: null, producto: null, error: null }); setReintento((n) => n + 1) }} className="underline font-semibold cursor-pointer">
            Reintentar
          </button>
        </Alert>
      ) : (
        <article className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-start">
          <ImagenProducto key={producto.imagenUrl ?? 'sin-imagen'} url={producto.imagenUrl} className="w-full aspect-square" />

          <div className="flex flex-col gap-4 min-w-0">
            <div>
              <p className="text-sm text-texto-suave">{ETIQUETA_CATEGORIA[producto.categoria]}</p>
              <h1 className="font-outfit text-[28px] font-bold break-words">{producto.nombre}</h1>
            </div>

            <p className="font-outfit text-3xl font-bold tabular-nums">{precio(producto.precio)}</p>

            <div className="flex flex-wrap gap-2">
              <Badge variante={producto.disponible ? 'exito' : 'error'}>{producto.disponible ? 'Disponible' : 'Sin stock'}</Badge>
              {producto.alquilable && <Badge variante="info">Alquilable</Badge>}
            </div>

            {producto.alquilable && (
              <div className="bg-panel border border-gray-800 rounded-xl p-4">
                <p className="text-sm text-texto-suave">Precio de alquiler</p>
                <p className="font-outfit text-xl font-bold tabular-nums">
                  {precio(producto.precioAlquiler)} <span className="text-sm font-normal text-texto-suave">por turno</span>
                </p>
              </div>
            )}

            <Alert variante="info">La compra y el alquiler se realizan en el mostrador del club.</Alert>
          </div>
        </article>
      )}
    </div>
  )
}