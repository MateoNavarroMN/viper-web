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
import { OPCIONES_CONCEPTO, OPCIONES_METODO_PAGO, OPCIONES_TIPO_MOVIMIENTO, fechaDelDia } from '../caja'
import DetalleMovimiento from './DetalleMovimiento'
import FilaMovimiento, { COLUMNAS_MOVIMIENTO } from './FilaMovimiento'
import RegistrarMovimiento from './RegistrarMovimiento'
import ResumenCaja from './ResumenCaja'

const TAMANIO = 20

// Pestaña «Movimientos»: lo que entró y salió de la caja en un día (hoy, si no se elige otro), con los totales, filtros y el
// detalle de cada movimiento. Los filtros viven en la URL (?fecha=&tipo=&concepto=&metodo=&pagina=).
export default function Movimientos() {
  const hoy = fechaDeHoy()
  const [parametros, setParametros] = useSearchParams()
  const fecha = parametros.get('fecha') || hoy
  const tipo = parametros.get('tipo') ?? ''
  const concepto = parametros.get('concepto') ?? ''
  const metodo = parametros.get('metodo') ?? ''
  const pagina = Math.max(1, Number(parametros.get('pagina')) || 1)

  const [reintento, setReintento] = useState(0)
  const [abierto, setAbierto] = useState(null) // id del movimiento cuyo detalle se está viendo
  const [registrando, setRegistrando] = useState(false) // formulario «Registrar movimiento» abierto
  // Última respuesta y a qué consulta corresponde. Mientras no coincide con la actual se está cargando y se sigue mostrando
  // la lista anterior atenuada.
  const [resultado, setResultado] = useState(null) // { clave, datos, error }
  const clave = `${fecha}|${tipo}|${concepto}|${metodo}|${pagina}|${reintento}`
  const cargando = resultado?.clave !== clave
  const datos = resultado?.datos ?? null
  const error = resultado?.clave === clave ? resultado.error : null

  // Cambia filtros en la URL. Cualquier cambio de filtro vuelve a la página 1; el día de hoy no se escribe.
  const actualizar = (cambios) => {
    const nuevos = new URLSearchParams(parametros)
    for (const [campo, valor] of Object.entries({ pagina: '', ...cambios })) {
      if (valor && !(campo === 'fecha' && valor === hoy)) nuevos.set(campo, valor)
      else nuevos.delete(campo)
    }
    setParametros(nuevos)
  }

  useEffect(() => {
    let vigente = true // si cambian los filtros antes de que responda, se ignora la respuesta vieja
    const consulta = new URLSearchParams({ fecha, pagina: String(pagina), tamanio: String(TAMANIO) })
    if (tipo) consulta.set('tipo', tipo)
    if (concepto) consulta.set('concepto', concepto)
    if (metodo) consulta.set('metodo', metodo)
    get(`/caja/movimientos?${consulta}`)
      .then((respuesta) => vigente && setResultado({ clave, datos: respuesta }))
      .catch((e) => vigente && setResultado((anterior) => ({ clave, datos: anterior?.datos, error: e.mensaje })))
    return () => {
      vigente = false
    }
  }, [clave, fecha, tipo, concepto, metodo, pagina])

  const hayFiltros = Boolean(tipo || concepto || metodo)
  const esHoy = fecha === hoy
  const limpiarFiltros = () => setParametros(esHoy ? new URLSearchParams() : new URLSearchParams({ fecha }))

  // Un movimiento nuevo es de hoy: se vuelve a pedir la lista (y los totales) mirando el día de hoy
  const alRegistrar = () => {
    setRegistrando(false)
    setReintento((n) => n + 1)
    if (!esHoy) actualizar({ fecha: hoy })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* En el celular el botón queda fijo abajo */}
      <div className="fixed bottom-0 inset-x-0 p-4 bg-fondo/90 backdrop-blur border-t border-gray-800 z-30 md:static md:p-0 md:bg-transparent md:border-0 md:backdrop-blur-none md:flex md:justify-end">
        <Button onClick={() => setRegistrando(true)} className="w-full md:w-auto">
          Registrar movimiento
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[auto_repeat(3,minmax(0,1fr))] gap-3 items-end">
        <label className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
          <span className="text-xs font-bold uppercase tracking-wide text-texto-suave">Día</span>
          <div className="flex gap-2">
            <Input
              type="date"
              aria-label="Día de los movimientos"
              max={hoy}
              value={fecha}
              // Un campo de fecha vacío (se borró con el teclado) no es un día: se vuelve a hoy
              onChange={(e) => actualizar({ fecha: e.target.value || hoy })}
              className="lg:w-48"
            />
            {!esHoy && (
              <Button variante="secundario" onClick={() => actualizar({ fecha: hoy })} className="whitespace-nowrap">
                Hoy
              </Button>
            )}
          </div>
        </label>
        <Select aria-label="Filtrar por tipo" opciones={OPCIONES_TIPO_MOVIMIENTO} value={tipo} onChange={(e) => actualizar({ tipo: e.target.value })} />
        <Select aria-label="Filtrar por concepto" opciones={OPCIONES_CONCEPTO} value={concepto} onChange={(e) => actualizar({ concepto: e.target.value })} />
        <Select aria-label="Filtrar por medio de pago" opciones={OPCIONES_METODO_PAGO} value={metodo} onChange={(e) => actualizar({ metodo: e.target.value })} />
      </div>

      {error ? (
        <Alert variante="error" titulo="No pudimos cargar los movimientos">
          {error}{' '}
          <button type="button" onClick={() => setReintento((n) => n + 1)} className="underline font-semibold cursor-pointer">
            Reintentar
          </button>
        </Alert>
      ) : !datos ? (
        <div className="py-16 flex justify-center">
          <Spinner texto="Cargando movimientos" />
        </div>
      ) : (
        <div className={`flex flex-col gap-6 transition-opacity ${cargando ? 'opacity-60' : ''}`} aria-busy={cargando}>
          {datos.cajaCerrada && (
            <Alert variante="info">La caja del {fechaDelDia(fecha)} ya fue cerrada: sus movimientos no admiten cambios.</Alert>
          )}

          <ResumenCaja totales={datos.totales} />
          <p className="text-xs text-texto-suave -mt-3">Los totales suman solo los movimientos aprobados{hayFiltros ? ' que coinciden con los filtros' : ''}.</p>

          {datos.movimientos.length === 0 ? (
            <div className="bg-panel border border-gray-800 rounded-2xl px-6 py-12 text-center flex flex-col items-center">
              <h2 className="font-outfit text-lg font-bold">
                {hayFiltros ? 'No se encontraron movimientos' : esHoy ? 'Todavía no hay movimientos hoy' : `No hay movimientos el ${fechaDelDia(fecha)}`}
              </h2>
              <p className="text-texto-suave text-sm mt-2">
                {hayFiltros ? 'Probá con otros filtros o elegí otro día.' : 'Cuando se registre una venta, un cobro o un egreso, aparece acá.'}
              </p>
              {hayFiltros && (
                <Button variante="secundario" onClick={limpiarFiltros} className="mt-6">
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {datos.totalPaginas > 1 && <Paginacion pagina={pagina} totalPaginas={datos.totalPaginas} onCambiar={(n) => actualizar({ pagina: String(n) })} etiqueta="Paginación superior" />}
              <div className={`hidden md:grid ${COLUMNAS_MOVIMIENTO} gap-x-4 px-6 text-xs font-bold uppercase tracking-wide text-texto-suave`}>
                <span>Hora</span>
                <span>Movimiento</span>
                <span>Medio de pago</span>
                <span>Estado</span>
                <span className="text-right">Importe</span>
              </div>
              <ul className="flex flex-col gap-3">
                {datos.movimientos.map((movimiento) => (
                  <FilaMovimiento key={movimiento.id} movimiento={movimiento} onAbrir={setAbierto} />
                ))}
              </ul>
              <Paginacion
                pagina={pagina}
                totalPaginas={datos.totalPaginas}
                onCambiar={(n) => actualizar({ pagina: String(n) })}
                resumen={`Mostrando ${datos.movimientos.length} de ${datos.total} ${datos.total === 1 ? 'movimiento' : 'movimientos'}`}
                className="mt-2"
              />
            </div>
          )}
        </div>
      )}

      {registrando && <RegistrarMovimiento onCerrar={() => setRegistrando(false)} onRegistrado={alRegistrar} />}
      {abierto && <DetalleMovimiento key={abierto} id={abierto} onCerrar={() => setAbierto(null)} onCambio={() => setReintento((n) => n + 1)} />}
    </div>
  )
}