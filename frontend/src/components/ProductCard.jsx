const QUALITY_STYLES = {
  exact: 'bg-green-100 text-green-800',
  great: 'bg-teal-100 text-teal-800',
  good: 'bg-blue-100 text-blue-800',
  fair: 'bg-amber-100 text-amber-800',
  poor: 'bg-red-100 text-red-800',
}

export default function ProductCard({ product, index, onTryOn, skinHex }) {
  const {
    brand, line, shade_code, shade_name, hex_color,
    finish, coverage, price, match_percentage, buy_url,
    shade_comparison,
  } = product

  const qualityStyle = shade_comparison?.match_quality
    ? (QUALITY_STYLES[shade_comparison.match_quality] || QUALITY_STYLES.good)
    : null

  return (
    <div
      className="product-card glass rounded-2xl p-5 animate-fade-in-up"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Match Badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Color swatch */}
          <div
            className="w-12 h-12 rounded-xl shadow-md border-2 border-white flex-shrink-0"
            style={{ backgroundColor: hex_color }}
          />
          <div>
            <h4 className="font-semibold text-charcoal text-sm">{brand}</h4>
            <p className="text-xs text-charcoal-light">{line}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="match-badge px-2.5 py-1 rounded-full text-xs">
            {match_percentage}% match
          </span>
          {shade_comparison?.match_quality && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${qualityStyle}`}>
              {shade_comparison.match_quality}
            </span>
          )}
        </div>
      </div>

      {/* Shade Info */}
      <div className="mb-3">
        <p className="font-semibold text-charcoal">
          {shade_name}
          <span className="text-charcoal-light font-normal ml-1.5 text-sm">#{shade_code}</span>
        </p>
        {shade_comparison?.color_shift_description && (
          <p className="text-xs text-charcoal-light/70 mt-0.5 italic">
            {shade_comparison.color_shift_description}
          </p>
        )}
      </div>

      {/* Skin vs Product comparison */}
      {skinHex && hex_color && (
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1">
            <div
              className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: skinHex }}
            />
            <span className="text-[10px] text-charcoal-light">You</span>
          </div>
          <span className="text-charcoal-light/40 text-xs">→</span>
          <div className="flex items-center gap-1">
            <div
              className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: hex_color }}
            />
            <span className="text-[10px] text-charcoal-light">Product</span>
          </div>
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <span className="px-2.5 py-1 bg-cream rounded-lg text-xs font-medium text-charcoal-light capitalize">
          {finish}
        </span>
        <span className="px-2.5 py-1 bg-cream rounded-lg text-xs font-medium text-charcoal-light capitalize">
          {coverage} coverage
        </span>
      </div>

      {/* Try It On button */}
      {onTryOn && (
        <button
          onClick={onTryOn}
          className="w-full mb-3 py-2 rounded-xl text-sm font-medium
            bg-gradient-to-r from-rose to-blush text-white
            hover:shadow-md hover:scale-[1.02] active:scale-[0.98]
            transition-all duration-200 cursor-pointer"
        >
          Try It On 💄
        </button>
      )}

      {/* Price + CTA */}
      <div className="flex items-center justify-between pt-3 border-t border-blush/10">
        <span className="text-lg font-bold text-charcoal">{price}</span>
        <a
          href={buy_url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-charcoal text-cream rounded-xl text-sm font-medium
            hover:bg-charcoal-light transition-colors"
        >
          View Product →
        </a>
      </div>
    </div>
  )
}
