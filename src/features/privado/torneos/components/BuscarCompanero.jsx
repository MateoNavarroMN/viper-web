import { useState } from 'react'
import { get } from '../../../../shared/api/client'
import Button from '../../../../shared/components/Button'
import FormField from '../../../../shared/components/FormField'
import Input from '../../../../shared/components/Input'

// «12.345.678» o «12345678» → '12345678'
const soloNumeros = (texto) => texto.replace(/[.\s]/g, '')

// «12345678» → '12.345.678'
const conPuntos = (dni) => dni.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

// Compañero de Pádel: el jugador escribe el DNI, se busca en la API y se muestra
// una tarjeta para confirmar a quién eligió. `valor` es el compañero elegido ({ id, nombre, apellido, dni, categorias }) o null.
export default function BuscarCompanero({ disciplina, valor, onElegir, disabled = false }) {
  const [dni, setDni] = useState('')
  const [error, setError] = useState('')
  const [buscando, setBuscando] = useState(false)

  const buscar = async () => {
    const limpio = soloNumeros(dni)
    if (!/^\d{7,9}$/.test(limpio)) {
      setError('Ingresá un DNI de 7 a 9 números')
      return
    }
    setError('')
    setBuscando(true)
    try {
      const { jugador } = await get(`/jugadores/buscar?dni=${limpio}`)
      onElegir({ ...jugador, dni: limpio })
      setDni('')
    } catch (e) {
      setError(e.mensaje)
    } finally {
      setBuscando(false)
    }
  }

  if (valor) {
    const categoria = valor.categorias?.[disciplina]?.nombre
    return (
      <div className="flex items-center gap-3 bg-fondo border border-viper/50 rounded-xl p-4">
        <div className="w-9 h-9 rounded-full bg-viper/15 text-viper flex items-center justify-center font-outfit font-bold shrink-0" aria-hidden="true">
          {valor.nombre[0]}{valor.apellido[0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate">{valor.nombre} {valor.apellido}</p>
          <p className="text-xs text-texto-suave">DNI {conPuntos(valor.dni)}{categoria && ` · Categoría ${categoria}`}</p>
        </div>
        <button
          type="button"
          onClick={() => onElegir(null)}
          disabled={disabled}
          className="text-sm text-texto-suave hover:text-error transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          Quitar
        </button>
      </div>
    )
  }

  return (
    <div className="flex gap-3 items-start">
      <div className="flex-1">
        <FormField label="DNI del compañero" id="dni-companero" error={error} requerido>
          <Input
            id="dni-companero"
            inputMode="numeric"
            autoComplete="off"
            placeholder="12.345.678"
            maxLength={11}
            value={dni}
            error={Boolean(error)}
            disabled={disabled}
            onChange={(e) => setDni(e.target.value)}
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
  )
}