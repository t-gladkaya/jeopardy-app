import { Link } from 'react-router-dom'

function CreateGamePage() {
  return (
    <main className="admin-page">
      <section className="admin-shell empty-state" aria-labelledby="create-title">
        <Link className="back-link" to="/admin">
          Назад
        </Link>
        <p className="landing-kicker">Скоро</p>
        <h1 id="create-title">Создание игры</h1>
        <p className="landing-text">Здесь позже появится форма для подготовки игры и раундов.</p>
      </section>
    </main>
  )
}

export default CreateGamePage
