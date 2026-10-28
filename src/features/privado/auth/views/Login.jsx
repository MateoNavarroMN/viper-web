import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import FormField from '../../../../shared/components/FormField'
import Input from '../../../../shared/components/Input'
import PasswordInput from '../../../../shared/components/PasswordInput'
import { validarEmail } from '../../../../shared/utils/validaciones'
import AuthLayout from '../components/AuthLayout'
import { destinoDespuesDeIngresar } from '../rutaInicio'
import { useAuth } from '../useAuth'

// "mm:ss" para la cuenta regresiva
const formatearEspera = (segundos) => {
  const minutos = Math.floor(segundos / 60)
  const resto = String(segundos % 60).padStart(2, '0')
  return `${minutos}:${resto}`
}

export default function Login() {
  const [valores, setValores] = useState({ email: '', password: '' })
  const [errores, setErrores] = useState({})
  const [alerta, setAlerta] = useState(null) // { titulo, texto }
  const [esperaHasta, setEsperaHasta] = useState(null) // milisegundos (Date.now) en que termina la espera
  const [ahora, setAhora] = useState(() => Date.now())
  const [enviando, setEnviando] = useState(false)
  const formulario = useRef(null)
  const location = useLocation()
  const { usuario, cargando, login } = useAuth()

  // /login?motivo=expirada: la sesión se cerró por vencimiento; el aviso se queda hasta que se intenta ingresar de nuevo
  const sesionVencida = new URLSearchParams(location.search).get('motivo') === 'expirada'

  const segundosRestantes = esperaHasta ? Math.max(0, Math.ceil((esperaHasta - ahora) / 1000)) : 0
  const enEspera = segundosRestantes > 0

  // Cuenta regresiva: se actualiza cada segundo mientras dure la espera
  useEffect(() => {
    if (!esperaHasta) return undefined
    const reloj = setInterval(() => {
      const actual = Date.now()
      setAhora(actual)
      if (actual >= esperaHasta) {
        clearInterval(reloj)
        setEsperaHasta(null)
      }
    }, 500)
    return () => clearInterval(reloj)
  }, [esperaHasta])

  const cambiar = (campo) => (evento) => {
    setValores((anteriores) => ({ ...anteriores, [campo]: evento.target.value }))
    if (errores[campo]) setErrores((anteriores) => ({ ...anteriores, [campo]: undefined }))
  }

  const enfocar = (campo) => formulario.current?.elements[campo]?.focus()

  const enviar = async (evento) => {
    evento.preventDefault()
    if (enEspera) return
    setAlerta(null)

    // Campos vacíos o correo mal formado: se marcan en rojo y se conserva lo escrito
    const conError = {
      email: validarEmail(valores.email),
      password: valores.password ? null : 'Campo obligatorio',
    }
    const marcados = Object.fromEntries(Object.entries(conError).filter(([, texto]) => texto))
    if (Object.keys(marcados).length > 0) {
      setErrores(marcados)
      setAlerta({ titulo: 'Revisá los campos marcados', texto: 'Ingresá tu correo y tu contraseña.' })
      enfocar(marcados.email ? 'email' : 'password')
      return
    }

    setErrores({})
    setEnviando(true)
    try {
      // Si sale bien, useAuth guarda el usuario y más abajo se redirige (paso 10)
      await login(valores.email.trim(), valores.password)
    } catch (error) {
      if (error.status === 423) {
        // Espera por demasiados intentos
        setAhora(Date.now())
        setEsperaHasta(Date.now() + (error.segundosRestantes ?? 900) * 1000)
        setValores((anteriores) => ({ ...anteriores, password: '' }))
      } else if (error.status === 401) {
        // 6a/6b · mensaje genérico: no se aclara si falló el correo o la contraseña
        setAlerta({ titulo: 'Credenciales inválidas', texto: 'Revisá tu correo y tu contraseña e intentá de nuevo.' })
        setValores((anteriores) => ({ ...anteriores, password: '' }))
        enfocar('password')
      } else if (error.status === 400 && error.campo && error.campo in valores) {
        setErrores({ [error.campo]: error.mensaje })
        setAlerta({ titulo: 'Revisá los campos marcados', texto: error.mensaje })
        enfocar(error.campo)
      } else {
        setAlerta({ titulo: 'No pudimos iniciar sesión', texto: error.mensaje })
      }
    } finally {
      setEnviando(false)
    }
  }

  // Con sesión iniciada va a la ruta que quería abrir (la guarda RequireAuth, M1-FE-04) o al panel de su rol
  if (usuario) {
    const destino = destinoDespuesDeIngresar(usuario.rol, location.state?.from?.pathname)
    return <Navigate to={destino} replace />
  }
  if (cargando) return null

  return (
    <AuthLayout accion={{ texto: 'Iniciar sesión', ruta: '/login' }}>
      <div className="text-center mb-8 md:mb-10">
        <h1 className="font-outfit text-[40px] font-bold mb-3 leading-tight text-balance">
          Iniciá <span className="text-viper">sesión</span>
        </h1>
        <p className="text-texto-suave max-w-md mx-auto leading-relaxed">
          Ingresá con tu correo y contraseña para acceder a Viper.
        </p>
      </div>

      <form
        ref={formulario}
        onSubmit={enviar}
        noValidate
        className="bg-panel border border-gray-800 rounded-2xl p-6 md:p-10 max-w-[480px] mx-auto flex flex-col gap-6"
      >
        {enEspera && (
          <Alert variante="advertencia" titulo="Cuenta en espera">
            Superaste los intentos permitidos. Podés volver a intentar en{' '}
            <span className="font-semibold tabular-nums">{formatearEspera(segundosRestantes)}</span>.
          </Alert>
        )}
        {!enEspera && !alerta && sesionVencida && (
          <Alert variante="advertencia" titulo="Tu sesión expiró">
            Volvé a iniciar sesión para continuar.
          </Alert>
        )}
        {!enEspera && alerta && (
          <Alert variante="error" titulo={alerta.titulo}>
            {alerta.texto}
          </Alert>
        )}

        <FormField label="Correo electrónico" id="email" requerido error={errores.email}>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="nombre@correo.com" maxLength={254}
            value={valores.email} onChange={cambiar('email')} error={!!errores.email} />
        </FormField>
        <FormField label="Contraseña" id="password" requerido error={errores.password}>
          <PasswordInput id="password" name="password" autoComplete="current-password" placeholder="••••••••"
            value={valores.password} onChange={cambiar('password')} error={!!errores.password} />
        </FormField>

        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <Link
            to="/"
            className="font-outfit inline-flex items-center justify-center px-6 py-3 rounded-lg bg-panel border border-gray-800 hover:border-viper transition-colors"
          >
            Cancelar
          </Link>
          <Button type="submit" variante="primario" cargando={enviando} disabled={enEspera} className="flex-1 py-3">
            {enEspera ? `Reintentá en ${formatearEspera(segundosRestantes)}` : 'Ingresar'}
          </Button>
        </div>
      </form>

      <p className="text-center text-texto-suave mt-8">
        ¿No tenés una cuenta?{' '}
        <Link to="/registro" className="text-viper font-semibold hover:underline">
          Registrate
        </Link>
      </p>
    </AuthLayout>
  )
}