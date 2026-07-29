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

      // Check duration via HTMLVideoElement
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
        setError('Could not read video file. Please try a different file.');
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

  if (preview && fileName) {
    return (
      <div className="glass-card p-6 space-y-4 animate-fade-in">
        {isVideo ? (
          <video
            src={preview}
            controls
            className="w-full rounded-xl max-h-64 object-contain bg-black"
          />
        ) : (
          <img
            src={preview}
            alt="Cattle preview"
            className="w-full rounded-xl max-h-64 object-contain bg-black"
          />
        )}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white truncate">{fileName}</p>
            <p className="text-xs text-grey-500 mt-0.5">
              {isVideo ? 'Video ready for frame extraction & analysis' : 'Photo ready for clarity check & analysis'}
            </p>
          </div>
          <button
            onClick={() => { setPreview(null); setFileName(null); setError(null); }}
            className="btn-ghost text-xs text-red-400 hover:text-red-300"
            disabled={disabled}
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer
          transition-all duration-300 group
          ${isDragActive
            ? 'border-green-500/60 bg-green-500/[0.04]'
            : 'border-white/[0.08] hover:border-white/20 hover:bg-white/[0.02]'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        {/* Icon */}
        <div className={`
          w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all duration-300
          ${isDragActive ? 'bg-green-500/20 scale-110' : 'bg-white/[0.06] group-hover:bg-white/[0.1]'}
        `}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
            className={`w-7 h-7 transition-colors ${isDragActive ? 'text-green-400' : 'text-grey-400 group-hover:text-grey-200'}`}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0c-.698.04-1.344.42-1.736 1.039l-.822 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
        </div>

        {isDragActive ? (
          <p className="text-green-400 font-medium text-sm">Drop your photo or video here</p>
        ) : (
          <>
            <p className="text-white font-medium text-sm mb-1">
              Drag & drop photo or video of cattle
            </p>
            <p className="text-grey-500 text-xs">or click to select file</p>
          </>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
          <span className="badge-grey text-[10px]">📷 JPG / PNG / WEBP</span>
          <span className="badge-grey text-[10px]">🎥 MP4 / MOV / AVI</span>
          <span className="badge-grey text-[10px]">Max 60s Video</span>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 animate-fade-in">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}

