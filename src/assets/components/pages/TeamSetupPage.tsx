import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { resetCompletedClues } from '../../data/drafts'
import { createDefaultTeams, getTeams, saveTeams } from '../../data/teams'
import type { Team } from '../../data/teams'

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error) {
    return error.message
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    return typeof message === 'string' ? message : fallback
  }

  return fallback
}

function TeamSetupPage() {
  const navigate = useNavigate()
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isScoreReset, setIsScoreReset] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadTeams = async () => {
      try {
        const savedTeams = await getTeams()
        const nextTeams = savedTeams.length > 0 ? savedTeams : createDefaultTeams()

        setTeams(nextTeams)

        if (savedTeams.length === 0) {
          await saveTeams(nextTeams)
        }
      } catch (loadError) {
        setError(getErrorMessage(loadError, 'Не удалось загрузить команды.'))
        setTeams(createDefaultTeams())
      } finally {
        setIsLoading(false)
      }
    }

    void loadTeams()
  }, [])

  useEffect(() => {
    if (isLoading || isSaving || teams.length === 0) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void saveTeams(teams)
        .then(() => setError(''))
        .catch((saveError) => {
          setError(getErrorMessage(saveError, 'Не удалось сохранить команды.'))
        })
    }, 500)

    return () => window.clearTimeout(timeoutId)
  }, [isLoading, isSaving, teams])

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

  const handleResetScores = async () => {
    const nextTeams = teams.map((team) => ({
      ...team,
      score: 0,
    }))

    setIsSaving(true)
    setError('')
    setTeams(nextTeams)

    try {
      await saveTeams(nextTeams)
      await resetCompletedClues()
      setIsScoreReset(true)
    } catch (resetError) {
      setError(getErrorMessage(resetError, 'Не удалось сбросить счет.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleStartRound = async () => {
    const normalizedTeams = teams.map((team, index) => ({
      ...team,
      name: team.name.trim() || `Команда ${index + 1}`,
    }))

    setIsSaving(true)
    setError('')
    setTeams(normalizedTeams)

    try {
      await saveTeams(normalizedTeams)
      navigate('/game/round/1')
    } catch (saveError) {
      setError(getErrorMessage(saveError, 'Не удалось сохранить команды.'))
    } finally {
      setIsSaving(false)
    }
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
              disabled={isLoading || isSaving}
              type="button"
              onClick={() => void handleResetScores()}
            >
              {isScoreReset ? 'Счет сброшен' : 'Сбросить счет'}
            </button>
            <button
              className="save-draft-button"
              disabled={isLoading || isSaving || teams.length === 0}
              type="button"
              onClick={() => void handleStartRound()}
            >
              {isSaving ? 'Сохранение...' : 'Далее'}
            </button>
          </div>
        </header>

        <div className="teams-content">
          <p className="landing-kicker">Перед началом</p>
          <h1 id="teams-title">Создайте команды</h1>

          {isLoading && <p className="media-error">Загрузка команд...</p>}
          {error && <p className="media-error">{error}</p>}

          {!isLoading && (
            <>
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
            </>
          )}
        </div>
      </section>
    </main>
  )
}

export default TeamSetupPage
