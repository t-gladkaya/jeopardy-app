import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  CLUE_LEVELS,
  ClueDraft,
  ClueLevel,
  createDefaultCategories,
  createEmptyClue,
  deleteDraft,
  getCategoryPlaceholder,
  getClueKey,
  getDraftById,
  getNextDraftTitle,
  isClueFilled,
  saveDraft,
} from '../../data/drafts'

function CreateGamePage() {
  const { draftId } = useParams()
  const navigate = useNavigate()
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>(draftId)
  const [title, setTitle] = useState(getNextDraftTitle)
  const [categories, setCategories] = useState(createDefaultCategories)
  const [clues, setClues] = useState<Record<string, ClueDraft>>({})
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0)
  const [selectedLevel, setSelectedLevel] = useState<ClueLevel>(100)

  const selectedClueKey = useMemo(
    () => getClueKey(selectedCategoryIndex, selectedLevel),
    [selectedCategoryIndex, selectedLevel],
  )
  const selectedClue = clues[selectedClueKey] ?? createEmptyClue()
  const filledCluesCount = Object.values(clues).filter(isClueFilled).length
  const draftSummary =
    filledCluesCount > 0
      ? `Заполнено вопросов: ${filledCluesCount} из ${categories.length * CLUE_LEVELS.length}`
      : 'Содержимое пока не заполнено'

  useEffect(() => {
    if (!draftId) {
      setCurrentDraftId(undefined)
      setTitle(getNextDraftTitle())
      setCategories(createDefaultCategories())
      setClues({})
      setSelectedCategoryIndex(0)
      setSelectedLevel(100)
      return
    }

    const savedDraft = getDraftById(draftId)

    if (!savedDraft) {
      navigate('/admin', { replace: true })
      return
    }

    setCurrentDraftId(savedDraft.id)
    setTitle(savedDraft.title)
    setCategories(savedDraft.categories)
    setClues(savedDraft.clues)
    setSelectedCategoryIndex(0)
    setSelectedLevel(100)
  }, [draftId, navigate])

  const handleCategoryChange = (categoryIndex: number, value: string) => {
    setCategories((currentCategories) =>
      currentCategories.map((category, index) => (index === categoryIndex ? value : category)),
    )
  }

  const updateSelectedClue = (updates: Partial<ClueDraft>) => {
    setClues((currentClues) => ({
      ...currentClues,
      [selectedClueKey]: {
        ...createEmptyClue(),
        ...currentClues[selectedClueKey],
        ...updates,
      },
    }))
  }

  const handleMediaChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') {
        updateSelectedClue({
          mediaName: file.name,
          mediaUrl: reader.result,
        })
      }
    })
    reader.readAsDataURL(file)
  }

  const handleRemoveMedia = () => {
    updateSelectedClue({
      mediaName: undefined,
      mediaUrl: undefined,
    })
  }

  const handleSaveDraft = () => {
    const savedDraft = saveDraft({
      categories,
      clues,
      content: draftSummary,
      id: currentDraftId,
      title,
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

          <section className="jeopardy-builder" aria-label="Конструктор игрового поля">
            <div className="builder-board">
              <div className="category-row">
                {categories.map((category, categoryIndex) => (
                  <label className="category-input" key={categoryIndex}>
                    <input
                      aria-label={getCategoryPlaceholder(categoryIndex)}
                      placeholder={getCategoryPlaceholder(categoryIndex)}
                      value={category}
                      onChange={(event) => handleCategoryChange(categoryIndex, event.target.value)}
                    />
                  </label>
                ))}
              </div>

              <div className="levels-grid">
                {CLUE_LEVELS.flatMap((level) =>
                  categories.map((_, categoryIndex) => {
                    const clueKey = getClueKey(categoryIndex, level)
                    const isSelected = selectedCategoryIndex === categoryIndex && selectedLevel === level
                    const isFilled = isClueFilled(clues[clueKey])

                    return (
                      <button
                        className={`level-tile${isSelected ? ' selected' : ''}${isFilled ? ' filled' : ''}`}
                        key={clueKey}
                        type="button"
                        onClick={() => {
                          setSelectedCategoryIndex(categoryIndex)
                          setSelectedLevel(level)
                        }}
                      >
                        {level}
                      </button>
                    )
                  }),
                )}
              </div>
            </div>

            <aside className="clue-editor" aria-label="Редактор выбранного вопроса">
              <span>
                {categories[selectedCategoryIndex] || getCategoryPlaceholder(selectedCategoryIndex)} за{' '}
                {selectedLevel}
              </span>
              <strong>Вопрос</strong>
              <textarea
                value={selectedClue.question}
                onChange={(event) => updateSelectedClue({ question: event.target.value })}
                placeholder="Напишите текст вопроса для выбранной клетки"
              />

              <label className="clue-answer-field">
                <span>Правильный ответ</span>
                <input
                  value={selectedClue.answer}
                  onChange={(event) => updateSelectedClue({ answer: event.target.value })}
                  placeholder="Например: Александр Пушкин"
                />
              </label>

              <div className="media-uploader">
                <label className="media-upload-button">
                  Добавить изображение
                  <input accept="image/*" type="file" onChange={handleMediaChange} />
                </label>

                {selectedClue.mediaUrl && (
                  <div className="media-preview">
                    <img alt={selectedClue.mediaName || 'Медиа вопроса'} src={selectedClue.mediaUrl} />
                    <div>
                      <span>{selectedClue.mediaName}</span>
                      <button type="button" onClick={handleRemoveMedia}>
                        Удалить медиа
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </section>
        </div>
      </section>
    </main>
  )
}

export default CreateGamePage
