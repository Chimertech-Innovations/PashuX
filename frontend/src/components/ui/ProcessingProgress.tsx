import type { ProcessingStatus } from '@/types';

interface Step {
  id: ProcessingStatus;
  label: string;
  description: string;
}

const STEPS: Step[] = [
  { id: 'uploading',          label: 'Video uploaded',              description: 'Securely uploading your video to the server' },
  { id: 'extracting',         label: 'Extracting frames',           description: 'Pulling high-clarity frames from footage' },
  { id: 'filtering_blur',     label: 'Removing blurry frames',      description: 'Using Laplacian variance to filter unclear frames' },
  { id: 'removing_duplicates',label: 'Removing duplicate frames',   description: 'Perceptual hashing to eliminate near-identical shots' },
  { id: 'ranking',            label: 'Selecting best frames',    description: 'Ranking by image clarity and selecting top frames' },
  { id: 'sending_ai',         label: 'Sending frames to AI',        description: 'Transmitting selected frames to Chimertech AI Vision Engine' },
  { id: 'analysing',          label: 'Calculating result',          description: 'AI analysing cattle condition and generating report' },
];

const STATUS_ORDER: ProcessingStatus[] = [
  'uploading', 'extracting', 'filtering_blur', 'removing_duplicates',
  'ranking', 'frames_ready', 'sending_ai', 'analysing', 'completed'
];

function getStepState(step: Step, current: ProcessingStatus): 'done' | 'active' | 'pending' {
  if (current === 'completed') return 'done';

  const currentIdx = STATUS_ORDER.indexOf(current);
  const stepIdx    = STATUS_ORDER.indexOf(step.id);

  if (current === 'frames_ready') {
    if (step.id === 'uploading' || step.id === 'extracting' || step.id === 'filtering_blur' || step.id === 'removing_duplicates' || step.id === 'ranking') {
      return 'done';
    }
    return 'pending';
  }

  if (stepIdx < currentIdx)   return 'done';
  if (stepIdx === currentIdx) return 'active';
  return 'pending';
}

interface Props {
  status: ProcessingStatus;
}

export default function ProcessingProgress({ status }: Props) {
  if (status === 'idle' || status === 'error') return null;

  return (
    <div className="glass-card p-6 space-y-3 animate-fade-in border border-slate-200 bg-white shadow-sm relative overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
        <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          {status === 'completed' ? 'Analysis Complete' :
           status === 'frames_ready' ? 'Frames Cleaned & Stored' :
           'Processing Video Pipeline…'}
        </h3>
        <span className="badge-green text-[10px] uppercase font-bold tracking-wider">AI Pipeline</span>
      </div>

      <div className="space-y-2">
        {STEPS.map(step => {
          const state = getStepState(step, status);
          return (
            <div
              key={step.id}
              className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${
                state === 'active' ? 'bg-emerald-50 border border-emerald-300 shadow-sm' :
                state === 'done'   ? 'bg-slate-50 border border-slate-200/60' :
                'opacity-50 border border-transparent'
              }`}
            >
              {/* Dot */}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all ${
                state === 'done'   ? 'bg-emerald-600 text-white' :
                state === 'active' ? 'bg-emerald-500 text-white animate-pulse' :
                'bg-slate-200 text-slate-500'
              }`}>
                {state === 'done' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : state === 'active' ? (
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-extrabold ${
                  state === 'done'   ? 'text-slate-800' :
                  state === 'active' ? 'text-emerald-800' : 'text-slate-500'
                }`}>
                  {step.label}
                </p>
                {state === 'active' && (
                  <p className="text-[11px] text-slate-700 font-bold mt-0.5 animate-fade-in">{step.description}</p>
                )}
              </div>

              {/* Active loader */}
              {state === 'active' && (
                <div className="flex gap-1.5">
                  {[0,1,2].map(i => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                      style={{ animation: `pulse-soft 1.2s ease-in-out ${i * 0.25}s infinite` }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
