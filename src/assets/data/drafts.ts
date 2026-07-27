import { supabase } from '../lib/supabase'

export type ClueLevel = number

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
  levels: ClueLevel[]
  title: string
  updatedAt: string
}

type DraftRow = {
  categories: unknown
  clues: unknown
  content: string | null
  created_at: string
  id: string
  levels?: unknown
  title: string
  updated_at: string
}

type SupabaseError = {
  message?: string
}

export const CLUE_LEVELS: ClueLevel[] = [100, 200, 300, 400, 500]
export const CATEGORY_COUNT = 5

const requireSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.')
  }

  return supabase
}

const throwSupabaseError = (error: SupabaseError) => {
  throw new Error(error.message || 'Не удалось выполнить запрос к Supabase.')
}

const isMissingLevelsColumnError = (error?: SupabaseError | null) => {
  return Boolean(error?.message?.toLowerCase().includes('levels') && error.message.toLowerCase().includes('column'))
}

const throwMissingLevelsColumnError = () => {
  throw new Error(
    'В таблице game_drafts нет колонки levels. Выполните миграцию: alter table public.game_drafts add column if not exists levels jsonb not null default \'[100,200,300,400,500]\'::jsonb;',
  )
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

const isClueLevel = (value: unknown): value is ClueLevel => {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

const normalizeClueLevels = (value: unknown) => {
  if (!Array.isArray(value)) {
    return CLUE_LEVELS
  }

  const levels = value.filter(isClueLevel)
  return levels.length > 0 ? levels : CLUE_LEVELS
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
    ? row.categories.slice(0, CATEGORY_COUNT)
    : defaultCategories

  return {
    categories: categories.length > 0 ? categories : defaultCategories,
    clues: normalizeClues(row.clues),
    content: row.content ?? '',
    createdAt: row.created_at,
    id: row.id,
    levels: normalizeClueLevels(row.levels),
    title: row.title,
    updatedAt: row.updated_at,
  }
}

export const getDrafts = async (): Promise<GameDraft[]> => {
  const client = requireSupabase()
  const { data, error } = await client
    .from('game_drafts')
    .select('id,title,content,categories,clues,levels,created_at,updated_at')
    .order('created_at', { ascending: true })

  if (isMissingLevelsColumnError(error)) {
    const { data: legacyData, error: legacyError } = await client
      .from('game_drafts')
      .select('id,title,content,categories,clues,created_at,updated_at')
      .order('created_at', { ascending: true })

    if (legacyError) {
      throwSupabaseError(legacyError)
    }

    return (legacyData ?? []).map((row) => mapDraftRow(row as DraftRow))
  }

  if (error) {
    throwSupabaseError(error)
  }

  return (data ?? []).map((row) => mapDraftRow(row as DraftRow))
}

export const getDraftById = async (draftId: string) => {
  const client = requireSupabase()
  const { data, error } = await client
    .from('game_drafts')
    .select('id,title,content,categories,clues,levels,created_at,updated_at')
    .eq('id', draftId)
    .maybeSingle()

  if (isMissingLevelsColumnError(error)) {
    const { data: legacyData, error: legacyError } = await client
      .from('game_drafts')
      .select('id,title,content,categories,clues,created_at,updated_at')
      .eq('id', draftId)
      .maybeSingle()

    if (legacyError) {
      throwSupabaseError(legacyError)
    }

    return legacyData ? mapDraftRow(legacyData as DraftRow) : undefined
  }

  if (error) {
    throwSupabaseError(error)
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
  const draftId = draft.id ?? crypto.randomUUID()
  const savedAt = new Date().toISOString()
  const payload = {
    categories: draft.categories ?? createDefaultCategories(),
    clues: draft.clues ?? {},
    content: draft.content ?? '',
    id: draftId,
    levels: draft.levels ?? CLUE_LEVELS,
    title: draft.title,
    updated_at: savedAt,
  }
  const { error } = await client.from('game_drafts').upsert(payload)

  if (isMissingLevelsColumnError(error)) {
    throwMissingLevelsColumnError()
  }

  if (error) {
    throwSupabaseError(error)
  }

  return (
    (await getDraftById(draftId)) ?? {
      categories: payload.categories,
      clues: payload.clues,
      content: payload.content,
      createdAt: savedAt,
      id: draftId,
      levels: payload.levels,
      title: payload.title,
      updatedAt: savedAt,
    }
  )
}

const renumberDrafts = async () => {
  const client = requireSupabase()
  const drafts = await getDrafts()

  for (const [index, draft] of drafts.entries()) {
    const nextTitle = `Раунд ${index + 1}`

    if (draft.title === nextTitle) {
      continue
    }

    const { error } = await client
      .from('game_drafts')
      .update({
        title: nextTitle,
        updated_at: new Date().toISOString(),
      })
      .eq('id', draft.id)

    if (error) {
      throwSupabaseError(error)
    }
  }
}

export const deleteDraft = async (draftId: string) => {
  const client = requireSupabase()
  const { error } = await client.from('game_drafts').delete().eq('id', draftId)

  if (error) {
    throwSupabaseError(error)
  }

  await renumberDrafts()
}

export const getCompletedClues = async (draftId: string) => {
  const client = requireSupabase()
  const { data, error } = await client
    .from('completed_clues')
    .select('clue_key')
    .eq('draft_id', draftId)

  if (error) {
    throwSupabaseError(error)
  }

  return (data ?? []).map((item) => item.clue_key as string)
}

export const saveCompletedClues = async (draftId: string, completedClues: string[]) => {
  const client = requireSupabase()
  const { error: deleteError } = await client.from('completed_clues').delete().eq('draft_id', draftId)

  if (deleteError) {
    throwSupabaseError(deleteError)
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
    throwSupabaseError(error)
  }
}

export const resetCompletedClues = async () => {
  const client = requireSupabase()
  const { error } = await client.from('completed_clues').delete().not('draft_id', 'is', null)

  if (error) {
    throwSupabaseError(error)
  }
}
