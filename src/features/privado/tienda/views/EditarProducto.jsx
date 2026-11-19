import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { get, patch } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import Spinner from '../../../../shared/components/Spinner'
import { useToast } from '../../../../shared/hooks/useToast'
import FormularioProducto from '../components/FormularioProducto'
import { RUTA_TIENDA } from '../tienda'

// Editar un producto (solo Administrador): foto, nombre, categoría, precios y alquiler. El stock y el estado se manejan desde el catálogo.
export default function EditarProducto() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { mostrarToast } = useToast()
  const [estado, setEstado] = useState({ cargando: true, producto: null, noExiste: false, error: null })
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    get(`/productos/${id}`)
      .then((r) => vigente && setEstado({ cargando: false, producto: r.producto, noExiste: false, error: null }))
      .catch((e) => vigente && setEstado({ cargando: false, producto: null, noExiste: e.status === 404, error: e.status === 404 ? null : e.mensaje }))
    return () => {
      vigente = false
    }
  }, [id, intento])

  const { cargando, producto, noExiste, error } = estado

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <Link to={RUTA_TIENDA} className="text-sm text-texto-suave hover:text-viper transition-colors inline-flex items-center gap-1 w-fit">
        <span aria-hidden="true">‹</span> Volver al catálogo
      </Link>

      {cargando ? (
        <div className="py-16 flex justify-center"><Spinner texto="Cargando el producto" /></div>
      ) : noExiste ? (
        <Alert variante="error" titulo="Producto no encontrado">
          No existe un producto con ese enlace.{' '}
          <Button variante="neutro" onClick={() => navigate(RUTA_TIENDA)} className="ml-2">Volver al catálogo</Button>
        </Alert>
      ) : error ? (
        <Alert variante="error" titulo="No pudimos cargar el producto">
          {error}{' '}
          <Button variante="neutro" onClick={() => { setEstado((p) => ({ ...p, cargando: true })); setIntento((n) => n + 1) }} className="ml-2">Reintentar</Button>
        </Alert>
      ) : (
        <>
          <div>
            <h1 className="font-outfit text-[28px] font-bold">Editar producto</h1>
            <p className="text-texto-suave text-sm mt-1">Cambiá los datos de {producto.nombre}.</p>
          </div>
          <FormularioProducto
            modo="edicion"
            inicial={{ ...producto, precio: producto.precio, precioAlquiler: producto.precioAlquiler ?? '' }}
            textoGuardar="Guardar cambios"
            guardar={(datos) => patch(`/productos/${id}`, datos)}
            onTerminar={() => {
              mostrarToast('Producto actualizado correctamente')
              navigate(RUTA_TIENDA, { replace: true })
            }}
            onCancelar={() => navigate(RUTA_TIENDA)}
          />
        </>
      )}
    </div>
  )
}