import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  CLUE_LEVELS,
  getCategoryPlaceholder,
  getClueKey,
  getCompletedClues,
  getDrafts,
  saveCompletedClues,
} from '../../data/drafts'
import type { ClueDraft, ClueLevel, GameDraft } from '../../data/drafts'
import { createDefaultTeams, getTeams, saveTeamScores } from '../../data/teams'
import type { Team } from '../../data/teams'

type SelectedClue = {
  categoryIndex: number
  clue: ClueDraft
  level: ClueLevel
}

function RoundPage() {
  const { roundNumber = '1' } = useParams()
  const navigate = useNavigate()
  const roundIndex = Math.max(Number(roundNumber) - 1, 0)
  const [drafts, setDrafts] = useState<GameDraft[]>([])
  const [draft, setDraft] = useState<GameDraft | undefined>()
  const [teams, setTeams] = useState<Team[]>([])
  const [completedClues, setCompletedClues] = useState<string[]>([])
  const [selectedClue, setSelectedClue] = useState<SelectedClue | null>(null)
  const [isAnswerVisible, setIsAnswerVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const totalCluesCount = CLUE_LEVELS.length * (draft?.categories.length ?? 0)
  const isRoundComplete = Boolean(draft && completedClues.length >= totalCluesCount)
  const nextRoundNumber = roundIndex + 2
  const hasNextRound = nextRoundNumber <= drafts.length

  useEffect(() => {
    const loadRound = async () => {
      setIsLoading(true)
      setError('')
      setSelectedClue(null)
      setCompletedClues([])

      try {
        const [savedDrafts, savedTeams] = await Promise.all([getDrafts(), getTeams()])
        const currentDraft = savedDrafts[roundIndex]

        setDrafts(savedDrafts)
        setDraft(currentDraft)
        setTeams(savedTeams.length > 0 ? savedTeams : createDefaultTeams())

        if (currentDraft) {
          setCompletedClues(await getCompletedClues(currentDraft.id))
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить раунд.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadRound()
  }, [roundIndex])

  useEffect(() => {
    if (!selectedClue) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault()
        setIsAnswerVisible(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedClue])

  const updateTeams = async (nextTeams: Team[]) => {
    setTeams(nextTeams)
    await saveTeamScores(nextTeams)
  }

  const handleScoreChange = (teamId: string, score: string) => {
    const parsedScore = Number(score)
    const nextTeams = teams.map((team) =>
      team.id === teamId ? { ...team, score: Number.isNaN(parsedScore) ? 0 : parsedScore } : team,
    )

    setTeams(nextTeams)
    void saveTeamScores(nextTeams).catch((saveError) => {
      setError(saveError instanceof Error ? saveError.message : 'Не удалось сохранить счет.')
    })
  }

  const markClueCompleted = async (clueKey: string) => {
    if (!draft) {
      return
    }

    const nextCompletedClues = completedClues.includes(clueKey)
      ? completedClues
      : [...completedClues, clueKey]

    setCompletedClues(nextCompletedClues)
    await saveCompletedClues(draft.id, nextCompletedClues)
  }

  const handleOpenClue = (categoryIndex: number, level: ClueLevel) => {
    if (!draft) {
      return
    }

    const clueKey = getClueKey(categoryIndex, level)

    if (completedClues.includes(clueKey)) {
      return
    }

    setSelectedClue({
      categoryIndex,
      clue: draft.clues[clueKey] ?? { answer: '', question: '' },
      level,
    })
    setIsAnswerVisible(false)
  }

  const handleAwardPoints = async (teamId: string) => {
    if (!selectedClue) {
      return
    }

    const nextTeams = teams.map((team) =>
      team.id === teamId ? { ...team, score: team.score + selectedClue.level } : team,
    )

    try {
      await updateTeams(nextTeams)
      await markClueCompleted(getClueKey(selectedClue.categoryIndex, selectedClue.level))
      setSelectedClue(null)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Не удалось сохранить результат.')
    }
  }

  const handleSkipClue = async () => {
    if (!selectedClue) {
      return
    }

    try {
      await markClueCompleted(getClueKey(selectedClue.categoryIndex, selectedClue.level))
      setSelectedClue(null)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Не удалось сохранить ячейку.')
    }
  }

  if (isLoading) {
    return (
      <main className="round-page">
        <section className="round-empty-state" aria-labelledby="round-title">
          <p className="landing-kicker">Загрузка</p>
          <h1 id="round-title">Готовим раунд...</h1>
        </section>
      </main>
    )
  }

  if (!draft) {
    return (
      <main className="round-page">
        <section className="round-empty-state" aria-labelledby="round-title">
          <Link className="back-link" to="/admin">
            К драфтам
          </Link>
          <p className="landing-kicker">Раунд не найден</p>
          <h1 id="round-title">Нет сохраненного драфта</h1>
          {error && <p className="media-error">{error}</p>}
        </section>
      </main>
    )
  }

  return (
    <main className="round-page">
      <section className="round-layout" aria-labelledby="round-kicker">
        <header className="round-header">
          <Link className="back-link" to="/teams">
            Назад
          </Link>

          <div>
            <p className="landing-kicker" id="round-kicker">
              {draft.title}
            </p>
          </div>

          {isRoundComplete && (
            <button
              className="save-draft-button"
              type="button"
              onClick={() => navigate(hasNextRound ? `/game/round/${nextRoundNumber}` : '/admin')}
            >
              {hasNextRound ? 'Следующий раунд' : 'Завершить игру'}
            </button>
          )}
        </header>

        {error && <p className="media-error">{error}</p>}

        <div className="round-scoreboard" aria-label="Счет команд">
          {teams.map((team) => (
            <label className="round-team-score" key={team.id}>
              <span>{team.name}</span>
              <input
                aria-label={`Баллы команды ${team.name}`}
                inputMode="numeric"
                type="number"
                value={team.score}
                onChange={(event) => handleScoreChange(team.id, event.target.value)}
              />
            </label>
          ))}
        </div>

        <section className="play-board" aria-label="Таблица раунда">
          <div className="play-category-row">
            {draft.categories.map((category, categoryIndex) => (
              <div className="play-category" key={categoryIndex}>
                {category || getCategoryPlaceholder(categoryIndex)}
              </div>
            ))}
          </div>

          <div className="play-levels-grid">
            {CLUE_LEVELS.flatMap((level) =>
              draft.categories.map((_, categoryIndex) => {
                const clueKey = getClueKey(categoryIndex, level)
                const isCompleted = completedClues.includes(clueKey)

                return (
                  <button
                    className={`play-level-tile${isCompleted ? ' completed' : ''}`}
                    key={clueKey}
                    type="button"
                    onClick={() => handleOpenClue(categoryIndex, level)}
                  >
                    {!isCompleted && level}
                  </button>
                )
              }),
            )}
          </div>
        </section>
      </section>

      {selectedClue && (
        <section className="clue-modal" aria-labelledby="clue-modal-title" role="dialog">
          <div className="clue-modal-content">
            <button className="clue-close-button" type="button" onClick={() => setSelectedClue(null)}>
              Закрыть
            </button>

            <p className="landing-kicker">
              {draft.categories[selectedClue.categoryIndex] ||
                getCategoryPlaceholder(selectedClue.categoryIndex)}{' '}
              за {selectedClue.level}
            </p>

            {selectedClue.clue.mediaUrl && (
              <img
                className="clue-modal-media"
                alt={selectedClue.clue.mediaName || 'Медиа вопроса'}
                src={selectedClue.clue.mediaUrl}
              />
            )}

            <p className="clue-question">
              {selectedClue.clue.question || 'Вопрос для этой клетки пока не заполнен.'}
            </p>

            {isAnswerVisible ? (
              <div className="clue-answer">
                <span>Правильный ответ</span>
                <strong>{selectedClue.clue.answer || 'Ответ пока не заполнен.'}</strong>
              </div>
            ) : (
              <p className="clue-hint">Нажмите пробел, чтобы показать правильный ответ</p>
            )}

            <div className="award-panel">
              <span>Начислить баллы</span>
              <div>
                {teams.map((team) => (
                  <button key={team.id} type="button" onClick={() => void handleAwardPoints(team.id)}>
                    {team.name} +{selectedClue.level}
                  </button>
                ))}
              </div>
              <button className="skip-clue-button" type="button" onClick={() => void handleSkipClue()}>
                Закрыть без баллов
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}

export default RoundPage
