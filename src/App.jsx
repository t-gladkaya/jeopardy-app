import './App.css'
import { StartButton } from './assets/components/buttons/StartButton'
import { AdminButton } from './assets/components/buttons/AdminButton'

function App() {
  return (
    <section className="flex flex-col items-center justify-center min-h-screen bg-linear-to-b from-purple-400 to-purple-600 text-white">
      <main>
        <StartButton />
      </main>
      <footer className="flex justify-end w-full p-4 fixed bottom-0">
        <AdminButton />
      </footer>
    </section>
  )
}

export default App
