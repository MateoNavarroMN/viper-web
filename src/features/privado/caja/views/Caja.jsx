import { useSearchParams } from 'react-router-dom'
import EnConstruccion from '../../../../shared/components/EnConstruccion'
import Tabs from '../../../../shared/components/Tabs'
import Movimientos from '../components/Movimientos'

const PESTANAS = [
  { clave: 'movimientos', titulo: 'Movimientos' },
  { clave: 'cierre', titulo: 'Cierre de caja' },
]

const ENCABEZADOS = {
  movimientos: { titulo: 'Movimientos de caja', texto: 'Ingresos y egresos del día' },
  cierre: { titulo: 'Cierre de caja', texto: 'Conciliá el efectivo de la jornada y cerrá la caja' },
}

// Sección Caja (Recepcionista y Administrador). La pestaña activa vive en la URL (?pestana=cierre).
// El cierre se arma en M5-FE-11.
export default function Caja() {
  const [parametros, setParametros] = useSearchParams()
  const activa = parametros.get('pestana') === 'cierre' ? 'cierre' : 'movimientos'
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

      {activa === 'movimientos' ? <Movimientos /> : <EnConstruccion titulo={titulo} />}
    </div>
  )
}