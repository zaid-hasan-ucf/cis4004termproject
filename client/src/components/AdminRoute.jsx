import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export default function AdminRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/" replace />
  if (user.role !== 'admin') return <Navigate to="/home" replace />
  return children
}
