export type Team = {
  id: string
  name: string
  score: number
}

const STORAGE_KEY = 'jeopardy-game-teams'

const isTeam = (value: unknown): value is Team => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const team = value as Record<string, unknown>
  return typeof team.id === 'string' && typeof team.name === 'string' && typeof team.score === 'number'
}

export const createDefaultTeams = (): Team[] => [
  { id: crypto.randomUUID(), name: 'Команда 1', score: 0 },
  { id: crypto.randomUUID(), name: 'Команда 2', score: 0 },
]

export const getTeams = (): Team[] => {
  const rawTeams = localStorage.getItem(STORAGE_KEY)

  if (!rawTeams) {
    return []
  }

  try {
    const parsedTeams: unknown = JSON.parse(rawTeams)
    return Array.isArray(parsedTeams) ? parsedTeams.filter(isTeam) : []
  } catch {
    return []
  }
}

export const saveTeams = (teams: Team[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(teams))
}
