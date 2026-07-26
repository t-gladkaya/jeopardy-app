import { Link } from 'react-router-dom'

type ExistingGame = {
  id: string
  rounds: number
  status: string
  title: string
}

const games: ExistingGame[] = []

function AdminPage() {
  const hasGames = games.length > 0

  return (
    <main className="admin-page">
      <section className="admin-shell" aria-labelledby="admin-title">
        <header className="admin-header">
          <Link className="back-link" to="/">
            Назад
          </Link>

          <div>
            <p className="landing-kicker">Админ-панель</p>
            <h1 id="admin-title">Созданные игры</h1>
          </div>
        </header>

        <div className="games-grid" aria-label="Список игр">
          {hasGames ? (
            games.map((game) => (
              <button className="game-card" key={game.id} type="button">
                <span>{game.status}</span>
                <strong>{game.title}</strong>
                <small>{game.rounds} раундов</small>
              </button>
            ))
          ) : (
            <Link className="game-card create-card" to="/admin/create">
              <span>Пока пусто</span>
              <strong>Создать первую игру</strong>
              <small>Перейти к будущему конструктору</small>
            </Link>
          )}
        </div>
      </section>
    </main>
  )
}

export default AdminPage
