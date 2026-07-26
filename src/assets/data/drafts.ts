export type GameDraft = {
  content: string
  createdAt: string
  id: string
  title: string
  updatedAt: string
}

const STORAGE_KEY = 'jeopardy-game-drafts'

const isGameDraft = (value: unknown): value is GameDraft => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const draft = value as Record<string, unknown>
  return (
    typeof draft.content === 'string' &&
    typeof draft.createdAt === 'string' &&
    typeof draft.id === 'string' &&
    typeof draft.title === 'string' &&
    typeof draft.updatedAt === 'string'
  )
}

export const getDrafts = (): GameDraft[] => {
  const rawDrafts = localStorage.getItem(STORAGE_KEY)

  if (!rawDrafts) {
    return []
  }

  try {
    const parsedDrafts: unknown = JSON.parse(rawDrafts)
    return Array.isArray(parsedDrafts) ? parsedDrafts.filter(isGameDraft) : []
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
}
