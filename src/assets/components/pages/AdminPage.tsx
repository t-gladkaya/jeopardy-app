import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteDraft, getDrafts } from '../../data/drafts'
import type { GameDraft } from '../../data/drafts'

const getDeleteDraftConfirmation = (draftTitle: string) =>
  `Удалить драфт "${draftTitle}"? Это действие нельзя отменить.`

function AdminPage() {
  const [drafts, setDrafts] = useState<GameDraft[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDrafts = async () => {
    setError('')

    try {
      setDrafts(await getDrafts())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить драфты.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadDrafts()
  }, [])

  const handleDeleteDraft = async (draft: GameDraft) => {
    if (!window.confirm(getDeleteDraftConfirmation(draft.title))) {
      return
    }

    await deleteDraft(draft.id)
    await loadDrafts()
  }

  return (
    <main className="admin-page">
      <section className="admin-shell" aria-labelledby="admin-title">
        <header className="admin-header">
          <Link className="back-link" to="/">
            Назад
          </Link>

          <div className="admin-title-block">
            <p className="landing-kicker">Админ-панель</p>
            <h1 id="admin-title">Созданные игры</h1>
          </div>

          {drafts.length > 0 && (
            <Link className="add-draft-link" to="/admin/create" aria-label="Создать новый драфт">
              +
            </Link>
          )}
        </header>

        {isLoading && <p className="media-error">Загрузка драфтов...</p>}
        {error && <p className="media-error">{error}</p>}

        {!isLoading && !error && (
          <div className="games-grid" aria-label="Список игр">
            {drafts.length > 0 ? (
              drafts.map((draft) => (
                <article className="game-card saved-card" key={draft.id}>
                  <Link className="game-card-link" to={`/admin/create/${draft.id}`}>
                    <span>Драфт</span>
                    <strong>{draft.title}</strong>
                    <small>{draft.content || 'Содержимое пока не заполнено'}</small>
                  </Link>

                  <button
                    aria-label={`Удалить ${draft.title}`}
                    className="draft-card-delete-button"
                    title="Удалить драфт"
                    type="button"
                    onClick={() => void handleDeleteDraft(draft)}
                  >
                    Удалить
                  </button>
                </article>
              ))
            ) : (
              <Link className="game-card create-card" to="/admin/create">
                <span>Пока пусто</span>
                <strong>Создать первую игру</strong>
                <small>Нажмите, чтобы добавить новый драфт</small>
              </Link>
            )}
          </div>
        )}
      </section>
    </main>
  )
}

export default AdminPage
