import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface LiveVideoRecorderModalProps {
  onVideoRecorded: (videoFile: File) => void;
  onClose: () => void;
}

export const LiveVideoRecorderModal: React.FC<LiveVideoRecorderModalProps> = ({
  onVideoRecorded,
  onClose,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15.0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        streamRef.current = s;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (err) {
        console.error('Error accessing video camera:', err);
        setError('Could not access camera. Please verify permissions or upload a video file directly.');
      }
    }
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  const handleDataAvailable = useCallback((e: BlobEvent) => {
    if (e.data && e.data.size > 0) {
      recordedChunksRef.current.push(e.data);
    }
  }, []);

  const finishRecording = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const handleStopRecording = useCallback(() => {
    const mimeType = mediaRecorderRef.current?.mimeType || 'video/webm';
    const blob = new Blob(recordedChunksRef.current, { type: mimeType });
    
    if (blob.size > 0) {
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const file = new File([blob], `cattle_live_recording_${Date.now()}.${ext}`, { type: mimeType });
      onVideoRecorded(file);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      onClose();
    } else {
      setError('Recording contained no data. Please try again.');
    }
  }, [onVideoRecorded, onClose]);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;

    recordedChunksRef.current = [];
    setTimeLeft(15.0);
    setIsRecording(true);
    setError(null);

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
      mediaRecorder.start(200); // 200ms slice
    } catch (err: any) {
      console.error('MediaRecorder error:', err);
      setError('MediaRecorder failed on this browser. Please use file upload.');
      setIsRecording(false);
      return;
    }

    const startTime = Date.now();
    const durationMs = 15000;

    timerIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, (durationMs - elapsed) / 1000);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        finishRecording();
      }
    }, 100);
  }, [finishRecording, handleDataAvailable, handleStopRecording]);

  const progressPercent = Math.min(100, Math.max(0, ((15.0 - timeLeft) / 15.0) * 100));

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex flex-col items-center justify-between p-4">
      {/* Header */}
      <div className="w-full max-w-xl flex items-center justify-between py-2 text-white">
        <div>
          <h3 className="text-sm font-black tracking-wider uppercase flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            Live 15-Second Video Scanner
          </h3>
          <p className="text-xs text-slate-300">
            Record cattle from side or rear angle showing body, spine & udder
          </p>
        </div>
        <button
          onClick={() => {
            if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
            onClose();
          }}
          className="text-slate-400 hover:text-white p-2 text-xl font-bold"
        >
          ✕
        </button>
      </div>

      {/* Video Viewport */}
      <div className="relative w-full max-w-2xl h-[460px] sm:h-[520px] bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

        {/* Recording Overlay Progress Bar */}
        {isRecording && (
          <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-slate-950/80 to-transparent">
            <div className="flex items-center justify-between text-white font-mono font-bold text-xs mb-2">
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                RECORDING LIVE
              </span>
              <span>{timeLeft.toFixed(1)}s remaining</span>
            </div>
            <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-700">
              <div
                className="bg-emerald-500 h-full transition-all duration-100 ease-linear rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Target Outline Overlay */}
        {!isRecording && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6 text-center">
            <div className="border-2 border-emerald-400/60 border-dashed rounded-3xl w-full h-full flex items-center justify-center">
              <span className="text-xs font-black text-emerald-300 bg-slate-900/80 px-4 py-2 rounded-full border border-emerald-500/40">
                ALIGN FULL CATTLE BODY IN FRAME
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-x-4 bottom-4 bg-rose-950/90 text-rose-200 p-4 rounded-2xl border border-rose-800 text-xs text-center font-bold">
            {error}
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="w-full max-w-xl flex items-center justify-center py-4 gap-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
          >
            <div className="w-4 h-4 rounded-full bg-rose-600 animate-pulse" />
            Start 15s Video Recording
          </button>
        ) : (
          <button
            onClick={finishRecording}
            className="px-8 py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm shadow-xl shadow-rose-600/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
          >
            <div className="w-4 h-4 rounded-md bg-white" />
            Stop & Use Video
          </button>
        )}
      </div>
    </div>
  );
};

export default LiveVideoRecorderModal;
