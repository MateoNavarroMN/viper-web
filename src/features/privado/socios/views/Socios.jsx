import { useSearchParams } from 'react-router-dom'
import Tabs from '../../../../shared/components/Tabs'
import ListadoCuotas from '../components/ListadoCuotas'
import ListadoSocios from '../components/ListadoSocios'
import { periodoActual } from '../socios'

const PESTANAS = [
  { clave: 'socios', titulo: 'Socios' },
  { clave: 'cuotas', titulo: 'Cuotas' },
]

const ENCABEZADOS = {
  socios: { titulo: 'Socios', texto: 'Gestioná los socios del club y su categoría técnica' },
  cuotas: { titulo: 'Cuotas de membresía', texto: 'Generá las cuotas mensuales y registrá sus pagos' },
}

// CU 4.1 y 4.2 · Socios y cuotas (Recepcionista y Administrador). La pestaña activa vive en la URL (?pestana=cuotas);
// cada pestaña guarda sus propios filtros en la misma URL, así que al cambiar de pestaña se empieza de cero. La de
// cuotas arranca en el mes actual.
export default function Socios() {
  const [parametros, setParametros] = useSearchParams()
  const activa = parametros.get('pestana') === 'cuotas' ? 'cuotas' : 'socios'
  const { titulo, texto } = ENCABEZADOS[activa]

  const cambiarPestana = (clave) => {
    if (clave === activa) return
    setParametros(clave === 'cuotas' ? new URLSearchParams({ pestana: 'cuotas', ...periodoActual() }) : new URLSearchParams())
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 pb-24 md:pb-0">
      <div>
        <h1 className="font-outfit text-[28px] font-bold">{titulo}</h1>
        <p className="text-texto-suave text-sm mt-1">{texto}</p>
      </div>

      <Tabs pestanas={PESTANAS} activa={activa} onCambiar={cambiarPestana} />

      {activa === 'cuotas' ? <ListadoCuotas /> : <ListadoSocios />}
    </div>
  )
}