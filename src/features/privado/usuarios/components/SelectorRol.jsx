import { useState } from 'react'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import { patch } from '../../../../shared/api/client'

// Roles que el Administrador puede asignar (ADMINISTRADOR no: esas cuentas se gestionan fuera del sistema)
const ROLES = [
  { valor: 'JUGADOR', titulo: 'Jugador', detalle: 'Reservas, torneos y ranking del club.' },
  { valor: 'RECEPCIONISTA', titulo: 'Recepcionista', detalle: 'Grilla, punto de venta y caja diaria.' },
  { valor: 'ORGANIZADOR', titulo: 'Organizador', detalle: 'Inscripciones, cuadros y resultados.' },
]

// CU 1.4 · cambiar el rol de un usuario. Se muestra en la página (escritorio) o en un panel inferior (celular).
// 6a: Cancelar cierra sin tocar nada. 7b: elegir el mismo rol avisa «No hay cambios para guardar».
export default function SelectorRol({ usuario, onGuardado, onCancelar }) {
  const [elegido, setElegido] = useState(usuario.rol)
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState(null) // { variante, titulo, texto }

  const elegir = (rol) => {
    setElegido(rol)
    setAviso(null)
  }

  const guardar = async () => {
    if (elegido === usuario.rol) {
      setAviso({ variante: 'advertencia', titulo: 'No hay cambios para guardar', texto: 'El rol elegido es igual al actual.' })
      return
    }
    setGuardando(true)
    setAviso(null)
    try {
      const respuesta = await patch(`/usuarios/${usuario.id}/rol`, { rol: elegido })
      onGuardado(respuesta)
    } catch (e) {
      // La API repite el 7b si alguien cambió el rol mientras tanto; el resto (409 sin DNI, 5xx) es un error común
      const sinCambios = e.status === 409 && e.mensaje === 'No hay cambios para guardar'
      setAviso({
        variante: sinCambios ? 'advertencia' : 'error',
        titulo: sinCambios ? e.mensaje : 'No se pudo cambiar el rol',
        texto: sinCambios ? 'El rol elegido es igual al actual.' : e.mensaje,
      })
      setGuardando(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-3 min-w-0">
        <legend className="sr-only">Rol del usuario</legend>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ROLES.map(({ valor, titulo, detalle }) => {
            const activo = elegido === valor
            return (
              <label
                key={valor}
                className={`relative flex flex-col gap-2 rounded-xl border p-4 cursor-pointer transition-colors focus-within:outline-2 focus-within:outline-viper ${
                  activo ? 'border-viper bg-viper/10' : 'border-gray-800 bg-fondo hover:border-viper'
                }`}
              >
                <input
                  type="radio"
                  name="rol"
                  value={valor}
                  checked={activo}
                  onChange={() => elegir(valor)}
                  className="sr-only"
                />
                <span className={`pr-7 text-sm font-bold ${activo ? 'text-viper' : ''}`}>{titulo}</span>
                <span className="text-xs text-texto-suave">{detalle}</span>
                <span
                  aria-hidden="true"
                  className={`absolute top-4 right-4 w-4 h-4 rounded-full border flex items-center justify-center ${
                    activo ? 'border-viper' : 'border-gray-600'
                  }`}
                >
                  {activo && <span className="w-2 h-2 rounded-full bg-viper" />}
                </span>
                {usuario.rol === valor && <span className="text-xs text-texto-suave">Rol actual</span>}
              </label>
            )
          })}
        </div>
      </fieldset>

      {aviso && (
        <Alert variante={aviso.variante} titulo={aviso.titulo}>
          {aviso.texto}
        </Alert>
      )}

      <p className="flex items-center gap-2 text-xs text-texto-suave">
        <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z" />
        </svg>
        Al guardar, se cierran todas sus sesiones activas.
      </p>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-5 border-t border-gray-800">
        <Button variante="neutro" onClick={onCancelar} disabled={guardando} className="py-3">
          Cancelar
        </Button>
        <Button onClick={guardar} cargando={guardando} className="py-3">
          Guardar cambios
        </Button>
      </div>
    </div>
  )
}