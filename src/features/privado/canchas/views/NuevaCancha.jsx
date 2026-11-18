import { Link, useNavigate } from 'react-router-dom'
import { post } from '../../../../shared/api/client'
import { useToast } from '../../../../shared/hooks/useToast'
import FormularioCancha from '../components/FormularioCancha'
import { SUPERFICIE_INICIAL } from '../canchas'

const INICIAL = { nombre: '', deporte: 'TENIS', tipoSuperficie: SUPERFICIE_INICIAL.TENIS, precioHora: '' }

// Registrar una cancha nueva (solo Administrador). Queda activa y aparece en la grilla de reservas con sus franjas libres.
export default function NuevaCancha() {
  const navigate = useNavigate()
  const { mostrarToast } = useToast()

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <Link to="/admin/canchas" className="text-sm text-texto-suave hover:text-viper transition-colors inline-flex items-center gap-1 w-fit">
        <span aria-hidden="true">‹</span> Volver a canchas y tarifas
      </Link>
      <div>
        <h1 className="font-outfit text-[28px] font-bold">Registrar una cancha nueva</h1>
        <p className="text-texto-suave text-sm mt-1">La cancha queda activa y aparece en la grilla de reservas.</p>
      </div>
      <FormularioCancha
        inicial={INICIAL}
        guardar={(datos) => post('/canchas', datos)}
        onTerminar={() => {
          mostrarToast('Cancha registrada correctamente')
          navigate('/admin/canchas', { replace: true })
        }}
        onCancelar={() => navigate('/admin/canchas')}
      />
    </div>
  )
}