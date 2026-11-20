import { Routes, Route, Navigate } from 'react-router-dom'
import PublicLayout from './features/public/components/PublicLayout'
import Landing from './features/public/views/Landing'
import ReservasInfo from './features/public/views/ReservasInfo'
import TorneosInfo from './features/public/views/TorneosInfo'
import RankingInfo from './features/public/views/RankingInfo'
import TiendaInfo from './features/public/views/TiendaInfo'

import Login from './features/privado/auth/views/Login'
import Registro from './features/privado/auth/views/Registro'
import RequireAuth from './features/privado/auth/components/RequireAuth'
import RequireRol from './features/privado/auth/components/RequireRol'
import MiPerfil from './features/privado/perfil/views/MiPerfil'
import EditarPerfil from './features/privado/perfil/views/EditarPerfil'
import CanchasYTarifas from './features/privado/canchas/views/CanchasYTarifas'
import EditarCancha from './features/privado/canchas/views/EditarCancha'
import NuevaCancha from './features/privado/canchas/views/NuevaCancha'
import ListadoUsuarios from './features/privado/usuarios/views/ListadoUsuarios'
import NuevoPersonal from './features/privado/usuarios/views/NuevoPersonal'
import DetalleUsuario from './features/privado/usuarios/views/DetalleUsuario'
import GestionTorneos from './features/privado/torneos/views/GestionTorneos'
import TorneosJugador from './features/privado/torneos/views/TorneosJugador'
import Reservas from './features/privado/reservas/views/Reservas'
import NuevaReserva from './features/privado/reservas/views/NuevaReserva'
import ReservasClub from './features/privado/reservas/views/ReservasClub'
import NuevoTurnoDirecto from './features/privado/reservas/views/NuevoTurnoDirecto'
import AlquileresFijos from './features/privado/reservas/views/AlquileresFijos'
import NuevoAlquilerFijo from './features/privado/reservas/views/NuevoAlquilerFijo'
import DetalleAlquilerFijo from './features/privado/reservas/views/DetalleAlquilerFijo'
import Calendario from './features/privado/calendario/views/Calendario'
import Inscripciones from './features/privado/torneos/views/Inscripciones'
import InscriptosTorneo from './features/privado/torneos/views/InscriptosTorneo'
import FormularioTorneo from './features/privado/torneos/views/FormularioTorneo'
import FichaTorneo from './features/privado/torneos/views/FichaTorneo'
import CabezasDeSerie from './features/privado/torneos/views/CabezasDeSerie'
import GenerarCuadro from './features/privado/torneos/views/GenerarCuadro'
import ArchivarTorneo from './features/privado/torneos/views/ArchivarTorneo'
import GenerarFaseEliminatoria from './features/privado/torneos/views/GenerarFaseEliminatoria'
import ProgramarPartido from './features/privado/torneos/views/ProgramarPartido'
import CargarResultado from './features/privado/torneos/views/CargarResultado'
import RegistrarWO from './features/privado/torneos/views/RegistrarWO'
import FichaTorneoJugador from './features/privado/torneos/views/FichaTorneoJugador'
import InscripcionTorneo from './features/privado/torneos/views/InscripcionTorneo'
import RankingJugador from './features/privado/ranking/views/RankingJugador'
import DetalleJugadorRanking from './features/privado/ranking/views/DetalleJugadorRanking'
import ReglasPuntuacion from './features/privado/ranking/views/ReglasPuntuacion'
import ModificarRegla from './features/privado/ranking/views/ModificarRegla'
import Socios from './features/privado/socios/views/Socios'
import RegistrarSocio from './features/privado/socios/views/RegistrarSocio'
import DetalleSocio from './features/privado/socios/views/DetalleSocio'
import Tienda from './features/privado/tienda/views/Tienda'
import Caja from './features/privado/caja/views/Caja'
import NuevoProducto from './features/privado/tienda/views/NuevoProducto'
import EditarProducto from './features/privado/tienda/views/EditarProducto'

import DemoUI from './features/privado/demo/views/DemoUI'
import AppLayout from './features/privado/layout/AppLayout'
import { PANTALLAS } from './features/privado/layout/navegacion'
import TiendaJugador from './features/privado/tiendaJugador/views/TiendaJugador'
import DetalleProducto from './features/privado/tiendaJugador/views/DetalleProducto'

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Landing />} />
        <Route path="reservas" element={<ReservasInfo />} />
        <Route path="torneos" element={<TorneosInfo />} />
        <Route path="ranking" element={<RankingInfo />} />
        <Route path="tienda" element={<TiendaInfo />} />
      </Route>

      {/* Acceso */}
      <Route path="login" element={<Login />} />
      <Route path="registro" element={<Registro />} />

      {/* Rutas privadas: sin sesión llevan a /login; cada grupo exige sus roles (Anexo C) */}
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="perfil" element={<MiPerfil />} />
          <Route path="perfil/editar" element={<EditarPerfil />} />
          <Route element={<RequireRol roles={PANTALLAS.torneos.roles} />}>
            <Route path="portal/torneos" element={<TorneosJugador />} />
            <Route path="portal/torneos/:id" element={<FichaTorneoJugador />} />
            <Route path="portal/torneos/:id/inscripcion" element={<InscripcionTorneo />} />
          </Route>
          <Route element={<RequireRol roles={PANTALLAS.ranking.roles} />}>
            <Route path="portal/ranking" element={<RankingJugador />} />
            <Route path="portal/ranking/:disciplina/:jugadorId" element={<DetalleJugadorRanking />} />
          </Route>
          <Route element={<RequireRol roles={PANTALLAS.reservas.roles} />}>
            <Route path="portal/reservas" element={<Reservas />} />
            <Route path="portal/reservas/nueva" element={<NuevaReserva />} />
          </Route>
          <Route element={<RequireRol roles={PANTALLAS.tiendaJugador.roles} />}>
            <Route path="portal/tienda" element={<TiendaJugador />} />
            <Route path="portal/tienda/:id" element={<DetalleProducto />} />
          </Route>
          <Route element={<RequireRol roles={PANTALLAS.reservasClub.roles} />}>
            <Route path="gestion/reservas" element={<ReservasClub />} />
            <Route path="gestion/reservas/nueva" element={<NuevoTurnoDirecto />} />
            <Route path="gestion/alquileres-fijos" element={<AlquileresFijos />} />
            <Route path="gestion/alquileres-fijos/nuevo" element={<NuevoAlquilerFijo />} />
            <Route path="gestion/alquileres-fijos/:id" element={<DetalleAlquilerFijo />} />
          </Route>
          <Route element={<RequireRol roles={PANTALLAS.inscripciones.roles} />}>
            <Route path="gestion/inscripciones" element={<Inscripciones />} />
            <Route path="gestion/inscripciones/:id" element={<InscriptosTorneo />} />
          </Route>
          <Route element={<RequireRol roles={PANTALLAS.calendario.roles} />}>
            <Route path="gestion/calendario" element={<Calendario />} />
          </Route>
          <Route element={<RequireRol roles={PANTALLAS.socios.roles} />}>
            <Route path="gestion/socios" element={<Socios />} />
            <Route path="gestion/socios/nuevo" element={<RegistrarSocio />} />
            <Route path="gestion/socios/:id" element={<DetalleSocio />} />
          </Route>
          <Route element={<RequireRol roles={PANTALLAS.tienda.roles} />}>
            <Route path="gestion/tienda" element={<Tienda />} />
          </Route>
          {/* Alta y edición de productos: solo el Administrador (el Recepcionista usa el punto de venta) */}
          <Route element={<RequireRol roles={['ADMINISTRADOR']} />}>
            <Route path="gestion/tienda/productos/nuevo" element={<NuevoProducto />} />
            <Route path="gestion/tienda/productos/:id/editar" element={<EditarProducto />} />
          </Route>
          <Route element={<RequireRol roles={PANTALLAS.caja.roles} />}>
            <Route path="gestion/caja" element={<Caja />} />
          </Route>
          <Route element={<RequireRol roles={PANTALLAS.reglasPuntuacion.roles} />}>
            <Route path="gestion/reglas-puntuacion" element={<ReglasPuntuacion />} />
            <Route path="gestion/reglas-puntuacion/:disciplina/:instancia/modificar" element={<ModificarRegla />} />
          </Route>
          <Route element={<RequireRol roles={PANTALLAS.gestionTorneos.roles} />}>
            <Route path="gestion/torneos" element={<GestionTorneos />} />
            <Route path="gestion/torneos/nuevo" element={<FormularioTorneo />} />
            <Route path="gestion/torneos/:id/editar" element={<FormularioTorneo />} />
            <Route path="gestion/torneos/:id" element={<FichaTorneo />} />
            <Route path="gestion/torneos/:id/cabezas-de-serie" element={<CabezasDeSerie />} />
            <Route path="gestion/torneos/:id/generar-cuadro" element={<GenerarCuadro />} />
            <Route path="gestion/torneos/:id/fase-eliminatoria" element={<GenerarFaseEliminatoria />} />
            <Route path="gestion/torneos/:id/partidos/:partidoId/programar" element={<ProgramarPartido />} />
            <Route path="gestion/torneos/:id/partidos/:partidoId/resultado" element={<CargarResultado key="resultado" />} />
            <Route path="gestion/torneos/:id/partidos/:partidoId/corregir-resultado" element={<CargarResultado key="corregir" corrigiendo />} />
            <Route path="gestion/torneos/:id/partidos/:partidoId/wo" element={<RegistrarWO />} />
          </Route>
          <Route element={<RequireRol roles={['ADMINISTRADOR']} />}>
            <Route path="gestion/torneos/:id/archivar" element={<ArchivarTorneo />} />
          </Route>
          <Route element={<RequireRol roles={PANTALLAS.usuarios.roles} />}>
            <Route path="admin/usuarios" element={<ListadoUsuarios />} />
            <Route path="admin/usuarios/nuevo" element={<NuevoPersonal />} />
            <Route path="admin/usuarios/:id" element={<DetalleUsuario />} />
          </Route>
          <Route element={<RequireRol roles={PANTALLAS.canchas.roles} />}>
            <Route path="admin/canchas" element={<CanchasYTarifas />} />
            <Route path="admin/canchas/nueva" element={<NuevaCancha />} />
            <Route path="admin/canchas/:id/editar" element={<EditarCancha />} />
          </Route>
        </Route>
      </Route>

      {/* Página de prueba de componentes (se borra más adelante) */}
      <Route path="demo-ui" element={<DemoUI />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App