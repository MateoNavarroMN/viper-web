import { useEffect, useState } from 'react'
import { get } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Badge from '../../../../shared/components/Badge'
import Button from '../../../../shared/components/Button'
import Input from '../../../../shared/components/Input'
import Spinner from '../../../../shared/components/Spinner'
import { dniConPuntos } from '../../../../shared/utils/dni'
import { fechaCompleta, fechaHora } from '../../torneos/torneos'
import { PENDIENTES_DE, importe } from '../caja'

const BUSQUEDA_MINIMA = 2

const cuandoVence = (origen) => (origen.venceEn ? `Vence ${origen.tipo === 'CUOTA' ? fechaCompleta(origen.venceEn) : fechaHora(origen.venceEn)}` : 'Sin plazo de pago')

function DatosOrigen({ origen }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block text-sm break-words">{origen.descripcion}</span>
      <span className="block text-xs text-texto-suave">{cuandoVence(origen)}</span>
    </span>
  )
}

// Paso «¿qué se está cobrando?» de un cobro: se busca al cliente por nombre, apellido o DNI y se elige una de sus reservas,
// inscripciones o cuotas pendientes (según `concepto`). Usa GET /caja/origenes-pendientes.
//  · valor: { cliente, origen } o null     · onElegir(valor | null)     · error: mensaje del campo
//  · recarga: número que, al cambiar, vuelve a buscar (se usa cuando el servidor dice que el origen ya cambió de estado)
export default function BuscarOrigen({ concepto, valor, onElegir, error, recarga = 0, disabled = false }) {
  const [texto, setTexto] = useState('')
  const [consultado, setConsultado] = useState('') // lo que se buscó la última vez
  const [resultado, setResultado] = useState(null) // { clave, clientes, hayMas } | { clave, error }
  const [reintento, setReintento] = useState(0)
  const clave = `${consultado}|${recarga}|${reintento}`
  const buscando = consultado !== '' && resultado?.clave !== clave

  useEffect(() => {
    if (!consultado) return undefined
    let vigente = true
    get(`/caja/origenes-pendientes?q=${encodeURIComponent(consultado)}&concepto=${concepto}`)
      .then((r) => vigente && setResultado({ clave, clientes: r.clientes, hayMas: r.hayMas }))
      .catch((e) => vigente && setResultado({ clave, error: e.mensaje }))
    return () => {
      vigente = false
    }
  }, [clave, consultado, concepto])

  const [errorTexto, setErrorTexto] = useState('')
  const buscar = () => {
    const q = texto.trim()
    if (q.length < BUSQUEDA_MINIMA) {
      setErrorTexto(`Escribí al menos ${BUSQUEDA_MINIMA} caracteres`)
      return
    }
    setErrorTexto('')
    setConsultado(q)
  }

  if (valor) {
    const { cliente, origen } = valor
    return (
      <div className="flex flex-col gap-2">
        <div className={`bg-fondo border rounded-xl p-4 flex flex-col gap-3 ${error ? 'border-error' : 'border-viper/50'}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold truncate">
                {cliente.nombre} {cliente.apellido}
              </p>
              <p className="text-xs text-texto-suave">DNI {dniConPuntos(cliente.dni)}</p>
            </div>
            <button type="button" onClick={() => onElegir(null)} disabled={disabled} className="text-sm text-texto-suave hover:text-viper transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0">
              Cambiar
            </button>
          </div>
          <div className="flex items-end justify-between gap-3 border-t border-gray-800 pt-3">
            <DatosOrigen origen={origen} />
            <span className="text-right shrink-0">
              <span className="block text-xs text-texto-suave">Se cobra</span>
              <span className="block font-outfit text-lg font-bold tabular-nums">{importe(origen.monto)}</span>
            </span>
          </div>
        </div>
        {error && (
          <p role="alert" className="text-error text-xs">
            {error}
          </p>
        )}
      </div>
    )
  }

  const clientes = resultado?.clave === clave ? resultado.clientes : null
  const errorBusqueda = resultado?.clave === clave ? resultado.error : null
  const algunoConPendientes = clientes?.some((c) => c.origenes.length > 0)

  return (
    <div className="flex flex-col gap-3">
      {/* No es un <form>: este paso va dentro del formulario del movimiento y los formularios no se anidan */}
      <div className="flex gap-3 items-start">
        <div className="flex-1 flex flex-col gap-2">
          <Input
            id="buscar-cliente"
            type="search"
            aria-label="Buscar al cliente por nombre o DNI"
            placeholder="Buscar al cliente por nombre o DNI"
            autoComplete="off"
            maxLength={100}
            value={texto}
            error={Boolean(errorTexto || error)}
            disabled={disabled}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                buscar()
              }
            }}
            onChange={(e) => {
              setTexto(e.target.value)
              setErrorTexto('')
            }}
          />
          {(errorTexto || error) && (
            <p role="alert" className="text-error text-xs">
              {errorTexto || error}
            </p>
          )}
        </div>
        <Button type="button" variante="secundario" onClick={buscar} disabled={disabled || buscando}>
          Buscar
        </Button>
      </div>

      {buscando && (
        <div className="py-4 flex justify-center">
          <Spinner texto="Buscando" />
        </div>
      )}

      {errorBusqueda && (
        <Alert variante="error" titulo="No pudimos buscar">
          {errorBusqueda}{' '}
          <button type="button" onClick={() => setReintento((n) => n + 1)} className="underline font-semibold cursor-pointer">
            Reintentar
          </button>
        </Alert>
      )}

      {clientes && clientes.length === 0 && <Alert variante="advertencia">No encontramos ningún cliente con «{consultado}». Probá con otro nombre o con el DNI.</Alert>}

      {clientes && clientes.length > 0 && !algunoConPendientes && (
        <Alert variante="advertencia" titulo="Nada para cobrar">
          {clientes.length === 1
            ? `${clientes[0].nombre} ${clientes[0].apellido} no tiene ${PENDIENTES_DE[concepto]} pendientes de cobro.`
            : `Ninguno de los clientes encontrados tiene ${PENDIENTES_DE[concepto]} pendientes de cobro.`}
        </Alert>
      )}

      {clientes && algunoConPendientes && (
        <ul className="flex flex-col gap-3" aria-label="Clientes encontrados">
          {clientes.map((cliente) => (
            <li key={cliente.id} className="bg-fondo border border-gray-800 rounded-xl p-3 flex flex-col gap-2">
              <p className="text-sm font-semibold">
                {cliente.nombre} {cliente.apellido} <span className="text-texto-suave font-normal text-xs">· DNI {dniConPuntos(cliente.dni)}</span>
              </p>
              {cliente.origenes.length === 0 ? (
                <p className="text-xs text-texto-suave">No tiene {PENDIENTES_DE[concepto]} pendientes de cobro.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {cliente.origenes.map((origen) => (
                    <li key={origen.id}>
                      <button
                        type="button"
                        onClick={() => onElegir({ cliente, origen })}
                        disabled={disabled}
                        className="w-full flex items-center gap-3 text-left border border-gray-800 hover:border-viper rounded-lg px-3 py-2 transition-colors cursor-pointer"
                      >
                        <DatosOrigen origen={origen} />
                        {origen.vencida && <Badge variante="error">Vencida</Badge>}
                        <span className="text-sm font-semibold tabular-nums shrink-0">{importe(origen.monto)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
      {clientes && resultado.hayMas && <p className="text-xs text-texto-suave">Hay más clientes que coinciden: escribí más datos para afinar la búsqueda.</p>}
    </div>
  )
}