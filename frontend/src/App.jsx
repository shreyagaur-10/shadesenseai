import { useState, useEffect } from 'react'
import Hero from './components/Hero'
import ImageUpload from './components/ImageUpload'
import TextInput from './components/TextInput'
import Results from './components/Results'
import LoadingSpinner from './components/LoadingSpinner'
import VirtualTryOn from './components/VirtualTryOn'

// API URL — uses proxy in dev, direct URL in production
const API_URL = import.meta.env.PROD
  ? (import.meta.env.VITE_API_URL || '')
  : ''

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('darkMode') === 'true' } catch { return false }
  })

  useEffect(() => {
    try { localStorage.setItem('darkMode', darkMode) } catch {}
  }, [darkMode])

  const [image, setImage] = useState(null)         // File object
  const [imagePreview, setImagePreview] = useState(null) // base64 preview
  const [text, setText] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Party mode (multi-face)
  const [partyMode, setPartyMode] = useState(false)
  const [multiFaces, setMultiFaces] = useState(null)
  const [activeFaceIndex, setActiveFaceIndex] = useState(0)

  // Virtual try-on
  const [tryOnProduct, setTryOnProduct] = useState(null)

  const handleImageSelect = (file) => {
    setImage(file)
    setError(null)
    setResults(null)
    setMultiFaces(null)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target.result)
    reader.readAsDataURL(file)
  }

  const handleClearImage = () => {
    setImage(null)
    setImagePreview(null)
    setResults(null)
    setMultiFaces(null)
    setError(null)
  }

  const handleAnalyze = async () => {
    if (!image) {
      setError('Please upload or capture a photo first.')
      return
    }

    setLoading(true)
    setError(null)
    setResults(null)
    setMultiFaces(null)
    setActiveFaceIndex(0)

    try {
      const formData = new FormData()
      formData.append('image', image)
      formData.append('text', text)

      const endpoint = partyMode ? '/api/analyze-multi' : '/api/analyze'
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Server error. Please try again.')
      }

      if (data.success) {
        if (partyMode && data.faces) {
          setMultiFaces(data.faces)
          setResults(data.faces[0])
        } else {
          setResults(data)
        }
      } else {
        setError(data.error || 'Analysis failed. Please try a clearer photo.')
      }
    } catch (err) {
      console.error('Analysis error:', err)
      setError(
        err.message === 'Failed to fetch'
          ? 'Cannot connect to the server. Please make sure the backend is running.'
          : err.message || 'Something went wrong. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleTryOn = (product) => {
    setTryOnProduct(product)
  }

  const activeResults = multiFaces ? multiFaces[activeFaceIndex] : results

  return (
    <div className={`min-h-screen bg-cream ${darkMode ? 'dark' : ''}`}>
      {/* Dark Mode Toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full glass
          flex items-center justify-center text-xl
          hover:scale-110 transition-all duration-200 cursor-pointer shadow-md"
        aria-label="Toggle dark mode"
      >
        {darkMode ? '☀️' : '🌙'}
      </button>

      {/* Hero Section */}
      <Hero />

      {/* Main Content */}
      <main id="analyze" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-8">
        {/* Upload + Input Section */}
        <div className="animate-fade-in-up">
          <div className="glass rounded-3xl p-6 sm:p-10 shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Image Upload */}
              <div>
                <h2 className="text-xl font-semibold text-charcoal mb-1 flex items-center gap-2">
                  <span className="text-2xl">📸</span> Upload Your Selfie
                </h2>
                <p className="text-sm text-charcoal-light mb-4">
                  Take or upload a clear photo with natural lighting
                </p>
                <ImageUpload
                  onImageSelect={handleImageSelect}
                  onClear={handleClearImage}
                  preview={imagePreview}
                />

                {/* Party Mode Toggle */}
                <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-cream/60">
                  <button
                    onClick={() => setPartyMode(!partyMode)}
                    className={`relative w-12 h-7 rounded-full transition-all duration-300 cursor-pointer flex-shrink-0 ${
                      partyMode
                        ? 'bg-gradient-to-r from-blush to-rose'
                        : 'bg-charcoal-light/20'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${
                        partyMode ? 'left-5.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                  <div>
                    <p className="text-sm font-medium text-charcoal">
                      👥 Party Mode (Multi-Face)
                    </p>
                    <p className="text-xs text-charcoal-light">
                      Detect & analyze multiple faces in one photo
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Text Input + Analyze Button */}
              <div className="flex flex-col">
                <h2 className="text-xl font-semibold text-charcoal mb-1 flex items-center gap-2">
                  <span className="text-2xl">✨</span> Tell Us Your Vibe
                </h2>
                <p className="text-sm text-charcoal-light mb-4">
                  Describe the look you're going for (optional)
                </p>
                <TextInput value={text} onChange={setText} />

                <div className="mt-auto pt-6">
                  {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-fade-in">
                      ⚠️ {error}
                    </div>
                  )}

                  <button
                    onClick={handleAnalyze}
                    disabled={!image || loading}
                    className="w-full py-4 rounded-2xl font-semibold text-lg
                      transition-all duration-300 cursor-pointer
                      disabled:opacity-50 disabled:cursor-not-allowed
                      bg-gradient-to-r from-blush via-rose to-gold
                      text-white shadow-lg
                      hover:shadow-xl hover:scale-[1.02]
                      active:scale-[0.98]"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Analyzing...
                      </span>
                    ) : (
                      '🔍 Find My Perfect Shade'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && <LoadingSpinner />}

        {/* Multi-Face Selector */}
        {multiFaces && multiFaces.length > 1 && !loading && (
          <div className="mt-8 animate-fade-in-up">
            <div className="glass rounded-2xl p-4">
              <p className="text-sm font-medium text-charcoal mb-3">
                👥 {multiFaces.length} faces detected — select one:
              </p>
              <div className="flex flex-wrap gap-2">
                {multiFaces.map((face, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveFaceIndex(i)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer
                      flex items-center gap-2
                      ${activeFaceIndex === i
                        ? 'bg-gradient-to-r from-blush to-rose text-white shadow-md'
                        : 'bg-cream text-charcoal-light hover:text-charcoal hover:shadow-sm'
                      }`}
                  >
                    <div
                      className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: face.skin_analysis?.hex_color || '#ccc' }}
                    />
                    Face {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {activeResults && !loading && (
          <div className="mt-12 animate-fade-in-up">
            <Results
              data={activeResults}
              imageFile={image}
              onTryOn={handleTryOn}
            />
          </div>
        )}
      </main>

      {/* Virtual Try-On Modal */}
      {tryOnProduct && image && (
        <VirtualTryOn
          imageFile={image}
          product={tryOnProduct}
          onClose={() => setTryOnProduct(null)}
        />
      )}

      {/* Footer */}
      <footer className="text-center py-8 text-charcoal-light text-sm">
        <p>Made with 💖 by ShadeSense AI</p>
        <p className="mt-1 text-xs opacity-60">AI-powered shade matching for Indian & South Asian skin tones</p>
      </footer>
    </div>
  )
}

export default App
