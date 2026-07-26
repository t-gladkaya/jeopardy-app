import { supabase } from '../lib/supabase'

export type Team = {
  id: string
  name: string
  score: number
}

type TeamRow = {
  id: string
  name: string
  score: number
  sort_order: number
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
  score: row.score,
})

export const getTeams = async (): Promise<Team[]> => {
  const client = requireSupabase()
  const { data, error } = await client
    .from('game_teams')
    .select('id,name,score,sort_order')
    .order('sort_order', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => mapTeamRow(row as TeamRow))
}

export const saveTeams = async (teams: Team[]) => {
  const client = requireSupabase()
  const { error: deleteError } = await client.from('game_teams').delete().not('id', 'is', null)

  if (deleteError) {
    throw deleteError
  }

  if (teams.length === 0) {
    return
  }

  const { error } = await client.from('game_teams').insert(
    teams.map((team, index) => ({
      id: team.id,
      name: team.name,
      score: team.score,
      sort_order: index,
    })),
  )

  if (error) {
    throw error
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
    throw error
  }
}
