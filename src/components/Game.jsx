import { useState, useEffect } from 'react'
import { textToImage, imageToModifiedImage } from '../utils/aiGenerator'

export default function Game({ onEnd }) {
  const [images, setImages] = useState({ img1: null, img2: null })
  const [found, setFound] = useState([])
  const [score, setScore] = useState(0)
  const [timer, setTimer] = useState(60)
  const [combo, setCombo] = useState(1)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const input = window.gameInput || { text: "a dog playing in a sunny park" }
    startGame(input)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setTimer(t => t > 0 ? t - 1 : 0), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (timer === 0) onEnd(score)
  }, [timer])

  const startGame = async (input) => {
    setLoading(true)
    try {
      let img1, img2

      if (input.image) {
        img1 = URL.createObjectURL(input.image)
        img2 = await imageToModifiedImage(input.image)
      } else {
        const base = input.text
        img1 = await textToImage(base)
        img2 = await textToImage(`${base}, with 5 subtle differences: move object, change color, add shadow, resize, remove detail`)
      }

      setImages({ img1, img2 })
      setFound([])
      setScore(0)
      setTimer(60)
      setCombo(1)
    } catch (err) {
      alert("AI is busy. Retrying in 10s...")
      setTimeout(() => startGame(input), 10000)
    } finally {
      setLoading(false)
    }
  }

  const handleClick = (side, e) => {
    if (found.length >= 5) return
    const x = e.nativeEvent.offsetX
    const y = e.nativeEvent.offsetY
    const key = `${side}-${Math.floor(x / 50)}-${Math.floor(y / 50)}`

    if (!found.includes(key)) {
      setFound([...found, key])
      setScore(s => s + 10 * combo)
      setCombo(c => c + 0.5)
    } else {
      setCombo(1)
    }
  }

  if (loading) return <div className="text-center text-xl">Generating AI Puzzle...</div>

  return (
    <div className="text-center space-y-6">
      <div className="text-2xl font-bold">
        Time: {timer}s | Score: {score} | Combo: x{Math.floor(combo * 10) / 10}
      </div>
      <div className="flex flex-col md:flex-row gap-6 justify-center">
        <img
          src={images.img1}
          onClick={(e) => handleClick('left', e)}
          className="w-full max-w-md rounded-xl shadow-2xl cursor-crosshair border-4 border-purple-300"
        />
        <img
          src={images.img2}
          onClick={(e) => handleClick('right', e)}
          className="w-full max-w-md rounded-xl shadow-2xl cursor-crosshair border-4 border-blue-300"
        />
      </div>
      {found.length === 5 && <div className="text-3xl font-bold text-green-600">All 5 Found! 🎉</div>}
    </div>
  )
}