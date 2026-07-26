import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteDraft, getDraftById, getNextDraftTitle, saveDraft } from '../../data/drafts'

function CreateGamePage() {
  const { draftId } = useParams()
  const navigate = useNavigate()
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>(draftId)
  const [title, setTitle] = useState(getNextDraftTitle)
  const [content, setContent] = useState('')

  useEffect(() => {
    if (!draftId) {
      setCurrentDraftId(undefined)
      setTitle(getNextDraftTitle())
      setContent('')
      return
    }

    const savedDraft = getDraftById(draftId)

    if (!savedDraft) {
      navigate('/admin', { replace: true })
      return
    }

    setCurrentDraftId(savedDraft.id)
    setTitle(savedDraft.title)
    setContent(savedDraft.content)
  }, [draftId, navigate])

  const handleSaveDraft = () => {
    const savedDraft = saveDraft({
      content,
      id: currentDraftId,
      title: title.trim() || getNextDraftTitle(),
    })

    setCurrentDraftId(savedDraft.id)
    navigate('/admin')
  }

  const handleDeleteDraft = () => {
    if (currentDraftId) {
      deleteDraft(currentDraftId)
    }

    navigate('/admin')
  }

  return (
    <main className="admin-page">
      <section className="admin-shell create-shell" aria-labelledby="create-title">
        <header className="create-header">
          <Link className="back-link" to="/admin">
            Назад
          </Link>

          <div className="draft-actions">
            <button className="save-draft-button" type="button" onClick={handleSaveDraft}>
              Сохранить драфт
            </button>
            <button className="delete-draft-button" type="button" onClick={handleDeleteDraft}>
              Удалить драфт
            </button>
          </div>
        </header>

        <div className="create-content">
          <p className="landing-kicker">Конструктор</p>
          <h1 id="create-title">{title}</h1>
          <p className="landing-text">Здесь позже появится полноценная форма создания игры.</p>

          <label className="draft-field">
            <span>Название драфта</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>

          <label className="draft-field">
            <span>Содержимое драфта</span>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Например: категории, вопросы или заметки к раунду"
            />
          </label>
        </div>
      </section>
    </main>
  )
}

export default CreateGamePage
