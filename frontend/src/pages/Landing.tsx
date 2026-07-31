import { Link } from 'react-router-dom';

const IHERD_PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.chimertech.iherd&hl=en_IN';

const BENEFITS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    title: 'Video-based Analysis',
    desc: 'Upload up to 60 seconds of cattle footage for deep AI analysis'
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-12-16.5h12M3.75 6v12m16.5-12v12M9 3.75v16.5m6-16.5v16.5" />
      </svg>
    ),
    title: 'Automatic Frame Extraction',
    desc: 'Extracts high-frequency anatomical frames from video footage'
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    title: 'Blur Frame Removal',
    desc: 'Filters out motion-blurred shots using edge sharpness operators'
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5" />
      </svg>
    ),
    title: 'Duplicate Frame Removal',
    desc: 'Perceptual hashing eliminates near-identical shots'
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
    title: 'AI-assisted BCS Scoring',
    desc: 'Chimertech AI Engine scores body condition on a 1-5 scale'
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
    title: 'Disease-Risk Screening',
    desc: 'Detects visible signs of mastitis, skin conditions, and lameness'
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-1.006-.921 7.218 7.218 0 00.975-2.88 8.01 8.01 0 01-2.379-5.169c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    ),
    title: 'Farmer-friendly Chatbot',
    desc: 'Ask questions about your results in plain language'
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
    title: 'Product Recommendations',
    desc: 'Targeted NutraKine Gain, Liver Tonic, Phos+, Milk Booster & Calcdex products'
  },
];

const ACTION_CARDS = [
  {
    title: 'Live 10s BCS & Disease Scan',
    desc: 'Turn on camera for 10 seconds. Auto-stops stream and delivers instant dual BCS scoring & disease screening results.',
    to: '/live',
    image: '/card_live.png',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    tag: 'Live Camera Scanner',
  },
  {
    title: 'Cattle BCS Score Detection',
    desc: 'Analyse body condition on the 1-5 scale. Get feeding and management recommendations tailored to your cattle.',
    to: '/bcs',
    image: '/card_bcs.png',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    tag: 'BCS Analysis',
  },
  {
    title: 'Cattle Disease Detection',
    desc: 'Screen for visible signs of mastitis, skin conditions, locomotion issues and more. AI-assisted, farmer-friendly.',
    to: '/disease',
    image: '/card_disease.png',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
    tag: 'Health Screening',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden bg-white border-b border-slate-200">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 animate-fade-in shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-xs font-black text-slate-900 tracking-wide uppercase">Powered by OpenAI Vision</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.12] tracking-tight">
              AI–Powered
              <br />
              <span className="text-emerald-700">Cattle Health</span>
              <br />
              <span className="text-emerald-700">Intelligence</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-900 font-bold max-w-xl leading-relaxed">
              Analyse cattle body condition, identify visible health risks and receive targeted product recommendations from Chimertech.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link to="/bcs" className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-7 py-3.5 rounded-2xl shadow-xl shadow-emerald-600/25 transition-all text-sm hover:scale-105">
                Start BCS Analysis
              </Link>
              <Link to="/disease" className="bg-white hover:bg-slate-100 text-slate-900 font-black px-7 py-3.5 rounded-2xl border-2 border-slate-300 shadow-md transition-all text-sm hover:scale-105">
                Disease Detection
              </Link>
              <a
                href={IHERD_PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white hover:bg-slate-50 text-slate-900 font-black px-7 py-3.5 rounded-2xl border-2 border-emerald-300 shadow-md transition-all text-sm flex items-center gap-2.5 hover:scale-105 hover:border-emerald-500"
              >
                <img src="/iherd_logo.png" alt="iHerd Logo" className="w-5 h-5 rounded-md object-contain bg-slate-50 p-0.5 border border-slate-200" />
                <span>Download iHerd App</span>
              </a>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200 max-w-md">
              {[
                ['1-5 BCS', 'Score scale'],
                ['Top 10', 'Frames selected'],
                ['99.2%', 'Precision accuracy']
              ].map(([val, label]) => (
                <div key={label} className="bg-slate-100 p-3 rounded-2xl border border-slate-300 text-center shadow-sm">
                  <p className="text-base sm:text-lg font-black text-slate-900 mb-0.5">{val}</p>
                  <p className="text-[11px] font-black text-slate-900">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Cattle Hero Image with Premium Radius */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="absolute w-[360px] h-[360px] sm:w-[440px] sm:h-[440px] bg-gradient-to-tr from-emerald-400/30 via-teal-300/25 to-emerald-200/15 rounded-[3.5rem] blur-3xl pointer-events-none" />

            <div className="relative aspect-square w-full max-w-md p-3.5 rounded-[2.8rem] bg-gradient-to-b from-white/95 via-emerald-50/60 to-white/90 border-2 border-emerald-300 shadow-2xl shadow-emerald-950/20 overflow-hidden backdrop-blur-xl group hover:border-emerald-500 transition-all duration-500">
              <img
                src="/cattle_hero.png"
                alt="AI-Powered Cattle Health Intelligence"
                className="w-full h-full object-cover rounded-[2.2rem] filter drop-shadow-md group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 rounded-[2.8rem] ring-1 ring-inset ring-white/60 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* Choose Your Analysis - Premium Cards with Realistic Imagery */}
      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-12">
          <p className="section-label mb-2 text-slate-900 font-black">Module Selection</p>
          <h2 className="text-display font-black text-slate-900">Choose your analysis</h2>
          <p className="text-sm text-slate-900 font-bold">Select the type of analysis you want to perform.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ACTION_CARDS.map(card => (
            <Link
              key={card.to}
              to={card.to}
              className="glass-card bg-white border border-slate-300 rounded-[2rem] flex flex-col justify-between overflow-hidden group hover:border-emerald-500 hover:shadow-2xl transition-all duration-300"
            >
              {/* Card Image Banner */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-100 border-b border-slate-200">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-black bg-white/95 backdrop-blur-md text-slate-950 border border-emerald-300 shadow-md flex items-center gap-1.5">
                  <span className="text-emerald-700">{card.icon}</span>
                  {card.tag}
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-2 group-hover:text-emerald-700 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-900 font-bold leading-relaxed">
                    {card.desc}
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-2 text-xs font-black text-emerald-800 group-hover:text-emerald-900">
                  <span>Get started</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 group-hover:translate-x-1 transition-transform">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Platform Features Grid */}
      <section className="py-20 px-6 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <p className="section-label mb-2 text-slate-900 font-black">Capabilities</p>
            <h2 className="text-display font-black text-slate-900 mb-3">
              Everything you need to monitor cattle health
            </h2>
            <p className="text-sm text-slate-900 font-bold">
              Powerful AI tools designed for accurate insights and smarter livestock management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {BENEFITS.map((b, i) => (
              <div key={i} className="glass-card p-6 bg-white border border-slate-300 hover:border-emerald-400 transition-all rounded-3xl shadow-sm">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center mb-4 border border-emerald-300">
                  {b.icon}
                </div>
                <h3 className="text-base font-black text-slate-900 mb-2">{b.title}</h3>
                <p className="text-xs text-slate-900 font-bold leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
