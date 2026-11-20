import { useSearchParams } from 'react-router-dom'
import Tabs from '../../../../shared/components/Tabs'
import Cierre from '../components/Cierre'
import Historial from '../components/Historial'
import Movimientos from '../components/Movimientos'

const PESTANAS = [
  { clave: 'movimientos', titulo: 'Movimientos' },
  { clave: 'cierre', titulo: 'Cierre de caja' },
  { clave: 'historial', titulo: 'Historial' },
]

const ENCABEZADOS = {
  movimientos: { titulo: 'Movimientos de caja', texto: 'Ingresos y egresos del día' },
  cierre: { titulo: 'Cierre de caja', texto: 'Conciliá el efectivo de la jornada y cerrá la caja' },
  historial: { titulo: 'Historial de cierres', texto: 'Las cajas que ya se cerraron' },
}

// Sección Caja (Recepcionista y Administrador). La pestaña activa vive en la URL (?pestana=cierre o ?pestana=historial).
export default function Caja() {
  const [parametros, setParametros] = useSearchParams()
  const pedida = parametros.get('pestana')
  const activa = pedida === 'cierre' || pedida === 'historial' ? pedida : 'movimientos'
  const { titulo, texto } = ENCABEZADOS[activa]

  const cambiarPestana = (clave) => {
    if (clave === activa) return
    setParametros(clave === 'movimientos' ? new URLSearchParams() : new URLSearchParams({ pestana: clave }))
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 pb-24 md:pb-0">
      <div>
        <h1 className="font-outfit text-[28px] font-bold">{titulo}</h1>
        <p className="text-texto-suave text-sm mt-1">{texto}</p>
      </div>

      <Tabs pestanas={PESTANAS} activa={activa} onCambiar={cambiarPestana} />

      {activa === 'movimientos' ? <Movimientos /> : activa === 'cierre' ? <Cierre /> : <Historial />}
    </div>
  )
}