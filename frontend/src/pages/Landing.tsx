import { Link } from 'react-router-dom';

const BENEFITS = [
  { icon: '🎬', title: 'Video-based Analysis',         desc: 'Upload up to 30 seconds of cattle footage for deep AI analysis' },
  { icon: '🖼',  title: 'Automatic Frame Extraction',   desc: 'Extracts one frame per second for comprehensive coverage' },
  { icon: '🔍', title: 'Blur Frame Removal',            desc: 'Filters out unclear frames using Laplacian variance scoring' },
  { icon: '📋', title: 'Duplicate Frame Removal',       desc: 'Perceptual hashing eliminates near-identical shots' },
  { icon: '⭐', title: 'AI-assisted BCS Scoring',       desc: 'OpenAI Vision model scores body condition on a 1-5 scale' },
  { icon: '🏥', title: 'Disease-Risk Screening',        desc: 'Detects visible signs of common cattle health conditions' },
  { icon: '💬', title: 'Farmer-friendly Chatbot',       desc: 'Ask questions about your results in plain language' },
  { icon: '🛒', title: 'Product Recommendations',       desc: 'Relevant Chimertech products suggested based on findings' },
];

const ACTION_CARDS = [
  {
    title: '⚡ Live 10s BCS & Disease Scan',
    desc: 'Turn on camera for 10 seconds. Auto-stops stream and delivers instant dual BCS scoring & disease screening results.',
    to: '/live',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    tag: 'Live 10s Camera',
    color: 'green',
  },
  {
    title: 'Cattle BCS Score Detection',
    desc: 'Analyse body condition on the 1-5 scale. Get feeding and management recommendations tailored to your cattle.',
    to: '/bcs',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    tag: 'BCS Analysis',
    color: 'teal',
  },
  {
    title: 'Cattle Disease Detection',
    desc: 'Screen for visible signs of mastitis, skin conditions, locomotion issues and more. AI-assisted, farmer-friendly.',
    to: '/disease',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
    tag: 'Health Screening',
    color: 'amber',
  },
];


export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 hero-glow pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-green-500/[0.03] blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-900/60 bg-green-950/40 mb-8 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-soft" />
            <span className="text-xs font-medium text-green-400">Powered by OpenAI Vision</span>
          </div>

          {/* Heading */}
          <h1 className="text-display-xl font-black text-white mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            AI-Powered Cattle
            <br />
            <span className="text-gradient-green">Health Intelligence</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg text-grey-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up" style={{ animationDelay: '0.2s' }}>
            Analyse cattle body condition, identify visible health risks and receive practical product recommendations from Chimertech.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-16 animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <Link to="/live" className="btn-primary px-8 py-3.5 flex items-center gap-2 font-black shadow-[0_0_20px_rgba(34,197,94,0.4)]">
              <span className="w-2.5 h-2.5 rounded-full bg-black animate-ping" />
              ⚡ Start Live 10s Scan
            </Link>
            <Link to="/bcs" className="btn-secondary px-6 py-3.5">
              BCS Score
            </Link>
            <Link to="/disease" className="btn-secondary px-6 py-3.5">
              Disease Screening
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-px bg-white/[0.05] rounded-2xl overflow-hidden max-w-lg mx-auto animate-fade-up" style={{ animationDelay: '0.4s' }}>
            {[['10s Auto', 'Camera limit'], ['1-5 BCS', 'Score scale'], ['Dual AI', 'BCS + Health']].map(([val, label]) => (
              <div key={label} className="bg-[#0a0a0a] py-5 px-4 text-center">
                <p className="text-lg font-black text-white mb-1">{val}</p>
                <p className="text-[11px] text-grey-600">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Action cards */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <p className="section-label text-center mb-12">Choose Your Analysis</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {ACTION_CARDS.map(card => (
              <Link
                key={card.to}
                to={card.to}
                className="glass-card-hover p-8 group relative overflow-hidden"
              >
                {/* Subtle corner glow */}
                <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl opacity-20
                  ${card.color === 'green' ? 'bg-green-500' : 'bg-amber-500'}`}
                />
                <div className={`w-14 h-14 rounded-2xl mb-5 flex items-center justify-center
                  ${card.color === 'green' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}
                >
                  {card.icon}
                </div>
                <span className={`text-xs font-medium mb-3 block
                  ${card.color === 'green' ? 'text-green-500' : 'text-amber-500'}`}>
                  {card.tag}
                </span>
                <h2 className="text-heading-lg font-bold text-white mb-3 group-hover:text-grey-100 transition-colors">
                  {card.title}
                </h2>
                <p className="text-sm text-grey-500 leading-relaxed mb-6">{card.desc}</p>
                <div className="flex items-center gap-2 text-sm font-medium text-grey-300 group-hover:text-white transition-colors">
                  <span>Get started</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 group-hover:translate-x-1 transition-transform">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-6 pb-32">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="section-label mb-4">Platform Features</p>
            <h2 className="text-display font-black text-white">Everything you need to monitor cattle health</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {BENEFITS.map((b, i) => (
              <div
                key={b.title}
                className="glass-card-hover p-5 animate-fade-up"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <span className="text-2xl mb-4 block">{b.icon}</span>
                <h3 className="text-sm font-semibold text-white mb-1.5">{b.title}</h3>
                <p className="text-xs text-grey-500 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="px-6 pb-24">
        <div className="max-w-3xl mx-auto">
          <div className="glass-card p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/[0.04] to-transparent pointer-events-none" />
            <div className="relative">
              <h2 className="text-display font-black text-white mb-4">Ready to analyse your herd?</h2>
              <p className="text-grey-400 mb-8 text-sm">Upload a cattle video and get AI-powered insights in minutes.</p>
              <Link to="/bcs" className="btn-primary px-10 py-4 text-base">
                Start Free Analysis
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
