import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { get, post } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import Spinner from '../../../../shared/components/Spinner'
import { useToast } from '../../../../shared/hooks/useToast'
import ArchivoBloqueado from '../components/ArchivoBloqueado'
import ResumenArchivo from '../components/ResumenArchivo'

const RUTA = '/gestion/torneos'
const TARJETA = 'bg-panel border border-gray-800 rounded-2xl p-5 md:p-6'
const TITULO_SECCION = 'text-xs font-bold uppercase tracking-wide text-texto-suave mb-4'

const CONSERVA = ['Partidos y resultados', 'Inscripciones asociadas', 'Zonas y tablas de posiciones']

function Icono({ ruta, clases }) {
  return (
    <svg className={`shrink-0 mt-0.5 ${clases}`} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ruta} />
    </svg>
  )
}
const TILDE = 'M20 6 9 17l-5-5'
const ADVERTENCIA = 'M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'

// Panel «Confirmar archivo»: qué se valida, qué deja de poder hacerse y qué se conserva
function PanelConfirmar({ botones }) {
  return (
    <aside className={`${TARJETA} h-fit lg:sticky lg:top-6`} aria-label="Confirmar archivo">
      <h2 className="font-outfit text-lg font-bold">Confirmar archivo</h2>
      <p className="text-sm text-texto-suave mt-1">Se valida el estado del torneo antes de archivarlo.</p>

      <h3 className={`${TITULO_SECCION} mt-6`}>Validación</h3>
      <div className="flex items-start gap-2 text-sm">
        <Icono ruta={TILDE} clases="text-viper" />
        <span>El torneo está en estado Finalizado</span>
      </div>

      <div className="mt-4 flex items-start gap-2 text-sm bg-advertencia/10 border border-advertencia/50 rounded-xl px-4 py-3">
        <Icono ruta={ADVERTENCIA} clases="text-advertencia" />
        <div>
          <p className="font-semibold">El torneo dejará de ser editable</p>
          <p className="text-texto-suave mt-1">Una vez archivado, no se podrán modificar sus datos. Esta acción no se puede deshacer.</p>
        </div>
      </div>

      <h3 className={`${TITULO_SECCION} mt-6`}>Se conserva</h3>
      <ul className="flex flex-col gap-2">
        {CONSERVA.map((texto) => (
          <li key={texto} className="flex items-start gap-2 text-sm">
            <Icono ruta={TILDE} clases="text-viper" />
            <span>{texto}</span>
          </li>
        ))}
      </ul>

      <div className="hidden lg:flex flex-col-reverse gap-3 mt-8">{botones}</div>
    </aside>
  )
}

// Archivar un torneo finalizado (CU 3.8). Solo Administrador. Muestra el resumen del torneo (campeón, cuadro final, ranking y
// resultados) y pide confirmar. Cancelar (4a) vuelve sin cambiar nada; un torneo que no está finalizado (5a) o que ya está
// archivado (5b) muestra por qué no se puede. Al archivar vuelve al listado, en Históricos.
export default function ArchivarTorneo() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { mostrarToast } = useToast()

  const [reintento, setReintento] = useState(0)
  const [resultado, setResultado] = useState(null) // { clave, resumen, error }
  const [archivando, setArchivando] = useState(false)
  const clave = `${id}|${reintento}`
  const actual = resultado?.clave === clave ? resultado : null

  useEffect(() => {
    let vigente = true
    get(`/torneos/${id}/resumen`)
      .then((resumen) => vigente && setResultado({ clave, resumen }))
      .catch((error) => vigente && setResultado({ clave, error }))
    return () => {
      vigente = false
    }
  }, [id, clave])

  const recargar = useCallback(() => setReintento((n) => n + 1), [])

  // 4a: se vuelve a la pantalla de la que se vino (la ficha o el listado) sin llamar a la API
  const cancelar = () => {
    if (window.history.state?.idx > 0) navigate(-1)
    else navigate(`${RUTA}?vista=historicos`)
  }

  const archivar = async () => {
    setArchivando(true)
    try {
      const respuesta = await post(`/torneos/${id}/archivar`)
      mostrarToast(respuesta.mensaje, 'exito')
      navigate(`${RUTA}?vista=historicos&estado=FINALIZADO`, { state: { archivado: respuesta.torneo.nombre } })
    } catch (e) {
      // Otra persona lo archivó o cambió el estado mientras se miraba: se avisa y se vuelve a pedir el resumen (5a o 5b)
      mostrarToast(e.mensaje, 'error')
      recargar()
    } finally {
      setArchivando(false)
    }
  }

  const encabezado = (
    <Link to={`${RUTA}?vista=historicos`} className="text-sm text-texto-suave hover:text-viper transition-colors inline-flex items-center gap-1 w-fit">
      <span aria-hidden="true">‹</span> Volver a torneos
    </Link>
  )
  const titulo = <h1 className="font-outfit text-[28px] font-bold">Archivar torneo</h1>
  const pantalla = (contenido, bajada = null) => (
    <div className="max-w-6xl mx-auto w-full flex flex-col gap-6">
      {encabezado}
      <div>
        {titulo}
        {bajada && <p className="text-texto-suave text-sm mt-1">{bajada}</p>}
      </div>
      {contenido}
    </div>
  )

  if (!actual) return pantalla(<div className="py-16 flex justify-center"><Spinner texto="Cargando resumen" /></div>)

  const { resumen, error } = actual
  if (error) {
    if (error.status === 404) {
      return pantalla(
        <Alert variante="error" titulo="No encontramos el torneo">
          <Link to={RUTA} className="underline font-semibold">Volver a la lista</Link>
        </Alert>
      )
    }
    if (error.status === 409 && error.datos?.estado) return pantalla(<ArchivoBloqueado estado={error.datos.estado} />)
    return pantalla(
      <Alert variante="error" titulo="No pudimos cargar el resumen del torneo">
        {error.mensaje}{' '}
        <button type="button" onClick={recargar} className="underline font-semibold cursor-pointer">Reintentar</button>
      </Alert>
    )
  }

  if (resumen.torneo.estado === 'ARCHIVADO') return pantalla(<ArchivoBloqueado estado="ARCHIVADO" torneo={resumen.torneo} />)

  const botones = (
    <>
      <Button variante="neutro" disabled={archivando} onClick={cancelar}>Cancelar</Button>
      <Button cargando={archivando} onClick={archivar}>Confirmar Archivo</Button>
    </>
  )

  return (
    <div className="max-w-6xl mx-auto w-full flex flex-col gap-6 pb-28 lg:pb-0">
      {encabezado}
      <div>
        {titulo}
        <p className="text-texto-suave text-sm mt-1">Revisá el resumen antes de confirmar</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem] gap-6 items-start">
        <ResumenArchivo resumen={resumen} />
        <PanelConfirmar botones={botones} />
      </div>

      {/* Celular y tablet: los botones van en la barra fija de abajo */}
      <div className="fixed bottom-0 inset-x-0 p-4 bg-fondo/90 backdrop-blur border-t border-gray-800 z-30 lg:hidden flex gap-3">
        <Button variante="neutro" className="flex-1" disabled={archivando} onClick={cancelar}>Cancelar</Button>
        <Button className="flex-[2]" cargando={archivando} onClick={archivar}>Confirmar Archivo</Button>
      </div>
    </div>
  )
}