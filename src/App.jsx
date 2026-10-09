import { Routes, Route, Navigate } from 'react-router-dom'
import PublicLayout from './features/public/components/PublicLayout'
import Landing from './features/public/views/Landing'
import ReservasInfo from './features/public/views/ReservasInfo'
import TorneosInfo from './features/public/views/TorneosInfo'
import RankingInfo from './features/public/views/RankingInfo'
import TiendaInfo from './features/public/views/TiendaInfo'

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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
