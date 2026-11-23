import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import Spinner from '../../../../shared/components/Spinner'
import { useConsulta } from '../useConsulta'
import { ALERTAS, ordenarAlertas, textoDeAlerta } from '../dashboard'
import BloqueBalance from './BloqueBalance'

// Triángulo de advertencia; el color lo pone el texto de quien lo usa
function IconoAlerta({ gravedad }) {
  return (
    <span className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${gravedad === 'error' ? 'bg-error/15 text-error' : 'bg-advertencia/15 text-advertencia'}`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      </svg>
    </span>
  )
}

// «Requiere tu atención»: lo que necesita al Administrador, de lo más urgente a lo menos. Cada alerta abre su detalle (`onElegir`).
export default function AlertasDashboard({ onElegir }) {
  const { datos, cargando, error, reintentar } = useConsulta('/dashboard/alertas')
  const alertas = datos ? ordenarAlertas(datos.alertas) : []

  return (
    <BloqueBalance
      titulo="Requiere tu atención"
      derecha={datos && datos.total > 0 && (
        <span className="min-w-6 h-6 px-2 rounded-full bg-error/15 text-error text-sm font-semibold inline-flex items-center justify-center tabular-nums" aria-label={`${datos.total} alertas`}>
          {datos.total}
        </span>
      )}
      className="h-full"
    >
      {!datos && cargando && <div className="py-8 flex justify-center"><Spinner texto="Cargando las alertas" /></div>}
      {!datos && error && (
        <Alert variante="error" titulo="No se pudieron cargar las alertas">
          Revisá tu conexión e intentá de nuevo.{' '}
          <Button variante="neutro" onClick={reintentar} className="ml-2">Reintentar</Button>
        </Alert>
      )}
      {datos && (
        <div className={`transition-opacity ${cargando ? 'opacity-60' : ''}`} aria-busy={cargando}>
          {/* 11a: nada que atender */}
          {datos.sinAlertas ? (
            <div className="py-6 flex flex-col items-center text-center gap-2">
              <span className="w-12 h-12 rounded-full bg-exito/15 text-exito flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 5 5L20 7" /></svg>
              </span>
              <p className="font-outfit font-bold">Todo en orden</p>
              <p className="text-sm text-texto-suave">No hay nada que requiera atención</p>
            </div>
          ) : (
            <ul className="flex flex-col -my-2">
              {alertas.map((a) => (
                <li key={a.tipo}>
                  <button
                    type="button"
                    onClick={() => onElegir(a.tipo)}
                    className="w-full flex items-center gap-3 py-3 text-left rounded-lg hover:bg-fondo/60 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-viper"
                  >
                    <IconoAlerta gravedad={ALERTAS[a.tipo]?.gravedad} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium">{textoDeAlerta(a)}</span>
                      <span className="block text-sm text-texto-suave">{ALERTAS[a.tipo]?.ayuda ?? a.titulo}</span>
                    </span>
                    <svg className="shrink-0 text-texto-suave" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {error && (
            <div className="mt-3">
              <Alert variante="error" titulo="No se pudieron actualizar las alertas">
                <Button variante="neutro" onClick={reintentar}>Reintentar</Button>
              </Alert>
            </div>
          )}
        </div>
      )}
    </BloqueBalance>
  )
}