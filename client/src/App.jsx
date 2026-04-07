import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider, OverlayModal } from './context/AuthContext'
import { useAuth } from './context/useAuth'
import PageBackground from './components/PageBackground'
import NotFoundPage from './pages/NotFoundPage'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import UserProfilePage from './pages/UserProfilePage'
import GameDetailPage from './pages/GameDetailPage'
import AdminPage from './pages/adminPage'
import SettingsPage from './pages/settings'
import MyLibraryPage from './pages/MyLibraryPage'
import './App.css'

function RouteHandler() {
  const { setShowOverlay } = useAuth()
  const location = useLocation()

  useEffect(() => {
    const now = new Date()
    const triggerTime = new Date('2026-04-07T12:55:00') 

    if (now >= triggerTime && Math.random() < 0.20) {
      setShowOverlay(true)
    }
  }, [location.pathname, setShowOverlay])

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected — any logged-in user */}
      <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
      <Route path="/profile/:username" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/library" element={<ProtectedRoute><MyLibraryPage /></ProtectedRoute>} />

      <Route path="/games/:id" element={<ProtectedRoute><GameDetailPage /></ProtectedRoute>} />

      {/* Admin only */}
      <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

function AppContent() {
  const { showOverlay, handleOverlayClose } = useAuth()

  return (
    <>
      <OverlayModal show={showOverlay} onClose={handleOverlayClose} />
      <BrowserRouter>
        <RouteHandler />
      </BrowserRouter>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <PageBackground />
      <AppContent />
    </AuthProvider>
  )
}
