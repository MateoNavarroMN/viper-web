import { Link } from 'react-router-dom'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import Spinner from '../../../../shared/components/Spinner'
import BloqueBalance from './BloqueBalance'

// Mensaje informativo dentro de un bloque (los estados vacíos del panel)
export function AvisoDeBloque({ children }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-800 bg-fondo px-4 py-3 text-sm text-texto-suave">
      <svg className="shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z" />
      </svg>
      <span>{children}</span>
    </div>
  )
}

// Un renglón «etiqueta ........ valor»
export function Dato({ etiqueta, valor, tono = 'text-texto' }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-texto-suave">{etiqueta}</span>
      <span className={`font-semibold tabular-nums text-right whitespace-nowrap ${tono}`}>{valor}</span>
    </div>
  )
}

// Barra de progreso (por ejemplo, franjas ocupadas o cupo). `porcentaje` va de 0 a 100; `color` es una clase bg-.
export function Barra({ porcentaje, color = 'bg-exito' }) {
  return (
    <div className="h-2 rounded-full bg-gray-800 overflow-hidden" role="presentation">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, Math.max(0, porcentaje))}%` }} />
    </div>
  )
}

// Marco de un bloque operativo del Dashboard: carga, error con «Reintentar» (el resto del panel sigue funcionando) y «Ver detalle».
//   consulta  = lo que devuelve useConsulta · ruta = pantalla a la que lleva «Ver detalle»
//   insignia  = (datos) => un Badge al lado del título · children = (datos) => el contenido, ya con datos
export default function BloqueOperativo({ titulo, consulta, ruta, insignia, children, className = '' }) {
  const { datos, cargando, error, reintentar } = consulta
  return (
    <BloqueBalance
      titulo={titulo}
      className={className}
      derecha={(
        <div className="flex items-center gap-3">
          {datos && insignia?.(datos)}
          <Link to={ruta} className="text-sm font-medium text-viper hover:underline focus-visible:outline-2 focus-visible:outline-viper rounded">
            Ver detalle<span className="sr-only"> de {titulo.toLowerCase()}</span>
          </Link>
        </div>
      )}
    >
      {!datos && cargando && <div className="py-8 flex justify-center"><Spinner texto={`Cargando ${titulo.toLowerCase()}`} /></div>}
      {!datos && error && (
        <Alert variante="error" titulo="No se pudieron cargar los datos">
          Revisá tu conexión e intentá de nuevo.{' '}
          <Button variante="neutro" onClick={reintentar} className="ml-2">Reintentar</Button>
        </Alert>
      )}
      {datos && (
        <div className={`flex flex-col gap-4 transition-opacity ${cargando ? 'opacity-60' : ''}`} aria-busy={cargando}>
          {error && (
            <Alert variante="error" titulo="No se pudieron actualizar los datos">
              Lo que ves es lo último que se cargó.{' '}
              <Button variante="neutro" onClick={reintentar} className="ml-2">Reintentar</Button>
            </Alert>
          )}
          {children(datos)}
        </div>
      )}
    </BloqueBalance>
  )
}