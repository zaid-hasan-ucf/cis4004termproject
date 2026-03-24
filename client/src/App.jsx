import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
// import AdminRoute from './components/AdminRoute' — uncomment when AdminDashboardPage is built and if needed.
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import UserProfilePage from './pages/UserProfilePage'
import GameDetailPage from './pages/GameDetailPage'
import './App.css'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected — any logged-in user */}
          <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/profile/:username" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />

          <Route path="/games/:id" element={<ProtectedRoute><GameDetailPage /></ProtectedRoute>} />

          {/* TODO: uncomment as pages are built */}
          {/* <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} /> */}
          {/* <Route path="/library" element={<ProtectedRoute><MyLibraryPage /></ProtectedRoute>} /> */}
          {/* <Route path="/specs" element={<ProtectedRoute><PCSpecsPage /></ProtectedRoute>} /> */}

          {/* Admin only */}
          {/* <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} /> */}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
