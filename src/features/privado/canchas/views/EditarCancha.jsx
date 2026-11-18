import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { get, patch } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import Spinner from '../../../../shared/components/Spinner'
import { useToast } from '../../../../shared/hooks/useToast'
import { precio } from '../../torneos/torneos'
import FormularioCancha from '../components/FormularioCancha'
import { textoReservasFuturas } from '../canchas'

const LISTADO = '/admin/canchas'
const monto = (valor) => (valor > 0 ? precio(valor) : '$ 0,00')

function textoConservan(cantidad) {
  if (cantidad === 0) return 'No hay reservas futuras'
  return `${textoReservasFuturas(cantidad)}: conservan su precio`
}

// Panel «Resumen del cambio» (a la derecha en escritorio)
function ResumenDelCambio({ cancha, precioNuevo }) {
  const cambia = precioNuevo !== null && precioNuevo !== cancha.precioHora
  return (
    <aside aria-label="Resumen del cambio" className="hidden lg:flex flex-col gap-4 bg-panel border border-gray-800 rounded-2xl p-6 h-fit">
      <h2 className="font-outfit text-lg font-bold">Resumen del cambio</h2>
      <dl className="flex flex-col gap-3 text-sm">
        <div>
          <dt className="text-texto-suave text-xs">Precio actual</dt>
          <dd className="font-semibold tabular-nums">{monto(cancha.precioHora)}</dd>
        </div>
        <div>
          <dt className="text-texto-suave text-xs">Nuevo precio</dt>
          <dd className={`font-semibold tabular-nums ${cambia ? 'text-exito' : ''}`}>{cambia ? monto(precioNuevo) : 'Sin cambios'}</dd>
        </div>
        <div>
          <dt className="text-texto-suave text-xs">Rige desde</dt>
          <dd>Reservas nuevas</dd>
        </div>
        <div>
          <dt className="text-texto-suave text-xs">Reservas futuras</dt>
          <dd>{textoConservan(cancha.reservasFuturas)}</dd>
        </div>
      </dl>
      <p className="text-texto-suave text-xs">El precio de cada reserva se fija al crearla.</p>
    </aside>
  )
}

// Editar una cancha (solo Administrador): nombre, superficie y precio por hora. El cambio de precio no toca las reservas existentes.
export default function EditarCancha() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { mostrarToast } = useToast()
  const [estado, setEstado] = useState({ cargando: true, cancha: null, noExiste: false, error: null })
  const [precioNuevo, setPrecioNuevo] = useState(null)
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    get(`/canchas/${id}`)
      .then((r) => vigente && setEstado({ cargando: false, cancha: r.cancha, noExiste: false, error: null }))
      .catch((e) =>
        vigente && setEstado({ cargando: false, cancha: null, noExiste: e.status === 404 || e.status === 400, error: e.status === 404 || e.status === 400 ? null : e.mensaje }),
      )
    return () => {
      vigente = false
    }
  }, [id, intento])

  const { cargando, cancha, noExiste, error } = estado

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6">
      <Link to={LISTADO} className="text-sm text-texto-suave hover:text-viper transition-colors inline-flex items-center gap-1 w-fit">
        <span aria-hidden="true">‹</span> Volver a canchas y tarifas
      </Link>

      {cargando ? (
        <div className="py-16 flex justify-center"><Spinner texto="Cargando la cancha" /></div>
      ) : noExiste ? (
        <Alert variante="error" titulo="Cancha no encontrada">
          No existe una cancha con ese enlace.{' '}
          <Button variante="neutro" onClick={() => navigate(LISTADO)} className="ml-2">Volver al listado</Button>
        </Alert>
      ) : error ? (
        <Alert variante="error" titulo="No pudimos cargar la cancha">
          {error}{' '}
          <Button variante="neutro" onClick={() => { setEstado((p) => ({ ...p, cargando: true })); setIntento((n) => n + 1) }} className="ml-2">Reintentar</Button>
        </Alert>
      ) : (
        <>
          <div>
            <h1 className="font-outfit text-[28px] font-bold">Editar cancha</h1>
            <p className="text-texto-suave text-sm mt-1">Cambiá el nombre, la superficie o el precio por hora de {cancha.nombre}.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
            <FormularioCancha
              modo="edicion"
              inicial={{ nombre: cancha.nombre, deporte: cancha.deporte, tipoSuperficie: cancha.tipoSuperficie, precioHora: cancha.precioHora }}
              activa={cancha.activa}
              textoGuardar="Guardar cambios"
              alCambiarPrecio={setPrecioNuevo}
              notaPrecio={
                precioNuevo !== null && precioNuevo !== cancha.precioHora ? (
                  <p className="text-xs text-texto-suave">
                    Rige para las reservas nuevas. {textoConservan(cancha.reservasFuturas)}.
                  </p>
                ) : null
              }
              guardar={(datos) => patch(`/canchas/${id}`, { nombre: datos.nombre, tipoSuperficie: datos.tipoSuperficie, precioHora: datos.precioHora })}
              onTerminar={() => {
                mostrarToast('Tarifa actualizada correctamente')
                navigate(LISTADO, { replace: true })
              }}
              onCancelar={() => navigate(LISTADO)}
            />
            <ResumenDelCambio cancha={cancha} precioNuevo={precioNuevo} />
          </div>
        </>
      )}
    </div>
  )
}