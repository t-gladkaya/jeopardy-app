import { Route, Routes } from 'react-router-dom'
import AdminPage from '../components/pages/AdminPage'
import CreateGamePage from '../components/pages/CreateGamePage'
import LandingPage from '../components/pages/LandingPage'

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/create" element={<CreateGamePage />} />
      <Route path="/admin/create/:draftId" element={<CreateGamePage />} />
    </Routes>
  )
}

export default AppRouter
