import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Alert from '../../../../shared/components/Alert'
import BottomSheet from '../../../../shared/components/BottomSheet'
import Button from '../../../../shared/components/Button'
import Spinner from '../../../../shared/components/Spinner'
import Tabs from '../../../../shared/components/Tabs'
import { useMediaQuery } from '../../../../shared/hooks/useMediaQuery'
import AlertasDashboard from '../components/AlertasDashboard'
import BloqueCaja from '../components/BloqueCaja'
import BloqueCanchas from '../components/BloqueCanchas'
import BloqueComunicados from '../components/BloqueComunicados'
import BloqueSocios from '../components/BloqueSocios'
import BloqueTienda from '../components/BloqueTienda'
import BloqueTorneos from '../components/BloqueTorneos'
import DesglosePorMedio from '../components/DesglosePorMedio'
import DesglosePorRubro from '../components/DesglosePorRubro'
import DetalleAlerta from '../components/DetalleAlerta'
import DetalleRubro from '../components/DetalleRubro'
import FiltrosDashboard from '../components/FiltrosDashboard'
import GraficoEvolucion from '../components/GraficoEvolucion'
import TarjetaTotal from '../components/TarjetaTotal'
import { ETIQUETA_RUBRO, RUBROS_DE_EGRESO, RUBROS_DE_INGRESO, dinero, errorDeRango, rangoEscrito } from '../dashboard'
import { useBalance } from '../useBalance'

// Mensaje para los estados vacíos del panel (13b)
function Vacio({ titulo, detalle, children }) {
  return (
    <div className="bg-panel border border-gray-800 rounded-2xl p-8 text-center">
      <p className="font-outfit text-lg font-bold">{titulo}</p>
      <p className="text-texto-suave text-sm mt-2">{detalle}</p>
      {children && <div className="mt-5 flex justify-center">{children}</div>}
    </div>
  )
}

// Las tres pantallas del celular (en la computadora se ve todo junto)
const VISTAS = [
  { clave: 'resumen', titulo: 'Resumen' },
  { clave: 'finanzas', titulo: 'Finanzas' },
  { clave: 'hoy', titulo: 'Operación de hoy' },
]

// Dashboard del Administrador: balance del período (ingresos, egresos y saldo) con su desglose por rubro y medio de pago y la evolución
// diaria; las alertas de lo que requiere atención; y el estado operativo de hoy (caja, canchas, torneos, socios, tienda y comunicados).
// Sin filtros muestra el mes actual. Cada bloque carga por su cuenta: si uno falla, el resto sigue funcionando.
// Al elegir un rubro del desglose o una alerta se abre su detalle en lugar del panel, con un botón para volver.
export default function Dashboard() {
  const navigate = useNavigate()
  // Lo que escribió la persona en los filtros. `null` = todavía no tocó ese campo: se muestra lo que informó la API (el mes actual).
  const [campos, setCampos] = useState({ desde: null, hasta: null, rubro: '' })
  // Lo que se pidió a la API: solo cambia si el rango es válido, así un rango inválido conserva el último que sí lo era (12a)
  const [aplicados, setAplicados] = useState({ desde: '', hasta: '', rubro: '' })
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)
  const [vista, setVista] = useState('resumen')
  // Detalle abierto: { tipo: 'rubro', rubro } o { tipo: 'alerta', alerta }
  const [detalle, setDetalle] = useState(null)
  const esCelular = !useMediaQuery('(min-width: 768px)')

  const { datos, cargando, error, reintentar } = useBalance(aplicados)

  const mostrados = { desde: campos.desde ?? datos?.desde ?? '', hasta: campos.hasta ?? datos?.hasta ?? '', rubro: campos.rubro }
  // Mientras no haya un primer balance no hay nada que conservar: no se marca error por las fechas aún vacías
  const errorRango = datos ? errorDeRango(mostrados.desde, mostrados.hasta) : null

  const cambiar = (cambio) => {
    const siguientes = { ...mostrados, ...cambio }
    setCampos(siguientes)
    if (!errorDeRango(siguientes.desde, siguientes.hasta)) setAplicados(siguientes)
  }
  const limpiarFiltros = () => {
    setCampos({ desde: null, hasta: null, rubro: '' })
    setAplicados({ desde: '', hasta: '', rubro: '' })
  }

  // «Exportar» abre el formulario de exportación con el rango y el rubro que se están mirando (los últimos válidos)
  const exportar = () => {
    const parametros = new URLSearchParams({ desde: datos.desde, hasta: datos.hasta })
    if (datos.rubro) parametros.set('rubro', datos.rubro)
    navigate(`/admin/reportes?${parametros}`)
  }

  // Detalle de un rubro o de una alerta: ocupa el lugar del panel; al volver, los filtros siguen como estaban
  if (detalle?.tipo === 'rubro' && datos) {
    return <DetalleRubro rubro={detalle.rubro} desde={datos.desde} hasta={datos.hasta} onVolver={() => setDetalle(null)} />
  }
  if (detalle?.tipo === 'alerta') {
    return <DetalleAlerta tipo={detalle.alerta} onVolver={() => setDetalle(null)} />
  }

  const filtros = <FiltrosDashboard campos={mostrados} onCambiar={cambiar} error={errorRango} prefijo={esCelular ? 'dash-m' : 'dash'} />
  const aviso = errorRango && datos && (
    <Alert variante="error" titulo={errorRango.titulo}>
      {errorRango.detalle} Se conserva el último rango válido: {rangoEscrito(datos.desde, datos.hasta)}.
    </Alert>
  )
  const rubroElegido = datos?.rubro ? ETIQUETA_RUBRO[datos.rubro] : null
  // 13b: el rubro elegido no tiene movimientos en el rango
  const sinResultadosDelFiltro = Boolean(datos?.sinMovimientos && rubroElegido)

  const alertas = <AlertasDashboard onElegir={(alerta) => setDetalle({ tipo: 'alerta', alerta })} />

  const totales = datos && (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <TarjetaTotal titulo="Ingresos" valor={dinero(datos.totalIngresos)} ayuda="Movimientos aprobados" tono="text-exito" />
      <TarjetaTotal titulo="Egresos" valor={dinero(datos.totalEgresos)} ayuda="Movimientos aprobados" tono="text-advertencia" />
      <TarjetaTotal titulo="Saldo" valor={dinero(datos.saldo)} ayuda="Ingresos menos egresos" tono={datos.saldo < 0 ? 'text-error' : 'text-texto'} />
    </div>
  )

  // 3a: ningún movimiento aprobado en el rango (con todos los rubros)
  const sinMovimientos = datos?.sinMovimientos && (
    <Alert variante="info" titulo="No hay movimientos para mostrar">
      El período seleccionado no tiene movimientos aprobados.
    </Alert>
  )
  const grafico = datos && <GraficoEvolucion evolucion={datos.evolucion} />
  const desgloses = datos && (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <DesglosePorRubro titulo="Ingresos por rubro" campo="ingresos" porRubro={datos.porRubro} rubrosPosibles={RUBROS_DE_INGRESO} color="bg-exito" onElegir={(rubro) => setDetalle({ tipo: 'rubro', rubro })} />
      <DesglosePorRubro titulo="Egresos por rubro" campo="egresos" porRubro={datos.porRubro} rubrosPosibles={RUBROS_DE_EGRESO} color="bg-advertencia" onElegir={(rubro) => setDetalle({ tipo: 'rubro', rubro })} />
      <DesglosePorMedio porMedio={datos.porMedio} />
    </div>
  )

  const operativo = (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <BloqueCaja />
      <BloqueCanchas />
      <BloqueTorneos />
      <BloqueSocios />
      <BloqueTienda desde={aplicados.desde} hasta={aplicados.hasta} />
      <BloqueComunicados />
    </div>
  )

  const vacioPorFiltro = (
    <Vacio titulo={`No hay movimientos de ${rubroElegido}`} detalle="No hay movimientos en el rango elegido.">
      <Button variante="neutro" onClick={limpiarFiltros}>Limpiar filtros</Button>
    </Vacio>
  )

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-outfit text-[28px] font-bold">Dashboard</h1>
          <p className="text-texto-suave text-sm mt-1">
            Estado general del club{esCelular && datos ? ` · ${rangoEscrito(datos.desde, datos.hasta)} · ${rubroElegido ?? 'Todos los rubros'}` : ''}
          </p>
        </div>
        {esCelular ? (
          <Button variante="neutro" onClick={() => setFiltrosAbiertos(true)} aria-haspopup="dialog" className="shrink-0">
            Filtros
          </Button>
        ) : (
          <Button variante="neutro" onClick={exportar} disabled={!datos} className="shrink-0">Exportar</Button>
        )}
      </div>

      {esCelular ? (
        <BottomSheet abierto={filtrosAbiertos} titulo="Filtros" onCerrar={() => setFiltrosAbiertos(false)}>
          <div className="flex flex-col gap-4">
            {filtros}
            {aviso}
            <Button onClick={() => setFiltrosAbiertos(false)} disabled={Boolean(errorRango)}>Ver resultados</Button>
          </div>
        </BottomSheet>
      ) : (
        <div className="flex flex-col gap-4">
          {filtros}
          {datos && !errorRango && (
            <p className="text-sm text-texto-suave md:text-right">Mostrando {rangoEscrito(datos.desde, datos.hasta)}{rubroElegido ? ` · ${rubroElegido}` : ''}</p>
          )}
          {aviso}
        </div>
      )}

      {esCelular && <Tabs pestanas={VISTAS} activa={vista} onCambiar={setVista} />}

      {!datos && cargando && (
        <div className="py-16 flex justify-center"><Spinner texto="Cargando el balance" /></div>
      )}

      {!datos && error && (
        <Alert variante="error" titulo="No pudimos cargar el balance">
          {error}{' '}
          <Button variante="neutro" onClick={reintentar} className="ml-2">Reintentar</Button>
        </Alert>
      )}

      {/* El balance falló o todavía no llegó: igual se ven las alertas y los bloques de hoy, que cargan por su cuenta */}
      {!datos && (!esCelular || vista === 'resumen') && alertas}
      {!datos && (!esCelular || vista === 'hoy') && (
        <>
          {!esCelular && <h2 className="font-outfit text-xl font-bold -mb-2">Estado operativo de hoy</h2>}
          {operativo}
        </>
      )}

      {datos && (
        <div className={`flex flex-col gap-6 transition-opacity ${cargando ? 'opacity-60' : ''}`} aria-busy={cargando}>
          {error && (
            <Alert variante="error" titulo="No se pudieron actualizar los datos">
              {error} Lo que ves es el último balance cargado.{' '}
              <Button variante="neutro" onClick={reintentar} className="ml-2">Reintentar</Button>
            </Alert>
          )}

          {esCelular ? (
            <>
              {vista === 'resumen' && (sinResultadosDelFiltro ? vacioPorFiltro : (<>{totales}{sinMovimientos}</>))}
              {vista === 'resumen' && alertas}
              {vista === 'finanzas' && (
                sinResultadosDelFiltro ? vacioPorFiltro : (
                  <>
                    {sinMovimientos || (<>{grafico}{desgloses}</>)}
                    <Button variante="neutro" onClick={exportar} className="w-full">Exportar informe</Button>
                  </>
                )
              )}
              {vista === 'hoy' && operativo}
            </>
          ) : (
            <>
              {sinResultadosDelFiltro ? (
                <>
                  {vacioPorFiltro}
                  {alertas}
                </>
              ) : (
                <>
                  {totales}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 min-w-0">{sinMovimientos || grafico}</div>
                    {alertas}
                  </div>
                  {!datos.sinMovimientos && desgloses}
                </>
              )}
              <h2 className="font-outfit text-xl font-bold -mb-2">Estado operativo de hoy</h2>
              {operativo}
            </>
          )}
        </div>
      )}
    </div>
  )
}