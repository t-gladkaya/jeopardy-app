import { supabase } from '../lib/supabase'

export type ClueLevel = 100 | 200 | 300 | 400 | 500

export type ClueDraft = {
  answer: string
  mediaName?: string
  mediaPath?: string
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

type DraftRow = {
  categories: unknown
  clues: unknown
  content: string | null
  created_at: string
  id: string
  title: string
  updated_at: string
}

export const CLUE_LEVELS: ClueLevel[] = [100, 200, 300, 400, 500]
export const CATEGORY_COUNT = 5

const requireSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.')
  }

  return supabase
}

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
    mediaPath: typeof clue.mediaPath === 'string' ? clue.mediaPath : undefined,
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

const mapDraftRow = (row: DraftRow): GameDraft => {
  const defaultCategories = createDefaultCategories()
  const categories = isStringArray(row.categories)
    ? [...row.categories, ...defaultCategories].slice(0, CATEGORY_COUNT)
    : defaultCategories

  return {
    categories,
    clues: normalizeClues(row.clues),
    content: row.content ?? '',
    createdAt: row.created_at,
    id: row.id,
    title: row.title,
    updatedAt: row.updated_at,
  }
}

export const getDrafts = async (): Promise<GameDraft[]> => {
  const client = requireSupabase()
  const { data, error } = await client
    .from('game_drafts')
    .select('id,title,content,categories,clues,created_at,updated_at')
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => mapDraftRow(row as DraftRow))
}

export const getDraftById = async (draftId: string) => {
  const client = requireSupabase()
  const { data, error } = await client
    .from('game_drafts')
    .select('id,title,content,categories,clues,created_at,updated_at')
    .eq('id', draftId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data ? mapDraftRow(data as DraftRow) : undefined
}

export const getNextDraftTitle = async () => {
  const drafts = await getDrafts()
  return `Раунд ${drafts.length + 1}`
}

export const saveDraft = async (
  draft: Omit<GameDraft, 'createdAt' | 'id' | 'updatedAt'> & Partial<GameDraft>,
) => {
  const client = requireSupabase()
  const payload = {
    categories: draft.categories ?? createDefaultCategories(),
    clues: draft.clues ?? {},
    content: draft.content ?? '',
    title: draft.title,
    updated_at: new Date().toISOString(),
  }
  const query = draft.id
    ? client.from('game_drafts').update(payload).eq('id', draft.id)
    : client.from('game_drafts').insert(payload)
  const { data, error } = await query
    .select('id,title,content,categories,clues,created_at,updated_at')
    .single()

  if (error) {
    throw error
  }

  return mapDraftRow(data as DraftRow)
}

export const deleteDraft = async (draftId: string) => {
  const client = requireSupabase()
  const { error } = await client.from('game_drafts').delete().eq('id', draftId)

  if (error) {
    throw error
  }
}

export const getCompletedClues = async (draftId: string) => {
  const client = requireSupabase()
  const { data, error } = await client
    .from('completed_clues')
    .select('clue_key')
    .eq('draft_id', draftId)

  if (error) {
    throw error
  }

  return (data ?? []).map((item) => item.clue_key as string)
}

export const saveCompletedClues = async (draftId: string, completedClues: string[]) => {
  const client = requireSupabase()
  const { error: deleteError } = await client.from('completed_clues').delete().eq('draft_id', draftId)

  if (deleteError) {
    throw deleteError
  }

  if (completedClues.length === 0) {
    return
  }

  const { error } = await client.from('completed_clues').insert(
    completedClues.map((clueKey) => ({
      clue_key: clueKey,
      draft_id: draftId,
    })),
  )

  if (error) {
    throw error
  }
}

export const resetCompletedClues = async () => {
  const client = requireSupabase()
  const { error } = await client.from('completed_clues').delete().not('draft_id', 'is', null)

  if (error) {
    throw error
  }
}
