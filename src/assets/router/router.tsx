import { Route, Routes } from 'react-router-dom'
import AdminPage from '../components/pages/AdminPage'
import CreateGamePage from '../components/pages/CreateGamePage'
import LandingPage from '../components/pages/LandingPage'
import RoundPage from '../components/pages/RoundPage'
import TeamSetupPage from '../components/pages/TeamSetupPage'

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/teams" element={<TeamSetupPage />} />
      <Route path="/game/round-1" element={<RoundPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/create" element={<CreateGamePage />} />
      <Route path="/admin/create/:draftId" element={<CreateGamePage />} />
    </Routes>
  )
}

export default AppRouter
