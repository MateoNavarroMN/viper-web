import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { get, post } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import ConfirmDialog from '../../../../shared/components/ConfirmDialog'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Badge from '../../../../shared/components/Badge'
import Spinner from '../../../../shared/components/Spinner'
import { useToast } from '../../../../shared/hooks/useToast'
import { leerPrecio } from '../../torneos/torneos'
import { MENSAJE_MONTO_INVALIDO, diaConNombre, diaYMes, diferenciaDeCaja, faltaOSobra, importe } from '../caja'
import ConciliacionCaja from './ConciliacionCaja'
import DatosDelCierre from './DatosDelCierre'
import ResumenJornada from './ResumenJornada'

// Una jornada: su resumen, el campo para declarar el efectivo y el cierre. Se monta con `key={fecha}`: al elegir otra jornada
// se descarta lo escrito. Cuando la caja se cierra, avisa con onCerrada() (la lista de jornadas sin cerrar se vuelve a pedir).
export default function Jornada({ fecha, hoy, onCerrada }) {
  const navigate = useNavigate()
  const { mostrarToast } = useToast()
  const campo = useRef(null)
  const [recarga, setRecarga] = useState(0)
  const [resultado, setResultado] = useState(null) // { clave, resumen, error }
  const [texto, setTexto] = useState('')
  const [errorMonto, setErrorMonto] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState('')
  const [recienCerrada, setRecienCerrada] = useState(false) // se cerró en esta pantalla: se muestra el resultado

  const clave = `${fecha}|${recarga}`
  const resumen = resultado?.clave === clave ? resultado.resumen : null
  const error = resultado?.clave === clave ? resultado.error : null

  useEffect(() => {
    let vigente = true
    get(`/caja/cierre/resumen?fecha=${fecha}`)
      .then((respuesta) => vigente && setResultado({ clave, resumen: respuesta }))
      .catch((e) => vigente && setResultado({ clave, error: e.mensaje }))
    return () => {
      vigente = false
    }
  }, [clave, fecha])

  const enlaceMovimientos = fecha === hoy ? '/gestion/caja' : `/gestion/caja?fecha=${fecha}`
  const declarado = leerPrecio(texto)

  const escribir = (valor) => {
    setTexto(valor)
    setErrorMonto('')
    setAviso('')
  }

  // Valida el monto y, si está bien, pide la confirmación. Cancelarla deja la caja abierta y lo escrito como estaba.
  const pedirConfirmacion = () => {
    if (declarado === null) {
      setErrorMonto(MENSAJE_MONTO_INVALIDO)
      campo.current?.focus()
      return
    }
    setAviso('')
    setConfirmando(true)
  }

  const cerrar = async () => {
    setEnviando(true)
    try {
      await post('/caja/cierre', { fecha, efectivoDeclarado: declarado })
      setConfirmando(false)
      setRecienCerrada(true)
      setRecarga((n) => n + 1) // se vuelve a pedir el resumen: ya trae el cierre registrado
      onCerrada()
      mostrarToast('Caja cerrada correctamente')
    } catch (e) {
      setConfirmando(false)
      if (e.campo === 'efectivoDeclarado') {
        setErrorMonto(e.mensaje)
      } else {
        // Ya la cerró otra persona, apareció un cobro en línea pendiente, etc.: se muestra el motivo y se vuelve a mirar cómo quedó la jornada
        setAviso(e.mensaje)
        setRecarga((n) => n + 1)
        if (e.datos?.codigo === 'YA_CERRADA') onCerrada()
      }
    } finally {
      setEnviando(false)
    }
  }

  if (error) {
    return (
      <Alert variante="error" titulo="No pudimos cargar la jornada">
        {error}{' '}
        <button type="button" onClick={() => setRecarga((n) => n + 1)} className="underline font-semibold cursor-pointer">
          Reintentar
        </button>
      </Alert>
    )
  }
  if (!resumen) {
    return (
      <div className="py-16 flex justify-center">
        <Spinner texto="Cargando la jornada" />
      </div>
    )
  }

  const encabezado = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-panel border border-gray-800 rounded-2xl px-5 py-4">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-texto-suave">Jornada</p>
        <p className="font-outfit text-xl font-bold">{diaConNombre(fecha)}</p>
      </div>
      {resumen.cerrada ? <Badge variante="neutro">Cerrada</Badge> : <Badge variante="exito">Abierta</Badge>}
      <p className="text-sm text-texto-suave">
        {resumen.cantidadMovimientos} {resumen.cantidadMovimientos === 1 ? 'movimiento aprobado' : 'movimientos aprobados'}
      </p>
    </div>
  )

  // La caja ya está cerrada: se ve lo registrado, sin poder cerrarla de nuevo. Si se acaba de cerrar acá, es la pantalla de resultado.
  if (resumen.cerrada) {
    const { cierre } = resumen
    return (
      <div className="flex flex-col gap-6">
        {encabezado}
        {recienCerrada ? (
          <Alert variante="exito" titulo="Caja cerrada">
            Los movimientos del día quedaron bloqueados.
          </Alert>
        ) : (
          <Alert variante="info" titulo="La caja de esta fecha ya está cerrada">
            Se muestra el cierre registrado: no se puede ejecutar de nuevo.
          </Alert>
        )}
        {aviso && <Alert variante="advertencia">{aviso}</Alert>}
        <section aria-label="Cierre registrado" className="bg-panel border border-gray-800 rounded-2xl p-5 md:p-6 flex flex-col gap-5">
          <h2 className="font-outfit text-lg font-bold">Cierre registrado</h2>
          <DatosDelCierre cierre={cierre} />
          {cierre.diferencia !== 0 && <Alert variante="error">{faltaOSobra(cierre.diferencia)}.</Alert>}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to={enlaceMovimientos}
              className="font-outfit inline-flex items-center justify-center px-6 py-2 rounded-lg font-semibold bg-viper hover:bg-viper-hover text-sobre-viper transition-colors"
            >
              Ver movimientos del día
            </Link>
            <Button variante="neutro" onClick={() => navigate('/gestion/caja')}>
              Volver a Caja
            </Button>
          </div>
        </section>
        <ResumenJornada resumen={resumen} />
      </div>
    )
  }

  // Sin movimientos aprobados no hay nada que cerrar
  if (resumen.sinMovimientos) {
    return (
      <div className="flex flex-col gap-6">
        {encabezado}
        {aviso && <Alert variante="advertencia">{aviso}</Alert>}
        <div className="bg-panel border border-gray-800 rounded-2xl px-6 py-12 text-center flex flex-col items-center">
          <h2 className="font-outfit text-lg font-bold">No hay movimientos para cerrar</h2>
          <p className="text-texto-suave text-sm mt-2">La jornada del {diaYMes(fecha)} no tiene movimientos aprobados.</p>
          {fecha === hoy && (
            <Button variante="secundario" onClick={() => navigate('/gestion/caja')} className="mt-6">
              Registrar movimiento
            </Button>
          )}
        </div>
      </div>
    )
  }

  const pendientes = resumen.pendientesEnLinea
  const diferencia = declarado === null ? null : diferenciaDeCaja(declarado, resumen.efectivoCalculado)

  return (
    <div className="flex flex-col gap-6">
      {encabezado}
      {aviso && <Alert variante="advertencia">{aviso}</Alert>}

      {pendientes.length > 0 && (
        <section aria-label="Cobros pendientes" className="flex flex-col gap-3">
          <Alert variante="advertencia" titulo="No se puede cerrar la caja">
            Hay cobros en línea de esta jornada sin acreditar. Esperá a que se acrediten o se cancelen: después podés cerrar.
          </Alert>
          <ul className="flex flex-col gap-2">
            {pendientes.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-4 bg-panel border border-gray-800 rounded-xl px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold break-words">{p.descripcion ?? 'Cobro en línea'}</p>
                  <p className="text-xs text-texto-suave break-words">Mercado Pago{p.cliente ? ` · ${p.cliente}` : ''}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="font-semibold tabular-nums">{importe(p.monto)}</span>
                  <EstadoBadge tipo="movimiento" estado="PENDIENTE" />
                </div>
              </li>
            ))}
          </ul>
          <Link to={enlaceMovimientos} className="text-sm underline text-viper self-start">
            Ir a movimientos
          </Link>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <ResumenJornada resumen={resumen} />
        <ConciliacionCaja
          calculado={resumen.efectivoCalculado}
          texto={texto}
          onTexto={escribir}
          declarado={declarado}
          error={errorMonto}
          deshabilitado={pendientes.length > 0}
          campoRef={campo}
          enlaceMovimientos={enlaceMovimientos}
          onCerrar={pedirConfirmacion}
        />
      </div>

      <ConfirmDialog
        abierto={confirmando}
        posicion="abajo-movil"
        tipo="advertencia"
        titulo={`¿Cerrar la caja del ${diaYMes(fecha)}?`}
        mensaje={`Después del cierre, los movimientos del día no podrán modificarse ni anularse.${
          diferencia !== null && diferencia !== 0 ? ` La caja va a quedar descuadrada: ${faltaOSobra(diferencia).toLowerCase()}.` : ''
        }`}
        textoConfirmar="Cerrar caja"
        cargando={enviando}
        onConfirmar={cerrar}
        onCancelar={() => !enviando && setConfirmando(false)}
      />
    </div>
  )
}