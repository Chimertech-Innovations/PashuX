import { useState, useRef, useEffect, useCallback } from 'react';

interface LiveCameraScannerProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export default function LiveCameraScanner({ onFile, disabled }: LiveCameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(10.0);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [error, setError] = useState<string | null>(null);

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
          width: { ideal: 1280 },
          height: { ideal: 720 },
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
    } else {
      setError('Recording failed to produce video data. Please try again.');
    }
  }, [onFile]);

  // Start 10-second countdown and video recording
  const startScan = useCallback(() => {
    if (!streamRef.current || !isCameraActive) return;

    recordedChunksRef.current = [];
    setTimeLeft(10.0);
    setIsRecording(true);

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
      setError('MediaRecorder error on this browser. Falling back to snapshot mode.');
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
  }, [isCameraActive, handleDataAvailable, handleStopRecording, finishRecording]);

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
    <div className="glass-card p-6 space-y-5 border border-white/10 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              Live Camera Scanner
              <span className="badge-green text-[10px] uppercase font-bold tracking-wider">Auto 10s Limit</span>
            </h3>
            <p className="text-xs text-grey-400">Camera turns on for 10s, auto-shuts off, then performs BCS & Disease analysis</p>
          </div>
        </div>

        {isCameraActive && (
          <button
            onClick={toggleFacingMode}
            disabled={isRecording || disabled}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            title="Switch camera"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-emerald-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Flip
          </button>
        )}
      </div>

      {/* Camera Preview Area */}
      <div className="relative rounded-2xl overflow-hidden bg-black aspect-video border border-white/10 shadow-2xl flex items-center justify-center">
        {/* Video Element */}
        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'} ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
        />

        {/* Live Alignment Grid Overlay */}
        {isCameraActive && (
          <div className="absolute inset-0 pointer-events-none border border-emerald-500/20 grid grid-cols-3 grid-rows-3">
            <div className="border-r border-b border-emerald-500/15" />
            <div className="border-r border-b border-emerald-500/15 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full border border-dashed border-emerald-400/40" />
            </div>
            <div className="border-b border-emerald-500/15" />
            <div className="border-r border-b border-emerald-500/15" />
            <div className="border-r border-b border-emerald-500/15 flex items-center justify-center">
              <p className="text-[10px] text-emerald-400/70 font-mono uppercase tracking-widest bg-black/40 px-2 py-0.5 rounded">
                Align Cattle Spine & Flank
              </p>
            </div>
            <div className="border-b border-emerald-500/15" />
            <div className="border-r border-emerald-500/15" />
            <div className="border-r border-emerald-500/15" />
            <div className="" />
          </div>
        )}

        {/* Recording 10s Timer & Countdown Overlay */}
        {isRecording && (
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between bg-black/75 backdrop-blur-md px-4 py-2.5 rounded-xl border border-red-500/30 shadow-lg animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-black uppercase text-rose-400 tracking-wider">RECORDING LIVE 10s CLIP</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-lg font-mono font-black text-white">{timeLeft.toFixed(1)}s</span>
              <div className="w-24 h-2 rounded-full bg-white/10 overflow-hidden">
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
          <div className="text-center p-8 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-white/[0.05] border border-white/10 mx-auto flex items-center justify-center text-grey-400 shadow-xl">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0c-.698.04-1.344.42-1.736 1.039l-.822 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-extrabold text-white mb-1">Camera is Currently OFF</p>
              <p className="text-xs text-grey-400 max-w-xs mx-auto">
                Click below to turn on the camera. The camera will stay active for 10 seconds to scan the cattle, then automatically turn off.
              </p>
            </div>
            <button
              onClick={startCameraStream}
              disabled={disabled}
              className="btn-primary text-xs py-2.5 px-6 font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg"
            >
              📷 Open Camera Stream
            </button>
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 mt-0.5 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Control Buttons */}
      {isCameraActive && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={stopCameraStream}
            disabled={isRecording || disabled}
            className="btn-ghost text-xs text-grey-400 hover:text-white"
          >
            ⏹ Turn Off Camera
          </button>

          {!isRecording ? (
            <button
              onClick={startScan}
              disabled={disabled}
              className="btn-primary text-xs py-3 px-8 font-black bg-gradient-to-r from-emerald-400 to-teal-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:scale-105 transition-all flex items-center gap-2"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-black animate-ping" />
              START 10s LIVE SCAN
            </button>
          ) : (
            <button
              onClick={finishRecording}
              className="btn-secondary text-xs py-3 px-6 text-rose-400 border-rose-500/30 hover:bg-rose-500/10 font-bold flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Stop Early & Analyze
            </button>
          )}
        </div>
      )}
    </div>
  );
}
