import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { get } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import Input from '../../../../shared/components/Input'
import Paginacion from '../../../../shared/components/Paginacion'
import Select from '../../../../shared/components/Select'
import Spinner from '../../../../shared/components/Spinner'
import { fechaDeHoy } from '../../socios/socios'
import { OPCIONES_ESTADO_CIERRE } from '../caja'
import DetalleCierre from './DetalleCierre'
import FilaCierre, { COLUMNAS_CIERRE } from './FilaCierre'

const TAMANIO = 20
const FECHA_VALIDA = /^\d{4}-\d{2}-\d{2}$/

// Pestaña «Historial»: los cierres de caja, del más reciente al más antiguo, con filtros por fechas y estado y el detalle de cada
// uno. Los filtros viven en la URL (?pestana=historial&desde=&hasta=&estado=&pagina=).
export default function Historial() {
  const hoy = fechaDeHoy()
  const [parametros, setParametros] = useSearchParams()
  const leer = (nombre) => (FECHA_VALIDA.test(parametros.get(nombre) ?? '') ? parametros.get(nombre) : '')
  const desde = leer('desde')
  const hasta = leer('hasta')
  const estado = ['CUADRADO', 'DESCUADRADO'].includes(parametros.get('estado')) ? parametros.get('estado') : ''
  const pagina = Math.max(1, Number(parametros.get('pagina')) || 1)

  const [reintento, setReintento] = useState(0)
  const [abierto, setAbierto] = useState(null) // id del cierre cuyo detalle se está viendo
  const [resultado, setResultado] = useState(null) // { clave, datos, error }
  const clave = `${desde}|${hasta}|${estado}|${pagina}|${reintento}`
  const cargando = resultado?.clave !== clave
  const datos = resultado?.datos ?? null
  const error = resultado?.clave === clave ? resultado.error : null

  // Cambia filtros en la URL; cualquier cambio vuelve a la página 1. «Desde» nunca queda después de «Hasta».
  const actualizar = (cambios) => {
    const nuevos = new URLSearchParams(parametros)
    const final = { desde, hasta, ...cambios }
    if (final.desde && final.hasta && final.desde > final.hasta) {
      if ('desde' in cambios) final.hasta = final.desde
      else final.desde = final.hasta
    }
    for (const [campo, valor] of Object.entries({ pagina: '', ...cambios, desde: final.desde, hasta: final.hasta })) {
      if (valor) nuevos.set(campo, valor)
      else nuevos.delete(campo)
    }
    setParametros(nuevos)
  }

  useEffect(() => {
    let vigente = true
    const consulta = new URLSearchParams({ pagina: String(pagina), tamanio: String(TAMANIO) })
    if (desde) consulta.set('desde', desde)
    if (hasta) consulta.set('hasta', hasta)
    if (estado) consulta.set('estado', estado)
    get(`/caja/cierres?${consulta}`)
      .then((respuesta) => vigente && setResultado({ clave, datos: respuesta }))
      .catch((e) => vigente && setResultado((anterior) => ({ clave, datos: anterior?.datos, error: e.mensaje })))
    return () => {
      vigente = false
    }
  }, [clave, desde, hasta, estado, pagina])

  const hayFiltros = Boolean(desde || hasta || estado)
  const limpiarFiltros = () => setParametros(new URLSearchParams({ pestana: 'historial' }))

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wide text-texto-suave">Desde</span>
          <Input type="date" aria-label="Cierres desde" max={hasta || hoy} value={desde} onChange={(e) => actualizar({ desde: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wide text-texto-suave">Hasta</span>
          <Input type="date" aria-label="Cierres hasta" max={hoy} value={hasta} onChange={(e) => actualizar({ hasta: e.target.value })} />
        </label>
        <Select aria-label="Filtrar por estado" opciones={OPCIONES_ESTADO_CIERRE} value={estado} onChange={(e) => actualizar({ estado: e.target.value })} />
      </div>

      {error ? (
        <Alert variante="error" titulo="No pudimos cargar los cierres">
          {error}{' '}
          <button type="button" onClick={() => setReintento((n) => n + 1)} className="underline font-semibold cursor-pointer">
            Reintentar
          </button>
        </Alert>
      ) : !datos ? (
        <div className="py-16 flex justify-center">
          <Spinner texto="Cargando cierres" />
        </div>
      ) : (
        <div className={`flex flex-col gap-3 transition-opacity ${cargando ? 'opacity-60' : ''}`} aria-busy={cargando}>
          {datos.cierres.length === 0 ? (
            <div className="bg-panel border border-gray-800 rounded-2xl px-6 py-12 text-center flex flex-col items-center">
              <h2 className="font-outfit text-lg font-bold">{hayFiltros ? 'No hay cierres con esos criterios' : 'Todavía no se cerró ninguna caja'}</h2>
              <p className="text-texto-suave text-sm mt-2">
                {hayFiltros ? 'Probá con otro filtro o limpiá la búsqueda.' : 'Cuando se cierre una caja, aparece acá.'}
              </p>
              {hayFiltros && (
                <Button variante="secundario" onClick={limpiarFiltros} className="mt-6">
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              {datos.totalPaginas > 1 && <Paginacion pagina={pagina} totalPaginas={datos.totalPaginas} onCambiar={(n) => actualizar({ pagina: String(n) })} etiqueta="Paginación superior" />}
              <div className={`hidden md:grid ${COLUMNAS_CIERRE} gap-x-4 px-6 text-xs font-bold uppercase tracking-wide text-texto-suave`}>
                <span>Fecha</span>
                <span>Responsable</span>
                <span className="text-right">Declarado</span>
                <span className="text-right">Diferencia</span>
                <span className="text-right">Estado</span>
              </div>
              <ul className="flex flex-col gap-3">
                {datos.cierres.map((cierre) => (
                  <FilaCierre key={cierre.id} cierre={cierre} onAbrir={setAbierto} />
                ))}
              </ul>
              <Paginacion
                pagina={pagina}
                totalPaginas={datos.totalPaginas}
                onCambiar={(n) => actualizar({ pagina: String(n) })}
                resumen={`Mostrando ${datos.cierres.length} de ${datos.total} ${datos.total === 1 ? 'cierre' : 'cierres'}`}
                className="mt-2"
              />
            </>
          )}
        </div>
      )}

      {abierto && <DetalleCierre key={abierto} id={abierto} onCerrar={() => setAbierto(null)} />}
    </div>
  )
}