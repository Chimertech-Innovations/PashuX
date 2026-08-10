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
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: 1280, height: 720 } });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        alert('Could not access device camera. Please check camera permissions or use file upload.');
        onClose();
      }
    }
    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleSnap = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `${angleName}_camera_capture.jpg`, { type: 'image/jpeg' });
        onCapture(file);
        if (stream) {
          stream.getTracks().forEach((t) => t.stop());
        }
        onClose();
      }
    }, 'image/jpeg', 0.92);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[100] flex flex-col items-center justify-between p-4">
      <div className="w-full max-w-xl flex items-center justify-between py-2 text-white">
        <div>
          <h3 className="text-sm font-black tracking-wider uppercase">{angleLabel} Live Camera Capture</h3>
          <p className="text-xs text-slate-300">Align cattle body within target outline silhouette below</p>
        </div>
        <button onClick={() => { if (stream) stream.getTracks().forEach((t) => t.stop()); onClose(); }} className="text-slate-400 hover:text-white p-2 text-xl font-bold">✕</button>
      </div>

      <div className="relative w-full max-w-2xl h-[500px] sm:h-[560px] bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex items-center justify-center">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />

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
              <span className="absolute top-3 text-[11px] font-black text-emerald-400 uppercase tracking-wider bg-slate-900/85 px-4 py-1.5 rounded-full border border-emerald-500/50 shadow-lg">ALIGN RIGHT SIDE PROFILE</span>
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
              <span className="absolute top-3 text-[11px] font-black text-emerald-400 uppercase tracking-wider bg-slate-900/85 px-4 py-1.5 rounded-full border border-emerald-500/50 shadow-lg">ALIGN LEFT SIDE PROFILE</span>
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
              <span className="absolute top-3 text-[11px] font-black text-emerald-400 uppercase tracking-wider bg-slate-900/85 px-4 py-1.5 rounded-full border border-emerald-500/50 shadow-lg">ALIGN REAR HINDQUARTERS</span>
            </div>
          )}

          {angleName === 'udder' && (
            <div className="relative w-full h-full flex items-center justify-center">
              <span className="absolute top-3 text-[11px] font-black text-purple-300 uppercase tracking-wider bg-slate-900/85 px-4 py-1.5 rounded-full border border-purple-500/50 shadow-lg">UDDER & TEATS CLOSE-UP CAMERA</span>
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-xl flex items-center justify-center py-4">
        <button
          onClick={handleSnap}
          className="w-16 h-16 rounded-full bg-white border-4 border-emerald-500 shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-600" />
        </button>
      </div>
    </div>
  );
};
export default AngleCameraModal;
