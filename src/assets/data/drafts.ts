export type ClueLevel = 100 | 200 | 300 | 400 | 500

export type ClueDraft = {
  answer: string
  mediaName?: string
  mediaUrl?: string
  question: string
}

export type GameDraft = {
  categories: string[]
  clues: Record<string, ClueDraft>
  content: string
  createdAt: string
  id: string
  title: string
  updatedAt: string
}

export const CLUE_LEVELS: ClueLevel[] = [100, 200, 300, 400, 500]
export const CATEGORY_COUNT = 5

const STORAGE_KEY = 'jeopardy-game-drafts'
const COMPLETED_CLUES_STORAGE_PREFIX = 'jeopardy-completed-clues-'

export const createDefaultCategories = () => {
  return Array.from({ length: CATEGORY_COUNT }, () => '')
}

export const createEmptyClue = (): ClueDraft => ({
  answer: '',
  question: '',
})

export const getCategoryPlaceholder = (categoryIndex: number) => {
  return `Категория ${categoryIndex + 1}`
}

export const getClueKey = (categoryIndex: number, level: ClueLevel) => {
  return `${categoryIndex}-${level}`
}

export const isClueFilled = (clue?: ClueDraft) => {
  return Boolean(clue?.question || clue?.answer || clue?.mediaUrl)
}

const isStringArray = (value: unknown) => {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

const normalizeClue = (value: unknown): ClueDraft => {
  if (typeof value === 'string') {
    return {
      answer: '',
      question: value,
    }
  }

  if (!value || typeof value !== 'object') {
    return createEmptyClue()
  }

  const clue = value as Record<string, unknown>
  return {
    answer: typeof clue.answer === 'string' ? clue.answer : '',
    mediaName: typeof clue.mediaName === 'string' ? clue.mediaName : undefined,
    mediaUrl: typeof clue.mediaUrl === 'string' ? clue.mediaUrl : undefined,
    question: typeof clue.question === 'string' ? clue.question : '',
  }
}

const normalizeClues = (value: unknown) => {
  if (!value || typeof value !== 'object') {
    return {}
  }

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, ClueDraft>>(
    (normalizedClues, [key, clue]) => ({
      ...normalizedClues,
      [key]: normalizeClue(clue),
    }),
    {},
  )
}

const normalizeDraft = (value: unknown): GameDraft | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const draft = value as Record<string, unknown>

  if (
    typeof draft.createdAt !== 'string' ||
    typeof draft.id !== 'string' ||
    typeof draft.title !== 'string' ||
    typeof draft.updatedAt !== 'string'
  ) {
    return null
  }

  const defaultCategories = createDefaultCategories()
  const categories = isStringArray(draft.categories)
    ? [...draft.categories, ...defaultCategories].slice(0, CATEGORY_COUNT)
    : defaultCategories

  return {
    categories,
    clues: normalizeClues(draft.clues),
    content: typeof draft.content === 'string' ? draft.content : '',
    createdAt: draft.createdAt,
    id: draft.id,
    title: draft.title,
    updatedAt: draft.updatedAt,
  }
}

export const getDrafts = (): GameDraft[] => {
  const rawDrafts = localStorage.getItem(STORAGE_KEY)

  if (!rawDrafts) {
    return []
  }

  try {
    const parsedDrafts: unknown = JSON.parse(rawDrafts)
    return Array.isArray(parsedDrafts)
      ? parsedDrafts.map(normalizeDraft).filter((draft): draft is GameDraft => Boolean(draft))
      : []
  } catch {
    return []
  }
}

export const getDraftById = (draftId: string) => {
  return getDrafts().find((draft) => draft.id === draftId)
}

export const getNextDraftTitle = () => {
  return `Раунд ${getDrafts().length + 1}`
}

export const saveDraft = (draft: Omit<GameDraft, 'createdAt' | 'id' | 'updatedAt'> & Partial<GameDraft>) => {
  const drafts = getDrafts()
  const now = new Date().toISOString()
  const existingDraft = draft.id ? drafts.find((item) => item.id === draft.id) : undefined
  const nextDraft: GameDraft = {
    categories: draft.categories ?? createDefaultCategories(),
    clues: draft.clues ?? {},
    content: draft.content,
    createdAt: existingDraft?.createdAt ?? now,
    id: draft.id ?? crypto.randomUUID(),
    title: draft.title,
    updatedAt: now,
  }
  const nextDrafts = existingDraft
    ? drafts.map((item) => (item.id === nextDraft.id ? nextDraft : item))
    : [...drafts, nextDraft]

  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextDrafts))
  return nextDraft
}

export const deleteDraft = (draftId: string) => {
  const nextDrafts = getDrafts().filter((draft) => draft.id !== draftId)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nextDrafts))
  localStorage.removeItem(`${COMPLETED_CLUES_STORAGE_PREFIX}${draftId}`)
}

export const getCompletedCluesStorageKey = (draftId: string) => {
  return `${COMPLETED_CLUES_STORAGE_PREFIX}${draftId}`
}

export const resetCompletedClues = () => {
  getDrafts().forEach((draft) => {
    localStorage.removeItem(getCompletedCluesStorageKey(draft.id))
  })
}
