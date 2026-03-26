export default function ShadeCard({ skinAnalysis }) {
  const { hex_color, shade_name, shade_code, undertone, undertone_description, confidence } = skinAnalysis

  // Determine undertone badge color
  const undertoneColors = {
    'warm': 'bg-amber-100 text-amber-800',
    'cool': 'bg-blue-100 text-blue-800',
    'neutral': 'bg-gray-100 text-gray-700',
    'neutral-warm': 'bg-amber-50 text-amber-700',
    'neutral-cool': 'bg-blue-50 text-blue-700',
  }

  const badgeColor = undertoneColors[undertone] || 'bg-gray-100 text-gray-700'

  return (
    <div className="glass rounded-2xl p-6 sm:p-8 animate-fade-in-up">
      <h3 className="text-lg font-semibold text-charcoal mb-6 flex items-center gap-2">
        <span className="text-xl">🎨</span> Your Skin Analysis
      </h3>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Color Swatch */}
        <div className="flex-shrink-0">
          <div
            className="w-28 h-28 rounded-2xl shadow-lg border-4 border-white"
            style={{ backgroundColor: hex_color }}
          />
          <p className="text-center mt-2 text-xs font-mono text-charcoal-light">
            {hex_color}
          </p>
        </div>

        {/* Details */}
        <div className="flex-1 text-center sm:text-left">
          <h4 className="text-2xl font-bold text-charcoal font-serif">{shade_name}</h4>
          <p className="text-sm text-charcoal-light mb-3">Shade Code: {shade_code}</p>

          {/* Undertone Badge */}
          <div className="inline-flex items-center gap-2 mb-3">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badgeColor}`}>
              {undertone.charAt(0).toUpperCase() + undertone.slice(1)} Undertone
            </span>
            <span className="text-sm text-charcoal-light">
              {Math.round(confidence * 100)}% confidence
            </span>
          </div>

          {/* Description */}
          <p className="text-sm text-charcoal-light leading-relaxed">
            {undertone_description}
          </p>
        </div>
      </div>

      {/* Confidence Bar */}
      <div className="mt-6 pt-4 border-t border-blush/20">
        <div className="flex items-center justify-between text-xs text-charcoal-light mb-2">
          <span>Analysis Confidence</span>
          <span className="font-semibold">{Math.round(confidence * 100)}%</span>
        </div>
        <div className="h-2 bg-blush-light/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blush to-gold rounded-full transition-all duration-1000"
            style={{ width: `${Math.round(confidence * 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
