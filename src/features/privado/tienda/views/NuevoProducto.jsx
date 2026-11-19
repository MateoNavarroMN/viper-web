import { Link, useNavigate } from 'react-router-dom'
import { post } from '../../../../shared/api/client'
import { useToast } from '../../../../shared/hooks/useToast'
import FormularioProducto from '../components/FormularioProducto'
import { RUTA_TIENDA } from '../tienda'

const INICIAL = { imagenUrl: null, nombre: '', categoria: '', precio: '', stockActual: '', disponibleParaAlquiler: false, precioAlquiler: '', activo: true }

// Cargar un producto nuevo al catálogo (solo Administrador). Queda activo y con el stock inicial indicado.
export default function NuevoProducto() {
  const navigate = useNavigate()
  const { mostrarToast } = useToast()

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <Link to={RUTA_TIENDA} className="text-sm text-texto-suave hover:text-viper transition-colors inline-flex items-center gap-1 w-fit">
        <span aria-hidden="true">‹</span> Volver al catálogo
      </Link>
      <div>
        <h1 className="font-outfit text-[28px] font-bold">Nuevo producto</h1>
        <p className="text-texto-suave text-sm mt-1">El producto queda activo y disponible en el punto de venta.</p>
      </div>
      <FormularioProducto
        inicial={INICIAL}
        guardar={(datos) => post('/productos', datos)}
        onTerminar={() => {
          mostrarToast('Producto registrado correctamente')
          navigate(RUTA_TIENDA, { replace: true })
        }}
        onCancelar={() => navigate(RUTA_TIENDA)}
      />
    </div>
  )
}