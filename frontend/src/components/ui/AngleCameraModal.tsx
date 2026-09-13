import React, { useState, useEffect, useRef } from 'react';

export interface AngleCameraModalProps {
  angleName: string;
  angleLabel: string;
  onCapture: (file: File) => void;
  onClose: () => void;
}

export const AngleCameraModal: React.FC<AngleCameraModalProps> = ({ angleName, angleLabel, onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nativeInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasStream, setHasStream] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const stopTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping track:', e);
        }
      });
      streamRef.current = null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function startCamera() {
      setIsInitializing(true);
      setCameraError(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (isMounted) {
          setCameraError('Live camera streaming is not supported in this browser. Please use your device camera or upload a photo.');
          setIsInitializing(false);
        }
        return;
      }

      // Progressive constraint fallback list — critical for iOS Safari WebKit
      const constraintCandidates: MediaStreamConstraints[] = [
        {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        },
        {
          video: {
            facingMode: { ideal: 'environment' },
          },
          audio: false,
        },
        {
          video: {
            facingMode: 'environment',
          },
          audio: false,
        },
        {
          video: true,
          audio: false,
        },
      ];

      let stream: MediaStream | null = null;
      let lastError: any = null;

      for (const constraints of constraintCandidates) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (stream) break;
        } catch (err: any) {
          lastError = err;
          console.warn('getUserMedia attempt failed with constraints:', constraints, err);
        }
      }

      if (!isMounted) {
        if (stream) {
          stream.getTracks().forEach((t) => t.stop());
        }
        return;
      }

      if (!stream) {
        console.error('All camera constraint attempts failed:', lastError);
        const isPermissionDenied =
          lastError?.name === 'NotAllowedError' ||
          lastError?.name === 'PermissionDeniedError' ||
          lastError?.name === 'SecurityError';

        setCameraError(
          isPermissionDenied
            ? 'Camera access was denied. You can tap below to use your device camera directly, or enable Camera permissions in iOS Settings -> Safari -> Camera.'
            : 'Could not start live camera preview. Please tap below to capture using your phone camera directly.'
        );
        setIsInitializing(false);
        return;
      }

      streamRef.current = stream;
      setHasStream(true);
      setIsInitializing(false);

      if (videoRef.current) {
        const video = videoRef.current;
        // iOS Safari critical attributes
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        video.setAttribute('autoplay', 'true');
        video.setAttribute('muted', 'true');
        video.muted = true;
        video.playsInline = true;
        video.srcObject = stream;

        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Video play interrupted or delayed:', err);
          });
        }

        video.onloadedmetadata = () => {
          video.play().catch((e) => console.warn('Playback error on loadedmetadata:', e));
        };
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      stopTracks();
    };
  }, []);

  const handleClose = () => {
    stopTracks();
    onClose();
  };

  const handleSnap = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Check if video actually has dimensions
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `${angleName}_camera_capture.jpg`, { type: 'image/jpeg' });
          stopTracks();
          onCapture(file);
          onClose();
        }
      },
      'image/jpeg',
      0.92
    );
  };

  const handleNativeFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      stopTracks();
      onCapture(file);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex flex-col items-center justify-between p-4">
      {/* Hidden file inputs for direct iOS camera and photo gallery fallback */}
      <input
        ref={nativeInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        capture="environment"
        className="hidden"
        onChange={handleNativeFileSelected}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="hidden"
        onChange={handleNativeFileSelected}
      />

      {/* Header */}
      <div className="w-full max-w-xl flex items-center justify-between py-2 text-white">
        <div>
          <h3 className="text-sm font-black tracking-wider uppercase">{angleLabel} Camera</h3>
          <p className="text-xs text-slate-300">Align cattle within the outline frame</p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="text-slate-400 hover:text-white p-2 text-xl font-bold transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Viewport Box */}
      <div className="relative w-full max-w-2xl h-[460px] sm:h-[540px] bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center">
        {/* Live video */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${cameraError ? 'hidden' : 'block'}`}
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Loading Spinner */}
        {isInitializing && !cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-20 text-white gap-3">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-slate-300">Accessing camera...</p>
          </div>
        )}

        {/* Camera Error / Fallback Card */}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-950 text-center z-30">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h4 className="text-base font-bold text-white mb-2">Camera Unavailable</h4>
            <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">{cameraError}</p>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
              <button
                type="button"
                onClick={() => nativeInputRef.current?.click()}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Open Phone Camera</span>
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 active:scale-95 transition-all"
              >
                Choose Photo
              </button>
            </div>
          </div>
        )}

        {/* Alignment Outlines */}
        {!cameraError && hasStream && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-0 overflow-hidden">
            {(angleName.includes('muzzle') || angleName === 'front' || angleName === 'straight' || angleName === 'left' || angleName === 'right') && (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src="/outlines/mouth.jpg"
                  alt="Muzzle Outline"
                  className="w-full h-full object-contain opacity-90 scale-[1.35] sm:scale-[1.45] transform origin-center"
                  style={{ filter: 'invert(1) contrast(160%)', mixBlendMode: 'screen' }}
                />
                <span className="absolute top-3 text-[11px] font-black text-emerald-400 uppercase tracking-wider bg-slate-900/85 px-4 py-1.5 rounded-full border border-emerald-500/50 shadow-lg">
                  {angleName === 'left' || angleName === 'muzzle_left' 
                    ? 'ALIGN MUZZLE PATTERN - SLIGHT LEFT' 
                    : angleName === 'right' || angleName === 'muzzle_right'
                    ? 'ALIGN MUZZLE PATTERN - SLIGHT RIGHT'
                    : 'ALIGN FRONT HEAD & MUZZLE'}
                </span>
              </div>
            )}

            {angleName === 'right_body' && (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src="/outlines/right.jpg"
                  alt="Right Side Outline"
                  className="w-full h-full object-contain opacity-90 scale-[1.38] sm:scale-[1.5] transform origin-center"
                  style={{ filter: 'invert(1) contrast(160%)', mixBlendMode: 'screen' }}
                />
                <span className="absolute top-3 text-[11px] font-black text-emerald-400 uppercase tracking-wider bg-slate-900/85 px-4 py-1.5 rounded-full border border-emerald-500/50 shadow-lg">
                  ALIGN RIGHT SIDE PROFILE
                </span>
              </div>
            )}

            {angleName === 'left_body' && (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src="/outlines/left.jpg"
                  alt="Left Side Outline"
                  className="w-full h-full object-contain opacity-90 scale-[1.38] sm:scale-[1.5] transform origin-center"
                  style={{ filter: 'invert(1) contrast(160%)', mixBlendMode: 'screen' }}
                />
                <span className="absolute top-3 text-[11px] font-black text-emerald-400 uppercase tracking-wider bg-slate-900/85 px-4 py-1.5 rounded-full border border-emerald-500/50 shadow-lg">
                  ALIGN LEFT SIDE PROFILE
                </span>
              </div>
            )}

            {angleName === 'back' && (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src="/outlines/back.jpg"
                  alt="Back Side Outline"
                  className="w-full h-full object-contain opacity-90 scale-[1.35] sm:scale-[1.45] transform origin-center"
                  style={{ filter: 'invert(1) contrast(160%)', mixBlendMode: 'screen' }}
                />
                <span className="absolute top-3 text-[11px] font-black text-emerald-400 uppercase tracking-wider bg-slate-900/85 px-4 py-1.5 rounded-full border border-emerald-500/50 shadow-lg">
                  ALIGN REAR HINDQUARTERS
                </span>
              </div>
            )}

            {angleName === 'udder' && (
              <div className="relative w-full h-full flex items-center justify-center">
                <span className="absolute top-3 text-[11px] font-black text-purple-300 uppercase tracking-wider bg-slate-900/85 px-4 py-1.5 rounded-full border border-purple-500/50 shadow-lg">
                  UDDER & TEATS CLOSE-UP CAMERA
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="w-full max-w-xl flex flex-col items-center justify-center py-3 gap-2">
        {!cameraError && (
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleSnap}
              title="Capture Photo"
              className="w-16 h-16 rounded-full bg-white border-4 border-emerald-500 shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-600" />
            </button>
          </div>
        )}

        {/* Small fallback shortcut to native camera even when stream is working */}
        {!cameraError && (
          <button
            type="button"
            onClick={() => nativeInputRef.current?.click()}
            className="text-[11px] text-slate-400 hover:text-emerald-400 underline decoration-slate-600 font-medium transition-colors pt-1"
          >
            Having trouble? Tap to use iPhone Native Camera
          </button>
        )}
      </div>
    </div>
  );
};

export default AngleCameraModal;
