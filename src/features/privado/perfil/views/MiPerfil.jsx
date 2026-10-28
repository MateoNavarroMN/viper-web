import { useCallback, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Avatar from '../../../../shared/components/Avatar'
import Button from '../../../../shared/components/Button'
import Tabs from '../../../../shared/components/Tabs'
import { ETIQUETA_ROL } from '../../auth/permisos'
import { useAuth } from '../../auth/useAuth'
import CambiarPassword from '../components/CambiarPassword'
import CampoBloqueado from '../components/CampoBloqueado'
import MiActividad from '../components/MiActividad'
import Nota from '../components/Nota'

const PESTANAS = [
  { clave: 'datos', titulo: 'Datos personales' },
  { clave: 'actividad', titulo: 'Mi actividad' },
]

// Vista de solo lectura del perfil. Editar datos va a /perfil/editar; Cambiar contraseña abre un modal.
// El JUGADOR tiene además la pestaña «Mi actividad» (CU 1.3 · A2), que queda en la URL (?seccion=actividad).
export default function MiPerfil() {
  const { usuario } = useAuth()
  const [cambiandoPassword, setCambiandoPassword] = useState(false)
  const cerrarCambioPassword = useCallback(() => setCambiandoPassword(false), [])
  const [parametros, setParametros] = useSearchParams()
  const esJugador = usuario.rol === 'JUGADOR'
  // Otros roles no tienen Mi actividad: aunque escriban ?seccion=actividad ven sus datos
  const pestana = esJugador && parametros.get('seccion') === 'actividad' ? 'actividad' : 'datos'
  const cambiarPestana = (clave) => setParametros(clave === 'actividad' ? { seccion: 'actividad' } : {}, { replace: true })

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="font-outfit text-[28px] font-bold">Mi perfil</h1>
        <p className="text-texto-suave text-sm mt-1">Consultá y actualizá tus datos de contacto.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_22rem] gap-6 items-start">
        <div className="flex flex-col gap-6 min-w-0">
          {esJugador && <Tabs pestanas={PESTANAS} activa={pestana} onCambiar={cambiarPestana} />}
          {pestana === 'actividad' ? (
            <MiActividad />
          ) : (
            <section aria-labelledby="titulo-datos" className="bg-panel border border-gray-800 rounded-2xl p-6 md:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between pb-6 border-b border-gray-800">
                <div className="flex items-center gap-4 min-w-0">
                  <Avatar semilla={usuario.id} tamano={56} />
                  <div className="min-w-0">
                    <p className="font-outfit text-lg font-bold truncate">
                      {usuario.nombre} {usuario.apellido}
                    </p>
                    <p className="text-texto-suave text-[13px] truncate">{usuario.email}</p>
                  </div>
                </div>
                <Link
                  to="/perfil/editar"
                  className="font-outfit font-semibold bg-viper hover:bg-viper-hover text-black px-6 py-3 rounded-lg text-center transition-colors"
                >
                  Editar datos
                </Link>
              </div>

              <h2 id="titulo-datos" className="text-xs font-bold uppercase tracking-wide text-texto-suave mt-6 mb-4">
                Datos personales
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <CampoBloqueado etiqueta="Nombre" valor={usuario.nombre} />
                <CampoBloqueado etiqueta="Apellido" valor={usuario.apellido} />
                <CampoBloqueado etiqueta="Correo electrónico" valor={usuario.email} />
                <CampoBloqueado etiqueta="Teléfono" valor={usuario.telefono} />
                {usuario.rol === 'JUGADOR' && usuario.dni && <CampoBloqueado etiqueta="DNI" valor={usuario.dni} />}
                <CampoBloqueado etiqueta="Rol" valor={ETIQUETA_ROL[usuario.rol]} />
              </div>
              <div className="mt-6">
                <Nota>El correo y el DNI solo los modifica el Administrador.</Nota>
              </div>
            </section>
          )}
        </div>

        <section aria-labelledby="titulo-seguridad" className="bg-panel border border-gray-800 rounded-2xl p-6">
          <h2 id="titulo-seguridad" className="text-xs font-bold uppercase tracking-wide text-texto-suave mb-4">
            Seguridad
          </h2>
          <p className="text-sm">Contraseña</p>
          <p className="text-texto-suave tracking-widest mt-1" aria-hidden="true">
            ••••••••••
          </p>
          <p className="text-texto-suave text-xs mt-3">Al cambiarla se cierran tus otras sesiones.</p>
          <Button variante="secundario" onClick={() => setCambiandoPassword(true)} className="w-full mt-5 py-3">
            Cambiar contraseña
          </Button>
        </section>
      </div>

      {cambiandoPassword && <CambiarPassword onCerrar={cerrarCambioPassword} />}
    </div>
  )
}