import { Link, useNavigate } from 'react-router-dom'
import { post } from '../../../../shared/api/client'
import { useToast } from '../../../../shared/hooks/useToast'
import FormularioComunicado from '../components/FormularioComunicado'

const INICIAL = { titulo: '', mensaje: '', alcance: 'TODOS' }

// Redactar un comunicado nuevo (solo Administrador): se guarda como borrador o se publica en la cartelera del Portal del Jugador.
export default function NuevoComunicado() {
  const navigate = useNavigate()
  const { mostrarToast } = useToast()

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <Link to="/gestion/comunicados" className="text-sm text-texto-suave hover:text-viper transition-colors inline-flex items-center gap-1 w-fit">
        <span aria-hidden="true">‹</span> Volver a comunicados
      </Link>
      <div>
        <h1 className="font-outfit text-[28px] font-bold">Nuevo comunicado</h1>
        <p className="text-texto-suave text-sm mt-1">Redactá el aviso y elegí a quiénes se muestra</p>
      </div>
      <FormularioComunicado
        inicial={INICIAL}
        guardar={(datos) => post('/comunicados', datos)}
        onTerminar={(accion, respuesta) => {
          mostrarToast(respuesta.mensaje)
          navigate('/gestion/comunicados', { replace: true })
        }}
        onCancelar={() => navigate('/gestion/comunicados')}
      />
    </div>
  )
}