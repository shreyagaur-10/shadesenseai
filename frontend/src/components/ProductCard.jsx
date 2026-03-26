export default function ProductCard({ product, index }) {
  const {
    brand, line, shade_code, shade_name, hex_color,
    finish, coverage, price, match_percentage, buy_url
  } = product

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
        <span className="match-badge px-2.5 py-1 rounded-full text-xs">
          {match_percentage}% match
        </span>
      </div>

      {/* Shade Info */}
      <div className="mb-4">
        <p className="font-semibold text-charcoal">
          {shade_name}
          <span className="text-charcoal-light font-normal ml-1.5 text-sm">#{shade_code}</span>
        </p>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        <span className="px-2.5 py-1 bg-cream rounded-lg text-xs font-medium text-charcoal-light capitalize">
          {finish}
        </span>
        <span className="px-2.5 py-1 bg-cream rounded-lg text-xs font-medium text-charcoal-light capitalize">
          {coverage} coverage
        </span>
      </div>

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
