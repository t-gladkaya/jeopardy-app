import { useNavigate } from 'react-router-dom'

export const StartButton = () => {
  const navigate = useNavigate()

  return (
    <button className="start-button" type="button" onClick={() => navigate('/teams')}>
      Начать игру
    </button>
  )
}
