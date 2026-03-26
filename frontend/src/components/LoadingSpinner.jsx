export default function LoadingSpinner() {
  return (
    <div className="mt-12 flex flex-col items-center justify-center animate-fade-in">
      {/* Spinning shade wheel */}
      <div className="relative w-20 h-20 mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-blush-light" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-gold animate-spin-slow" />
        <div className="absolute inset-2 rounded-full bg-cream flex items-center justify-center">
          <span className="text-2xl">💄</span>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-charcoal mb-2">Analyzing Your Skin...</h3>

      <div className="flex flex-col items-center gap-2 text-sm text-charcoal-light">
        <p className="animate-pulse-soft">🔍 Detecting face landmarks</p>
        <p className="animate-pulse-soft stagger-2">🎨 Extracting skin tone</p>
        <p className="animate-pulse-soft stagger-4">✨ Finding your perfect match</p>
      </div>
    </div>
  )
}
