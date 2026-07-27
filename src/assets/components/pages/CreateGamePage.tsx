import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, ChangeEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  CLUE_LEVELS,
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
import type { ClueDraft, ClueLevel } from '../../data/drafts'
import { deleteQuestionMedia, uploadQuestionMedia } from '../../data/media'

const getDeleteDraftConfirmation = (draftTitle: string) =>
  `Удалить драфт "${draftTitle}"? Это действие нельзя отменить.`

function CreateGamePage() {
  const { draftId } = useParams()
  const navigate = useNavigate()
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>(draftId)
  const [title, setTitle] = useState('Раунд')
  const [categories, setCategories] = useState(createDefaultCategories)
  const [clues, setClues] = useState<Record<string, ClueDraft>>({})
  const [clueLevels, setClueLevels] = useState<ClueLevel[]>(CLUE_LEVELS)
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0)
  const [selectedLevel, setSelectedLevel] = useState<ClueLevel>(100)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isMediaUploading, setIsMediaUploading] = useState(false)
  const [mediaError, setMediaError] = useState('')
  const [pageError, setPageError] = useState('')

  const selectedClueKey = useMemo(
    () => getClueKey(selectedCategoryIndex, selectedLevel),
    [selectedCategoryIndex, selectedLevel],
  )
  const selectedClue = clues[selectedClueKey] ?? createEmptyClue()
  const filledCluesCount = Object.values(clues).filter(isClueFilled).length
  const draftSummary =
    filledCluesCount > 0
      ? `Заполнено вопросов: ${filledCluesCount} из ${categories.length * clueLevels.length}`
      : 'Содержимое пока не заполнено'
  const boardGridStyle = {
    '--category-count': categories.length,
    '--level-count': clueLevels.length,
  } as CSSProperties

  useEffect(() => {
    const loadDraft = async () => {
      setIsLoading(true)
      setPageError('')

      try {
        if (!draftId) {
          setCurrentDraftId(undefined)
          setTitle(await getNextDraftTitle())
          setCategories(createDefaultCategories())
          setClues({})
          setClueLevels(CLUE_LEVELS)
          setSelectedCategoryIndex(0)
          setSelectedLevel(100)
          return
        }

        const savedDraft = await getDraftById(draftId)

        if (!savedDraft) {
          navigate('/admin', { replace: true })
          return
        }

        setCurrentDraftId(savedDraft.id)
        setTitle(savedDraft.title)
        setCategories(savedDraft.categories)
        setClues(savedDraft.clues)
        setClueLevels(savedDraft.levels)
        setSelectedCategoryIndex(0)
        setSelectedLevel(savedDraft.levels[0] ?? 100)
      } catch (error) {
        setPageError(error instanceof Error ? error.message : 'Не удалось загрузить драфт.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadDraft()
  }, [draftId, navigate])

  useEffect(() => {
    setMediaError('')
  }, [selectedClueKey])

  const handleCategoryChange = (categoryIndex: number, value: string) => {
    setCategories((currentCategories) =>
      currentCategories.map((category, index) => (index === categoryIndex ? value : category)),
    )
  }

  const handleRemoveCategory = (removedCategoryIndex: number) => {
    if (categories.length <= 1) {
      return
    }

    const nextCategoryIndex = Math.min(removedCategoryIndex, categories.length - 2)

    setCategories((currentCategories) =>
      currentCategories.filter((_, categoryIndex) => categoryIndex !== removedCategoryIndex),
    )
    setClues((currentClues) =>
      Object.entries(currentClues).reduce<Record<string, ClueDraft>>((nextClues, [key, clue]) => {
        const [categoryIndexValue, levelValue] = key.split('-')
        const categoryIndex = Number(categoryIndexValue)
        const level = Number(levelValue)

        if (!Number.isInteger(categoryIndex) || !Number.isInteger(level) || categoryIndex === removedCategoryIndex) {
          return nextClues
        }

        const nextCategoryKey = categoryIndex > removedCategoryIndex ? categoryIndex - 1 : categoryIndex
        nextClues[getClueKey(nextCategoryKey, level)] = clue
        return nextClues
      }, {}),
    )
    setSelectedCategoryIndex(nextCategoryIndex)
  }

  const handleRemoveLevel = (removedLevel: ClueLevel) => {
    if (clueLevels.length <= 1) {
      return
    }

    const nextLevels = clueLevels.filter((level) => level !== removedLevel)
    const removedLevelIndex = clueLevels.indexOf(removedLevel)
    const nextLevelIndex = Math.min(Math.max(removedLevelIndex, 0), nextLevels.length - 1)

    setClueLevels(nextLevels)
    setClues((currentClues) =>
      Object.entries(currentClues).reduce<Record<string, ClueDraft>>((nextClues, [key, clue]) => {
        const [, levelValue] = key.split('-')

        if (Number(levelValue) !== removedLevel) {
          nextClues[key] = clue
        }

        return nextClues
      }, {}),
    )
    setSelectedLevel(nextLevels[nextLevelIndex] ?? 100)
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

  const handleMediaChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    setIsMediaUploading(true)
    setMediaError('')

    try {
      if (selectedClue.mediaPath) {
        await deleteQuestionMedia(selectedClue.mediaPath)
      }

      const uploadedMedia = await uploadQuestionMedia(file)
      updateSelectedClue(uploadedMedia)
    } catch (error) {
      setMediaError(error instanceof Error ? error.message : 'Не удалось загрузить изображение.')
    } finally {
      setIsMediaUploading(false)
    }
  }

  const handleRemoveMedia = async () => {
    await deleteQuestionMedia(selectedClue.mediaPath)
    updateSelectedClue({
      mediaName: undefined,
      mediaPath: undefined,
      mediaUrl: undefined,
    })
  }

  const handleSaveDraft = async () => {
    setIsSaving(true)
    setPageError('')

    try {
      const savedDraft = await saveDraft({
        categories,
        clues,
        content: draftSummary,
        id: currentDraftId,
        levels: clueLevels,
        title,
      })

      setCurrentDraftId(savedDraft.id)
      navigate('/admin')
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Не удалось сохранить драфт.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteDraft = async () => {
    if (!window.confirm(getDeleteDraftConfirmation(title))) {
      return
    }

    try {
      if (currentDraftId) {
        await deleteDraft(currentDraftId)
      }

      navigate('/admin')
    } catch (error) {
      setPageError(error instanceof Error ? error.message : 'Не удалось удалить драфт.')
    }
  }

  return (
    <main className="admin-page">
      <section className="admin-shell create-shell" aria-labelledby="create-title">
        <header className="create-header">
          <Link className="back-link" to="/admin">
            Назад
          </Link>

          <div className="draft-actions">
            <button
              className="save-draft-button"
              disabled={isSaving || isLoading}
              type="button"
              onClick={() => void handleSaveDraft()}
            >
              {isSaving ? 'Сохранение...' : 'Сохранить драфт'}
            </button>
            <button className="delete-draft-button" type="button" onClick={() => void handleDeleteDraft()}>
              Удалить драфт
            </button>
          </div>
        </header>

        <div className="create-content">
          <p className="landing-kicker">Конструктор</p>
          <h1 id="create-title">{isLoading ? 'Загрузка...' : title}</h1>
          {pageError && <p className="media-error">{pageError}</p>}

          {!isLoading && !pageError && (
            <section className="jeopardy-builder" aria-label="Конструктор игрового поля">
              <div className="builder-board">
                <div className="category-row" style={boardGridStyle}>
                  {categories.map((category, categoryIndex) => (
                    <div className="category-input" key={categoryIndex}>
                      <input
                        aria-label={getCategoryPlaceholder(categoryIndex)}
                        placeholder={getCategoryPlaceholder(categoryIndex)}
                        value={category}
                        onChange={(event) => handleCategoryChange(categoryIndex, event.target.value)}
                      />
                      <button
                        aria-label={`Удалить ${category || getCategoryPlaceholder(categoryIndex)}`}
                        className="builder-remove-button"
                        disabled={categories.length <= 1}
                        type="button"
                        onClick={() => handleRemoveCategory(categoryIndex)}
                      >
                        Удалить
                      </button>
                    </div>
                  ))}
                </div>

                <div className="levels-grid" style={boardGridStyle}>
                  {clueLevels.flatMap((level) =>
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
                <div className="level-remove-row" style={boardGridStyle}>
                  {clueLevels.map((level) => (
                    <button
                      aria-label={`Удалить ряд на ${level}`}
                      className="builder-remove-button"
                      disabled={clueLevels.length <= 1}
                      key={level}
                      type="button"
                      onClick={() => handleRemoveLevel(level)}
                    >
                      Удалить ряд {level}
                    </button>
                  ))}
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
                  <label className={`media-upload-button${isMediaUploading ? ' is-uploading' : ''}`}>
                    {isMediaUploading ? 'Загрузка...' : 'Добавить изображение'}
                    <input
                      accept="image/*"
                      disabled={isMediaUploading}
                      type="file"
                      onChange={handleMediaChange}
                    />
                  </label>

                  {mediaError && <p className="media-error">{mediaError}</p>}

                  {selectedClue.mediaUrl && (
                    <div className="media-preview">
                      <img alt={selectedClue.mediaName || 'Медиа вопроса'} src={selectedClue.mediaUrl} />
                      <div>
                        <span>{selectedClue.mediaName}</span>
                        <button type="button" onClick={() => void handleRemoveMedia()}>
                          Удалить медиа
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </aside>
            </section>
          )}
        </div>
      </section>
    </main>
  )
}

export default CreateGamePage
