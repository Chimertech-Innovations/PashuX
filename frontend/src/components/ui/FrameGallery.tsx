import { useState } from 'react';

interface Frame {
  url: string;
  frameNumber: number;
  clarityScore?: number;
}

interface Props {
  frames: Frame[];
  label?: string;
  /** When true, shows a pulsing "Sending to AI" indicator instead of a static count */
  isLoading?: boolean;
}

export default function FrameGallery({ frames, label = 'Selected Frames', isLoading = false }: Props) {
  const [selected, setSelected] = useState<Frame | null>(null);

  if (!frames.length) return null;

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <h3 className="text-sm font-semibold text-white">{label}</h3>
          {isLoading && (
            <span className="flex items-center gap-1.5">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-1 h-1 rounded-full bg-green-500"
                  style={{ animation: `pulse-soft 1.2s ease-in-out ${i * 0.2}s infinite` }}
                />
              ))}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isLoading ? (
            <span className="badge-green text-[10px] animate-pulse">Sending to AI…</span>
          ) : (
            <span className="badge-grey">{frames.length} frames</span>
          )}
        </div>
      </div>

      {/* Stats bar — only when not loading */}
      {!isLoading && frames.some(f => f.clarityScore !== undefined) && (
        <div className="flex items-center gap-4 mb-4 px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[10px] text-grey-500">
              Avg clarity:{' '}
              <span className="text-green-400 font-semibold">
                {Math.round(
                  frames.reduce((s, f) => s + (f.clarityScore ?? 0), 0) / frames.length
                )}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[10px] text-grey-500">
              Sharpest:{' '}
              <span className="text-blue-400 font-semibold">
                #{frames.reduce((best, f) => (f.clarityScore ?? 0) > (best.clarityScore ?? 0) ? f : best, frames[0]).frameNumber}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {frames.map(frame => (
          <button
            key={frame.frameNumber}
            onClick={() => setSelected(frame)}
            className="relative group rounded-xl overflow-hidden aspect-[4/3] bg-grey-900 cursor-pointer border border-white/[0.06] hover:border-white/20 transition-all duration-200"
          >
            {frame.url ? (
              <img
                src={frame.url}
                alt={`Frame ${frame.frameNumber}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-grey-900">
                <span className="text-xs text-grey-600">Frame {frame.frameNumber}</span>
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
              </svg>
            </div>

            {/* Frame number badge */}
            <div className="absolute bottom-1.5 left-1.5">
              <span className="text-[9px] font-medium bg-black/60 text-grey-300 px-1.5 py-0.5 rounded-md">
                #{frame.frameNumber}
              </span>
            </div>

            {/* Clarity score badge */}
            {frame.clarityScore !== undefined && (
              <div className="absolute top-1.5 right-1.5">
                <span
                  className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md"
                  style={{
                    backgroundColor: frame.clarityScore >= 300 ? 'rgba(34,197,94,0.85)' :
                                     frame.clarityScore >= 150 ? 'rgba(234,179,8,0.85)'  :
                                                                 'rgba(239,68,68,0.85)',
                    color: '#fff',
                  }}
                >
                  {Math.round(frame.clarityScore)}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6 animate-fade-in"
          onClick={() => setSelected(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <img
              src={selected.url}
              alt={`Frame ${selected.frameNumber}`}
              className="w-full rounded-2xl"
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-sm text-grey-400">Frame #{selected.frameNumber}</span>
              {selected.clarityScore !== undefined && (
                <span className="badge-green text-xs">Clarity: {Math.round(selected.clarityScore)}</span>
              )}
            </div>
            <button
              onClick={() => setSelected(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-grey-800 flex items-center justify-center text-grey-300 hover:text-white transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
