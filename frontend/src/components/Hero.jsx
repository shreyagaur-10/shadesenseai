export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-cream via-blush-light to-cream-dark">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-blush/20 blur-3xl animate-float" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-gold/10 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-rose-light/20 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-medium text-charcoal mb-6 animate-fade-in">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          AI-Powered Shade Matching
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 animate-fade-in-up font-serif">
          Find Your{' '}
          <span className="gradient-text">Perfect Shade</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-charcoal-light max-w-2xl mx-auto mb-10 animate-fade-in-up stagger-2">
          Upload a selfie and let our AI analyze your skin tone, detect your undertone,
          and recommend the best foundation shades — made for{' '}
          <strong className="text-charcoal">Indian & South Asian</strong> skin tones.
        </p>

        {/* CTA */}
        <a
          href="#analyze"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl
            bg-charcoal text-cream font-semibold text-lg
            shadow-lg hover:shadow-xl hover:scale-105
            transition-all duration-300
            animate-fade-in-up stagger-3"
        >
          <span>✨</span> Get Started — It's Free
        </a>

        {/* Trust Badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-charcoal-light animate-fade-in-up stagger-4">
          <span className="flex items-center gap-1.5">
            <span className="text-lg">🔒</span> No Login Required
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-lg">⚡</span> Instant Results
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-lg">🎯</span> Real Products
          </span>
        </div>
      </div>
    </section>
  )
}
