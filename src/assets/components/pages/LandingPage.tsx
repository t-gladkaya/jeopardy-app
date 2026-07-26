import { AdminButton } from '../buttons/AdminButton'
import { StartButton } from '../buttons/StartButton'

function LandingPage() {
  return (
    <main className="landing-page">
      <section className="landing-card" aria-labelledby="landing-title">
        <div className="brand-mark" aria-hidden="true">
          ?
        </div>

        <p className="landing-kicker">Командная викторина</p>
        <h1 id="landing-title">Игра на Лещинского</h1>
        <p className="landing-text">
          Запускайте игру для участников или переходите в админ-панель, чтобы подготовить раунды.
        </p>

        <div className="landing-actions" aria-label="Главные действия">
          <StartButton />
          <AdminButton />
        </div>
      </section>
    </main>
  )
}

export default LandingPage
