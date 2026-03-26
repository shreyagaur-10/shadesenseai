import ShadeCard from './ShadeCard'
import ProductCard from './ProductCard'

export default function Results({ data }) {
  const { skin_analysis, recommendations, style_tips, intent } = data

  return (
    <div className="space-y-8">
      {/* Section Title */}
      <div className="text-center animate-fade-in">
        <h2 className="text-3xl font-bold font-serif text-charcoal">
          Your Results ✨
        </h2>
        <p className="text-charcoal-light mt-2">
          Here's what our AI found for you
        </p>
      </div>

      {/* Shade Analysis Card */}
      <ShadeCard skinAnalysis={skin_analysis} />

      {/* Detected Preferences */}
      {intent?.preferences_detected && (
        <div className="glass rounded-2xl p-6 animate-fade-in-up stagger-2">
          <h3 className="text-lg font-semibold text-charcoal mb-3 flex items-center gap-2">
            <span className="text-xl">🎯</span> Your Preferences
          </h3>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 bg-blush-light/40 rounded-full text-sm font-medium text-charcoal capitalize">
              📅 {intent.occasion}
            </span>
            <span className="px-3 py-1.5 bg-blush-light/40 rounded-full text-sm font-medium text-charcoal capitalize">
              💫 {intent.look} look
            </span>
            <span className="px-3 py-1.5 bg-blush-light/40 rounded-full text-sm font-medium text-charcoal capitalize">
              🎨 {intent.coverage} coverage
            </span>
            <span className="px-3 py-1.5 bg-blush-light/40 rounded-full text-sm font-medium text-charcoal capitalize">
              ✨ {intent.finish} finish
            </span>
          </div>
        </div>
      )}

      {/* Product Recommendations */}
      <div className="animate-fade-in-up stagger-3">
        <h3 className="text-xl font-semibold text-charcoal mb-6 flex items-center gap-2">
          <span className="text-2xl">💄</span> Recommended Products
        </h3>

        {recommendations && recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 glass rounded-2xl">
            <p className="text-charcoal-light">
              No matching products found. Try a different photo or preference.
            </p>
          </div>
        )}
      </div>

      {/* Style Tips */}
      {style_tips && style_tips.length > 0 && (
        <div className="glass rounded-2xl p-6 animate-fade-in-up stagger-4">
          <h3 className="text-lg font-semibold text-charcoal mb-4 flex items-center gap-2">
            <span className="text-xl">💡</span> Pro Tips For You
          </h3>
          <ul className="space-y-3">
            {style_tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-charcoal-light leading-relaxed">
                <span className="text-gold mt-0.5 flex-shrink-0">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-center text-xs text-charcoal-light/60 pt-4">
        💡 Results are AI-generated and may vary. We recommend testing products in-store when possible.
        Shade matches are based on image analysis and may be affected by lighting conditions.
      </p>
    </div>
  )
}
