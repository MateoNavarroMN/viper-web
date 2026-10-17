import { useCallback, useEffect, useRef, useState } from 'react'
import { patch } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import FormField from '../../../../shared/components/FormField'
import Input from '../../../../shared/components/Input'
import Modal from '../../../../shared/components/Modal'
import { normalizarDni, validarDni, validarEmail } from '../../../../shared/utils/validaciones'
import Nota from '../../perfil/components/Nota'

// CU 1.4 · A3 · el Administrador corrige el correo o el DNI. El DNI solo existe en usuarios con perfil de Jugador.
// A3a: si la API rechaza un campo (formato o ya registrado) se marca ese campo y se conserva lo ingresado.
export default function EditarContacto({ usuario, onGuardado, onCerrar }) {
  const tieneDni = Boolean(usuario.jugador_id)
  const [valores, setValores] = useState({ email: usuario.email, dni: usuario.dni ?? '' })
  const [errores, setErrores] = useState({})
  const [alerta, setAlerta] = useState(null) // { variante, titulo, texto }
  const [guardando, setGuardando] = useState(false)
  const formulario = useRef(null)

  useEffect(() => {
    formulario.current?.elements.email?.focus()
  }, [])

  // Estable (useCallback): Modal vuelve a enfocar su panel cada vez que cambia onCerrar
  const cerrar = useCallback(() => {
    if (!guardando) onCerrar()
  }, [guardando, onCerrar])

  const cambiar = (campo) => (evento) => {
    setValores((anteriores) => ({ ...anteriores, [campo]: evento.target.value }))
    if (errores[campo]) setErrores((anteriores) => ({ ...anteriores, [campo]: undefined }))
  }

  const marcar = (conError) => {
    setErrores(conError)
    setAlerta({ variante: 'error', titulo: 'Revisá los campos marcados', texto: 'El valor pertenece a otro usuario o el formato es incorrecto.' })
    const primero = ['email', 'dni'].find((campo) => conError[campo])
    formulario.current?.elements[primero]?.focus()
  }

  const guardar = async (evento) => {
    evento.preventDefault()
    setAlerta(null)

    const conError = {}
    const errorEmail = validarEmail(valores.email)
    if (errorEmail) conError.email = errorEmail
    const errorDni = tieneDni && validarDni(valores.dni)
    if (errorDni) conError.dni = errorDni
    if (Object.keys(conError).length > 0) return marcar(conError)

    // Solo se manda lo que cambió
    const cambios = {}
    if (valores.email.trim().toLowerCase() !== usuario.email) cambios.email = valores.email.trim()
    if (tieneDni && normalizarDni(valores.dni) !== usuario.dni) cambios.dni = normalizarDni(valores.dni)
    if (Object.keys(cambios).length === 0) {
      setErrores({})
      setAlerta({ variante: 'advertencia', titulo: 'No hay cambios para guardar', texto: 'Los datos son iguales a los actuales.' })
      return
    }

    setErrores({})
    setGuardando(true)
    try {
      const respuesta = await patch(`/usuarios/${usuario.id}/contacto`, cambios)
      onGuardado(respuesta)
    } catch (e) {
      if (e.campo === 'email' || e.campo === 'dni') {
        const texto = e.mensaje.replace(/^Datos inválidos: /, '')
        marcar({ [e.campo]: texto.charAt(0).toUpperCase() + texto.slice(1) })
      } else {
        setAlerta({ variante: 'error', titulo: 'No se pudieron actualizar los datos', texto: e.mensaje })
      }
      setGuardando(false)
    }
  }

  return (
    <Modal abierto titulo="Editar correo / DNI" onCerrar={cerrar}>
      <form ref={formulario} onSubmit={guardar} noValidate className="flex flex-col gap-5">
        {alerta && (
          <Alert variante={alerta.variante} titulo={alerta.titulo}>
            {alerta.texto}
          </Alert>
        )}
        <FormField label="Correo electrónico" id="email" requerido error={errores.email}>
          <Input id="email" name="email" type="email" autoComplete="off" maxLength={254}
            value={valores.email} onChange={cambiar('email')} error={!!errores.email} />
        </FormField>
        {tieneDni && (
          <FormField label="DNI" id="dni" requerido error={errores.dni}>
            <Input id="dni" name="dni" inputMode="numeric" autoComplete="off" maxLength={12}
              value={valores.dni} onChange={cambiar('dni')} error={!!errores.dni} />
          </FormField>
        )}
        <Nota>El DNI solo aplica a usuarios con perfil de Jugador.</Nota>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-2">
          <Button variante="neutro" onClick={cerrar} disabled={guardando} className="py-3">
            Cancelar
          </Button>
          <Button type="submit" cargando={guardando} className="py-3">
            Guardar cambios
          </Button>
        </div>
      </form>
    </Modal>
  )
}