import React, { useState, useEffect } from 'react';
import { BASE_URL } from '@/lib/api';

interface BackendStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackendStatusModal: React.FC<BackendStatusModalProps> = ({ isOpen, onClose }) => {
  const [currentUrl, setCurrentUrl] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('PASHU_BACKEND_URL') || '';
      setCurrentUrl(BASE_URL || window.location.origin);
      setCustomInput(stored || BASE_URL);
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const testConnection = async (urlToTest: string) => {
    setIsChecking(true);
    setStatusMessage({ type: 'info', text: 'Pinging backend health endpoint...' });
    
    const cleanUrl = urlToTest.trim().replace(/\/+$/, '');
    const target = cleanUrl ? `${cleanUrl}/health` : '/health';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      
      const res = await fetch(target, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatusMessage({
          type: 'success',
          text: `✅ Connected successfully! (${data.service || 'Backend OK'})`
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: `⚠️ Server reachable but returned HTTP ${res.status}: ${res.statusText}`
        });
      }
    } catch (err: any) {
      const isMixed = window.location.protocol === 'https:' && cleanUrl.startsWith('http:');
      let extra = '';
      if (isMixed) {
        extra = ' (Mixed Content Block: Browser blocks HTTPS website from calling HTTP URL)';
      }
      setStatusMessage({
        type: 'error',
        text: `❌ Cannot reach server at "${target}": ${err.message || 'Connection failed'}${extra}`
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleSave = () => {
    const clean = customInput.trim().replace(/\/+$/, '');
    if (!clean) {
      localStorage.removeItem('PASHU_BACKEND_URL');
    } else {
      localStorage.setItem('PASHU_BACKEND_URL', clean);
    }
    window.location.reload();
  };

  const handleReset = () => {
    localStorage.removeItem('PASHU_BACKEND_URL');
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-lg">
              ⚙️
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">Backend Server Connection</h3>
              <p className="text-xs text-slate-500 font-medium">Configure where your mobile or desktop app connects</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
              Current Active Server URL
            </label>
            <div className="px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 truncate select-all">
              {currentUrl}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
              Custom Backend Server URL
            </label>
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="e.g. http://10.120.112.221:8000 or https://your-server.up.railway.app"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Tip: For mobile testing on same Wi-Fi, enter your laptop's IP (e.g. <code>http://&lt;laptop-ip&gt;:8000</code>).
            </p>
          </div>

          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs font-bold ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              {statusMessage.text}
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              disabled={isChecking}
              onClick={() => testConnection(customInput || currentUrl)}
              className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-extrabold transition-all active:scale-95 disabled:opacity-50"
            >
              {isChecking ? 'Checking...' : '🔍 Test Connection'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
            >
              💾 Save & Reload
            </button>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="w-full py-2 text-center text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
            Reset to Automatic Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

