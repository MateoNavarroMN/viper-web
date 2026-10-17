import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { get } from '../../../../shared/api/client'
import Alert from '../../../../shared/components/Alert'
import Avatar from '../../../../shared/components/Avatar'
import Badge from '../../../../shared/components/Badge'
import Button from '../../../../shared/components/Button'
import EstadoBadge from '../../../../shared/components/EstadoBadge'
import Select from '../../../../shared/components/Select'
import Spinner from '../../../../shared/components/Spinner'
import { ETIQUETA_ROL, VARIANTE_ROL } from '../../auth/permisos'
import SinResultados from '../components/SinResultados'
import { Link, useLocation, useSearchParams } from 'react-router-dom'

const TAMANIO = 10
const ESPERA_BUSQUEDA = 350 // ms sin tipear antes de buscar (debounce)

const OPCIONES_ROL = [
  { valor: '', texto: 'Rol: Todos' },
  ...Object.entries(ETIQUETA_ROL).map(([valor, texto]) => ({ valor, texto })),
]
const OPCIONES_ESTADO = [
  { valor: '', texto: 'Estado: Todos' },
  { valor: 'ACTIVO', texto: 'Activo' },
  { valor: 'BLOQUEADO', texto: 'Bloqueado' },
]

const ICONO_CANDADO = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
)
const ICONO_FLECHA = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m9 18 6-6-6-6" />
  </svg>
)

// Fila del listado: toda la fila lleva al detalle. Las cuentas de Administrador muestran un candado
// (se pueden ver, pero no tienen acciones).
function FilaUsuario({ usuario, busqueda }) {
  return (
    <li>
      <Link
        to={`/admin/usuarios/${usuario.id}`}
        state={{ busqueda }}
        className="grid grid-cols-[auto_minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_12rem_10rem_2rem] items-center gap-x-4 gap-y-2 bg-panel border border-gray-800 rounded-xl px-4 md:px-6 py-3 hover:border-viper transition-colors focus-visible:outline-2 focus-visible:outline-viper"
      >
        <div className="contents md:flex md:items-center md:gap-3 md:min-w-0">
          <Avatar semilla={usuario.id} tamano={36} />
          <div className="min-w-0">
            <p className="text-sm truncate">
              {usuario.nombre} {usuario.apellido}
            </p>
            <p className="hidden md:block text-xs text-texto-suave truncate">{usuario.email}</p>
            {/* En el celular los badges van debajo del nombre */}
            <div className="md:hidden flex flex-wrap gap-2 mt-2">
              <Badge variante={VARIANTE_ROL[usuario.rol]}>{ETIQUETA_ROL[usuario.rol]}</Badge>
              <EstadoBadge tipo="usuario" estado={usuario.estado} />
            </div>
          </div>
        </div>
        <div className="hidden md:block">
          <Badge variante={VARIANTE_ROL[usuario.rol]}>{ETIQUETA_ROL[usuario.rol]}</Badge>
        </div>
        <div className="hidden md:block">
          <EstadoBadge tipo="usuario" estado={usuario.estado} />
        </div>
        <span className="text-texto-suave justify-self-end">
          {usuario.gestionable ? ICONO_FLECHA : ICONO_CANDADO}
          {!usuario.gestionable && <span className="sr-only">Cuenta de Administrador, sin acciones</span>}
        </span>
      </Link>
    </li>
  )
}

// CU 1.4 · listado de usuarios (solo ADMINISTRADOR). Los filtros viven en la URL (?q=&rol=&estado=&pagina=)
// para poder recargar o compartir la búsqueda.
export default function ListadoUsuarios() {
  const [parametros, setParametros] = useSearchParams()
  const { search } = useLocation()
  const q = parametros.get('q') ?? ''
  const rol = parametros.get('rol') ?? ''
  const estado = parametros.get('estado') ?? ''
  const pagina = Math.max(1, Number(parametros.get('pagina')) || 1)

  const [busqueda, setBusqueda] = useState(q)
  const [reintento, setReintento] = useState(0)
  // Última respuesta recibida y a qué consulta corresponde. Mientras la consulta actual no coincide con
  // `resultado.clave`, se está cargando y se sigue mostrando la lista anterior atenuada.
  const [resultado, setResultado] = useState(null) // { clave, datos, error }
  const clave = `${q}|${rol}|${estado}|${pagina}|${reintento}`
  const cargando = resultado?.clave !== clave
  const datos = resultado?.datos ?? null // { usuarios, total, totalPaginas }
  const error = resultado?.clave === clave ? resultado.error : null

  // Cambia filtros en la URL. Cualquier cambio de filtro vuelve a la página 1.
  const actualizar = (cambios) => {
    const nuevos = new URLSearchParams(parametros)
    for (const [clave, valor] of Object.entries({ pagina: '', ...cambios })) {
      if (valor) nuevos.set(clave, valor)
      else nuevos.delete(clave)
    }
    setParametros(nuevos)
  }

  // Si la URL cambia desde afuera (atrás/adelante del navegador), el buscador la sigue. Si el cambio vino de lo
  // que se está tipeando (busqueda.trim() === q) no se toca, para no pisar un espacio recién escrito.
  const [qPrevia, setQPrevia] = useState(q)
  if (q !== qPrevia) {
    setQPrevia(q)
    if (q !== busqueda.trim()) setBusqueda(q)
  }

  // Debounce: busca cuando se deja de tipear
  useEffect(() => {
    if (busqueda.trim() === q) return undefined
    const espera = setTimeout(() => actualizar({ q: busqueda.trim() }), ESPERA_BUSQUEDA)
    return () => clearTimeout(espera)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda])

  useEffect(() => {
    let vigente = true // si cambian los filtros antes de que responda, se ignora la respuesta vieja
    const consulta = new URLSearchParams({ pagina: String(pagina), tamanio: String(TAMANIO) })
    if (q) consulta.set('q', q)
    if (rol) consulta.set('rol', rol)
    if (estado) consulta.set('estado', estado)
    get(`/usuarios?${consulta}`)
      .then((respuesta) => vigente && setResultado({ clave, datos: respuesta }))
      .catch((e) => vigente && setResultado((anterior) => ({ clave, datos: anterior?.datos, error: e.mensaje })))
    return () => {
      vigente = false
    }
  }, [clave, q, rol, estado, pagina])

  const hayFiltros = Boolean(q || rol || estado)
  const limpiarFiltros = () => {
    setBusqueda('')
    setParametros(new URLSearchParams())
  }

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 pb-24 md:pb-0">
      <div>
        <h1 className="font-outfit text-[28px] font-bold">Usuarios</h1>
        <p className="text-texto-suave text-sm mt-1">Consultá y gestioná las cuentas del sistema.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
        <div className="relative flex-1 lg:max-w-md">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-texto-suave pointer-events-none" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            aria-label="Buscar por nombre, correo o DNI"
            placeholder="Buscar por nombre, correo o DNI"
            maxLength={100}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-fondo text-texto placeholder:text-texto-suave border border-gray-800 focus:border-viper rounded-lg pl-11 pr-4 py-3 text-sm focus:outline-none transition-colors"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:flex">
          <Select aria-label="Filtrar por rol" opciones={OPCIONES_ROL} value={rol} onChange={(e) => actualizar({ rol: e.target.value })} className="lg:w-44" />
          <Select aria-label="Filtrar por estado" opciones={OPCIONES_ESTADO} value={estado} onChange={(e) => actualizar({ estado: e.target.value })} className="lg:w-44" />
        </div>
        {/* En el celular el botón queda fijo abajo (Figma, vista móvil) */}
        <div className="fixed bottom-0 inset-x-0 p-4 bg-fondo/90 backdrop-blur border-t border-gray-800 z-30 md:static md:p-0 md:bg-transparent md:border-0 md:backdrop-blur-none lg:ml-auto">
          <Link
            to="/admin/usuarios/nuevo"
            className="font-outfit font-semibold bg-viper hover:bg-viper-hover text-black px-6 py-3 rounded-lg text-center block transition-colors"
          >
            Crear cuenta de personal
          </Link>
        </div>
      </div>

      {error ? (
        <Alert variante="error" titulo="No pudimos cargar los usuarios">
          {error}{' '}
          <button type="button" onClick={() => setReintento((n) => n + 1)} className="underline font-semibold cursor-pointer">
            Reintentar
          </button>
        </Alert>
      ) : !datos ? (
        <div className="py-16 flex justify-center">
          <Spinner texto="Cargando usuarios" />
        </div>
      ) : datos.usuarios.length === 0 ? (
        <SinResultados hayFiltros={hayFiltros} onLimpiar={limpiarFiltros} />
      ) : (
        <div className={`flex flex-col gap-3 transition-opacity ${cargando ? 'opacity-60' : ''}`} aria-busy={cargando}>
          <div className="hidden md:grid grid-cols-[minmax(0,1fr)_12rem_10rem_2rem] gap-x-4 px-6 text-xs font-bold uppercase tracking-wide text-texto-suave">
            <span>Usuario</span>
            <span>Rol</span>
            <span>Estado</span>
          </div>
          <ul className="flex flex-col gap-3">
            {datos.usuarios.map((usuario) => (
              <FilaUsuario key={usuario.id} usuario={usuario} busqueda={search} />
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-2">
            <p className="text-sm text-texto-suave" aria-live="polite">
              Mostrando {datos.usuarios.length} de {datos.total} {datos.total === 1 ? 'usuario' : 'usuarios'}
            </p>
            {datos.totalPaginas > 1 && (
              <nav aria-label="Paginación" className="flex items-center gap-3">
                <Button variante="neutro" disabled={pagina <= 1} onClick={() => actualizar({ ...Object.fromEntries(parametros), pagina: String(pagina - 1) })} className="text-sm">
                  Anterior
                </Button>
                <span className="text-sm text-texto-suave tabular-nums">
                  Página {pagina} de {datos.totalPaginas}
                </span>
                <Button variante="neutro" disabled={pagina >= datos.totalPaginas} onClick={() => actualizar({ ...Object.fromEntries(parametros), pagina: String(pagina + 1) })} className="text-sm">
                  Siguiente
                </Button>
              </nav>
            )}
          </div>
        </div>
      )}
    </div>
  )
}