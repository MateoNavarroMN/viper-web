import { useSearchParams } from 'react-router-dom'
import EnConstruccion from '../../../../shared/components/EnConstruccion'
import Tabs from '../../../../shared/components/Tabs'
import { useAuth } from '../../auth/useAuth'
import ListadoProductos from '../components/ListadoProductos'

// El catálogo lo gestiona solo el Administrador; el punto de venta, el personal de recepción (el Administrador incluido).
const PESTANAS = [
  { clave: 'catalogo', titulo: 'Catálogo', roles: ['ADMINISTRADOR'] },
  { clave: 'punto-venta', titulo: 'Punto de venta' },
]

const ENCABEZADOS = {
  catalogo: { titulo: 'Catálogo de artículos', texto: 'Productos del Pro-Shop y del buffet, con su precio y stock' },
  'punto-venta': { titulo: 'Punto de venta', texto: 'Registrá las ventas del Pro-Shop y del buffet' },
}

// Sección Tienda. La pestaña activa vive en la URL (?pestana=punto-venta); cada pestaña guarda sus propios filtros en la misma
// URL, así que al cambiar de pestaña se empieza de cero. Cada rol ve solo sus pestañas y entra por la primera.
export default function Tienda() {
  const { rol } = useAuth()
  const [parametros, setParametros] = useSearchParams()
  const pestanas = PESTANAS.filter((p) => !p.roles || p.roles.includes(rol))
  const activa = pestanas.find((p) => p.clave === parametros.get('pestana'))?.clave ?? pestanas[0].clave
  const { titulo, texto } = ENCABEZADOS[activa]

  const cambiarPestana = (clave) => {
    if (clave === activa) return
    setParametros(clave === pestanas[0].clave ? new URLSearchParams() : new URLSearchParams({ pestana: clave }))
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 pb-24 md:pb-0">
      <div>
        <h1 className="font-outfit text-[28px] font-bold">{titulo}</h1>
        <p className="text-texto-suave text-sm mt-1">{texto}</p>
      </div>

      <Tabs pestanas={pestanas} activa={activa} onCambiar={cambiarPestana} />

      {/* El punto de venta se arma en M5-FE-04 */}
      {activa === 'catalogo' ? <ListadoProductos /> : <EnConstruccion titulo="Punto de venta" />}
    </div>
  )
}