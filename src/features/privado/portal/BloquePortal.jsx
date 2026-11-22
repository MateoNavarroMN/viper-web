import { Link } from 'react-router-dom'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import Spinner from '../../../../shared/components/Spinner'

// Marco de un bloque del panel del jugador: título, un enlace opcional («Ver todas») y los tres estados de carga, error y vacío.
// Cada bloque maneja los suyos: si uno falla, muestra «Reintentar» y el resto del panel sigue funcionando.
//   estado = { cargando, error, reintentar }
//   vacio  = texto que se muestra cuando no hay nada (o null si el contenido ya sabe qué mostrar)
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
          <Alert variante="error" titulo="No pudimos cargar este bloque">
            {error}{' '}
            <Button variante="neutro" onClick={reintentar} className="ml-2">Reintentar</Button>
          </Alert>
        ) : vacio ? (
          <p className="text-sm text-texto-suave text-center py-6">{vacio}</p>
        ) : (
          children
        )}
      </div>
    </section>
  )
}