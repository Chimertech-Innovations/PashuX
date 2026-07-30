import { useState, useRef, useEffect, useCallback } from 'react';

interface LiveCameraScannerProps {
  onFile: (file: File) => void;
  onInstantSnapshot?: (file: File) => void;
  disabled?: boolean;
}

export default function LiveCameraScanner({ onFile, onInstantSnapshot, disabled }: LiveCameraScannerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(10.0);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [error, setError] = useState<string | null>(null);

  // Fullscreen API toggle
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => setIsFullscreen(true));
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => setIsFullscreen(false));
      } else {
        setIsFullscreen(false);
      }
    }
  }, []);

  useEffect(() => {
    const handleFs = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFs);
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, []);

  // Stop camera tracks cleanly so hardware turns off
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Stop recording & camera tracks when timer ends
  const finishRecording = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    setIsRecording(false);

    // Stop MediaRecorder if recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Explicitly shut down camera stream hardware immediately after 10s
    stopCameraStream();
  }, [stopCameraStream]);

  // Turn on device camera stream
  const startCameraStream = useCallback(async () => {
    setError(null);
    try {
      if (streamRef.current) {
        stopCameraStream();
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      setError(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Camera permission was denied. Please allow camera access in your browser.'
          : 'Could not access device camera. Please check your camera permissions.'
      );
      setIsCameraActive(false);
    }
  }, [facingMode, stopCameraStream]);

  // Handle recorded blob after recorder finishes
  const handleDataAvailable = useCallback((e: BlobEvent) => {
    if (e.data && e.data.size > 0) {
      recordedChunksRef.current.push(e.data);
    }
  }, []);

  const handleStopRecording = useCallback(() => {
    const mimeType = mediaRecorderRef.current?.mimeType || 'video/webm';
    const blob = new Blob(recordedChunksRef.current, { type: mimeType });
    recordedChunksRef.current = [];

    if (blob.size > 0) {
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const file = new File([blob], `live_scan_10s.${ext}`, { type: mimeType });
      onFile(file);
    }
  }, [onFile]);

  // Capture instant snapshot frame from live video canvas
  const captureSnapshot = useCallback(() => {
    if (!videoRef.current || videoRef.current.videoWidth === 0) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
      if (blob && onInstantSnapshot) {
        const file = new File([blob], 'live_camera_snapshot.jpg', { type: 'image/jpeg' });
        onInstantSnapshot(file);
      }
    }, 'image/jpeg', 0.92);
  }, [onInstantSnapshot]);

  // Start 10-second countdown and video recording
  const startScan = useCallback(() => {
    if (!streamRef.current || !isCameraActive) return;

    recordedChunksRef.current = [];
    setTimeLeft(10.0);
    setIsRecording(true);

    // Trigger instant snapshot capture 500ms into live stream
    setTimeout(() => {
      captureSnapshot();
    }, 500);

    try {
      const options = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? { mimeType: 'video/webm;codecs=vp9' }
        : MediaRecorder.isTypeSupported('video/webm')
        ? { mimeType: 'video/webm' }
        : MediaRecorder.isTypeSupported('video/mp4')
        ? { mimeType: 'video/mp4' }
        : undefined;

      const mediaRecorder = new MediaRecorder(streamRef.current, options);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = handleDataAvailable;
      mediaRecorder.onstop = handleStopRecording;
      mediaRecorder.start(200); // collect 200ms slice
    } catch (err: any) {
      setError('MediaRecorder error on this browser. Snapshot mode active.');
    }

    const startTime = Date.now();
    const durationMs = 10000;

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    timerIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, (durationMs - elapsed) / 1000);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        finishRecording();
      }
    }, 100);
  }, [isCameraActive, captureSnapshot, handleDataAvailable, handleStopRecording, finishRecording]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      stopCameraStream();
    };
  }, [stopCameraStream]);

  // Toggle camera direction (rear/front)
  const toggleFacingMode = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
    if (isCameraActive) {
      setTimeout(() => startCameraStream(), 100);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`transition-all duration-300 w-full max-w-full overflow-hidden ${
        isFullscreen
          ? 'fixed inset-0 z-[99999] bg-black text-white p-3 sm:p-6 flex flex-col justify-between overflow-hidden'
          : 'glass-card p-3.5 sm:p-6 space-y-4 sm:space-y-5 border border-slate-200 bg-white shadow-sm rounded-2xl sm:rounded-3xl animate-fade-in'
      }`}
    >
      {/* Top Controller Header */}
      <div className="flex items-center justify-between gap-2 sm:gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 font-bold border border-emerald-200 shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 sm:w-5 sm:h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className={`text-xs sm:text-base font-extrabold flex items-center gap-1.5 sm:gap-2 truncate ${isFullscreen ? 'text-white' : 'text-slate-900'}`}>
              <span className="truncate">Live Camera Stream</span>
              <span className="badge-green text-[8px] sm:text-[10px] uppercase font-bold tracking-wider flex-shrink-0">10s Limit</span>
            </h3>
            <p className={`text-xs font-bold hidden sm:block ${isFullscreen ? 'text-slate-300' : 'text-slate-600'}`}>
              Live camera streams at top. Results update directly below in real-time.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
          {isCameraActive && (
            <button
              onClick={toggleFacingMode}
              disabled={isRecording || disabled}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all shadow-sm active:scale-95"
              title="Switch camera"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              <span>Flip</span>
            </button>
          )}

          {isCameraActive && (
            <button
              onClick={toggleFullscreen}
              className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-extrabold flex items-center gap-1 transition-all shadow-sm active:scale-95 ${
                isFullscreen
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isFullscreen ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 sm:w-4 sm:h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9L4.5 4.5m0 0H9m-4.5 0V9m10.5 0l4.5-4.5m0 0H15m4.5 0V9M9 15l-4.5 4.5m0 0H9m-4.5 0v-4.5m10.5 0l4.5 4.5m0 0H15m4.5 0v-4.5" />
                  </svg>
                  <span>Exit</span>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5 sm:w-4 sm:h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                  <span>Full Screen</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Camera Viewport Container - Portrait View (3:4) on mobile, Landscape (16:9) on desktop */}
      <div className={`relative w-full max-w-full overflow-hidden bg-black flex items-center justify-center border border-slate-800 shadow-2xl transition-all ${
        isFullscreen
          ? 'flex-1 w-full rounded-2xl my-2'
          : 'rounded-2xl aspect-[3/4] sm:aspect-video'
      }`}>
        {/* Video Element */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'} ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
        />

        {/* Live Alignment Overlay */}
        {isCameraActive && (
          <div className="absolute inset-0 pointer-events-none border border-emerald-500/20 grid grid-cols-3 grid-rows-3 z-10">
            <div className="border-r border-b border-emerald-500/15" />
            <div className="border-r border-b border-emerald-500/15 flex items-center justify-center">
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-2 border-dashed border-emerald-400/50 animate-pulse" />
            </div>
            <div className="border-b border-emerald-500/15" />
            <div className="border-r border-b border-emerald-500/15" />
            <div className="border-r border-b border-emerald-500/15 flex items-center justify-center">
              <p className="text-[10px] sm:text-xs text-emerald-400 font-mono font-bold uppercase tracking-widest bg-black/70 px-3 py-1 rounded-full border border-emerald-500/30 backdrop-blur-md">
                Align Cattle Spine & Flank
              </p>
            </div>
            <div className="border-b border-emerald-500/15" />
            <div className="border-r border-emerald-500/15" />
            <div className="border-r border-emerald-500/15" />
            <div />
          </div>
        )}

        {/* Floating Quick Action Overlay Controls on Camera */}
        {isCameraActive && (
          <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/20 shadow-lg transition-all"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                {isFullscreen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 9L4.5 4.5m0 0H9m-4.5 0V9m10.5 0l4.5-4.5m0 0H15m4.5 0V9M9 15l-4.5 4.5m0 0H9m-4.5 0v-4.5m10.5 0l4.5 4.5m0 0H15m4.5 0v-4.5" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                )}
              </svg>
            </button>
          </div>
        )}

        {/* Recording 10s Timer & Countdown Overlay */}
        {isRecording && (
          <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 z-30 flex items-center justify-between bg-black/85 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-red-500/40 shadow-2xl animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <span className="text-[11px] sm:text-xs font-black uppercase text-rose-400 tracking-wider">LIVE SCANNING CATTLE</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-base sm:text-xl font-mono font-black text-white">{timeLeft.toFixed(1)}s</span>
              <div className="w-16 sm:w-28 h-2 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-rose-500 transition-all duration-100"
                  style={{ width: `${(timeLeft / 10.0) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Standby State when camera is OFF */}
        {!isCameraActive && (
          <div className="text-center p-6 sm:p-10 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 border border-slate-200 mx-auto flex items-center justify-center text-emerald-700 shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0c-.698.04-1.344.42-1.736 1.039l-.822 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </div>
            <div>
              <p className="text-base font-extrabold text-white mb-1">Camera Standby</p>
              <p className="text-xs text-slate-300 max-w-xs mx-auto font-medium leading-relaxed">
                Click below to turn on the live camera in full view mode. The stream turns on for 10s and automatically shows BCS & Disease results below!
              </p>
            </div>
            <button
              onClick={startCameraStream}
              disabled={disabled}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm py-3.5 px-8 rounded-2xl font-black shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 mx-auto active:scale-95"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.039l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0c-.698.04-1.344.42-1.736 1.039l-.822 1.316z" />
              </svg>
              Turn On Live Camera
            </button>
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 mt-0.5 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="font-bold">{error}</p>
        </div>
      )}

      {/* Control Buttons Bar - Ultra Clean Mobile & Desktop UX */}
      {isCameraActive && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            onClick={stopCameraStream}
            disabled={isRecording || disabled}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all"
          >
            Turn Off Camera
          </button>

          {!isRecording ? (
            <button
              onClick={startScan}
              disabled={disabled}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm py-3.5 px-8 rounded-2xl font-black shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 flex-1 sm:flex-none active:scale-95"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
              START 10s LIVE SCAN
            </button>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={captureSnapshot}
                disabled={disabled}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold shadow-sm"
              >
                Re-Snap Frame
              </button>
              <button
                onClick={finishRecording}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-300 text-xs font-bold shadow-sm"
              >
                Stop Camera
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
