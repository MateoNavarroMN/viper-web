import { useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { descargar } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Badge from '../../../../shared/components/Badge'
import Button from '../../../../shared/components/Button'
import CampoFecha from '../../../../shared/components/CampoFecha'
import FormField from '../../../../shared/components/FormField'
import Select from '../../../../shared/components/Select'
import Spinner from '../../../../shared/components/Spinner'
import { useToast } from '../../../../shared/hooks/useToast'
import { useConsulta } from '../../dashboard/useConsulta'
import { ETIQUETA_RUBRO, OPCIONES_RUBRO, dinero, errorDeRango, rangoEscrito } from '../../dashboard/dashboard'
import { FORMATOS, esFechaISO, guardarArchivo, mesActual } from '../reportes'

function Fila({ etiqueta, valor, tono = 'text-texto' }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-texto-suave">{etiqueta}</span>
      <span className={`font-semibold tabular-nums whitespace-nowrap ${tono}`}>{valor}</span>
    </div>
  )
}

function IconoArchivo({ texto, color }) {
  return (
    <span className={`shrink-0 w-11 h-12 rounded-lg border-2 flex items-end justify-center pb-1 text-[10px] font-bold ${color}`} aria-hidden="true">{texto}</span>
  )
}

// Exportar reporte financiero (solo Administrador): rango de fechas y rubro, vista previa con los totales y descarga en Excel o PDF.
// Se abre desde el Dashboard con el rango y el rubro que se estaban mirando (?desde=&hasta=&rubro=) o desde «Reportes» con el mes actual.
export default function ExportarReporte() {
  const navigate = useNavigate()
  const location = useLocation()
  const { mostrarToast } = useToast()
  const [parametros] = useSearchParams()

  // Filtros iniciales: los que trae el Dashboard o, sin ellos, el mes actual y todos los rubros
  const [inicial] = useState(() => {
    const trae = esFechaISO(parametros.get('desde')) && esFechaISO(parametros.get('hasta'))
    const mes = mesActual()
    const rubro = parametros.get('rubro')
    return {
      desdeDashboard: trae,
      campos: {
        desde: trae ? parametros.get('desde') : mes.desde,
        hasta: trae ? parametros.get('hasta') : mes.hasta,
        rubro: rubro in ETIQUETA_RUBRO ? rubro : '',
      },
    }
  })
  const [campos, setCampos] = useState(inicial.campos)
  // Qué se está generando ('excel' | 'pdf'), el error de la última generación y el último archivo descargado
  const [generando, setGenerando] = useState(null)
  const [fallo, setFallo] = useState(null)
  const [descargado, setDescargado] = useState(null)

  // 6a: fechas faltantes o desde posterior a hasta. Se marcan los campos y se conserva lo demás.
  const errorRango = errorDeRango(campos.desde, campos.hasta)
  const consulta = new URLSearchParams({ desde: campos.desde, hasta: campos.hasta })
  if (campos.rubro) consulta.set('rubro', campos.rubro)
  // 4: la vista previa se calcula con el mismo servicio que el Excel y el PDF, así los números coinciden
  const vista = useConsulta(errorRango ? null : `/reportes/vista-previa?${consulta}`)
  const previa = errorRango ? null : vista.datos
  const calculando = !errorRango && vista.cargando
  const sinMovimientos = Boolean(previa?.sinMovimientos) && !calculando
  const puedeExportar = Boolean(previa) && !calculando && !sinMovimientos && !generando && !vista.error

  const cambiar = (cambio) => {
    setCampos((anteriores) => ({ ...anteriores, ...cambio }))
    setFallo(null)
    setDescargado(null)
  }

  const exportar = async (formato) => {
    setGenerando(formato)
    setFallo(null)
    setDescargado(null)
    try {
      const { blob, nombre } = await descargar(`${FORMATOS[formato].ruta}?${consulta}`)
      const archivo = nombre ?? `viper-reporte-${campos.desde}-${campos.hasta}.${FORMATOS[formato].extension}`
      guardarArchivo(blob, archivo)
      setDescargado({ formato, nombre: archivo })
      mostrarToast('El reporte se descargó correctamente', 'exito')
    } catch (e) {
      // 7a: error de generación; los filtros se conservan para reintentar
      setFallo({ formato, mensaje: e.mensaje })
    } finally {
      setGenerando(null)
    }
  }

  // 3a: se vuelve a la pantalla anterior sin generar nada
  const cancelar = () => {
    mostrarToast('Exportación cancelada. No se generó ningún archivo.', 'exito')
    if (location.key !== 'default') navigate(-1)
    else navigate('/admin/dashboard')
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="font-outfit text-[28px] font-bold">Exportar reporte financiero</h1>
        <p className="text-texto-suave text-sm mt-1">Generá el balance y el detalle de movimientos para descargarlo</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* ---- Formulario ---- */}
        <section aria-label="Filtros del reporte" className="lg:col-span-2 bg-panel border border-gray-800 rounded-2xl p-6 flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-texto-suave">Período</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Desde" id="rep-desde" requerido error={errorRango && (campos.desde && campos.hasta ? 'No puede ser posterior a «hasta»' : !campos.desde ? 'Elegí la fecha' : null)}>
                <CampoFecha id="rep-desde" valor={campos.desde} error={Boolean(errorRango)} onChange={(desde) => cambiar({ desde })} disabled={Boolean(generando)} />
              </FormField>
              <FormField label="Hasta" id="rep-hasta" requerido error={errorRango && (campos.desde && campos.hasta ? 'Corregí el rango' : !campos.hasta ? 'Elegí la fecha' : null)}>
                <CampoFecha id="rep-hasta" valor={campos.hasta} error={Boolean(errorRango)} onChange={(hasta) => cambiar({ hasta })} disabled={Boolean(generando)} />
              </FormField>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col gap-4">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-texto-suave">Rubro económico</h2>
            <FormField label="Rubro" id="rep-rubro" requerido ayuda="Todos, Tienda, Reserva, Inscripción, Cuota, Proveedor, Servicios u Otro">
              <Select id="rep-rubro" opciones={OPCIONES_RUBRO} value={campos.rubro} onChange={(e) => cambiar({ rubro: e.target.value })} disabled={Boolean(generando)} />
            </FormField>
          </div>

          {errorRango && (
            <Alert variante="error" titulo="Revisá las fechas">
              Falta una fecha o «desde» es posterior a «hasta».
            </Alert>
          )}
          {inicial.desdeDashboard && !errorRango && (
            <Alert variante="info" titulo="Filtros tomados del Dashboard">Podés cambiarlos antes de exportar.</Alert>
          )}

          {/* 7a */}
          {fallo && (
            <Alert variante="error" titulo="No se pudo generar el archivo">
              {fallo.mensaje}. Revisá tu conexión e intentá de nuevo: tus filtros se conservaron.
            </Alert>
          )}

          {/* Resultado de la última descarga (A1: el PDF no trae el detalle de movimientos) */}
          {descargado && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-4 rounded-xl border border-gray-800 bg-fondo px-4 py-3">
                <IconoArchivo texto={descargado.formato === 'pdf' ? 'PDF' : 'XLS'} color={descargado.formato === 'pdf' ? 'border-error text-error' : 'border-exito text-exito'} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium break-all">{descargado.nombre}</p>
                  <p className="text-sm text-texto-suave">{descargado.formato === 'pdf' ? 'PDF · Balance y desglose' : 'Excel · Resumen y detalle'}</p>
                </div>
                <Badge variante="exito">Descargado</Badge>
              </div>
              {descargado.formato === 'pdf' && (
                <Alert variante="info" titulo="El PDF no incluye el detalle de movimientos">
                  Para obtener cada movimiento, exportá a Excel.
                </Alert>
              )}
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            <Button variante="neutro" onClick={cancelar} disabled={Boolean(generando)}>Cancelar</Button>
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <Button variante="neutro" onClick={() => exportar('pdf')} disabled={!puedeExportar} cargando={generando === 'pdf'}>
                {fallo?.formato === 'pdf' ? 'Reintentar PDF' : 'Exportar a PDF'}
              </Button>
              <Button onClick={() => exportar('excel')} disabled={!puedeExportar} cargando={generando === 'excel'}>
                {fallo?.formato === 'excel' ? 'Reintentar Excel' : 'Exportar a Excel'}
              </Button>
            </div>
          </div>
          {generando && (
            <p className="text-sm text-texto-suave text-center -mt-3" role="status">
              Generando el informe… {rangoEscrito(campos.desde, campos.hasta)} · {campos.rubro ? ETIQUETA_RUBRO[campos.rubro] : 'Todos los rubros'}
            </p>
          )}
        </section>

        {/* ---- Vista previa y contenido del archivo ---- */}
        <div className="flex flex-col gap-6">
          <section aria-label="Vista previa" className="bg-panel border border-gray-800 rounded-2xl overflow-hidden">
            <h2 className="font-outfit text-base font-bold px-5 py-4 border-b border-gray-800">Vista previa</h2>
            <div className="p-5 flex flex-col gap-4">
              {errorRango && <p className="text-sm text-texto-suave">Corregí las fechas para ver la vista previa.</p>}
              {calculando && !previa && <div className="py-8 flex flex-col items-center gap-3"><Spinner texto="Calculando la vista previa" /><p className="text-sm text-texto-suave">Calculando la vista previa…</p></div>}
              {!errorRango && vista.error && !previa && (
                <Alert variante="error" titulo="No se pudo calcular la vista previa">
                  {vista.error}{' '}
                  <Button variante="neutro" onClick={vista.reintentar} className="ml-2">Reintentar</Button>
                </Alert>
              )}
              {previa && (
                <div className={`flex flex-col gap-4 transition-opacity ${calculando ? 'opacity-60' : ''}`} aria-busy={calculando}>
                  {/* 4a: sin movimientos no se habilita la exportación */}
                  {sinMovimientos && (
                    <Alert variante="advertencia" titulo="No hay movimientos para exportar">
                      El rango y el rubro elegidos no tienen movimientos aprobados.
                    </Alert>
                  )}
                  <Fila etiqueta="Total de ingresos" valor={dinero(previa.totalIngresos)} />
                  <Fila etiqueta="Total de egresos" valor={dinero(previa.totalEgresos)} />
                  <div className="border-t border-gray-800 pt-4">
                    <Fila etiqueta="Saldo" valor={dinero(previa.saldo)} tono={previa.saldo < 0 ? 'text-error' : 'text-exito'} />
                  </div>
                  <div className="border-t border-gray-800 pt-4">
                    <Fila etiqueta="Movimientos incluidos" valor={previa.cantidadMovimientos} />
                    <p className="text-xs text-texto-suave mt-2">Solo movimientos aprobados</p>
                  </div>
                </div>
              )}
              {!errorRango && vista.error && previa && (
                <Alert variante="error" titulo="No se pudo actualizar la vista previa">
                  <Button variante="neutro" onClick={vista.reintentar}>Reintentar</Button>
                </Alert>
              )}
            </div>
          </section>

          <section aria-label="Contenido del archivo" className="bg-panel border border-gray-800 rounded-2xl overflow-hidden">
            <h2 className="font-outfit text-base font-bold px-5 py-4 border-b border-gray-800">Contenido del archivo</h2>
            <ul className="p-5 flex flex-col gap-5">
              <li className="flex items-start gap-4">
                <IconoArchivo texto="XLS" color="border-exito text-exito" />
                <div>
                  <p className="font-semibold">Hoja «Resumen»</p>
                  <p className="text-sm text-texto-suave">Balance del período y desglose por rubro y por medio de pago</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <IconoArchivo texto="XLS" color="border-exito text-exito" />
                <div>
                  <p className="font-semibold">Hoja «Detalle»</p>
                  <p className="text-sm text-texto-suave">Cada movimiento: fecha y hora, tipo, concepto, monto, medio, cliente y operador</p>
                </div>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}