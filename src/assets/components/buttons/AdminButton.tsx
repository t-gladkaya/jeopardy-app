import { useNavigate } from 'react-router-dom'

export const AdminButton = () => {
  const navigate = useNavigate()

  return (
    <button className="admin-button" type="button" onClick={() => navigate('/admin')}>
      Админ
    </button>
  )
}
