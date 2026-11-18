import { useState } from 'react'
import { Link } from 'react-router-dom'
import { post } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Badge from '../../../../shared/components/Badge'
import Button from '../../../../shared/components/Button'
import ConfirmDialog from '../../../../shared/components/ConfirmDialog'
import EmptyState from '../../../../shared/components/EmptyState'
import Spinner from '../../../../shared/components/Spinner'
import { useMediaQuery } from '../../../../shared/hooks/useMediaQuery'
import { useToast } from '../../../../shared/hooks/useToast'
import MenuAcciones from '../../torneos/components/MenuAcciones'
import { precio } from '../../torneos/torneos'
import { TEXTO_DEPORTE, textoReservasFuturas } from '../canchas'
import { useCanchas } from '../useCanchas'

const RUTA = '/admin/canchas'
const ENCABEZADO = 'text-xs font-semibold uppercase tracking-wide text-texto-suave px-6 py-4 whitespace-nowrap'

// «Sin cargo» es lo que usa el resto de la app para un precio en cero; acá se escribe el monto aunque sea cero
const monto = (valor) => (valor > 0 ? precio(valor) : '$ 0,00')

function EstadoCancha({ activa }) {
  return <Badge variante={activa ? 'exito' : 'neutro'}>{activa ? 'Activa' : 'Inactiva'}</Badge>
}

// Menú ⋮ de una cancha: una activa se puede editar o desactivar; una inactiva, editar o activar.
function Acciones({ cancha, alDesactivar, alActivar }) {
  const items = [
    { texto: 'Editar', to: `${RUTA}/${cancha.id}/editar` },
    cancha.activa
      ? { texto: 'Desactivar', onClick: () => alDesactivar?.(cancha), peligro: true }
      : { texto: 'Activar', onClick: () => alActivar?.(cancha) },
  ]
  return <MenuAcciones etiqueta={`Acciones de ${cancha.nombre}`} items={items} />
}

// Canchas y tarifas (solo Administrador): las canchas del club con su precio por hora y las reservas que todavía no empezaron.
export default function CanchasYTarifas() {
  const { cargando, canchas, error, reintentar, recargar } = useCanchas()
  const { mostrarToast } = useToast()
  const esEscritorio = useMediaQuery('(min-width: 768px)')
  const [aviso, setAviso] = useState(null) // { variante, texto } de lo que no salió
  const [confirmando, setConfirmando] = useState(null) // { cancha, reservas, reservasFuturas } cuando hay reservas futuras
  const [procesando, setProcesando] = useState(false)

  // Desactivar: el primer pedido va sin confirmar; si la cancha tiene reservas futuras, la API las devuelve y se pide confirmación.
  const desactivar = async (cancha, confirmar = false) => {
    setAviso(null)
    setProcesando(true)
    try {
      await post(`/canchas/${cancha.id}/desactivar`, confirmar ? { confirmar: true } : {})
      setConfirmando(null)
      mostrarToast(`${cancha.nombre} quedó inactiva`)
      recargar()
    } catch (e) {
      if (e.status === 409 && e.datos?.requiereConfirmacion) {
        setConfirmando({ cancha, reservas: e.datos.reservas ?? [], reservasFuturas: e.datos.reservasFuturas })
      } else {
        setConfirmando(null)
        setAviso({ variante: e.status === 409 ? 'advertencia' : 'error', texto: e.mensaje })
        if (e.status === 409 || e.status === 404) recargar()
      }
    } finally {
      setProcesando(false)
    }
  }

  const activar = async (cancha) => {
    setAviso(null)
    try {
      await post(`/canchas/${cancha.id}/activar`, {})
      mostrarToast(`${cancha.nombre} quedó activa`)
    } catch (e) {
      setAviso({ variante: e.status === 409 ? 'advertencia' : 'error', texto: e.mensaje })
    }
    recargar()
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-outfit text-[28px] font-bold">Canchas y tarifas</h1>
          <p className="text-texto-suave text-sm mt-1">Administrá las canchas del club y el precio por hora</p>
        </div>
        <Link
          to={`${RUTA}/nueva`}
          className="hidden lg:inline-flex shrink-0 items-center justify-center px-6 py-2 rounded-lg font-semibold bg-viper hover:bg-viper-hover text-sobre-viper shadow-[0_0_20px_var(--glow-primary)] transition-colors"
        >
          + Nueva cancha
        </Link>
      </div>

      {aviso && <Alert variante={aviso.variante}>{aviso.texto}</Alert>}
      <Alert variante="info">El precio por hora rige para las reservas que se creen desde ahora. Las reservas existentes conservan su precio.</Alert>

      {cargando && canchas.length === 0 ? (
        <div className="py-16 flex justify-center"><Spinner texto="Cargando las canchas" /></div>
      ) : error && canchas.length === 0 ? (
        <Alert variante="error" titulo="No pudimos cargar las canchas">
          {error}{' '}
          <Button variante="neutro" onClick={reintentar} className="ml-2">Reintentar</Button>
        </Alert>
      ) : canchas.length === 0 ? (
        <EmptyState titulo="Todavía no hay canchas" descripcion="Registrá la primera para que aparezca en la grilla de reservas." />
      ) : (
        <>
          <div className="hidden md:block bg-panel border border-gray-800 rounded-2xl overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className={ENCABEZADO}>Cancha</th>
                  <th className={ENCABEZADO}>Deporte</th>
                  <th className={ENCABEZADO}>Superficie</th>
                  <th className={ENCABEZADO}>Precio por hora</th>
                  <th className={ENCABEZADO}>Reservas futuras</th>
                  <th className={ENCABEZADO}>Estado</th>
                  <th className="w-12"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {canchas.map((c) => (
                  <tr key={c.id} className="border-b border-gray-800 last:border-b-0 hover:bg-fondo/50 transition-colors">
                    <td className="px-6 py-4 font-semibold">{c.nombre}</td>
                    <td className="px-6 py-4">{TEXTO_DEPORTE[c.deporte]}</td>
                    <td className="px-6 py-4">{c.tipoSuperficie}</td>
                    <td className="px-6 py-4 tabular-nums">{monto(c.precioHora)}</td>
                    <td className="px-6 py-4 tabular-nums">{c.reservasFuturas}</td>
                    <td className="px-6 py-4"><EstadoCancha activa={c.activa} /></td>
                    <td className="pr-4"><Acciones cancha={c} alDesactivar={desactivar} alActivar={activar} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="md:hidden flex flex-col gap-3">
            {canchas.map((c) => (
              <li key={c.id} className="bg-panel border border-gray-800 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold break-words">{c.nombre}</p>
                    <p className="text-sm text-texto-suave">{TEXTO_DEPORTE[c.deporte]} · {c.tipoSuperficie}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <EstadoCancha activa={c.activa} />
                    <Acciones cancha={c} alDesactivar={desactivar} alActivar={activar} />
                  </div>
                </div>
                <div className="flex items-end justify-between gap-3 text-sm">
                  <div>
                    <p className="text-xs text-texto-suave">Precio por hora</p>
                    <p className="font-semibold tabular-nums">{monto(c.precioHora)}</p>
                  </div>
                  <p className="text-texto-suave">{textoReservasFuturas(c.reservasFuturas)}</p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {confirmando && (
        <ConfirmDialog
          abierto
          posicion={esEscritorio ? 'centro' : 'abajo-movil'}
          titulo={`¿Desactivar ${confirmando.cancha.nombre}?`}
          mensaje={
            <>
              Tiene {confirmando.reservasFuturas} {confirmando.reservasFuturas === 1 ? 'reserva futura Pendiente o Confirmada' : 'reservas futuras Pendientes o Confirmadas'}.{' '}
              No se cancelan solas: se gestionan desde la grilla.{' '}
              {confirmando.reservas[0]?.fecha && (
                <Link
                  to={`/gestion/reservas?fecha=${confirmando.reservas[0].fecha}`}
                  className="text-viper underline font-semibold"
                >
                  Ver en la grilla
                </Link>
              )}
            </>
          }
          textoCancelar="Volver"
          textoConfirmar="Desactivar"
          cargando={procesando}
          onCancelar={() => setConfirmando(null)}
          onConfirmar={() => desactivar(confirmando.cancha, true)}
        />
      )}

      <Link
        to={`${RUTA}/nueva`}
        aria-label="Nueva cancha"
        className="lg:hidden fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full bg-viper hover:bg-viper-hover text-sobre-viper flex items-center justify-center shadow-[0_0_20px_var(--glow-primary)] transition-colors"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </Link>
    </div>
  )
}