import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export default function Leaderboard({ onBack }) {
  const [name, setName] = useState('')
  const [scores, setScores] = useState([])
  const score = window.finalScore || 0

  useEffect(() => {
    loadScores()
  }, [])

  const loadScores = async () => {
    const { data, error } = await supabase
      .from('scores')
      .select('name, score')
      .order('score', { ascending: false })
      .limit(10)
    if (error) console.error(error)
    else setScores(data || [])
  }

  const submitScore = async () => {
    if (!name.trim()) return
    const { error } = await supabase
      .from('scores')
      .insert({ name: name.trim(), score })
    if (error) console.error(error)
    else {
      setName('')
      loadScores()
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h2 className="text-3xl font-bold text-center text-purple-700">Global Leaderboard</h2>
      
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 border-2 border-purple-200 rounded-lg mb-3 focus:border-purple-500 outline-none"
        />
        <button
          onClick={submitScore}
          className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold hover:scale-105 transition"
        >
          Save Score: {score}
        </button>
      </div>

      <div className="space-y-2">
        {scores.length === 0 ? (
          <p className="text-center text-gray-500">No scores yet. Be the first!</p>
        ) : (
          scores.map((s, i) => (
            <div key={i} className="flex justify-between items-center bg-white p-4 rounded-lg shadow-md">
              <span className="font-bold text-lg">#{i + 1} {s.name}</span>
              <span className="text-xl font-bold text-purple-600">{s.score}</span>
            </div>
          ))
        )}
      </div>

      <button onClick={onBack} className="w-full py-3 bg-gray-600 text-white rounded-lg font-bold">
        Back to Home
      </button>
    </div>
  )
}