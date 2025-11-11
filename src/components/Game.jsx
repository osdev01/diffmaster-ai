import { useState, useEffect } from 'react'
import { textToImage, imageToModifiedImage } from '../utils/aiGenerator'

export default function Game({ onEnd }) {
  const [images, setImages] = useState({ img1: null, img2: null })
  const [found, setFound] = useState([])
  const [score, setScore] = useState(0)
  const [timer, setTimer] = useState(60)
  const [combo, setCombo] = useState(1)
  const [loading, setLoading] = useState(false)
  const [generationStatus, setGenerationStatus] = useState('')
  const [retryCount, setRetryCount] = useState(0)

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
  }, [timer, score, onEnd])

  const startGame = async (input) => {
    setLoading(true)
    setGenerationStatus('🎨 شروع تولید تصویر...')
    setRetryCount(0)

    try {
      let img1, img2

      if (input.image) {
        img1 = URL.createObjectURL(input.image)
        setGenerationStatus('🔄 تولید تصویر اصلاح شده...')
        img2 = await imageToModifiedImage(input.image)
      } else {
        const base = input.text
        setGenerationStatus('🎯 تولید تصویر اصلی...')
        img1 = await textToImage(base)
        setGenerationStatus('🎯 تولید تصویر با تفاوت‌های ظریف...')
        img2 = await textToImage(`${base}, with 5 subtle differences: move object, change color, add shadow, resize, remove detail`)
      }

      setGenerationStatus('✅ تصاویر آماده شدند!')
      setImages({ img1, img2 })
      setFound([])
      setScore(0)
      setTimer(60)
      setCombo(1)
    } catch (err) {
      console.error("Game start error:", err);
      const errorMessage = err.message || "Unknown error";

      setRetryCount(prev => prev + 1)

      // اگر مدل در حال لود شدن است، پیام بهتری نشان بده
      if (errorMessage.includes("Python not found")) {
        setGenerationStatus("❌ Python نصب نیست - لطفاً Python را نصب کنید");
        alert("❌ Python is not installed!\n\nPlease install Python from https://python.org and restart the application.");
        return;
      } else if (errorMessage.includes("loading") || errorMessage.includes("wait")) {
        setGenerationStatus(`⏳ ${errorMessage} (تلاش ${retryCount + 1})`);
      } else if (errorMessage.includes("VITE_HF_TOKEN")) {
        setGenerationStatus("❌ خطا: توکن HuggingFace تنظیم نشده!");
        alert("❌ Error: Hugging Face token is not set!\n\nPlease add VITE_HF_TOKEN to your .env file.");
        return; // اگر توکن نیست، retry نکن
      } else {
        setGenerationStatus(`⚠️ خطای AI: ${errorMessage} (تلاش ${retryCount + 1})`);
      }

      setTimeout(() => startGame(input), 15000) // افزایش زمان به 15 ثانیه
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

  if (loading) return (
    <div className="text-center text-xl space-y-4">
      <div>🎨 تولید پازل هوش مصنوعی...</div>
      <div className="text-lg text-blue-400">{generationStatus}</div>
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
      {retryCount > 0 && (
        <div className="text-sm text-orange-400">
          تلاش شماره {retryCount} - لطفاً صبر کنید...
        </div>
      )}
    </div>
  )

  if (!images.img1 || !images.img2) {
    return <div className="text-center text-xl">Loading images...</div>
  }

  return (
    <div className="text-center space-y-6">
      <div className="text-2xl font-bold">
        Time: {timer}s | Score: {score} | Combo: x{Math.floor(combo * 10) / 10}
      </div>
      <div className="flex flex-col md:flex-row gap-6 justify-center">
        <img
          src={images.img1}
          alt="Original image"
          onClick={(e) => handleClick('left', e)}
          className="w-full max-w-md rounded-xl shadow-2xl cursor-crosshair border-4 border-purple-300"
        />
        <img
          src={images.img2}
          alt="Modified image"
          onClick={(e) => handleClick('right', e)}
          className="w-full max-w-md rounded-xl shadow-2xl cursor-crosshair border-4 border-blue-300"
        />
      </div>
      {found.length === 5 && <div className="text-3xl font-bold text-green-600">All 5 Found! 🎉</div>}
    </div>
  )
}