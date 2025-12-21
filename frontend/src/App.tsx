import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import TellsPage from './pages/TellsPage'
import MissionsPage from './pages/MissionsPage'
import GuessingPage from './pages/GuessingPage'
import AdminPage from './pages/AdminPage'
import PrizesPage from './pages/PrizesPage'

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { isLoggedIn, player } = useAuthStore()

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && !player?.isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export default function App() {
  const { isLoggedIn } = useAuthStore()

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tells"
          element={
            <ProtectedRoute>
              <TellsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/missions"
          element={
            <ProtectedRoute>
              <MissionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/guessing"
          element={
            <ProtectedRoute>
              <GuessingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/prizes"
          element={
            <ProtectedRoute>
              <PrizesPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to={isLoggedIn ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}
