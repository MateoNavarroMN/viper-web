import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { get } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Spinner from '../../../../shared/components/Spinner'
import Tabs from '../../../../shared/components/Tabs'
import HistorialRegla from '../components/HistorialRegla'
import { PESTANAS, disciplinaDe } from '../ranking'
import { RUTA_REGLAS, fechaCorta, nombreInstancia, puntosCorto, puntosLargo } from '../reglas'

const BOTON = 'font-outfit inline-flex items-center justify-center px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors'
const BOTON_MODIFICAR = `${BOTON} bg-panel border border-gray-800 text-texto hover:border-viper`

const VerHistorial = ({ onClick }) => (
  <button type="button" onClick={onClick} className={`${BOTON} text-viper hover:bg-viper/10 cursor-pointer`}>
    Ver historial
  </button>
)

const Modificar = ({ disciplina, regla }) => (
  <Link to={`${RUTA_REGLAS}/${disciplina.clave}/${regla.instancia}/modificar`} className={BOTON_MODIFICAR}>
    {regla.puntos === null ? 'Definir' : 'Modificar'}
  </Link>
)

// Puntos de una regla, o «Sin regla» si la instancia todavía no tiene ninguna
const Puntos = ({ regla }) =>
  regla.puntos === null ? <span className="text-texto-suave">Sin regla</span> : <span className="tabular-nums">{puntosLargo(regla.puntos)}</span>

// Reglas de puntuación (/gestion/reglas-puntuacion, Organizador y Administrador). La disciplina vive en la URL
// (?disciplina=padel). Consulta de las reglas que rigen hoy; «Modificar» lleva al formulario de la regla.
export default function ReglasPuntuacion() {
  const [parametros, setParametros] = useSearchParams()
  const disciplina = disciplinaDe(parametros.get('disciplina'))
  // Al volver de guardar una regla, su fila queda resaltada
  const actualizada = useLocation().state?.actualizada ?? null

  const [datos, setDatos] = useState(null) // { disciplina, reglas }
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)
  const [historial, setHistorial] = useState(null) // instancia cuyo historial está abierto
  const cerrarHistorial = useCallback(() => setHistorial(null), [])

  useEffect(() => {
    let vigente = true
    get(`/reglas-puntuacion?disciplina=${disciplina.api}`)
      .then((respuesta) => {
        if (!vigente) return
        setDatos(respuesta)
        setError('')
      })
      .catch((e) => vigente && setError(e.mensaje))
    return () => {
      vigente = false
    }
  }, [disciplina.api, intento])

  // Mientras la respuesta no sea de la disciplina elegida se muestra el spinner: una respuesta vieja nunca se ve en la pestaña nueva
  const reglas = datos?.disciplina === disciplina.api ? datos.reglas : null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-outfit text-[28px] font-bold">Reglas de puntuación</h1>
        <p className="text-texto-suave text-sm mt-1">Puntos que otorga cada instancia de competencia, por disciplina</p>
      </div>

      <Tabs
        pestanas={PESTANAS}
        activa={disciplina.clave}
        onCambiar={(clave) => {
          setError('')
          setParametros({ disciplina: clave }, { replace: true })
        }}
      />

      <Alert variante="info">Los cambios rigen para los resultados que se carguen desde su fecha de vigencia; los puntos ya otorgados no se modifican.</Alert>

      {error ? (
        <Alert variante="error" titulo="No pudimos cargar las reglas">
          {error}{' '}
          <button type="button" onClick={() => setIntento((n) => n + 1)} className="underline font-semibold cursor-pointer">
            Reintentar
          </button>
        </Alert>
      ) : !reglas ? (
        <div className="py-16 flex justify-center">
          <Spinner texto="Cargando reglas" />
        </div>
      ) : reglas.length === 0 ? (
        <Alert variante="advertencia">Todavía no hay reglas cargadas para esta disciplina.</Alert>
      ) : (
        <>
          {/* Escritorio: tabla */}
          <div className="hidden md:block bg-panel border border-gray-800 rounded-2xl overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-800 text-texto-suave">
                  <th className="text-xs font-semibold uppercase tracking-wide px-6 py-4">Instancia</th>
                  <th className="text-xs font-semibold uppercase tracking-wide px-6 py-4 whitespace-nowrap">Puntos otorgados</th>
                  <th className="text-xs font-semibold uppercase tracking-wide px-6 py-4 whitespace-nowrap">Vigente desde</th>
                  <th className="px-6 py-4">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {reglas.map((regla) => (
                  <tr
                    key={regla.instancia}
                    className={`border-b border-gray-800 last:border-b-0 transition-colors ${actualizada === regla.instancia ? 'bg-viper/10' : 'hover:bg-fondo/50'}`}
                  >
                    <td className="px-6 py-4">{nombreInstancia(regla.instancia)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Puntos regla={regla} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap tabular-nums">{regla.vigenteDesde ? fechaCorta(regla.vigenteDesde) : '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Modificar disciplina={disciplina} regla={regla} />
                        <VerHistorial onClick={() => setHistorial(regla.instancia)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Celular: una tarjeta por instancia */}
          <ul className="md:hidden flex flex-col gap-3">
            {reglas.map((regla) => (
              <li
                key={regla.instancia}
                className={`border rounded-2xl p-4 ${actualizada === regla.instancia ? 'bg-viper/10 border-viper/40' : 'bg-panel border-gray-800'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium break-words min-w-0">{nombreInstancia(regla.instancia)}</p>
                  <p className="font-bold whitespace-nowrap">{regla.puntos === null ? <span className="text-texto-suave font-normal">Sin regla</span> : puntosCorto(regla.puntos)}</p>
                </div>
                <p className="text-xs text-texto-suave mt-1">{regla.vigenteDesde ? `Vigente desde ${fechaCorta(regla.vigenteDesde)}` : 'Sin fecha de vigencia'}</p>
                <div className="flex items-center justify-between gap-2 mt-3">
                  <Modificar disciplina={disciplina} regla={regla} />
                  <VerHistorial onClick={() => setHistorial(regla.instancia)} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {historial && <HistorialRegla disciplina={disciplina} instancia={historial} onCerrar={cerrarHistorial} />}
    </div>
  )
}