import { useCallback, useEffect, useRef, useState } from 'react'
import { patch } from '../../../../shared/api/client'
import { useToast } from '../../../../shared/hooks/useToast'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import FormField from '../../../../shared/components/FormField'
import Modal from '../../../../shared/components/Modal'
import PasswordInput from '../../../../shared/components/PasswordInput'
import { REQUISITOS_PASSWORD, validarPassword } from '../../../../shared/utils/validaciones'

const VACIO = { actual: '', nueva: '', confirmacion: '' }
const CAMPOS = ['actual', 'nueva', 'confirmacion']

const ICONOS = {
  cumple: 'M20 6 9 17l-5-5',
  falta: 'M18 6 6 18M6 6l12 12',
}

const validar = (v) => {
  const errores = {
    actual: v.actual ? null : 'Campo obligatorio',
    nueva: validarPassword(v.nueva),
    confirmacion: v.confirmacion ? null : 'Campo obligatorio',
  }
  // A1b · motivos exactos
  if (!errores.nueva && v.actual && v.nueva === v.actual) errores.nueva = 'No puede ser igual a la actual'
  if (!errores.confirmacion && v.nueva !== v.confirmacion) errores.confirmacion = 'Las contraseñas no coinciden'
  return Object.fromEntries(Object.entries(errores).filter(([, texto]) => texto))
}

// Lista de requisitos de la nueva contraseña (A1b): cada uno en verde si se cumple o en rojo si no
function Requisitos({ valores }) {
  const lista = [
    { texto: 'Mínimo 8 caracteres, con una letra y un número', ok: REQUISITOS_PASSWORD.every((r) => r.cumple(valores.nueva)) },
    { texto: 'Es distinta de la contraseña actual', ok: Boolean(valores.nueva) && valores.nueva !== valores.actual },
    { texto: 'Coincide con la confirmación', ok: Boolean(valores.nueva) && valores.nueva === valores.confirmacion },
  ]
  return (
    <ul className="bg-fondo border border-gray-800 rounded-xl px-4 py-3 flex flex-col gap-2" aria-label="Requisitos de la nueva contraseña">
      {lista.map(({ texto, ok }) => (
        <li key={texto} className={`flex items-center gap-3 text-sm ${ok ? 'text-texto' : 'text-error'}`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${ok ? 'bg-viper/15 text-viper' : 'bg-error/15 text-error'}`} aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d={ok ? ICONOS.cumple : ICONOS.falta} />
            </svg>
          </span>
          {texto}
          <span className="sr-only">{ok ? '(cumplido)' : '(pendiente)'}</span>
        </li>
      ))}
    </ul>
  )
}

// CU 1.3 · A1 · Cambiar contraseña. La API cierra las demás sesiones; la actual sigue abierta.
export default function CambiarPassword({ onCerrar }) {
  const { mostrarToast } = useToast()
  const [valores, setValores] = useState(VACIO)
  const [errores, setErrores] = useState({})
  const [alerta, setAlerta] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const formulario = useRef(null)

  // Se monta al abrirse (ver MiPerfil): arranca vacío y con el foco en la contraseña actual
  useEffect(() => {
    formulario.current?.elements.actual?.focus()
  }, [])

  // Estable (useCallback): Modal vuelve a enfocar su panel cada vez que cambia onCerrar
  const cerrar = useCallback(() => {
    if (!guardando) onCerrar()
  }, [guardando, onCerrar])

  const cambiar = (campo) => (evento) => {
    setValores((anteriores) => ({ ...anteriores, [campo]: evento.target.value }))
    if (errores[campo]) setErrores((anteriores) => ({ ...anteriores, [campo]: undefined }))
  }

  const enfocarPrimerError = (conError) => {
    const primero = CAMPOS.find((campo) => conError[campo])
    if (primero) formulario.current?.elements[primero]?.focus()
  }

  const guardar = async (evento) => {
    evento.preventDefault()
    setAlerta(null)

    const conError = validar(valores)
    if (Object.keys(conError).length > 0) {
      setErrores(conError)
      enfocarPrimerError(conError)
      return
    }

    setErrores({})
    setGuardando(true)
    try {
      await patch('/perfil/password', valores)
      mostrarToast('Contraseña actualizada. Se cerraron tus sesiones en otros dispositivos.', 'exito')
      onCerrar()
    } catch (error) {
      if (error.campo && CAMPOS.includes(error.campo)) {
        // A1a: "La contraseña actual es incorrecta" · A1b: el motivo que da la API
        const texto = error.mensaje.replace(/^(Contraseña no válida|Datos inválidos): /, '')
        setErrores({ [error.campo]: texto.charAt(0).toUpperCase() + texto.slice(1) })
        if (error.campo === 'actual') setValores((anteriores) => ({ ...anteriores, actual: '' }))
        enfocarPrimerError({ [error.campo]: true })
      } else {
        setAlerta(error.mensaje)
      }
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal abierto titulo="Cambiar contraseña" onCerrar={cerrar}>
      <form ref={formulario} onSubmit={guardar} noValidate className="flex flex-col gap-5">
        {alerta && (
          <Alert variante="error" titulo="No pudimos cambiar la contraseña">
            {alerta}
          </Alert>
        )}
        <FormField label="Contraseña actual" id="actual" requerido error={errores.actual}>
          <PasswordInput id="actual" name="actual" autoComplete="current-password" placeholder="••••••••"
            value={valores.actual} onChange={cambiar('actual')} error={!!errores.actual} />
        </FormField>
        <FormField label="Nueva contraseña" id="nueva" requerido error={errores.nueva} ayuda="Mínimo 8 caracteres">
          <PasswordInput id="nueva" name="nueva" autoComplete="new-password" placeholder="••••••••"
            value={valores.nueva} onChange={cambiar('nueva')} error={!!errores.nueva} />
        </FormField>
        <FormField label="Confirmar nueva contraseña" id="confirmacion" requerido error={errores.confirmacion}>
          <PasswordInput id="confirmacion" name="confirmacion" autoComplete="new-password" placeholder="••••••••"
            value={valores.confirmacion} onChange={cambiar('confirmacion')} error={!!errores.confirmacion} />
        </FormField>

        {valores.nueva && <Requisitos valores={valores} />}

        <p className="flex items-start gap-2 text-texto-suave text-xs">
          <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z" />
          </svg>
          La sesión actual se mantiene; las demás se cierran.
        </p>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 mt-1">
          <Button variante="neutro" onClick={cerrar} disabled={guardando} className="py-3 sm:px-8">
            Cancelar
          </Button>
          <Button type="submit" variante="primario" cargando={guardando} className="py-3 sm:px-8">
            Cambiar contraseña
          </Button>
        </div>
      </form>
    </Modal>
  )
}