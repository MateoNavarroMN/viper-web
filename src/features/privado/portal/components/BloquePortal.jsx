import { Link } from 'react-router-dom'
import Button from '../../../../shared/components/Button'
import Spinner from '../../../../shared/components/Spinner'
import Aviso from './Aviso'

// Marco de un bloque del panel del jugador: título, un enlace opcional («Ver todas») y los tres estados de carga, error y vacío.
// Cada bloque maneja los suyos: si uno falla, muestra «Reintentar» y el resto del panel sigue funcionando.
//   estado = { cargando, error, reintentar }
//   vacio  = { titulo, detalle } con el mensaje cuando no hay nada (o null si el contenido ya sabe qué mostrar)
export default function BloquePortal({ titulo, enlace, estado, vacio = null, children }) {
  const { cargando, error, reintentar } = estado
  return (
    <section aria-label={titulo} className="bg-panel border border-gray-800 rounded-2xl overflow-hidden min-w-0">
      <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-800">
        <h2 className="font-outfit text-base font-bold">{titulo}</h2>
        {enlace && !cargando && !error && (
          <Link to={enlace.to} className="text-sm font-semibold text-viper hover:underline shrink-0">
            {enlace.texto}
          </Link>
        )}
      </header>
      <div className="p-4">
        {cargando ? (
          <div className="py-8 flex justify-center"><Spinner texto={`Cargando ${titulo.toLowerCase()}`} /></div>
        ) : error ? (
          <div role="alert" className="bg-fondo border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-3">
            <svg className="shrink-0 text-error" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 8v4m0 4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z" />
            </svg>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">No se pudieron cargar los datos</p>
              <p className="text-sm text-texto-suave">Revisá tu conexión e intentá de nuevo</p>
            </div>
            <Button variante="neutro" onClick={reintentar} className="shrink-0">Reintentar</Button>
          </div>
        ) : vacio ? (
          <Aviso titulo={vacio.titulo} detalle={vacio.detalle} />
        ) : (
          children
        )}
      </div>
    </section>
  )
}