import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import EmptyState from '../../../../shared/components/EmptyState'
import Paginacion from '../../../../shared/components/Paginacion'
import Spinner from '../../../../shared/components/Spinner'
import { VISTAS_MIS_RESERVAS } from '../reservas'
import { useMisReservas } from '../useMisReservas'
import CancelarReserva from './CancelarReserva'
import TarjetaReserva from './TarjetaReserva'

const CHIP = 'px-4 py-1.5 rounded-full border text-sm font-medium whitespace-nowrap transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-viper'

// «Mis reservas» del Jugador: las próximas y el historial, de a 10 por página. La vista y la página viven en la URL
// (?vista=historial&pagina=2) junto a la pestaña, para que recargar o compartir el enlace vuelva al mismo lugar.
export default function MisReservas({ onVerGrilla, acciones }) {
  const [params, setParams] = useSearchParams()
  const vista = VISTAS_MIS_RESERVAS.some((v) => v.clave === params.get('vista')) ? params.get('vista') : 'proximas'
  const numero = Number(params.get('pagina'))
  const pagina = Number.isInteger(numero) && numero >= 1 ? numero : 1

  const { cargando, error, datos, reintentar, refrescar } = useMisReservas(vista, pagina)
  const [cancelando, setCancelando] = useState(null) // la reserva que se está cancelando
  const [resultado, setResultado] = useState(null) // { variante, mensaje } de lo que pasó al cancelar

  const cambiar = (cambios) =>
    setParams((previo) => {
      const nuevos = new URLSearchParams(previo)
      for (const [clave, valor] of Object.entries(cambios)) {
        if (valor) nuevos.set(clave, valor)
        else nuevos.delete(clave)
      }
      return nuevos
    }, { replace: true })

  const proximas = vista === 'proximas'
  const control = (etiqueta, abajo) => (
    <Paginacion
      pagina={pagina}
      totalPaginas={datos.totalPaginas}
      onCambiar={(n) => cambiar({ pagina: n > 1 ? String(n) : '' })}
      etiqueta={etiqueta}
      resumen={abajo ? `Mostrando ${datos.reservas.length} de ${datos.total} ${datos.total === 1 ? 'reserva' : 'reservas'}` : null}
    />
  )

  return (
    <div className="flex flex-col gap-5">
      <div role="group" aria-label="Qué reservas ver" className="flex flex-wrap gap-2">
        {VISTAS_MIS_RESERVAS.map(({ clave, texto }) => (
          <button
            key={clave}
            type="button"
            aria-pressed={vista === clave}
            onClick={() => cambiar({ vista: clave === 'proximas' ? '' : clave, pagina: '' })}
            className={`${CHIP} ${vista === clave ? 'bg-viper/15 border-viper text-viper' : 'bg-fondo border-gray-800 text-texto-suave hover:text-viper'}`}
          >
            {texto}
          </button>
        ))}
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
          titulo={proximas ? 'No tenés reservas próximas' : 'Todavía no tenés reservas anteriores'}
          descripcion={proximas ? 'Elegí un turno libre en la grilla y reservalo.' : 'Acá van a quedar tus reservas pasadas, canceladas y vencidas.'}
          accion={proximas ? <Button onClick={onVerGrilla}>Ver la grilla</Button> : undefined}
        />
      )}

      {datos && datos.reservas.length > 0 && (
        <div className="flex flex-col gap-4 max-w-3xl">
          {datos.totalPaginas > 1 && control('Paginación superior', false)}
          <ul className="flex flex-col gap-4">
            {datos.reservas.map((reserva) => (
              <TarjetaReserva key={reserva.id} reserva={reserva} conAcciones={proximas} acciones={{ ...acciones, cancelar: setCancelando }} onVencida={refrescar} />
            ))}
          </ul>
          {control('Paginación', true)}
        </div>
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
            // Ya estaba cancelada, venció o faltan menos de 3 horas: se muestra lo que dijo la API y se vuelve a pedir la lista
            setCancelando(null)
            setResultado({ variante: 'advertencia', mensaje })
            refrescar()
          }}
        />
      )}
    </div>
  )
}
