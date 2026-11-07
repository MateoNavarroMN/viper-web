import { useState } from 'react'
import { get } from '../../../../shared/api/client'
import Badge from '../../../../shared/components/Badge'
import Button from '../../../../shared/components/Button'
import FormField from '../../../../shared/components/FormField'
import Input from '../../../../shared/components/Input'
import { dniConPuntos } from '../socios'

// «38.221.045» → '38221045'. Un correo se deja como está.
const normalizar = (texto) => {
  const limpio = texto.trim()
  return /^[\d.\s]+$/.test(limpio) ? limpio.replace(/[.\s]/g, '') : limpio
}

const INSIGNIA_SOCIO = {
  ACTIVO: { texto: 'Socio activo', variante: 'exito' },
  BAJA: { texto: 'Socio dado de baja', variante: 'advertencia' },
}

const iniciales = (j) => `${j.nombre[0] ?? ''}${j.apellido[0] ?? ''}`.toUpperCase()

// Datos del jugador en una tarjeta (los resultados y el jugador elegido usan el mismo diseño)
function DatosJugador({ jugador }) {
  return (
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <div className="w-9 h-9 rounded-full bg-viper/15 text-viper flex items-center justify-center font-outfit font-bold shrink-0" aria-hidden="true">
        {iniciales(jugador)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold truncate">
          {jugador.nombre} {jugador.apellido}
        </p>
        <p className="text-xs text-texto-suave truncate">
          DNI {dniConPuntos(jugador.dni)} · {jugador.email}
        </p>
        {jugador.telefono && <p className="text-xs text-texto-suave">Tel. {jugador.telefono}</p>}
      </div>
    </div>
  )
}

// CU 4.1 · pasos 3 a 6. El personal busca al jugador por DNI o correo. `valor` es el jugador elegido (el que devuelve
// GET /jugadores/consulta) o null. `error` es el mensaje del campo (9a, 9b).
export default function BuscarJugador({ valor, onElegir, error, disabled = false }) {
  const [texto, setTexto] = useState('')
  const [resultados, setResultados] = useState(null) // null: todavía no buscó
  const [errorBusqueda, setErrorBusqueda] = useState('')
  const [buscando, setBuscando] = useState(false)

  const buscar = async () => {
    const consulta = normalizar(texto)
    if (consulta.length < 3) {
      setErrorBusqueda('Ingresá al menos 3 caracteres')
      return
    }
    setErrorBusqueda('')
    setBuscando(true)
    try {
      const { jugadores } = await get(`/jugadores/consulta?q=${encodeURIComponent(consulta)}`)
      setResultados(jugadores)
    } catch (e) {
      setResultados(null)
      setErrorBusqueda(e.mensaje)
    } finally {
      setBuscando(false)
    }
  }

  const limpiar = () => {
    setTexto('')
    setResultados(null)
    setErrorBusqueda('')
  }

  if (valor) {
    return (
      <div className="flex flex-col gap-2">
        <div className={`flex flex-col sm:flex-row sm:items-center gap-3 bg-fondo border rounded-xl p-4 ${error ? 'border-error' : 'border-viper/50'}`}>
          <DatosJugador jugador={valor} />
          <div className="flex items-center gap-3 shrink-0 pl-12 sm:pl-0">
            {valor.socio ? (
              <Badge variante={INSIGNIA_SOCIO[valor.socio.estado].variante}>{INSIGNIA_SOCIO[valor.socio.estado].texto}</Badge>
            ) : (
              <Badge variante="exito">Seleccionado</Badge>
            )}
            <button
              type="button"
              onClick={() => {
                limpiar()
                onElegir(null)
              }}
              disabled={disabled}
              className="text-sm text-texto-suave hover:text-viper transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              Cambiar
            </button>
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

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3 items-start">
        <div className="flex-1">
          <FormField label="Buscar jugador" id="buscar-jugador" error={errorBusqueda || error} requerido>
            <Input
              id="buscar-jugador"
              autoComplete="off"
              placeholder="Buscar por DNI o correo electrónico"
              maxLength={100}
              value={texto}
              error={Boolean(errorBusqueda || error)}
              disabled={disabled}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  buscar()
                }
              }}
            />
          </FormField>
        </div>
        <Button variante="neutro" cargando={buscando} disabled={disabled} onClick={buscar} className="mt-[26px] h-11 w-28">
          Buscar
        </Button>
      </div>

      {resultados?.length === 0 && (
        <div className="bg-fondo border border-gray-800 rounded-xl p-4 flex flex-col gap-3 items-start">
          <div>
            <p className="font-semibold">No existe un jugador registrado con ese dato</p>
            <p className="text-sm text-texto-suave mt-1">Para ser socio, primero tiene que crear su cuenta.</p>
          </div>
          <Button variante="secundario" onClick={limpiar}>
            Limpiar búsqueda
          </Button>
        </div>
      )}

      {resultados?.length > 0 && (
        <ul className="flex flex-col gap-2" aria-label="Resultados de la búsqueda">
          {resultados.map((jugador) => (
            <li key={jugador.id}>
              <button
                type="button"
                onClick={() => onElegir(jugador)}
                className="w-full flex flex-col items-start sm:flex-row sm:items-center gap-3 text-left bg-fondo border border-gray-800 hover:border-viper rounded-xl p-4 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-viper"
              >
                <DatosJugador jugador={jugador} />
                {jugador.socio && (
                  <Badge variante={INSIGNIA_SOCIO[jugador.socio.estado].variante}>{INSIGNIA_SOCIO[jugador.socio.estado].texto}</Badge>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}