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
import ListadoUsuarios from './features/privado/usuarios/views/ListadoUsuarios'
import NuevoPersonal from './features/privado/usuarios/views/NuevoPersonal'
import DetalleUsuario from './features/privado/usuarios/views/DetalleUsuario'
import GestionTorneos from './features/privado/torneos/views/GestionTorneos'
import TorneosJugador from './features/privado/torneos/views/TorneosJugador'
import Inscripciones from './features/privado/torneos/views/Inscripciones'
import InscriptosTorneo from './features/privado/torneos/views/InscriptosTorneo'
import FormularioTorneo from './features/privado/torneos/views/FormularioTorneo'
import FichaTorneo from './features/privado/torneos/views/FichaTorneo'
import CabezasDeSerie from './features/privado/torneos/views/CabezasDeSerie'
import GenerarCuadro from './features/privado/torneos/views/GenerarCuadro'
import ProgramarPartido from './features/privado/torneos/views/ProgramarPartido'
import CargarResultado from './features/privado/torneos/views/CargarResultado'
import FichaTorneoJugador from './features/privado/torneos/views/FichaTorneoJugador'
import InscripcionTorneo from './features/privado/torneos/views/InscripcionTorneo'
import RankingJugador from './features/privado/ranking/views/RankingJugador'
import DemoUI from './features/privado/demo/views/DemoUI'
import AppLayout from './features/privado/layout/AppLayout'
import { PANTALLAS } from './features/privado/layout/navegacion'

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
          </Route>
          <Route element={<RequireRol roles={PANTALLAS.inscripciones.roles} />}>
            <Route path="gestion/inscripciones" element={<Inscripciones />} />
            <Route path="gestion/inscripciones/:id" element={<InscriptosTorneo />} />
          </Route>
          <Route element={<RequireRol roles={PANTALLAS.gestionTorneos.roles} />}>
            <Route path="gestion/torneos" element={<GestionTorneos />} />
            <Route path="gestion/torneos/nuevo" element={<FormularioTorneo />} />
            <Route path="gestion/torneos/:id/editar" element={<FormularioTorneo />} />
            <Route path="gestion/torneos/:id" element={<FichaTorneo />} />
            <Route path="gestion/torneos/:id/cabezas-de-serie" element={<CabezasDeSerie />} />
            <Route path="gestion/torneos/:id/generar-cuadro" element={<GenerarCuadro />} />
            <Route path="gestion/torneos/:id/partidos/:partidoId/programar" element={<ProgramarPartido />} />
            <Route path="gestion/torneos/:id/partidos/:partidoId/resultado" element={<CargarResultado />} />
          </Route>
          <Route element={<RequireRol roles={PANTALLAS.usuarios.roles} />}>
            <Route path="admin/usuarios" element={<ListadoUsuarios />} />
            <Route path="admin/usuarios/nuevo" element={<NuevoPersonal />} />
            <Route path="admin/usuarios/:id" element={<DetalleUsuario />} />
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