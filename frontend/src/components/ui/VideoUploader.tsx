import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface VideoUploaderProps {
  onFile: (file: File) => void;
  disabled?: boolean;
  maxDurationSeconds?: number;
}

const MAX_SIZE_MB = 50;
const MAX_IMAGE_SIZE_MB = 15;

export default function VideoUploader({ onFile, disabled, maxDurationSeconds = 60 }: VideoUploaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const validateAndAccept = useCallback((file: File) => {
    setError(null);

    const isImg = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.name);
    const isVid = file.type.startsWith('video/') || /\.(mp4|mov|avi)$/i.test(file.name);

    if (isImg) {
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        setError(`Photo too large. Maximum size is ${MAX_IMAGE_SIZE_MB}MB.`);
        return;
      }
      setIsVideo(false);
      setPreview(URL.createObjectURL(file));
      setFileName(file.name);
      onFile(file);
      return;
    }

    if (isVid) {
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`Video too large. Maximum size is ${MAX_SIZE_MB}MB.`);
        return;
      }

      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        if (video.duration > maxDurationSeconds) {
          setError(`Video too long (${Math.round(video.duration)}s). Maximum is ${maxDurationSeconds} seconds.`);
          return;
        }
        setIsVideo(true);
        setPreview(URL.createObjectURL(file));
        setFileName(file.name);
        onFile(file);
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        setIsVideo(true);
        setPreview(null);
        setFileName(file.name);
        onFile(file);
      };
      video.src = url;
      return;
    }

    setError('Unsupported file type. Please upload a photo (JPG/PNG) or video (MP4/MOV/AVI).');
  }, [onFile, maxDurationSeconds]);

  const onDrop = useCallback((accepted: File[], rejected: any[]) => {
    if (rejected.length > 0) {
      setError('Unsupported file format. Please upload MP4/MOV videos or JPG/PNG photos.');
      return;
    }
    if (accepted[0]) validateAndAccept(accepted[0]);
  }, [validateAndAccept]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
      'video/avi': ['.avi'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    disabled,
  });

  if (fileName) {
    return (
      <div className="glass-card p-6 space-y-4 animate-fade-in bg-white border border-slate-200 shadow-sm">
        {isVideo && preview ? (
          <video
            src={preview}
            controls
            className="w-full rounded-xl max-h-64 object-contain bg-slate-900 border border-slate-200"
          />
        ) : !isVideo && preview ? (
          <img
            src={preview}
            alt="Cattle preview"
            className="w-full rounded-xl max-h-64 object-contain bg-slate-900 border border-slate-200"
          />
        ) : (
          <div className="w-full p-8 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-900">{fileName}</p>
              <p className="text-xs text-emerald-700 mt-1 font-bold">Video File Ready for Frame Analysis</p>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900 truncate">{fileName}</p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              {isVideo ? 'Video ready for frame extraction & analysis' : 'Photo ready for clarity check & analysis'}
            </p>
          </div>
          <button
            onClick={() => { setPreview(null); setFileName(null); setError(null); }}
            className="btn-ghost text-xs text-rose-600 hover:text-rose-700 font-bold"
            disabled={disabled}
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer
          transition-all duration-300 group overflow-hidden bg-white shadow-sm
          ${isDragActive
            ? 'border-emerald-500 bg-emerald-50/60 shadow-lg shadow-emerald-500/10'
            : 'border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50/30'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        {/* Icon */}
        <div className={`
          w-16 h-16 rounded-3xl mx-auto mb-5 flex items-center justify-center transition-all duration-300
          ${isDragActive
            ? 'bg-emerald-600 text-white scale-110 shadow-md'
            : 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-105'
          }
        `}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0c-.698.04-1.344.42-1.736 1.039l-.822 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
        </div>

        {isDragActive ? (
          <p className="text-emerald-700 font-extrabold text-base">Drop your photo or video here to analyze</p>
        ) : (
          <>
            <p className="text-slate-900 font-extrabold text-lg mb-1 tracking-tight">
              Drag & drop cattle photo or video
            </p>
            <p className="text-slate-500 text-xs font-semibold">or click anywhere to browse from your device</p>
          </>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          <span className="badge-grey text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-slate-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            JPG / PNG / WEBP
          </span>
          <span className="badge-grey text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-slate-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
            MP4 / MOV / AVI
          </span>
          <span className="badge-green text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 text-emerald-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Up to 60s
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-200 animate-fade-in">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-sm font-bold text-rose-700">{error}</p>
        </div>
      )}
    </div>
  );
}
