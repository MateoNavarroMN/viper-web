import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { get, post } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Avatar from '../../../../shared/components/Avatar'
import Badge from '../../../../shared/components/Badge'
import BottomSheet from '../../../../shared/components/BottomSheet'
import Button from '../../../../shared/components/Button'
import ConfirmDialog from '../../../../shared/components/ConfirmDialog'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Spinner from '../../../../shared/components/Spinner'
import { useMediaQuery } from '../../../../shared/hooks/useMediaQuery'
import { useToast } from '../../../../shared/hooks/useToast'
import { ETIQUETA_ROL, VARIANTE_ROL } from '../../auth/permisos'
import CampoBloqueado from '../../perfil/components/CampoBloqueado'
import EditarContacto from '../components/EditarContacto'
import SelectorRol from '../components/SelectorRol'

// '2026-03-12 10:00:00' → '12/03/2026'
const fecha = (texto) => (texto ? texto.slice(0, 10).split('-').reverse().join('/') : '')

// «Hoy 09:12» si fue hoy; si no, '12/03/2026 09:12'
const ultimoAcceso = (texto) => {
  if (!texto) return 'Todavía no ingresó'
  const momento = new Date(texto)
  const hora = momento.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
  const esHoy = momento.toDateString() === new Date().toDateString()
  return esHoy ? `Hoy ${hora}` : `${momento.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${hora}`
}

const TARJETA = 'bg-panel border border-gray-800 rounded-2xl p-6 md:p-8'
const TITULO_TARJETA = 'text-xs font-bold uppercase tracking-wide text-texto-suave'

// CU 1.4 · detalle de un usuario (solo ADMINISTRADOR): datos de solo lectura y acciones según el estado.
export default function DetalleUsuario() {
  const { id } = useParams()
  const { state } = useLocation()
  const { mostrarToast } = useToast()
  const esEscritorio = useMediaQuery('(min-width: 1024px)')
  const volverA = `/admin/usuarios${state?.busqueda ?? ''}` // vuelve al listado con sus filtros

  const [reintento, setReintento] = useState(0)
  const [resultado, setResultado] = useState(null) // { clave, usuario, error, status }
  const clave = `${id}|${reintento}`
  const cargando = resultado?.clave !== clave
  const usuario = resultado?.usuario ?? null
  const error = resultado?.clave === clave && resultado.error ? resultado : null

  const [cambiandoRol, setCambiandoRol] = useState(false)
  const [sesionesCerradas, setSesionesCerradas] = useState(null)
  const tarjetaRol = useRef(null)
  const cerrarSelector = useCallback(() => setCambiandoRol(false), [])

  // A1/A2: 'bloquear' | 'activar' mientras se muestra la confirmación
  const [confirmando, setConfirmando] = useState(null)
  const [cambiandoEstado, setCambiandoEstado] = useState(false)
  // A3: modal de correo / DNI
  const [editandoContacto, setEditandoContacto] = useState(false)
  const cerrarContacto = useCallback(() => setEditandoContacto(false), [])

  useEffect(() => {
    let vigente = true
    get(`/usuarios/${id}`)
      .then((respuesta) => vigente && setResultado({ clave, usuario: respuesta.usuario }))
      .catch((e) => vigente && setResultado({ clave, error: e.mensaje, status: e.status }))
    return () => {
      vigente = false
    }
  }, [clave, id])

  // Al abrir el selector en escritorio, la tarjeta se lleva a la vista
  useEffect(() => {
    if (cambiandoRol && esEscritorio) tarjetaRol.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [cambiandoRol, esEscritorio])

  const rolGuardado = (respuesta) => {
    setResultado({ clave, usuario: respuesta.usuario })
    setSesionesCerradas(respuesta.sesionesCerradas)
    setCambiandoRol(false)
    mostrarToast('Rol actualizado correctamente')
  }

  const cancelarEstado = useCallback(() => {
    if (!cambiandoEstado) setConfirmando(null)
  }, [cambiandoEstado])

  const confirmarEstado = async () => {
    setCambiandoEstado(true)
    try {
      const respuesta = await post(`/usuarios/${id}/${confirmando}`)
      setResultado({ clave, usuario: respuesta.usuario })
      setSesionesCerradas(null) // el aviso «Rol actualizado» era de otra acción
      mostrarToast(respuesta.mensaje)
    } catch (e) {
      // 409 «El usuario ya está en ese estado»: otro administrador lo cambió; se recarga para mostrar el real
      mostrarToast(e.mensaje, 'error')
      if (e.status === 409 || e.status === 404) setReintento((n) => n + 1)
    } finally {
      setCambiandoEstado(false)
      setConfirmando(null)
    }
  }

  const contactoGuardado = (respuesta) => {
    setResultado({ clave, usuario: respuesta.usuario })
    setSesionesCerradas(null)
    setEditandoContacto(false)
    mostrarToast('Datos actualizados')
  }

  const volver = (
    <Link to={volverA} className="text-sm text-texto-suave hover:text-viper transition-colors inline-flex items-center gap-1 w-fit">
      <span aria-hidden="true">‹</span> Volver a usuarios
    </Link>
  )

  if (error) {
    const noExiste = error.status === 404
    return (
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {volver}
        <Alert variante="error" titulo={noExiste ? 'Usuario no encontrado' : 'No pudimos cargar el usuario'}>
          {noExiste ? 'La cuenta que buscás no existe o fue eliminada.' : error.error}{' '}
          {!noExiste && (
            <button type="button" onClick={() => setReintento((n) => n + 1)} className="underline font-semibold cursor-pointer">
              Reintentar
            </button>
          )}
        </Alert>
      </div>
    )
  }

  if (cargando && !usuario) {
    return (
      <div className="py-24 flex justify-center">
        <Spinner texto="Cargando usuario" />
      </div>
    )
  }

  const esAdministrador = !usuario.gestionable // 7a: las cuentas de Administrador no tienen acciones
  const selector = (
    <SelectorRol usuario={usuario} onGuardado={rolGuardado} onCancelar={cerrarSelector} />
  )

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      {volver}

      <div className="flex items-center gap-4">
        <Avatar semilla={usuario.id} tamano={56} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <h1 className="font-outfit text-[28px] font-bold leading-tight">
              {usuario.nombre} {usuario.apellido}
            </h1>
            <div className="flex gap-2">
              <Badge variante={VARIANTE_ROL[usuario.rol]}>{ETIQUETA_ROL[usuario.rol]}</Badge>
              <EstadoBadge tipo="usuario" estado={usuario.estado} />
            </div>
          </div>
          <p className="text-sm text-texto-suave truncate">{usuario.email}</p>
        </div>
      </div>

      {sesionesCerradas !== null && (
        <Alert variante="exito" titulo="Rol actualizado">
          {sesionesCerradas > 0
            ? `Se cerraron ${sesionesCerradas} ${sesionesCerradas === 1 ? 'sesión activa' : 'sesiones activas'}: el nuevo rol rige desde su próximo ingreso.`
            : 'No tenía sesiones activas: el nuevo rol rige desde su próximo ingreso.'}
        </Alert>
      )}

      {esAdministrador && (
        <Alert variante="error" titulo="Cuenta de Administrador">
          Estas cuentas se gestionan fuera del sistema.
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_22rem] gap-6 items-start">
        <div className="flex flex-col gap-6 min-w-0">
          <section aria-labelledby="titulo-datos" className={TARJETA}>
            <h2 id="titulo-datos" className={`${TITULO_TARJETA} mb-4`}>
              Datos de la cuenta
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <CampoBloqueado etiqueta="Nombre" valor={usuario.nombre} />
              <CampoBloqueado etiqueta="Apellido" valor={usuario.apellido} />
              <CampoBloqueado etiqueta="Correo electrónico" valor={usuario.email} />
              <CampoBloqueado etiqueta="DNI" valor={usuario.rol === 'JUGADOR' ? (usuario.dni ?? '—') : 'No aplica'} />
              <CampoBloqueado etiqueta="Fecha de registro" valor={fecha(usuario.fecha_registro)} />
              <CampoBloqueado etiqueta="Último acceso" valor={ultimoAcceso(usuario.ultimo_acceso)} />
            </div>
          </section>

          {cambiandoRol && esEscritorio && (
            <section ref={tarjetaRol} aria-labelledby="titulo-rol" className={TARJETA}>
              <h2 id="titulo-rol" className={`${TITULO_TARJETA} mb-4`}>
                Cambiar rol
              </h2>
              {selector}
            </section>
          )}
        </div>

        <section aria-labelledby="titulo-estado" className="bg-panel border border-gray-800 rounded-2xl p-6">
          <h2 id="titulo-estado" className={`${TITULO_TARJETA} mb-4`}>
            Estado y acciones
          </h2>
          <div className="flex items-center gap-3 text-sm text-texto-suave">
            <EstadoBadge tipo="usuario" estado={usuario.estado} />
            {usuario.estado === 'ACTIVO' ? 'Cuenta habilitada' : 'Cuenta bloqueada'}
          </div>
          <div className="flex flex-col gap-3 mt-5">
            {esAdministrador ? (
              <>
                {/* 7a: acciones deshabilitadas */}
                <Button variante="secundario" disabled className="w-full py-3">Cambiar rol</Button>
                <Button variante="peligro-borde" disabled className="w-full py-3">Bloquear usuario</Button>
                <Button variante="neutro" disabled className="w-full py-3">Editar correo / DNI</Button>
              </>
            ) : (
              <>
                <Button variante="secundario" onClick={() => setCambiandoRol(true)} disabled={cambiandoRol} className="w-full py-3">
                  Cambiar rol
                </Button>
                {/* Solo la acción que corresponde al estado actual */}
                {usuario.estado === 'ACTIVO' ? (
                  <Button variante="peligro-borde" onClick={() => setConfirmando('bloquear')} className="w-full py-3">
                    Bloquear usuario
                  </Button>
                ) : (
                  <Button variante="secundario" onClick={() => setConfirmando('activar')} className="w-full py-3">
                    Activar usuario
                  </Button>
                )}
                <Button variante="neutro" onClick={() => setEditandoContacto(true)} className="w-full py-3">
                  Editar correo / DNI
                </Button>
              </>
            )}
          </div>
          {esAdministrador && (
            <p className="mt-4 text-xs text-texto-suave">Las cuentas de Administrador no se gestionan acá.</p>
          )}
        </section>
      </div>

      {!esEscritorio && (
        <BottomSheet abierto={cambiandoRol} titulo="Cambiar rol" onCerrar={cerrarSelector}>
          {selector}
        </BottomSheet>
      )}

      <ConfirmDialog
        abierto={confirmando === 'bloquear'}
        tipo="peligro"
        titulo="Bloquear usuario"
        mensaje={`${usuario.nombre} ${usuario.apellido} no podrá iniciar sesión y se cerrarán todas sus sesiones activas.`}
        textoConfirmar="Bloquear"
        cargando={cambiandoEstado}
        onConfirmar={confirmarEstado}
        onCancelar={cancelarEstado}
      />
      <ConfirmDialog
        abierto={confirmando === 'activar'}
        variante="primario"
        titulo="Activar usuario"
        mensaje={`${usuario.nombre} ${usuario.apellido} podrá volver a iniciar sesión. Se reinician sus intentos fallidos y la espera.`}
        textoConfirmar="Activar"
        cargando={cambiandoEstado}
        onConfirmar={confirmarEstado}
        onCancelar={cancelarEstado}
      />

      {editandoContacto && <EditarContacto usuario={usuario} onGuardado={contactoGuardado} onCerrar={cerrarContacto} />}
    </div>
  )
}