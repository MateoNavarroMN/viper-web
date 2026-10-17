import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { post } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import FormField from '../../../../shared/components/FormField'
import Input from '../../../../shared/components/Input'
import PasswordInput from '../../../../shared/components/PasswordInput'
import { useToast } from '../../../../shared/hooks/useToast'
import { validarEmail, validarNombre, validarPassword, validarTelefono } from '../../../../shared/utils/validaciones'
import RequisitosPassword from '../../auth/components/RequisitosPassword'
import Nota from '../../perfil/components/Nota'

// Solo estos dos: los administradores se dan de alta fuera del sistema y los jugadores se registran solos
const ROLES = [
  { valor: 'RECEPCIONISTA', titulo: 'Recepcionista', detalle: 'Grilla, punto de venta y caja diaria.' },
  { valor: 'ORGANIZADOR', titulo: 'Organizador', detalle: 'Inscripciones, cuadros y resultados.' },
]

const VACIO = { nombre: '', apellido: '', telefono: '', rol: '', email: '', password: '', confirmarPassword: '' }

// Orden en que se revisa y se enfoca el primer campo con error
const CAMPOS = ['nombre', 'apellido', 'telefono', 'rol', 'email', 'password', 'confirmarPassword']

const validar = (v) => {
  const errores = {
    nombre: validarNombre(v.nombre, 'El nombre'),
    apellido: validarNombre(v.apellido, 'El apellido'),
    telefono: validarTelefono(v.telefono),
    rol: v.rol ? null : 'Elegí un rol',
    email: validarEmail(v.email),
    password: validarPassword(v.password),
  }
  if (!errores.password && v.password !== v.confirmarPassword) {
    errores.confirmarPassword = 'Las contraseñas no coinciden'
  }
  return Object.fromEntries(Object.entries(errores).filter(([, texto]) => texto))
}

const TARJETA = 'bg-panel border border-gray-800 rounded-2xl p-6 md:p-8'
const TITULO_SECCION = 'text-xs font-bold uppercase tracking-wide text-texto-suave mb-4'

// CU 1.1 · A1 · el Administrador crea una cuenta de Recepcionista u Organizador, con contraseña inicial.
// Mismos campos y validaciones que el registro, sin DNI. Al guardar vuelve al listado mostrando la cuenta nueva.
export default function NuevoPersonal() {
  const [valores, setValores] = useState(VACIO)
  const [errores, setErrores] = useState({})
  const [alerta, setAlerta] = useState(null) // { titulo, texto }
  const [mostrarRequisitos, setMostrarRequisitos] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const formulario = useRef(null)
  const navigate = useNavigate()
  const { mostrarToast } = useToast()

  const cambiar = (campo) => (evento) => {
    setValores((anteriores) => ({ ...anteriores, [campo]: evento.target.value }))
    if (errores[campo]) setErrores((anteriores) => ({ ...anteriores, [campo]: undefined }))
  }

  const enfocarPrimerError = (conError) => {
    const primero = CAMPOS.find((campo) => conError[campo])
    if (primero) formulario.current?.querySelector(`[name="${primero}"]`)?.focus()
  }

  const enviar = async (evento) => {
    evento.preventDefault()
    setAlerta(null)

    const conError = validar(valores)
    if (Object.keys(conError).length > 0) {
      setErrores(conError)
      const soloPassword = Object.keys(conError).every((c) => c === 'password' || c === 'confirmarPassword')
      if (soloPassword) {
        setMostrarRequisitos(true)
        setAlerta({ titulo: 'La contraseña no es válida', texto: 'No cumple los requisitos mínimos o no coincide con su confirmación.' })
      } else {
        setAlerta({ titulo: 'Revisá los campos marcados', texto: 'Completá los datos obligatorios con el formato correcto.' })
      }
      enfocarPrimerError(conError)
      return
    }

    setErrores({})
    setEnviando(true)
    try {
      const email = valores.email.trim()
      await post('/usuarios/personal', {
        nombre: valores.nombre.trim(),
        apellido: valores.apellido.trim(),
        email,
        telefono: valores.telefono.trim() || undefined,
        rol: valores.rol,
        password: valores.password,
        confirmarPassword: valores.confirmarPassword,
      })
      mostrarToast('Cuenta de personal creada correctamente')
      // Vuelve al listado buscando el correo nuevo, así la cuenta se ve aunque no entre en la primera página
      navigate(`/admin/usuarios?q=${encodeURIComponent(email.toLowerCase())}`, { replace: true })
    } catch (error) {
      const campo = error.campo
      if (error.status === 409 && campo === 'email') {
        setErrores({ email: 'Este correo ya está registrado' })
        setAlerta({ titulo: 'Ya existe una cuenta con ese correo', texto: 'Usá otro correo electrónico.' })
        enfocarPrimerError({ email: true })
      } else if (campo && CAMPOS.includes(campo)) {
        // La API rechazó un dato que el cliente dio por bueno: se marca el campo con su mensaje
        setErrores({ [campo]: error.mensaje })
        setAlerta({ titulo: 'Revisá los campos marcados', texto: error.mensaje })
        if (campo === 'password') setMostrarRequisitos(true)
        enfocarPrimerError({ [campo]: true })
      } else {
        setAlerta({ titulo: 'No pudimos crear la cuenta', texto: error.mensaje })
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <Link to="/admin/usuarios" className="text-sm text-texto-suave hover:text-viper transition-colors inline-flex items-center gap-1 w-fit">
        <span aria-hidden="true">‹</span> Volver a usuarios
      </Link>
      <div>
        <h1 className="font-outfit text-[28px] font-bold">Crear cuenta de personal</h1>
        <p className="text-texto-suave text-sm mt-1">Alta de recepcionistas y organizadores del club.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_22rem] gap-6 items-start">
        <form ref={formulario} onSubmit={enviar} noValidate className={`${TARJETA} flex flex-col gap-6 min-w-0`}>
          {alerta && (
            <Alert variante="error" titulo={alerta.titulo}>
              {alerta.texto}
            </Alert>
          )}

          <fieldset className="flex flex-col gap-5">
            <legend className={TITULO_SECCION}>Datos personales</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
              <FormField label="Nombre" id="nombre" requerido error={errores.nombre}>
                <Input id="nombre" name="nombre" autoComplete="off" placeholder="Nombre" maxLength={60}
                  value={valores.nombre} onChange={cambiar('nombre')} error={!!errores.nombre} />
              </FormField>
              <FormField label="Apellido" id="apellido" requerido error={errores.apellido}>
                <Input id="apellido" name="apellido" autoComplete="off" placeholder="Apellido" maxLength={60}
                  value={valores.apellido} onChange={cambiar('apellido')} error={!!errores.apellido} />
              </FormField>
              <FormField label="Teléfono" id="telefono" error={errores.telefono} ayuda="Opcional">
                <Input id="telefono" name="telefono" type="tel" autoComplete="off" placeholder="351 123 4567" maxLength={20}
                  value={valores.telefono} onChange={cambiar('telefono')} error={!!errores.telefono} />
              </FormField>
            </div>
          </fieldset>

          <hr className="border-gray-800" />

          <fieldset className="flex flex-col gap-3" aria-describedby={errores.rol ? 'error-rol' : undefined}>
            <legend className={TITULO_SECCION}>
              Rol<span className="text-viper ml-1" aria-hidden="true">*</span>
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ROLES.map(({ valor, titulo, detalle }) => {
                const activo = valores.rol === valor
                return (
                  <label
                    key={valor}
                    className={`relative flex flex-col gap-2 rounded-xl border p-4 cursor-pointer transition-colors focus-within:outline-2 focus-within:outline-viper ${
                      activo ? 'border-viper bg-viper/10' : errores.rol ? 'border-error bg-fondo' : 'border-gray-800 bg-fondo hover:border-viper'
                    }`}
                  >
                    <input type="radio" name="rol" value={valor} checked={activo} onChange={cambiar('rol')} className="sr-only" />
                    <span className={`pr-7 text-sm font-bold ${activo ? 'text-viper' : ''}`}>{titulo}</span>
                    <span className="text-xs text-texto-suave">{detalle}</span>
                    <span
                      aria-hidden="true"
                      className={`absolute top-4 right-4 w-4 h-4 rounded-full border flex items-center justify-center ${activo ? 'border-viper' : 'border-gray-600'}`}
                    >
                      {activo && <span className="w-2 h-2 rounded-full bg-viper" />}
                    </span>
                  </label>
                )
              })}
            </div>
            {errores.rol && (
              <p id="error-rol" role="alert" className="text-error text-xs">
                {errores.rol}
              </p>
            )}
          </fieldset>

          <hr className="border-gray-800" />

          <fieldset className="flex flex-col gap-5">
            <legend className={TITULO_SECCION}>Acceso a la cuenta</legend>
            <FormField label="Correo electrónico" id="email" requerido error={errores.email}>
              <Input id="email" name="email" type="email" autoComplete="off" placeholder="nombre@club.com" maxLength={254}
                value={valores.email} onChange={cambiar('email')} error={!!errores.email} />
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
              <FormField label="Contraseña inicial" id="password" requerido error={errores.password} ayuda="Mínimo 8 caracteres, con una letra y un número">
                <PasswordInput id="password" name="password" autoComplete="new-password" placeholder="••••••••"
                  value={valores.password} onChange={cambiar('password')} error={!!errores.password} />
              </FormField>
              <FormField label="Confirmar contraseña" id="confirmarPassword" requerido error={errores.confirmarPassword}>
                <PasswordInput id="confirmarPassword" name="confirmarPassword" autoComplete="new-password" placeholder="••••••••"
                  value={valores.confirmarPassword} onChange={cambiar('confirmarPassword')} error={!!errores.confirmarPassword} />
              </FormField>
            </div>
            {mostrarRequisitos && <RequisitosPassword password={valores.password} />}
          </fieldset>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-5 border-t border-gray-800">
            <Button variante="neutro" onClick={() => navigate('/admin/usuarios')} disabled={enviando} className="py-3">
              Cancelar
            </Button>
            <Button type="submit" cargando={enviando} className="py-3">
              Crear cuenta
            </Button>
          </div>
        </form>

        <section aria-labelledby="titulo-ayuda" className="bg-panel border border-gray-800 rounded-2xl p-6 flex flex-col gap-4">
          <h2 id="titulo-ayuda" className="text-xs font-bold uppercase tracking-wide text-texto-suave">
            Antes de crear la cuenta
          </h2>
          <Nota>Solo se pueden crear cuentas de Recepcionista u Organizador. Los jugadores se registran solos.</Nota>
          <Nota>El personal no lleva DNI.</Nota>
          <Nota>Pasale la contraseña inicial a la persona: la puede cambiar desde Mi perfil.</Nota>
        </section>
      </div>
    </div>
  )
}