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
}

export default function CattleQRCodeCard({
  cattleId,
  cattleName,
  muzzleId,
  breed,
  healthStatus = 'Healthy',
  bcsScore,
  compact = false,
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

  if (compact) {
    return (
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col items-center">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl mb-2 shadow-inner relative group">
          <QRCodeCanvas
            id={`cattle-qr-${cattleId}`}
            value={profileUrl}
            size={160}
            level="H"
            includeMargin={true}
            imageSettings={{
              src: logoSrc,
              x: undefined,
              y: undefined,
              height: 48,
              width: 48,
              excavate: false,
            }}
          />
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Scan for Cattle Details</p>
        <a
          href={logoWebsiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] font-bold text-slate-500 hover:text-emerald-600 flex items-center gap-1 mb-3 transition-colors"
        >
          <img src="/chimertech_logo.png" alt="Chimertech" className="w-3 h-3 object-contain" />
          <span>chimertech.com</span>
        </a>
        <div className="flex gap-2 w-full">
          <button
            onClick={shareWhatsApp}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs py-1.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-0.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
            </svg>
            <span>WhatsApp</span>
          </button>
          <button
            onClick={downloadQR}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-1.5 px-2.5 rounded-xl transition-colors flex items-center justify-center"
            title="Download QR Code"
          >
            <svg className="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl shadow-slate-200/50 mb-8">
      <div className="flex flex-col md:flex-row gap-8 items-center">
        
        {/* QR Code Canvas Frame */}
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="p-5 bg-white border-2 border-emerald-500/20 rounded-3xl shadow-lg relative group transition-all duration-300 hover:shadow-emerald-500/10">
            <QRCodeCanvas
              id={`cattle-qr-${cattleId}`}
              value={profileUrl}
              size={220}
              level="H"
              includeMargin={true}
              imageSettings={{
                src: logoSrc,
                x: undefined,
                y: undefined,
                height: 64,
                width: 64,
                excavate: false,
              }}
            />
            {/* Green corner accent badges */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-emerald-500 rounded-tl" />
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-emerald-500 rounded-tr" />
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-emerald-500 rounded-bl" />
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-emerald-500 rounded-br" />
          </div>

          <div className="mt-3 text-center flex flex-col items-center gap-1">
            <span className="inline-flex items-center gap-1.5 text-emerald-600 font-black text-xs bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              SCANNABLE VIA PHONE CAMERA
            </span>
            <a
              href={logoWebsiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-slate-500 hover:text-emerald-600 flex items-center gap-1.5 mt-1 transition-colors"
            >
              <img src="/chimertech_logo.png" alt="Chimertech" className="w-3.5 h-3.5 object-contain" />
              <span>chimertech.com</span>
              <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>

        {/* Info & Customization Controls */}
        <div className="flex-1 w-full space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <h3 className="text-xl font-black text-slate-900">Cattle Profile QR Code</h3>
            </div>
            <p className="text-sm text-slate-500">
              Scan with any mobile phone camera to open full cattle details, biometric muzzle record, and health analysis.
            </p>
          </div>

          {/* Fixed Logo Badge (Only Chimertech Logo) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 p-1.5 flex items-center justify-center shadow-sm">
                <img src="/chimertech_logo.png" alt="Chimertech Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">QR Center Logo</p>
                <p className="text-xs font-black text-slate-800">Chimertech Official Logo</p>
              </div>
            </div>
            <a
              href={logoWebsiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
            >
              <span>chimertech.com</span>
              <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          {/* Target URL Preview */}
          <div className="bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 flex items-center justify-between">
            <div className="truncate min-w-0 flex-1 mr-3">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">QR Target URL</p>
              <p className="text-xs font-mono font-bold text-slate-700 truncate">{profileUrl}</p>
            </div>
            <button
              onClick={copyLink}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 px-3 py-1 bg-white rounded-lg border border-slate-200 shadow-sm flex-shrink-0 flex items-center gap-1.5"
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
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-1">
            <button
              onClick={shareWhatsApp}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-sm py-3 px-5 rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-0.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
              </svg>
              Share Cattle Profile to WhatsApp
            </button>

            <button
              onClick={downloadQR}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm py-3 px-5 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download QR Code (PNG)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

