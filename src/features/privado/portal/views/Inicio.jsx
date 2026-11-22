import { useAuth } from '../../auth/useAuth'
import Cartelera from '../components/Cartelera'
import BloqueCuotas from '../components/BloqueCuotas'
import MiRanking from '../components/MiRanking'
import ProximosPartidos from '../components/ProximosPartidos'
import TorneosEnCurso from '../components/TorneosEnCurso'

// Inicio del Portal del Jugador: un panel con un bloque por tema. Cada bloque pide sus datos por su cuenta, así que si uno falla
// los demás se siguen viendo: novedades del club, ranking, próximos partidos, torneos en curso y cuotas.
export default function Inicio() {
  const { usuario } = useAuth()
  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="font-outfit text-[28px] font-bold">Hola, {usuario.nombre}</h1>
        <p className="text-texto-suave text-sm mt-1">Tu portal: novedades, ranking, partidos, torneos y cuotas</p>
      </div>
      <Cartelera limite={3} />
      <MiRanking />
      <ProximosPartidos />
      <TorneosEnCurso />
      <BloqueCuotas />
    </div>
  )
}