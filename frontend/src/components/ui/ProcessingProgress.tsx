import type { ProcessingStatus } from '@/types';

interface Step {
  id: ProcessingStatus;
  label: string;
  description: string;
}

const STEPS: Step[] = [
  { id: 'uploading',          label: 'Video uploaded',              description: 'Securely uploading your video to the server' },
  { id: 'extracting',         label: 'Extracting frames',           description: 'Pulling one frame for every second of footage' },
  { id: 'filtering_blur',     label: 'Removing blurry frames',      description: 'Using Laplacian variance to filter unclear frames' },
  { id: 'removing_duplicates',label: 'Removing duplicate frames',   description: 'Perceptual hashing to eliminate near-identical shots' },
  { id: 'ranking',            label: 'Selecting best 10 frames',    description: 'Ranking by image clarity and selecting top frames' },
  { id: 'sending_ai',         label: 'Sending frames to AI',        description: 'Transmitting selected frames to Gemini Vision model' },
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
    <div className="glass-card p-6 space-y-2 animate-fade-in">
      <h3 className="text-sm font-semibold text-white mb-5">
        {status === 'completed' ? 'Analysis complete' :
         status === 'frames_ready' ? '✅ Frames Extracted & Cleaned' :
         'Processing video…'}
      </h3>

      {STEPS.map(step => {
        const state = getStepState(step, status);
        return (
          <div key={step.id} className={`step-item ${state}`}>
            {/* Dot */}
            <div className={`step-dot ${state}`}>
              {state === 'done' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : state === 'active' ? (
                <span className="w-2 h-2 rounded-full bg-black animate-ping" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-30" />
              )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${
                state === 'done'   ? 'text-grey-300' :
                state === 'active' ? 'text-green-400' : 'text-grey-600'
              }`}>
                {step.label}
              </p>
              {state === 'active' && (
                <p className="text-xs text-grey-500 mt-0.5 animate-fade-in">{step.description}</p>
              )}
            </div>

            {/* Active loader */}
            {state === 'active' && (
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <span
                    key={i}
                    className="w-1 h-1 rounded-full bg-green-500"
                    style={{ animation: `pulse-soft 1.2s ease-in-out ${i * 0.2}s infinite` }}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
