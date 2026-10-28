import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { patch } from '../../../../shared/api/client'
import { useToast } from '../../../../shared/hooks/useToast'
import Alert from '../../../../shared/components/Alert'
import Button from '../../../../shared/components/Button'
import ConfirmDialog from '../../../../shared/components/ConfirmDialog'
import FormField from '../../../../shared/components/FormField'
import Input from '../../../../shared/components/Input'
import { validarNombre, validarTelefono } from '../../../../shared/utils/validaciones'
import { useAuth } from '../../auth/useAuth'
import CampoBloqueado from '../components/CampoBloqueado'
import Nota from '../components/Nota'

const CAMPOS = ['nombre', 'apellido', 'telefono']

const validar = (v) => {
  const errores = {
    nombre: validarNombre(v.nombre, 'El nombre'),
    apellido: validarNombre(v.apellido, 'El apellido'),
    telefono: validarTelefono(v.telefono),
  }
  return Object.fromEntries(Object.entries(errores).filter(([, texto]) => texto))
}

const Titulo = ({ children }) => (
  <h2 className="text-xs font-bold uppercase tracking-wide text-texto-suave mb-4">{children}</h2>
)

// Lo que el usuario puede y no puede editar (panel lateral)
const Permiso = ({ texto, quien, editable }) => (
  <li className="flex items-center gap-3">
    <span
      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${editable ? 'bg-viper/15 text-viper' : 'bg-gray-800 text-texto-suave'}`}
      aria-hidden="true"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {editable ? <path d="m5 12 5 5L20 7" /> : (<><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>)}
      </svg>
    </span>
    <span className={`flex-1 ${editable ? '' : 'text-texto-suave'}`}>{texto}</span>
    <span className={`text-xs ${editable ? 'text-viper' : 'text-texto-suave'}`}>{quien}</span>
  </li>
)

// Edición de nombre, apellido y teléfono. Correo y DNI se muestran bloqueados (los cambia el administrador).
export default function EditarPerfil() {
  const { usuario, actualizarUsuario } = useAuth()
  const { mostrarToast } = useToast()
  const navigate = useNavigate()
  const [valores, setValores] = useState({ nombre: usuario.nombre, apellido: usuario.apellido, telefono: usuario.telefono ?? '' })
  const [errores, setErrores] = useState({})
  const [alerta, setAlerta] = useState(null) // { variante, titulo, texto }
  const [guardando, setGuardando] = useState(false)
  const [confirmarDescarte, setConfirmarDescarte] = useState(false)
  const formulario = useRef(null)

  useEffect(() => {
    formulario.current?.elements.nombre?.focus()
  }, [])

  const limpios = {
    nombre: valores.nombre.trim(),
    apellido: valores.apellido.trim(),
    telefono: valores.telefono.trim(),
  }
  const hayCambios =
    limpios.nombre !== usuario.nombre || limpios.apellido !== usuario.apellido || limpios.telefono !== (usuario.telefono ?? '')

  const volver = () => navigate('/perfil')

  // Cancelar: si hay cambios sin guardar se pide confirmación; al confirmar se descartan
  const cancelar = () => {
    if (hayCambios) setConfirmarDescarte(true)
    else volver()
  }

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

    // Datos inválidos: campos en rojo y se conserva lo ingresado
    const conError = validar(valores)
    if (Object.keys(conError).length > 0) {
      setErrores(conError)
      setAlerta({ variante: 'error', titulo: 'Revisá los campos marcados', texto: 'Completá los datos obligatorios con el formato correcto.' })
      enfocarPrimerError(conError)
      return
    }
    if (!hayCambios) {
      setAlerta({ variante: 'info', titulo: 'No hay cambios para guardar', texto: 'Modificá algún dato o cancelá la edición.' })
      return
    }

    setErrores({})
    setGuardando(true)
    try {
      const datos = await patch('/perfil', limpios)
      // Los datos nuevos quedan en el contexto, así el menú también se actualiza
      actualizarUsuario(datos.usuario)
      mostrarToast('Perfil actualizado', 'exito')
      volver()
    } catch (error) {
      if (error.campo && CAMPOS.includes(error.campo)) {
        setErrores({ [error.campo]: error.mensaje })
        setAlerta({ variante: 'error', titulo: 'Revisá los campos marcados', texto: error.mensaje })
        enfocarPrimerError({ [error.campo]: true })
      } else {
        setAlerta({ variante: 'error', titulo: 'No pudimos guardar los cambios', texto: error.mensaje })
      }
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="font-outfit text-[28px] font-bold">Editar datos</h1>
        <p className="text-texto-suave text-sm mt-1">Modificá tu nombre, apellido y teléfono.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_22rem] gap-6 items-start">
        <form ref={formulario} onSubmit={guardar} noValidate className="bg-panel border border-gray-800 rounded-2xl p-6 md:p-8 flex flex-col gap-6">
          {alerta && (
            <Alert variante={alerta.variante} titulo={alerta.titulo}>
              {alerta.texto}
            </Alert>
          )}

          <div>
            <Titulo>Datos editables</Titulo>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <FormField label="Nombre" id="nombre" requerido error={errores.nombre}>
                <Input id="nombre" name="nombre" autoComplete="given-name" maxLength={60}
                  value={valores.nombre} onChange={cambiar('nombre')} error={!!errores.nombre} />
              </FormField>
              <FormField label="Apellido" id="apellido" requerido error={errores.apellido}>
                <Input id="apellido" name="apellido" autoComplete="family-name" maxLength={60}
                  value={valores.apellido} onChange={cambiar('apellido')} error={!!errores.apellido} />
              </FormField>
              <FormField label="Teléfono" id="telefono" error={errores.telefono}>
                <Input id="telefono" name="telefono" type="tel" autoComplete="tel" placeholder="351 123 4567" maxLength={20}
                  value={valores.telefono} onChange={cambiar('telefono')} error={!!errores.telefono} />
              </FormField>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6">
            <Titulo>Solo lectura</Titulo>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <CampoBloqueado etiqueta="Correo electrónico" valor={usuario.email} />
              {usuario.rol === 'JUGADOR' && usuario.dni && <CampoBloqueado etiqueta="DNI" valor={usuario.dni} />}
            </div>
            <div className="mt-5">
              <Nota>Para cambiar el correo o el DNI, comunicate con la administración.</Nota>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
            <Button variante="neutro" onClick={cancelar} disabled={guardando} className="py-3 sm:px-8">
              Cancelar
            </Button>
            <Button type="submit" variante="primario" cargando={guardando} className="py-3 sm:px-14">
              Guardar cambios
            </Button>
          </div>
        </form>

        <section aria-labelledby="titulo-permisos" className="bg-panel border border-gray-800 rounded-2xl p-6">
          <h2 id="titulo-permisos" className="text-xs font-bold uppercase tracking-wide text-texto-suave mb-5">
            Qué podés editar
          </h2>
          <ul className="flex flex-col gap-4 text-sm">
            <Permiso texto="Nombre" quien="Editable" editable />
            <Permiso texto="Apellido" quien="Editable" editable />
            <Permiso texto="Teléfono" quien="Editable" editable />
            <Permiso texto="Correo electrónico" quien="Administrador" />
            {usuario.rol === 'JUGADOR' && usuario.dni && <Permiso texto="DNI" quien="Administrador" />}
          </ul>
        </section>
      </div>

      <ConfirmDialog
        abierto={confirmarDescarte}
        tipo="advertencia"
        titulo="¿Descartar los cambios?"
        mensaje="Tenés cambios sin guardar. Si cancelás ahora, se pierden."
        textoConfirmar="Descartar"
        textoCancelar="Seguir editando"
        onConfirmar={volver}
        onCancelar={() => setConfirmarDescarte(false)}
      />
    </div>
  )
}