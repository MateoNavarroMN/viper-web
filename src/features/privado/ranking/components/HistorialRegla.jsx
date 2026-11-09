import { useEffect, useState } from 'react'
import { get } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Badge from '../../../../shared/components/Badge'
import BottomSheet from '../../../../shared/components/BottomSheet'
import Button from '../../../../shared/components/Button'
import Spinner from '../../../../shared/components/Spinner'
import { fechaCorta, nombreInstancia, puntosLargo } from '../reglas'

// Historial de una instancia (CU 4.3 · A1, solo lectura): todas las reglas que tuvo, de la más nueva a la más vieja.
// Sube desde abajo en el celular y es una ventana centrada en pantallas grandes. Se monta solo al abrirlo, así cada vez
// consulta de nuevo. `onCerrar` tiene que ser una función estable: el Modal vuelve a enfocar su panel cada vez que cambia.
export default function HistorialRegla({ disciplina, instancia, onCerrar }) {
  const [historial, setHistorial] = useState(null)
  const [error, setError] = useState('')
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    get(`/reglas-puntuacion/${disciplina.api}/${instancia}/historial`)
      .then((respuesta) => {
        if (!vigente) return
        setHistorial(respuesta.historial)
        setError('')
      })
      .catch((e) => vigente && setError(e.mensaje))
    return () => {
      vigente = false
    }
  }, [disciplina.api, instancia, intento])

  const titulo = `Historial · ${nombreInstancia(instancia)}`

  return (
    <BottomSheet abierto titulo={titulo} onCerrar={onCerrar}>
      <p className="text-texto-suave text-sm -mt-2 mb-5">{disciplina.titulo}</p>

      {error ? (
        <Alert variante="error" titulo="No pudimos cargar el historial">
          {error}{' '}
          <button type="button" onClick={() => setIntento((n) => n + 1)} className="underline font-semibold cursor-pointer">
            Reintentar
          </button>
        </Alert>
      ) : !historial ? (
        <div className="py-10 flex justify-center">
          <Spinner texto="Cargando historial" />
        </div>
      ) : historial.length === 0 ? (
        <Alert variante="info">Esta instancia todavía no tiene reglas.</Alert>
      ) : (
        <ul className="flex flex-col gap-2">
          {historial.map((regla) => (
            <li key={regla.vigenteDesde} className="bg-fondo border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium tabular-nums">{puntosLargo(regla.puntos)}</p>
                <p className="text-xs text-texto-suave">Desde {fechaCorta(regla.vigenteDesde)}</p>
              </div>
              <Badge variante={regla.vigente ? 'exito' : 'neutro'}>{regla.vigente ? 'Vigente' : 'Anterior'}</Badge>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-texto-suave mt-5">Los puntos ya otorgados conservan la regla con la que se calcularon.</p>
      <div className="flex mt-6">
        <Button variante="neutro" onClick={onCerrar} className="w-full sm:w-auto sm:ml-auto py-3">
          Cerrar
        </Button>
      </div>
    </BottomSheet>
  )
}