import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteDraft, GameDraft, getDrafts } from '../../data/drafts'

function AdminPage() {
  const [drafts, setDrafts] = useState<GameDraft[]>([])

  useEffect(() => {
    setDrafts(getDrafts())
  }, [])

  const handleDeleteDraft = (draftId: string) => {
    deleteDraft(draftId)
    setDrafts(getDrafts())
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
                  className="delete-draft-button"
                  type="button"
                  onClick={() => handleDeleteDraft(draft.id)}
                >
                  Удалить драфт
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
      </section>
    </main>
  )
}

export default AdminPage
