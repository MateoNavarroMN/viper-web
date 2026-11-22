import { useAuth } from '../../auth/useAuth'
import Cartelera from '../components/Cartelera'
import MiRanking from '../components/MiRanking'

// Inicio del Portal del Jugador: un panel con un bloque por tema. Cada bloque pide sus datos por su cuenta, así que si uno falla
// los demás se siguen viendo. Hoy: novedades del club y ranking; los próximos partidos, los torneos y las cuotas se suman después.
export default function Inicio() {
  const { usuario } = useAuth()
  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="font-outfit text-[28px] font-bold">Hola, {usuario.nombre}</h1>
        <p className="text-texto-suave text-sm mt-1">Tu portal: novedades del club y tu ranking</p>
      </div>
      <Cartelera limite={3} />
      <MiRanking />
    </div>
  )
}