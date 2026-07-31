import { useState } from 'react';
import { Link } from 'react-router-dom';

const IHERD_PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.chimertech.iherd&hl=en_IN';

const ACCORDION_ITEMS = [
  {
    id: 'bcs',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-emerald-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
      </svg>
    ),
    title: 'Real-time Cattle BCS Data',
    desc: 'Extract high-precision Body Condition Scores (BCS 1.0 to 5.0 scale) and key visual observations from 10-second camera video streams.',
  },
  {
    id: 'disease',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-blue-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
    title: 'Early Disease Risk Screening',
    desc: 'Screen for early visual signs of mastitis, skin lesions, locomotion issues, and udder inflammation to prevent yield loss.',
  },
  {
    id: 'products',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-amber-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
    title: 'Chimertech Veterinary Product Recommendations',
    desc: 'Automated clinical protocols pairing NutraKine Gain, Liver Tonic, Phos+, Milk Booster, and Calcdex with BCS score diagnoses.',
  },
  {
    id: 'openai',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-indigo-600">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
      </svg>
    ),
    title: 'OpenAI Vision Powered & PDF Export',
    desc: 'Powered by GPT-4 Vision frame extraction. Generate and download instant professional English PDF reports for herd records.',
  },
];

const ANALYSIS_MODULES = [
  {
    title: 'Live 10s BCS & Disease Scan',
    desc: 'Turn on camera for 10 seconds. Auto-stops stream and delivers instant dual BCS scoring & disease screening results.',
    to: '/live',
    image: '/card_live.png',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-emerald-700">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    tag: 'Live Camera Scanner',
  },
  {
    title: 'Cattle BCS Score Detection',
    desc: 'Analyse body condition on the 1–5 scale. Get feeding and management recommendations tailored to your cattle.',
    to: '/bcs',
    image: '/card_bcs.png',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-emerald-700">
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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-emerald-700">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
    tag: 'Health Screening',
  },
];

export default function Landing() {
  const [activeAccordion, setActiveAccordion] = useState<string>('bcs');

  return (
    <div className="min-h-screen bg-slate-50 font-sans overflow-x-hidden">
      {/* SECTION 1: HERO SECTION (Populated STRICTLY with PashuX Project Data) */}
      <section className="relative pt-32 sm:pt-36 lg:pt-40 pb-16 sm:pb-24 px-4 sm:px-6 overflow-hidden bg-gradient-to-b from-sky-50/60 via-white to-slate-50 border-b border-slate-200">
        {/* Soft Radial Background Glow */}
        <div className="absolute top-10 right-10 w-[300px] sm:w-[700px] h-[300px] sm:h-[700px] bg-gradient-to-br from-cyan-400/20 via-sky-300/15 to-emerald-300/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-gradient-to-tr from-sky-200/20 to-teal-300/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Text & CTAs with Project Data */}
          <div className="lg:col-span-6 space-y-5 sm:space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 animate-fade-in shadow-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-[11px] sm:text-xs font-black text-slate-900 tracking-wide uppercase">PashuX AI • OpenAI Vision Inside</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.12] tracking-tight">
              Cattle Health & BCS AI Intelligence
            </h1>

            <p className="text-sm sm:text-lg text-slate-700 font-bold leading-relaxed max-w-xl">
              Analyse cattle body condition scores (BCS 1-5 scale), detect early disease risks, and receive targeted product recommendations from Chimertech with our 10-second camera AI scanner.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1">
              <Link
                to="/live"
                className="w-full sm:w-auto text-center px-7 py-3.5 sm:py-4 rounded-2xl bg-[#0f172a] hover:bg-slate-800 text-white font-black text-xs sm:text-sm shadow-xl shadow-slate-900/20 hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                <span>Start Live 10s Camera Scan</span>
              </Link>

              <a
                href={IHERD_PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto text-center px-6 py-3.5 sm:py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-300 font-black text-xs sm:text-sm shadow-md hover:scale-105 transition-all flex items-center justify-center gap-2.5"
              >
                <img src="/iherd_logo.png" alt="iHerd Logo" className="w-5 h-5 rounded-md object-contain" />
                <span>Get iHerd App</span>
              </a>
            </div>
          </div>

          {/* Right Column: Premium iPhone Mockups Overlapping */}
          <div className="lg:col-span-6 relative flex justify-center items-center overflow-hidden py-4">
            {/* Background Glow Aura */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/30 to-sky-400/30 rounded-full blur-3xl scale-95" />

            <div className="relative w-full max-w-lg h-[440px] sm:h-[520px] flex items-center justify-center scale-[0.82] sm:scale-100 origin-center transition-transform">
              {/* Rear iPhone: Live Camera Stream Mockup */}
              <div className="absolute left-2 sm:left-8 top-6 w-[220px] sm:w-[260px] rounded-[44px] bg-slate-900 p-2.5 sm:p-3 shadow-2xl border-4 border-slate-800 -rotate-6 transition-transform hover:-rotate-3 duration-500">
                <div className="relative rounded-[36px] overflow-hidden bg-black aspect-[9/19.5] border border-slate-700 shadow-inner">
                  {/* Dynamic Island */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 sm:w-20 h-3.5 sm:h-4 bg-black rounded-full z-30" />
                  
                  {/* Phone Header */}
                  <div className="pt-7 px-3 sm:px-4 pb-2 bg-slate-900/90 backdrop-blur-sm border-b border-slate-800 text-white flex items-center justify-between text-xs z-20 relative">
                    <span className="font-black tracking-wider text-emerald-400 text-[10px] sm:text-[11px]">PashuX AI Scanner</span>
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  </div>

                  {/* Cattle Image on Screen */}
                  <img
                    src="/pashux_phone_camera.png"
                    alt="PashuX Live Camera Screen"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Front iPhone: Diagnostic Result Card Mockup */}
              <div className="absolute right-2 sm:right-8 top-0 w-[230px] sm:w-[275px] rounded-[44px] bg-slate-900 p-2.5 sm:p-3 shadow-2xl border-4 border-slate-800 rotate-3 z-10 transition-transform hover:rotate-0 duration-500">
                <div className="relative rounded-[36px] overflow-hidden bg-slate-50 aspect-[9/19.5] border border-slate-300 flex flex-col">
                  {/* Dynamic Island */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 sm:w-20 h-3.5 sm:h-4 bg-black rounded-full z-30" />

                  {/* Phone Header App Name */}
                  <div className="pt-7 px-3 sm:px-4 pb-2 bg-white border-b border-slate-200 text-slate-900 flex items-center justify-between z-20">
                    <div className="flex items-center gap-1.5">
                      <img src="/chimertech_logo.png" alt="Logo" className="w-3.5 sm:w-4 h-3.5 sm:h-4 object-contain" />
                      <span className="font-black text-xs tracking-tight">PashuX</span>
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">BCS 3.5</span>
                  </div>

                  {/* Cattle Image & Live UI */}
                  <div className="relative flex-1 bg-slate-100 overflow-hidden">
                    <img
                      src="/pashux_phone_bcs.png"
                      alt="PashuX BCS Diagnostic Screen"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: ACCORDION FEATURE LIST WITH PHONE PODIUM (Spike Screenshot 2 Style) */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Accordion Features */}
          <div className="lg:col-span-6 space-y-4 text-left">
            <p className="text-xs font-black uppercase tracking-widest text-emerald-700 mb-1">PLATFORM CAPABILITIES</p>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mb-6 sm:mb-8">
              Everything you need to monitor cattle health in real-time
            </h2>

            <div className="space-y-3">
              {ACCORDION_ITEMS.map((item) => {
                const isOpen = activeAccordion === item.id;
                return (
                  <div
                    key={item.id}
                    className={`rounded-2xl border transition-all duration-300 bg-white overflow-hidden shadow-sm ${
                      isOpen ? 'border-sky-300 shadow-md ring-2 ring-sky-100' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <button
                      onClick={() => setActiveAccordion(isOpen ? '' : item.id)}
                      className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-3 font-black text-slate-900 text-sm sm:text-base"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 flex-shrink-0">
                          {item.icon}
                        </div>
                        <span className="text-slate-900 font-black">{item.title}</span>
                      </div>
                      <span className="text-lg font-bold text-slate-400">
                        {isOpen ? '−' : '+'}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 text-xs sm:text-sm font-bold text-slate-600 leading-relaxed border-t border-slate-100">
                        {item.desc}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Phone Podium Container */}
          <div className="lg:col-span-6 flex justify-center items-center py-4">
            <div className="relative w-full max-w-md h-[400px] sm:h-[480px] rounded-[36px] sm:rounded-[48px] bg-gradient-to-b from-sky-100/90 via-sky-50 to-teal-50 border border-sky-200 p-6 sm:p-8 flex items-center justify-center shadow-xl overflow-hidden">
              {/* Background Circular Rings */}
              <div className="absolute w-[280px] sm:w-[360px] h-[280px] sm:h-[360px] rounded-full border border-sky-300/60 pointer-events-none animate-pulse" />
              <div className="absolute w-[220px] sm:w-[280px] h-[220px] sm:h-[280px] rounded-full border-2 border-sky-400/40 pointer-events-none" />

              {/* Centered Phone Screen with PashuX App Name */}
              <div className="relative w-[210px] sm:w-[240px] rounded-[40px] bg-slate-900 p-2.5 sm:p-3 shadow-2xl border-4 border-slate-800 z-10">
                <div className="relative rounded-[32px] overflow-hidden bg-white aspect-[9/19] border border-slate-200 flex flex-col">
                  {/* Dynamic Island */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 sm:w-16 h-3.5 bg-black rounded-full z-30" />

                  {/* Phone Header */}
                  <div className="pt-6 px-3 pb-2 bg-white border-b border-slate-200 flex items-center justify-between z-20">
                    <span className="text-xs font-black text-slate-900 tracking-tight flex items-center gap-1">
                      <img src="/chimertech_logo.png" alt="Logo" className="w-3.5 h-3.5 object-contain" />
                      PashuX
                    </span>
                    <span className="text-[9px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">ACTIVE</span>
                  </div>

                  {/* Image Display */}
                  <div className="relative flex-1 bg-slate-50">
                    <img
                      src="/pashux_phone_bcs.png"
                      alt="PashuX Screen on Podium"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: CHOOSE YOUR ANALYSIS (Original 3-Card Design with Real Cattle Images) */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Choose your analysis</h2>
          <p className="text-sm font-bold text-slate-600">Select the type of analysis you want to perform.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ANALYSIS_MODULES.map(card => (
            <Link
              key={card.to}
              to={card.to}
              className="glass-card bg-white border border-slate-300 rounded-[2rem] flex flex-col justify-between overflow-hidden group hover:border-emerald-500 hover:shadow-2xl transition-all duration-300 text-left"
            >
              {/* Card Image Banner */}
              <div className="relative h-48 w-full overflow-hidden bg-slate-100 border-b border-slate-200">
                <img
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-black bg-white/95 backdrop-blur-md text-slate-950 border border-emerald-300 shadow-md flex items-center gap-1.5">
                  {card.icon}
                  <span>{card.tag}</span>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-lg font-black text-slate-900 mb-2 group-hover:text-emerald-700 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-600 font-bold leading-relaxed">
                    {card.desc}
                  </p>
                </div>

                <div className="pt-2 flex items-center gap-2 text-xs font-black text-emerald-700 group-hover:text-emerald-800">
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
    </div>
  );
}
