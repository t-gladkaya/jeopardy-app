import { supabase } from '../lib/supabase'

export type Team = {
  id: string
  name: string
  score: number
}

type TeamRow = {
  id: string
  name: string
  score: number | string
  sort_order: number
}

type SupabaseError = {
  message?: string
}

const requireSupabase = () => {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.')
  }

  return supabase
}

export const createDefaultTeams = (): Team[] => [
  { id: crypto.randomUUID(), name: 'Команда 1', score: 0 },
  { id: crypto.randomUUID(), name: 'Команда 2', score: 0 },
]

const mapTeamRow = (row: TeamRow): Team => ({
  id: row.id,
  name: row.name,
  score: Number(row.score),
})

const throwSupabaseError = (error: SupabaseError) => {
  throw new Error(error.message || 'Не удалось выполнить запрос к Supabase.')
}

export const getTeams = async (): Promise<Team[]> => {
  const client = requireSupabase()
  const { data, error } = await client
    .from('game_teams')
    .select('id,name,score,sort_order')
    .order('sort_order', { ascending: true })

  if (error) {
    throwSupabaseError(error)
  }

  return (data ?? []).map((row) => mapTeamRow(row as TeamRow))
}

export const saveTeams = async (teams: Team[]) => {
  const client = requireSupabase()

  if (teams.length > 0) {
    const { error: upsertError } = await client.from('game_teams').upsert(
      teams.map((team, index) => ({
        id: team.id,
        name: team.name,
        score: team.score,
        sort_order: index,
      })),
    )

    if (upsertError) {
      throwSupabaseError(upsertError)
    }
  }

  const { data: savedRows, error: selectError } = await client.from('game_teams').select('id')

  if (selectError) {
    throwSupabaseError(selectError)
  }

  const nextTeamIds = new Set(teams.map((team) => team.id))
  const removedTeamIds = (savedRows ?? [])
    .map((row) => row.id as string)
    .filter((teamId) => !nextTeamIds.has(teamId))

  if (removedTeamIds.length === 0) {
    return
  }

  const { error: deleteError } = await client.from('game_teams').delete().in('id', removedTeamIds)

  if (deleteError) {
    throwSupabaseError(deleteError)
  }
}

export const saveTeamScores = async (teams: Team[]) => {
  const client = requireSupabase()
  const { error } = await client.from('game_teams').upsert(
    teams.map((team, index) => ({
      id: team.id,
      name: team.name,
      score: team.score,
      sort_order: index,
    })),
  )

  if (error) {
    throwSupabaseError(error)
  }
}
