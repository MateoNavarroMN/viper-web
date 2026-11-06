import Tabs from '../../../../shared/components/Tabs'
import ListadoSocios from '../components/ListadoSocios'

// Pestañas de la sección. «Cuotas» se habilita en M4-FE-04.
const PESTANAS = [
  { clave: 'socios', titulo: 'Socios' },
  { clave: 'cuotas', titulo: 'Cuotas', deshabilitada: true },
]

// CU 4.1 y 4.2 · Socios y cuotas (Recepcionista y Administrador)
export default function Socios() {
  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 pb-24 md:pb-0">
      <div>
        <h1 className="font-outfit text-[28px] font-bold">Socios</h1>
        <p className="text-texto-suave text-sm mt-1">Gestioná los socios del club y su categoría técnica</p>
      </div>

      <Tabs pestanas={PESTANAS} activa="socios" onCambiar={() => {}} />

      <ListadoSocios />
    </div>
  )
}