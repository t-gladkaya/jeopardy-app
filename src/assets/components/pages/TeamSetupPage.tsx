import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createDefaultTeams, saveTeams, Team } from '../../data/teams'

function TeamSetupPage() {
  const navigate = useNavigate()
  const [teams, setTeams] = useState<Team[]>(createDefaultTeams)

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

  const handleStartRound = () => {
    const normalizedTeams = teams.map((team, index) => ({
      ...team,
      name: team.name.trim() || `Команда ${index + 1}`,
    }))

    saveTeams(normalizedTeams)
    navigate('/game/round-1')
  }

  return (
    <main className="admin-page">
      <section className="admin-shell teams-shell" aria-labelledby="teams-title">
        <header className="create-header">
          <Link className="back-link" to="/">
            Назад
          </Link>

          <button className="save-draft-button" type="button" onClick={handleStartRound}>
            Далее
          </button>
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
