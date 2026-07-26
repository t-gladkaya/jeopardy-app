import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { resetCompletedClues } from '../../data/drafts'
import { createDefaultTeams, getTeams, saveTeams, Team } from '../../data/teams'

const getInitialTeams = () => {
  const savedTeams = getTeams()
  return savedTeams.length > 0 ? savedTeams : createDefaultTeams()
}

function TeamSetupPage() {
  const navigate = useNavigate()
  const [teams, setTeams] = useState<Team[]>(getInitialTeams)
  const [isScoreReset, setIsScoreReset] = useState(false)

  useEffect(() => {
    if (!isScoreReset) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setIsScoreReset(false)
    }, 1800)

    return () => window.clearTimeout(timeoutId)
  }, [isScoreReset])

  const handleTeamNameChange = (teamId: string, name: string) => {
    setTeams((currentTeams) =>
      currentTeams.map((team) => (team.id === teamId ? { ...team, name } : team)),
    )
  }

  const handleAddTeam = () => {
    setTeams((currentTeams) => [
      ...currentTeams,
      {
        id: crypto.randomUUID(),
        name: `Команда ${currentTeams.length + 1}`,
        score: 0,
      },
    ])
  }

  const handleRemoveTeam = (teamId: string) => {
    setTeams((currentTeams) => currentTeams.filter((team) => team.id !== teamId))
  }

  const handleResetScores = () => {
    const nextTeams = teams.map((team) => ({
      ...team,
      score: 0,
    }))

    setTeams(nextTeams)
    saveTeams(nextTeams)
    resetCompletedClues()
    setIsScoreReset(true)
  }

  const handleStartRound = () => {
    const normalizedTeams = teams.map((team, index) => ({
      ...team,
      name: team.name.trim() || `Команда ${index + 1}`,
    }))

    saveTeams(normalizedTeams)
    navigate('/game/round/1')
  }

  return (
    <main className="admin-page">
      <section className="admin-shell teams-shell" aria-labelledby="teams-title">
        <header className="create-header">
          <Link className="back-link" to="/">
            Назад
          </Link>

          <div className="draft-actions">
            <button
              className={`delete-draft-button reset-score-button${isScoreReset ? ' is-confirmed' : ''}`}
              type="button"
              onClick={handleResetScores}
            >
              {isScoreReset ? 'Счёт сброшен' : 'Сбросить счёт'}
            </button>
            <button className="save-draft-button" type="button" onClick={handleStartRound}>
              Далее
            </button>
          </div>
        </header>

        <div className="teams-content">
          <p className="landing-kicker">Перед началом</p>
          <h1 id="teams-title">Создайте команды</h1>

          <div className="teams-list" aria-label="Список команд">
            {teams.map((team, index) => (
              <label className="team-card" key={team.id}>
                <span>Команда {index + 1}</span>
                <div>
                  <input
                    value={team.name}
                    onChange={(event) => handleTeamNameChange(team.id, event.target.value)}
                  />
                  {teams.length > 2 && (
                    <button type="button" onClick={() => handleRemoveTeam(team.id)}>
                      Удалить
                    </button>
                  )}
                </div>
              </label>
            ))}
          </div>

          <button className="add-team-button" type="button" onClick={handleAddTeam}>
            Добавить команду
          </button>
        </div>
      </section>
    </main>
  )
}

export default TeamSetupPage
