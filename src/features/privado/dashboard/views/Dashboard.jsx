import { useState } from 'react'
import Alert from '../../../../shared/components/Alert'
import BottomSheet from '../../../../shared/components/BottomSheet'
import Button from '../../../../shared/components/Button'
import Spinner from '../../../../shared/components/Spinner'
import { useMediaQuery } from '../../../../shared/hooks/useMediaQuery'
import DesglosePorMedio from '../components/DesglosePorMedio'
import DesglosePorRubro from '../components/DesglosePorRubro'
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

// Dashboard del Administrador: balance del período (ingresos, egresos y saldo), su desglose por rubro y por medio de pago y la
// evolución diaria. Sin filtros muestra el mes actual. Los demás bloques del panel (alertas, caja, canchas…) se suman en las
// tareas siguientes.
export default function Dashboard() {
  // Lo que escribió la persona en los filtros. `null` = todavía no tocó ese campo: se muestra lo que informó la API (el mes actual).
  const [campos, setCampos] = useState({ desde: null, hasta: null, rubro: '' })
  // Lo que se pidió a la API: solo cambia si el rango es válido, así un rango inválido conserva el último que sí lo era (12a)
  const [aplicados, setAplicados] = useState({ desde: '', hasta: '', rubro: '' })
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)
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

  const filtros = <FiltrosDashboard campos={mostrados} onCambiar={cambiar} error={errorRango} prefijo={esCelular ? 'dash-m' : 'dash'} />
  const aviso = errorRango && datos && (
    <Alert variante="error" titulo={errorRango.titulo}>
      {errorRango.detalle} Se conserva el último rango válido: {rangoEscrito(datos.desde, datos.hasta)}.
    </Alert>
  )
  const rubroElegido = datos?.rubro ? ETIQUETA_RUBRO[datos.rubro] : null

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-outfit text-[28px] font-bold">Dashboard</h1>
          <p className="text-texto-suave text-sm mt-1">
            Estado general del club{esCelular && datos ? ` · ${rangoEscrito(datos.desde, datos.hasta)} · ${rubroElegido ?? 'Todos los rubros'}` : ''}
          </p>
        </div>
        {esCelular && (
          <Button variante="neutro" onClick={() => setFiltrosAbiertos(true)} aria-haspopup="dialog" className="shrink-0">
            Filtros
          </Button>
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

      {!datos && cargando && (
        <div className="py-16 flex justify-center"><Spinner texto="Cargando el balance" /></div>
      )}

      {!datos && error && (
        <Alert variante="error" titulo="No pudimos cargar el balance">
          {error}{' '}
          <Button variante="neutro" onClick={reintentar} className="ml-2">Reintentar</Button>
        </Alert>
      )}

      {datos && (
        <div className={`flex flex-col gap-6 transition-opacity ${cargando ? 'opacity-60' : ''}`} aria-busy={cargando}>
          {error && (
            <Alert variante="error" titulo="No se pudieron actualizar los datos">
              {error} Lo que ves es el último balance cargado.{' '}
              <Button variante="neutro" onClick={reintentar} className="ml-2">Reintentar</Button>
            </Alert>
          )}

          {/* 13b: un rubro sin movimientos en el rango. 3a: ningún movimiento aprobado en el rango (con todos los rubros) */}
          {datos.sinMovimientos && rubroElegido ? (
            <Vacio titulo={`No hay movimientos de ${rubroElegido}`} detalle="No hay movimientos en el rango elegido.">
              <Button variante="neutro" onClick={limpiarFiltros}>Limpiar filtros</Button>
            </Vacio>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TarjetaTotal titulo="Ingresos" valor={dinero(datos.totalIngresos)} ayuda="Movimientos aprobados" tono="text-exito" />
                <TarjetaTotal titulo="Egresos" valor={dinero(datos.totalEgresos)} ayuda="Movimientos aprobados" tono="text-advertencia" />
                <TarjetaTotal titulo="Saldo" valor={dinero(datos.saldo)} ayuda="Ingresos menos egresos" tono={datos.saldo < 0 ? 'text-error' : 'text-texto'} />
              </div>

              {datos.sinMovimientos ? (
                <Alert variante="info" titulo="No hay movimientos para mostrar">
                  El período seleccionado no tiene movimientos aprobados.
                </Alert>
              ) : (
                <>
                  <GraficoEvolucion evolucion={datos.evolucion} />
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <DesglosePorRubro titulo="Ingresos por rubro" campo="ingresos" porRubro={datos.porRubro} rubrosPosibles={RUBROS_DE_INGRESO} color="bg-exito" />
                    <DesglosePorRubro titulo="Egresos por rubro" campo="egresos" porRubro={datos.porRubro} rubrosPosibles={RUBROS_DE_EGRESO} color="bg-advertencia" />
                    <DesglosePorMedio porMedio={datos.porMedio} />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}