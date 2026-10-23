import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { get } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Badge from '../../../../shared/components/Badge'
import Button from '../../../../shared/components/Button'
import Spinner from '../../../../shared/components/Spinner'
import { ETIQUETA_FORMATO, nombrePareja, puntosTexto, REGLA_CABEZAS } from '../torneos'
import AvisoEtapa from './AvisoEtapa'

const TARJETA = 'bg-panel border border-gray-800 rounded-2xl p-5 md:p-8'

// `color`: clase de color del número (en el Figma: pagadas en verde y pendientes en ámbar)
function Cifra({ etiqueta, valor, color = '' }) {
  return (
    <div className="bg-panel border border-gray-800 rounded-xl p-3 sm:p-4 flex flex-col justify-between gap-1">
      <p className="text-xs sm:text-[13px] text-texto-suave">{etiqueta}</p>
      <p className={`font-outfit text-2xl sm:text-3xl font-bold tabular-nums ${color}`}>{valor}</p>
    </div>
  )
}

export function BadgeCabeza() {
  return (
    <Badge variante="violeta">
      <svg className="mr-1.5" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
      </svg>
      Cabeza de serie
    </Badge>
  )
}

// Pestaña «Cabezas de serie» de la ficha del torneo (CU 3.3 · pasos 1 a 3 y 7). Solo se muestra con las inscripciones
// abiertas o cerradas. Resume las inscripciones (`inscriptos` son las activas, de la ficha) y las cabezas ya elegidas, y
// lleva a la pantalla de selección. Sin inscriptos suficientes muestra el aviso de la 2a (`formato` es el del torneo).
export default function PanelCabezas({ torneoId, inscriptos, formato }) {
  const navigate = useNavigate()
  const irAConfigurar = () => navigate(`/gestion/torneos/${torneoId}/cabezas-de-serie`)

  const [reintento, setReintento] = useState(0)
  const [resultado, setResultado] = useState(null) // { clave, datos, error }
  const clave = `${torneoId}|${reintento}`
  const actual = resultado?.clave === clave ? resultado : null

  useEffect(() => {
    let vigente = true
    get(`/torneos/${torneoId}/cabezas-de-serie`)
      .then((datos) => vigente && setResultado({ clave, datos }))
      .catch((error) => vigente && setResultado({ clave, error }))
    return () => {
      vigente = false
    }
  }, [torneoId, clave])

  if (!actual) {
    return (
      <div className="py-16 flex justify-center">
        <Spinner texto="Cargando cabezas de serie" />
      </div>
    )
  }

  const { datos, error } = actual
  if (error?.status === 409) return <AvisoEtapa error={error} formato={ETIQUETA_FORMATO[formato]} />
  if (error) {
    return (
      <Alert variante="error" titulo="No pudimos cargar las cabezas de serie">
        {error.mensaje}{' '}
        <button type="button" onClick={() => setReintento((n) => n + 1)} className="underline font-semibold cursor-pointer">Reintentar</button>
      </Alert>
    )
  }

  const elegidas = datos.inscripciones.map((i, indice) => ({ ...i, posicion: indice + 1 })).filter((i) => i.cabezaDeSerie)
  const pendientes = Math.max(0, inscriptos - datos.pagadas)

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <Cifra etiqueta="Inscripciones activas" valor={inscriptos} />
        <Cifra etiqueta="Con pago confirmado" valor={datos.pagadas} color="text-viper" />
        <Cifra etiqueta="Pago pendiente" valor={pendientes} color="text-advertencia" />
        <Cifra etiqueta="Cabezas de serie" valor={`${datos.seleccionadas} / ${datos.maximoPermitido}`} />
      </div>

      <section className={TARJETA}>
        {elegidas.length === 0 ? (
          <>
            <h2 className="text-xs font-bold uppercase tracking-wide text-texto-suave">Cabezas de serie</h2>
            <div className="flex flex-col items-center text-center py-8 sm:py-10">
              <div className="w-14 h-14 rounded-full bg-viper/15 text-viper flex items-center justify-center mb-5">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
                </svg>
              </div>
              <h3 className="font-outfit text-xl font-bold mb-2">Todavía no configuraste cabezas de serie</h3>
              <p className="text-texto-suave leading-relaxed max-w-md">Marcá a los participantes destacados para que el sistema los distribuya al generar la competencia.</p>
              <Button className="mt-6 w-full sm:w-auto" onClick={irAConfigurar}>Configurar Cabezas de Serie</Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wide text-texto-suave">Cabezas de serie</h2>
                <p className="text-sm text-texto-suave mt-1">Hasta {datos.maximoPermitido} ({REGLA_CABEZAS[datos.torneo.formato]}).</p>
              </div>
              <Button variante="neutro" className="w-full sm:w-auto whitespace-nowrap" onClick={irAConfigurar}>Editar cabezas de serie</Button>
            </div>
            <ul className="flex flex-col gap-3">
              {elegidas.map((i) => (
                <li key={i.id} className="bg-fondo border border-gray-800 rounded-xl px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="font-outfit font-bold text-texto-suave tabular-nums w-8">{i.posicion}°</span>
                  <p className="flex-1 min-w-[10rem] font-semibold break-words">{nombrePareja(i)}</p>
                  <span className="text-sm tabular-nums">{puntosTexto(i.puntos)}</span>
                  <BadgeCabeza />
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  )
}