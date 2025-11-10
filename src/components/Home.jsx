import { useState } from 'react'

export default function Home({ onStart }) {
  const [text, setText] = useState('')
  const [image, setImage] = useState(null)

  const handleStart = () => {
    if (!text && !image) return
    onStart({ text: text.trim(), image })
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <input
          type="text"
          placeholder="Describe a scene... (e.g., a cat in a sunny garden)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-4 rounded-xl border-2 border-purple-200 focus:border-purple-500 outline-none transition"
        />
      </div>

      <div className="text-center text-gray-500 font-medium">OR</div>

      <div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
          className="block w-full text-sm text-gray-600 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
        />
        {image && <p className="mt-2 text-green-600 font-medium">✓ {image.name}</p>}
      </div>

      <button
        onClick={handleStart}
        className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full font-bold text-lg shadow-lg hover:scale-105 transition transform"
      >
        Generate Puzzle
      </button>
    </div>
  )
}