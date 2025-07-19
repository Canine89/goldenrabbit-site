import { useAuth } from '../../contexts/AuthContext'

const AdminGuard = ({ children, fallback = null }) => {
  const { profile } = useAuth()

  if (profile?.role !== 'admin') {
    return fallback
  }

  return children
}

export default AdminGuard