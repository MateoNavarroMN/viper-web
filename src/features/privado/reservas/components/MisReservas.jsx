import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import EmptyState from '../../../../shared/components/EmptyState'
import Paginacion from '../../../../shared/components/Paginacion'
import Spinner from '../../../../shared/components/Spinner'
import { precio } from '../../torneos/torneos'
import { VISTAS_MIS_RESERVAS, avisoDeCambio } from '../reservas'
import { useMisReservas } from '../useMisReservas'
import CancelarReserva from './CancelarReserva'
import ModificarHorario from './ModificarHorario'
import TarjetaReserva from './TarjetaReserva'
import AvisoFinContrato from './AvisoFinContrato'

const CHIP = 'px-4 py-1.5 rounded-full border text-sm font-medium whitespace-nowrap transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-viper'

export default function MisReservas({ onVerGrilla, acciones }) {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const vista = VISTAS_MIS_RESERVAS.some((v) => v.clave === params.get('vista')) ? params.get('vista') : 'proximas'
  const numero = Number(params.get('pagina'))
  const pagina = Number.isInteger(numero) && numero >= 1 ? numero : 1

  const { cargando, error, datos, reintentar, refrescar } = useMisReservas(vista, pagina)
  const [cancelando, setCancelando] = useState(null)
  const [modificando, setModificando] = useState(null)
  const [resultado, setResultado] = useState(null)

  const cambiar = (cambios) => {
    setParams((previo) => {
      const nuevos = new URLSearchParams(previo)
      for (const [clave, valor] of Object.entries(cambios)) {
        if (valor) nuevos.set(clave, valor)
        else nuevos.delete(clave)
      }
      return nuevos
    }, { replace: true })
  }

  const proximas = vista === 'proximas'
  const control = (etiqueta, abajo) => (
    <Paginacion
      etiqueta={etiqueta}
      pagina={datos.pagina}
      totalPaginas={datos.totalPaginas}
      total={datos.total}
      enPagina={datos.reservas.length}
      unidad="reservas"
      compacto={!abajo}
      onCambiar={(p) => cambiar({ pagina: p === 1 ? '' : String(p) })}
    />
  )

  return (
    <div className="flex flex-col gap-5">
      <AvisoFinContrato />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Filtrar reservas" className="flex gap-2">
          {VISTAS_MIS_RESERVAS.map(({ clave, texto }) => (
            <button
              key={clave}
              type="button"
              aria-pressed={clave === vista}
              onClick={() => cambiar({ vista: clave === 'proximas' ? '' : clave, pagina: '' })}
              className={`${CHIP} ${clave === vista ? 'bg-viper/15 border-viper text-viper' : 'bg-panel border-gray-800 text-texto-suave hover:text-viper hover:border-viper'}`}
            >
              {texto}
            </button>
          ))}
        </div>
        {datos && datos.total > 0 && control('Paginación superior de reservas', false)}
      </div>

      {resultado && <Alert variante={resultado.variante}>{resultado.mensaje}</Alert>}

      {cargando && <div className="py-16 flex justify-center"><Spinner texto="Cargando tus reservas" /></div>}

      {error && (
        <Alert variante="error" titulo="No pudimos cargar tus reservas">
          {error}{' '}
          <button type="button" onClick={reintentar} className="underline font-semibold cursor-pointer">Reintentar</button>
        </Alert>
      )}

      {datos && datos.reservas.length === 0 && (
        <EmptyState
          titulo={proximas ? 'No tenés reservas próximas' : 'Todavía no tenés historial'}
          descripcion={proximas
            ? 'Elegí una cancha y un horario desde Reservar turno.'
            : 'Acá van a aparecer tus turnos pasados, cancelados o expirados.'}
          accion={proximas && onVerGrilla && <Button onClick={onVerGrilla}>Reservar turno</Button>}
        />
      )}

      {datos && datos.reservas.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {datos.reservas.map((r) => (
              <TarjetaReserva
                key={r.id}
                reserva={r}
                acciones={{ ...acciones, cancelar: setCancelando, modificarHorario: setModificando, pagar: (r) => navigate(`/portal/reservas/${r.id}/pagar`) }}
              />
            ))}
          </div>
          {control('Paginación de reservas', true)}
        </>
      )}

      {modificando && (
        <ModificarHorario
          reserva={modificando}
          personal={false}
          onCerrar={() => setModificando(null)}
          onModificada={(respuesta) => {
            setModificando(null)
            setResultado({ variante: 'exito', mensaje: avisoDeCambio(respuesta, precio) })
            refrescar()
          }}
          onRechazada={(mensaje) => {
            setModificando(null)
            setResultado({ variante: 'advertencia', mensaje })
            refrescar()
          }}
        />
      )}

      {cancelando && (
        <CancelarReserva
          reserva={cancelando}
          personal={false}
          onCerrar={() => setCancelando(null)}
          onCancelada={(respuesta) => {
            setCancelando(null)
            setResultado({ variante: 'exito', mensaje: respuesta.reembolsoFueraDelSistema ? `${respuesta.mensaje} El reembolso se gestiona fuera del sistema.` : respuesta.mensaje })
            refrescar()
          }}
          onRechazada={(mensaje) => {
            setCancelando(null)
            setResultado({ variante: 'advertencia', mensaje })
            refrescar()
          }}
        />
      )}
    </div>
  )
}