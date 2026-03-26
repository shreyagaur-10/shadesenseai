import { useState } from 'react'
import ShadeCard from './ShadeCard'
import ColorPalette from './ColorPalette'
import SkinToneViz from './SkinToneViz'
import SkinHealth from './SkinHealth'
import LookGuide from './LookGuide'
import ProductCard from './ProductCard'
import ShareCard from './ShareCard'

const CATEGORY_TABS = [
  { key: 'all', label: 'All', emoji: '🛍️' },
  { key: 'foundation', label: 'Foundation', emoji: '🧴' },
  { key: 'lipstick', label: 'Lipstick', emoji: '💄' },
  { key: 'blush', label: 'Blush', emoji: '🌸' },
  { key: 'concealer', label: 'Concealer', emoji: '✨' },
]

export default function Results({ data, imageFile, onTryOn }) {
  const { skin_analysis, recommendations, style_tips, intent } = data
  const [activeTab, setActiveTab] = useState('all')

  const filteredProducts = activeTab === 'all'
    ? recommendations
    : (recommendations || []).filter(
        (p) => (p.type || '').toLowerCase() === activeTab
      )

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

      {/* Color Harmony Palette */}
      <ColorPalette colorHarmony={skin_analysis?.color_harmony} />

      {/* Skin Tone Visualization */}
      {skin_analysis?.luminance != null && (
        <SkinToneViz
          hexColor={skin_analysis.hex_color}
          luminance={skin_analysis.luminance}
          shadeName={skin_analysis.shade_name}
        />
      )}

      {/* Skin Health Dashboard */}
      <SkinHealth skinHealth={skin_analysis?.skin_health_indicators} />

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

      {/* Complete Look Guide */}
      {data.complete_look && (
        <LookGuide completeLook={data.complete_look} />
      )}

      {/* Product Recommendations */}
      <div className="animate-fade-in-up stagger-3">
        <h3 className="text-xl font-semibold text-charcoal mb-4 flex items-center gap-2">
          <span className="text-2xl">💄</span> Recommended Products
        </h3>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer
                ${activeTab === tab.key
                  ? 'bg-gradient-to-r from-blush to-rose text-white shadow-md'
                  : 'glass text-charcoal-light hover:text-charcoal hover:shadow-sm'
                }`}
            >
              <span className="mr-1.5">{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {filteredProducts && filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product, i) => (
              <ProductCard
                key={product.id}
                product={product}
                index={i}
                onTryOn={imageFile ? () => onTryOn(product) : undefined}
                skinHex={skin_analysis?.hex_color}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 glass rounded-2xl">
            <p className="text-charcoal-light">
              {activeTab === 'all'
                ? 'No matching products found. Try a different photo or preference.'
                : `No ${activeTab} matches found. Try the "All" tab to see other recommendations.`}
            </p>
          </div>
        )}
      </div>

      {/* Share Card */}
      <ShareCard skinAnalysis={skin_analysis} recommendations={recommendations} />

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
