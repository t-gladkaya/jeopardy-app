import { Link } from 'react-router-dom'
import { getTeams } from '../../data/teams'

function RoundPage() {
  const teams = getTeams()

  return (
    <main className="admin-page">
      <section className="admin-shell round-shell" aria-labelledby="round-title">
        <header className="create-header">
          <Link className="back-link" to="/teams">
            Назад
          </Link>
        </header>

        <div className="teams-content">
          <p className="landing-kicker">Раунд 1</p>
          <h1 id="round-title">Игра началась</h1>

          <div className="scoreboard" aria-label="Счёт команд">
            {teams.map((team) => (
              <article className="score-card-team" key={team.id}>
                <span>{team.name}</span>
                <strong>{team.score}</strong>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

export default RoundPage
