import { useRef, useState, useCallback } from 'react'

export default function ImageUpload({ onImageSelect, onClear, preview }) {
  const fileInputRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [webcamActive, setWebcamActive] = useState(false)
  const [webcamError, setWebcamError] = useState(null)

  // ─── File Upload ──────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) validateAndSelect(file)
  }

  const validateAndSelect = (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (JPEG, PNG, or WebP).')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image is too large. Please select an image under 10MB.')
      return
    }
    onImageSelect(file)
    setWebcamActive(false)
    stopWebcam()
  }

  // ─── Drag & Drop ─────────────────────────────────────────────
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragging(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) validateAndSelect(file)
  }, [])

  // ─── Webcam ───────────────────────────────────────────────────
  const startWebcam = async () => {
    try {
      setWebcamError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setWebcamActive(true)
      }
    } catch (err) {
      console.error('Webcam error:', err)
      setWebcamError('Camera access denied. Please allow camera permissions and try again.')
    }
  }

  const stopWebcam = () => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setWebcamActive(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    // Mirror the image (selfie mode)
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0)

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' })
        onImageSelect(file)
        stopWebcam()
      }
    }, 'image/jpeg', 0.9)
  }

  // ─── Render Preview ───────────────────────────────────────────
  if (preview) {
    return (
      <div className="relative rounded-2xl overflow-hidden group">
        <img
          src={preview}
          alt="Your selfie preview"
          className="w-full h-64 sm:h-80 object-cover rounded-2xl"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
          <button
            onClick={() => {
              onClear()
              stopWebcam()
            }}
            className="opacity-0 group-hover:opacity-100 transition-all duration-300
              px-6 py-3 bg-white/90 rounded-xl font-medium text-charcoal
              hover:bg-white cursor-pointer"
          >
            ✕ Remove Photo
          </button>
        </div>
        <div className="absolute top-3 right-3 px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
          ✓ Photo Ready
        </div>
      </div>
    )
  }

  // ─── Render Webcam ────────────────────────────────────────────
  if (webcamActive) {
    return (
      <div className="space-y-4">
        <div className="relative rounded-2xl overflow-hidden bg-charcoal">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-64 sm:h-80 object-cover rounded-2xl"
            style={{ transform: 'scaleX(-1)' }}
          />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
            <button
              onClick={capturePhoto}
              className="px-6 py-3 bg-white rounded-xl font-semibold text-charcoal
                shadow-lg hover:scale-105 transition-all cursor-pointer"
            >
              📸 Capture
            </button>
            <button
              onClick={stopWebcam}
              className="px-6 py-3 bg-white/80 rounded-xl font-medium text-charcoal
                hover:bg-white transition-all cursor-pointer"
            >
              ✕ Cancel
            </button>
          </div>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    )
  }

  // ─── Render Upload Zone ───────────────────────────────────────
  return (
    <div className="space-y-4">
      <div
        className={`drop-zone rounded-2xl p-8 text-center cursor-pointer
          h-64 sm:h-80 flex flex-col items-center justify-center
          ${dragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="text-5xl mb-4 animate-float">💄</div>
        <p className="font-semibold text-charcoal mb-1">
          Drop your selfie here
        </p>
        <p className="text-sm text-charcoal-light mb-4">
          or click to browse • JPEG, PNG, WebP • Max 10MB
        </p>
        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-cream rounded-xl
          text-sm font-medium text-charcoal hover:bg-cream-dark transition-colors">
          📁 Choose File
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Webcam Button */}
      <button
        onClick={startWebcam}
        className="w-full py-3 rounded-xl border-2 border-blush/30 text-charcoal
          font-medium flex items-center justify-center gap-2
          hover:border-blush hover:bg-blush-light/20 transition-all cursor-pointer"
      >
        <span className="text-xl">📷</span> Use Webcam Instead
      </button>

      {webcamError && (
        <p className="text-sm text-red-500 text-center animate-fade-in">
          {webcamError}
        </p>
      )}
    </div>
  )
}
