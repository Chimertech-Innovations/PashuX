import React, { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

interface CattleQRCodeCardProps {
  cattleId: string;
  cattleName: string;
  muzzleId: string;
  breed?: string;
  healthStatus?: string;
  bcsScore?: number;
  cattleImage?: string;
  compact?: boolean;
  variant?: 'inline' | 'card';
}

export default function CattleQRCodeCard({
  cattleId,
  cattleName,
  muzzleId,
  breed,
  healthStatus = 'Healthy',
  bcsScore,
  compact = false,
  variant = 'card',
}: CattleQRCodeCardProps) {
  const [copied, setCopied] = useState(false);

  // Full URL that resolves when scanning QR code with smartphone
  const profileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/cattle/${cattleId}`
    : `/cattle/${cattleId}`;

  // Fixed Chimertech logo source
  const logoSrc = '/chimertech_logo.png';
  const logoWebsiteUrl = 'https://chimertech.com';

  const downloadQR = () => {
    const canvas = document.getElementById(`cattle-qr-${cattleId}`) as HTMLCanvasElement;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR_${cattleName.replace(/[^a-zA-Z0-9]/g, '_')}_${cattleId.slice(0, 6)}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const shareWhatsApp = () => {
    const text = `*Cattle Profile Biometrics*\n\n` +
      `Name: ${cattleName}\n` +
      `Biometric Muzzle ID: ${muzzleId}\n` +
      `${breed ? `Breed: ${breed}\n` : ''}` +
      `${bcsScore ? `BCS Score: ${bcsScore.toFixed(1)}/5\n` : ''}` +
      `Health Status: ${healthStatus}\n\n` +
      `Powered by Chimertech Innovations\n` +
      `Scan or click link to view full details:\n${profileUrl}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  // Sleek inline widget layout (used directly inside Cattle Profile header card)
  if (variant === 'inline' || compact) {
    return (
      <div className="bg-slate-900/90 backdrop-blur-md text-white rounded-2xl p-3.5 border border-slate-700/60 shadow-xl flex flex-col items-center justify-between w-full max-w-[210px] sm:max-w-[220px]">
        {/* Header tag */}
        <div className="flex items-center gap-1.5 mb-2 w-full justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black tracking-wider text-slate-300 uppercase">Cattle Profile QR</span>
          </div>
          <a
            href={logoWebsiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] font-bold text-emerald-400 hover:underline flex items-center gap-0.5"
            title="Chimertech Official"
          >
            <span>Chimertech</span>
          </a>
        </div>

        {/* Crisp Small QR Frame */}
        <div className="p-2 bg-white rounded-xl shadow-md border border-slate-200 relative group my-1">
          <QRCodeCanvas
            id={`cattle-qr-${cattleId}`}
            value={profileUrl}
            size={100}
            level="H"
            includeMargin={false}
            imageSettings={{
              src: logoSrc,
              x: undefined,
              y: undefined,
              height: 32,
              width: 32,
              excavate: true,
            }}
          />
          {/* Corner accents */}
          <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-emerald-500 rounded-tl-sm pointer-events-none" />
          <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-emerald-500 rounded-tr-sm pointer-events-none" />
          <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-emerald-500 rounded-bl-sm pointer-events-none" />
          <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-emerald-500 rounded-br-sm pointer-events-none" />
        </div>

        <p className="text-[9px] font-semibold text-slate-400 mt-1 mb-2 text-center">Scan via phone camera</p>

        {/* Compact Action Buttons */}
        <div className="flex flex-col gap-1.5 w-full pt-1">
          {/* WhatsApp Share Button */}
          <button
            onClick={shareWhatsApp}
            className="w-full bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-black text-xs py-1.5 px-2.5 rounded-xl shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all transform hover:-translate-y-0.5"
          >
            <svg className="w-3.5 h-3.5 fill-current flex-shrink-0" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-0.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
            <span>WhatsApp Share</span>
          </button>

          {/* Copy Link & Download Row */}
          <div className="flex gap-1.5 w-full">
            <button
              onClick={copyLink}
              className={`flex-1 font-bold text-xs py-1.5 px-2 rounded-xl transition-all border flex items-center justify-center gap-1 ${
                copied
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
              title="Copy Profile Link"
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copy Link</span>
                </>
              )}
            </button>

            <button
              onClick={downloadQR}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs py-1.5 px-2 rounded-xl transition-all flex items-center justify-center"
              title="Download QR PNG"
            >
              <svg className="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Modern Card Layout
  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-lg shadow-slate-200/50 mb-6 w-full max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center">
        
        {/* QR Code Canvas Frame */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="p-3 bg-slate-50 border border-emerald-500/20 rounded-2xl shadow-sm relative group">
            <QRCodeCanvas
              id={`cattle-qr-${cattleId}`}
              value={profileUrl}
              size={128}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: logoSrc,
                x: undefined,
                y: undefined,
                height: 42,
                width: 42,
                excavate: true,
              }}
            />
            {/* Green corner accent badges */}
            <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 border-t-2 border-l-2 border-emerald-500 rounded-tl-sm" />
            <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 border-t-2 border-r-2 border-emerald-500 rounded-tr-sm" />
            <div className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 border-b-2 border-l-2 border-emerald-500 rounded-bl-sm" />
            <div className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-b-2 border-r-2 border-emerald-500 rounded-br-sm" />
          </div>

          <div className="mt-2 text-center flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Scannable QR</span>
          </div>
        </div>

        {/* Info & Controls */}
        <div className="flex-1 w-full min-w-0 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-black text-slate-900 truncate">Cattle Profile Link & QR</h3>
              <p className="text-xs text-slate-500">Scan or share to view biometric muzzle record & analysis</p>
            </div>
            <a
              href={logoWebsiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-bold text-emerald-600 hover:underline flex items-center gap-1 flex-shrink-0 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"
            >
              <img src="/chimertech_logo.png" alt="Chimertech" className="w-3 h-3 object-contain" />
              <span>Chimertech</span>
            </a>
          </div>

          {/* Target URL Preview */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 flex items-center justify-between gap-2">
            <p className="text-xs font-mono font-bold text-slate-600 truncate flex-1">{profileUrl}</p>
            <button
              onClick={copyLink}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 px-2.5 py-1 bg-white rounded-lg border border-slate-200 shadow-sm flex-shrink-0 flex items-center gap-1"
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-0.5">
            <button
              onClick={shareWhatsApp}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs py-2 px-3 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all"
            >
              <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-0.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              <span>Share to WhatsApp</span>
            </button>

            <button
              onClick={downloadQR}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all"
            >
              <svg className="w-3.5 h-3.5 fill-none stroke-current flex-shrink-0" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download PNG</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}


