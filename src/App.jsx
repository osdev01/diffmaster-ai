import { useState } from 'react'
import Home from './components/Home'
import Game from './components/Game'
import Leaderboard from './components/Leaderboard'

export default function App() {
  const [screen, setScreen] = useState('home')

  return (
    <div className="min-h-screen p-4">
      <header className="text-center mb-8">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
          DiffMaster AI
        </h1>
        <p className="text-gray-600 mt-2">Spot the Difference with Real AI</p>
      </header>

      {screen === 'home' && <Home onStart={(input) => { window.gameInput = input; setScreen('game') }} />}
      {screen === 'game' && <Game onEnd={(score) => { window.finalScore = score; setScreen('leaderboard') }} />}
      {screen === 'leaderboard' && <Leaderboard onBack={() => setScreen('home')} />}
    </div>
  )
}