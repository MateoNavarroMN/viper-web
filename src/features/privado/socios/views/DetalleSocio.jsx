import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { get, patch, post } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Avatar from '../../../../shared/components/Avatar'
import Button from '../../../../shared/components/Button'
import ConfirmDialog from '../../../../shared/components/ConfirmDialog'
import EmptyState from '../../../../shared/components/EmptyState'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import FormField from '../../../../shared/components/FormField'
import Input from '../../../../shared/components/Input'
import Select from '../../../../shared/components/Select'
import Spinner from '../../../../shared/components/Spinner'
import { useToast } from '../../../../shared/hooks/useToast'
import { validarNombre, validarTelefono } from '../../../../shared/utils/validaciones'
import CampoBloqueado from '../../perfil/components/CampoBloqueado'
import { fechaCompleta, puntosTexto } from '../../torneos/torneos'
import CuotasDelSocio from '../components/CuotasDelSocio'
import { DISCIPLINAS, dniConPuntos } from '../socios'

const TARJETA = 'bg-panel border border-gray-800 rounded-2xl p-6 md:p-8'
const TITULO_SECCION = 'text-xs font-bold uppercase tracking-wide text-texto-suave mb-4'
const ERRORES_VACIOS = { nombre: '', apellido: '', telefono: '', TENIS: '', PADEL: '' }

// El campo que informa la API → el campo de este formulario
const CAMPO_DE_API = {
  nombre: 'nombre',
  apellido: 'apellido',
  telefono: 'telefono',
  'categorias.TENIS': 'TENIS',
  'categorias.PADEL': 'PADEL',
}

// Ficha del socio: encabezado, formulario y últimas cuotas. Se monta cuando ya llegó el socio, así los valores iniciales salen de él.
function FichaSocio({ socio, catalogo, onRecargar }) {
  const navigate = useNavigate()
  const { mostrarToast } = useToast()

  const inicial = {
    nombre: socio.nombre,
    apellido: socio.apellido,
    telefono: socio.telefono ?? '',
    TENIS: socio.categorias.TENIS?.id ?? '',
    PADEL: socio.categorias.PADEL?.id ?? '',
  }
  const [valores, setValores] = useState(inicial)
  const [errores, setErrores] = useState(ERRORES_VACIOS)
  const [alerta, setAlerta] = useState(null) // { variante, texto }
  const [guardando, setGuardando] = useState(false)
  const [pideDescartar, setPideDescartar] = useState(false)
  const [pideBaja, setPideBaja] = useState(false) // A2
  const [dandoDeBaja, setDandoDeBaja] = useState(false)

  const limpios = { ...valores, nombre: valores.nombre.trim(), apellido: valores.apellido.trim(), telefono: valores.telefono.trim() }
  const hayCambios = Object.keys(inicial).some((campo) => limpios[campo] !== inicial[campo])

  const cambiar = (campo) => (e) => {
    setValores((actuales) => ({ ...actuales, [campo]: e.target.value }))
    setErrores((actuales) => ({ ...actuales, [campo]: '' }))
  }

  const volver = () => navigate('/gestion/socios')
  const cancelar = () => (hayCambios ? setPideDescartar(true) : volver())

  // A1 · guardar los cambios
  const guardar = async (e) => {
    e.preventDefault()
    if (!hayCambios) {
      setAlerta({ variante: 'info', texto: 'No hay cambios para guardar. Modificá algún dato o cancelá la edición.' })
      return
    }

    const nuevos = {
      ...ERRORES_VACIOS,
      nombre: validarNombre(limpios.nombre, 'El nombre') ?? '',
      apellido: validarNombre(limpios.apellido, 'El apellido') ?? '',
      telefono: validarTelefono(limpios.telefono) ?? '',
    }
    if (Object.values(nuevos).some(Boolean)) {
      setErrores(nuevos)
      setAlerta({ variante: 'error', texto: 'Revisá los campos marcados antes de continuar' })
      return
    }

    // Las categorías van solo si cambiaron
    const categorias = {}
    for (const { clave } of DISCIPLINAS) if (limpios[clave] !== inicial[clave]) categorias[clave] = limpios[clave]

    setErrores(ERRORES_VACIOS)
    setAlerta(null)
    setGuardando(true)
    try {
      await patch(`/socios/${socio.id}`, {
        nombre: limpios.nombre,
        apellido: limpios.apellido,
        telefono: limpios.telefono,
        ...(Object.keys(categorias).length > 0 && { categorias }),
      })
      mostrarToast('Socio actualizado correctamente')
      volver()
    } catch (error) {
      if (CAMPO_DE_API[error.campo]) {
        // Un 409 de categoría sale en el selector de esa disciplina; los demás datos quedan como se escribieron
        setErrores({ ...ERRORES_VACIOS, [CAMPO_DE_API[error.campo]]: error.mensaje })
        setAlerta({ variante: 'error', texto: 'Revisá los campos marcados antes de continuar' })
      } else {
        setAlerta({ variante: 'error', texto: error.mensaje })
      }
    } finally {
      setGuardando(false)
    }
  }

  // A2 · dar de baja
  const darDeBaja = async () => {
    setDandoDeBaja(true)
    try {
      await post(`/socios/${socio.id}/baja`)
      mostrarToast('Socio dado de baja correctamente')
      volver()
    } catch (error) {
      setPideBaja(false)
      if (error.status === 409) {
        // Otra persona ya lo dio de baja: se avisa y se vuelve a cargar la ficha para mostrarlo como está ahora
        mostrarToast(error.mensaje, 'error')
        onRecargar()
      } else {
        setAlerta({ variante: 'error', texto: error.mensaje })
      }
    } finally {
      setDandoDeBaja(false)
    }
  }

  const ocupado = guardando || dandoDeBaja

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4 min-w-0 flex-1">
          <Avatar semilla={socio.jugadorId} tamano={56} />
          <div className="min-w-0">
            <h1 className="font-outfit text-[28px] font-bold leading-tight truncate">
              {socio.nombre} {socio.apellido}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              <EstadoBadge tipo="socio" estado={socio.estado} />
              <EstadoBadge tipo="cuotasSocio" estado={socio.situacionCuotas} />
              <span className="text-sm text-texto-suave">Socio desde {fechaCompleta(socio.fechaAlta)}</span>
            </div>
          </div>
        </div>
        {/* A2 · solo los socios activos se pueden dar de baja */}
        {socio.estado === 'ACTIVO' && (
          <Button variante="peligro-borde" onClick={() => setPideBaja(true)} disabled={ocupado} className="py-3">
            Dar de baja
          </Button>
        )}
      </div>

      {socio.estado === 'BAJA' && (
        <Alert variante="info">
          Este socio está dado de baja: no se le generan cuotas nuevas y conserva su historial. Para volver a activarlo, usá «Registrar socio» y buscalo por su DNI.
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_22rem] gap-6 items-start">
        <form noValidate onSubmit={guardar} className={`${TARJETA} flex flex-col gap-6`}>
          {alerta && <Alert variante={alerta.variante}>{alerta.texto}</Alert>}

          <fieldset className="flex flex-col" disabled={ocupado}>
            <legend className={TITULO_SECCION}>Datos de contacto</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <FormField label="Nombre" id="nombre" requerido error={errores.nombre}>
                <Input id="nombre" maxLength={60} autoComplete="off" value={valores.nombre} error={Boolean(errores.nombre)} onChange={cambiar('nombre')} />
              </FormField>
              <FormField label="Apellido" id="apellido" requerido error={errores.apellido}>
                <Input id="apellido" maxLength={60} autoComplete="off" value={valores.apellido} error={Boolean(errores.apellido)} onChange={cambiar('apellido')} />
              </FormField>
              <FormField label="Teléfono" id="telefono" error={errores.telefono}>
                <Input id="telefono" type="tel" maxLength={20} placeholder="351 123 4567" autoComplete="off" value={valores.telefono} error={Boolean(errores.telefono)} onChange={cambiar('telefono')} />
              </FormField>
            </div>
          </fieldset>

          <div className="border-t border-gray-800 pt-6">
            <h2 className={TITULO_SECCION}>Solo lectura</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <CampoBloqueado etiqueta="DNI" valor={dniConPuntos(socio.dni)} />
              <CampoBloqueado etiqueta="Correo electrónico" valor={socio.email} />
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6">
            <fieldset className="flex flex-col" disabled={ocupado}>
              <legend className={TITULO_SECCION}>Categoría técnica</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                {DISCIPLINAS.map(({ clave, texto }) => (
                  <FormField
                    key={clave}
                    label={`Categoría en ${texto}`}
                    id={`categoria-${clave}`}
                    error={errores[clave]}
                    ayuda={`Puntos actuales: ${puntosTexto(socio.categorias[clave]?.puntos ?? 0)}`}
                  >
                    <Select
                      id={`categoria-${clave}`}
                      placeholder="Seleccionar categoría"
                      opciones={catalogo[clave].map((c) => ({ valor: c.id, texto: c.nombre }))}
                      value={valores[clave]}
                      error={Boolean(errores[clave])}
                      onChange={cambiar(clave)}
                    />
                  </FormField>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-5 border-t border-gray-800">
            <Button variante="neutro" onClick={cancelar} disabled={ocupado} className="py-3">
              Cancelar
            </Button>
            <Button type="submit" cargando={guardando} disabled={dandoDeBaja} className="py-3">
              Guardar cambios
            </Button>
          </div>
        </form>

        <CuotasDelSocio cuotas={socio.ultimasCuotas} />
      </div>

      {/* A1 · con cambios sin guardar, pide confirmar antes de salir */}
      <ConfirmDialog
        abierto={pideDescartar}
        tipo="advertencia"
        titulo="¿Descartar cambios?"
        mensaje="Tenés cambios sin guardar. Si salís ahora, se pierden."
        textoConfirmar="Descartar"
        textoCancelar="Seguir editando"
        onConfirmar={volver}
        onCancelar={() => setPideDescartar(false)}
      />

      {/* A2 · la baja se confirma aclarando qué se conserva y qué deja de pasar */}
      <ConfirmDialog
        abierto={pideBaja}
        tipo="peligro"
        titulo="¿Dar de baja al socio?"
        mensaje={`${socio.nombre} ${socio.apellido} pasa a estado Baja y deja de generar nuevas cuotas mensuales. Su historial de cuotas se conserva.`}
        textoConfirmar="Dar de baja"
        textoCancelar="Volver"
        cargando={dandoDeBaja}
        onConfirmar={darDeBaja}
        onCancelar={() => setPideBaja(false)}
      />

    </>
  )
}

// CU 4.1 · A1 y A2 · perfil del socio (Recepcionista y Administrador)
export default function DetalleSocio() {
  const { id } = useParams()
  const [estado, setEstado] = useState({ cargando: true }) // { cargando } | { socio, catalogo } | { noExiste } | { error }
  const [reintento, setReintento] = useState(0)

  useEffect(() => {
    let vigente = true
    Promise.all([get(`/socios/${id}`), ...DISCIPLINAS.map(({ clave }) => get(`/categorias?disciplina=${clave}`))])
      .then(([{ socio }, tenis, padel]) => vigente && setEstado({ socio, catalogo: { TENIS: tenis.categorias, PADEL: padel.categorias } }))
      .catch((e) => vigente && setEstado(e.status === 404 ? { noExiste: true } : { error: e.mensaje }))
    return () => {
      vigente = false
    }
  }, [id, reintento])

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <Link to="/gestion/socios" className="text-sm text-texto-suave hover:text-viper transition-colors inline-flex items-center gap-1 w-fit">
        <span aria-hidden="true">‹</span> Volver a socios
      </Link>

      {estado.cargando ? (
        <div className="py-16 flex justify-center">
          <Spinner texto="Cargando socio" />
        </div>
      ) : estado.noExiste ? (
        <EmptyState titulo="Socio no encontrado" descripcion="El socio que buscás no existe o ya no está disponible." />
      ) : estado.error ? (
        <Alert variante="error" titulo="No pudimos cargar el socio">
          {estado.error}{' '}
          <button
            type="button"
            onClick={() => {
              setEstado({ cargando: true })
              setReintento((n) => n + 1)
            }}
            className="underline font-semibold cursor-pointer"
          >
            Reintentar
          </button>
        </Alert>
      ) : (
        <FichaSocio key={`${estado.socio.id}-${reintento}`} socio={estado.socio} catalogo={estado.catalogo} onRecargar={() => setReintento((n) => n + 1)} />
      )}
    </div>
  )
}