import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BASE_URL } from '@/lib/api';
import CattleQRCodeCard from '@/components/cattle/CattleQRCodeCard';

export default function FarmManagement() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [file3, setFile3] = useState<File | null>(null);
  const [preview1, setPreview1] = useState<string | null>(null);
  const [preview2, setPreview2] = useState<string | null>(null);
  const [preview3, setPreview3] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Wizard state
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [currentCattleId, setCurrentCattleId] = useState<string | null>(null);
  const [videoStats, setVideoStats] = useState<any>(null);
  
  // Video state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [cattleList, setCattleList] = useState<any[]>([]);
  const [selectedQrCattle, setSelectedQrCattle] = useState<any | null>(null);

  const fileInputRefCamera1 = useRef<HTMLInputElement>(null);
  const fileInputRefGallery1 = useRef<HTMLInputElement>(null);
  const fileInputRefCamera2 = useRef<HTMLInputElement>(null);
  const fileInputRefGallery2 = useRef<HTMLInputElement>(null);
  const fileInputRefCamera3 = useRef<HTMLInputElement>(null);
  const fileInputRefGallery3 = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth', { state: { message: 'Please log in to register cattle' } });
      } else {
        fetchCattle();
      }
    }
  }, [user, authLoading, navigate]);

  const fetchCattle = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${BASE_URL}/api/muzzle/user/${user.id}`);
      const data = await res.json();
      if (res.ok) {
        setCattleList(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch cattle", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, slot: number) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const previewUrl = URL.createObjectURL(selectedFile);
      
      if (slot === 1) {
        setFile1(selectedFile);
        setPreview1(previewUrl);
      } else if (slot === 2) {
        setFile2(selectedFile);
        setPreview2(previewUrl);
      } else if (slot === 3) {
        setFile3(selectedFile);
        setPreview3(previewUrl);
      }
      setMessage(null);
    }
  };

  const removeFile = (slot: number) => {
    if (slot === 1) { 
        setFile1(null); setPreview1(null); 
        if (fileInputRefCamera1.current) fileInputRefCamera1.current.value = '';
        if (fileInputRefGallery1.current) fileInputRefGallery1.current.value = '';
    }
    if (slot === 2) { 
        setFile2(null); setPreview2(null); 
        if (fileInputRefCamera2.current) fileInputRefCamera2.current.value = '';
        if (fileInputRefGallery2.current) fileInputRefGallery2.current.value = '';
    }
    if (slot === 3) { 
        setFile3(null); setPreview3(null); 
        if (fileInputRefCamera3.current) fileInputRefCamera3.current.value = '';
        if (fileInputRefGallery3.current) fileInputRefGallery3.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file1 || !file2 || !file3) {
      setMessage({ type: 'error', text: 'Please upload all 3 muzzle images (Straight, Left, Right).' });
      return;
    }
    if (!user) return; // safety

    setLoading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('user_id', user.id);
    formData.append('file1', file1);
    formData.append('file2', file2);
    formData.append('file3', file3);

    try {
      const res = await fetch(`${BASE_URL}/api/muzzle/register`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: `Cattle registered successfully! Proceeding to Step 2...` });
        // data.cattle_id is now the real UUID from the database
        setCurrentCattleId(data.cattle_id);
        fetchCattle();
        setTimeout(() => {
            setStep(2);
            setMessage(null);
        }, 1500);
      } else {
        setMessage({ type: 'error', text: data.detail || 'Registration failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error connecting to backend.' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = (clearMessage = true) => {
    setName('');
    removeFile(1);
    removeFile(2);
    removeFile(3);
    setVideoFile(null);
    setVideoPreview(null);
    setCurrentCattleId(null);
    setVideoStats(null);
    setStep(1);
    if (clearMessage) setMessage(null);
  };

  // Go back to video step (Step 2) without clearing the muzzle registration
  const retakeVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setVideoStats(null);
    setMessage({ type: 'success', text: 'Please re-record the video showing the udder and teat area clearly from the side or rear.' });
    setStep(2);
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setVideoFile(file);
          setVideoPreview(URL.createObjectURL(file));
      }
  };

  const handleVideoSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!videoFile || !currentCattleId) return;

      setLoading(true);
      setMessage({ type: 'success', text: 'Processing video... this may take 15-45 seconds.' });

      const formData = new FormData();
      formData.append('video', videoFile);

      try {
          const res = await fetch(`${BASE_URL}/api/muzzle/${currentCattleId}/video-analysis`, {
              method: 'POST',
              body: formData
          });
          const data = await res.json();
          if (res.ok) {
              setMessage({ type: 'success', text: 'Video analysis complete! Cattle profile updated.' });
              setVideoStats(data.data);
              fetchCattle();
              setTimeout(() => {
                  setStep(3);
                  setMessage(null);
              }, 1000);
          } else {
              setMessage({ type: 'error', text: data.detail || 'Video analysis failed.' });
          }
      } catch (err) {
          setMessage({ type: 'error', text: 'Network error connecting to backend.' });
      } finally {
          setLoading(false);
      }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen pt-24 pb-20 bg-slate-50 flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="pt-24 pb-20 min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-black text-slate-900 mb-1">Farm Management</h1>
        <p className="text-slate-500 font-medium mb-2">Register new cattle using AI Muzzle Scanning and Video Analysis.</p>
        {/* User ID chip */}
        {user && (
          <div className="inline-flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm mb-8">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">User ID:</span>
            <span className="font-mono font-black text-xs text-slate-700">USR-{user.id.replace(/-/g,'').substring(0,8).toUpperCase()}</span>
          </div>
        )}

        {/* WIZARD PROGRESS */}
        <div className="flex items-center justify-center gap-4 mb-8">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-emerald-600' : 'text-slate-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${step >= 1 ? 'border-emerald-600 bg-emerald-50' : 'border-slate-300'}`}>1</div>
                <span className="font-bold text-sm">Muzzle Scan</span>
            </div>
            <div className={`w-16 h-1 rounded-full ${step >= 2 ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-emerald-600' : 'text-slate-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${step >= 2 ? 'border-emerald-600 bg-emerald-50' : 'border-slate-300'}`}>2</div>
                <span className="font-bold text-sm">Video Analysis</span>
            </div>
            <div className={`w-16 h-1 rounded-full ${step >= 3 ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-emerald-600' : 'text-slate-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 ${step >= 3 ? 'border-emerald-600 bg-emerald-50' : 'border-slate-300'}`}>3</div>
                <span className="font-bold text-sm">Results</span>
            </div>
        </div>

        {/* REGISTRATION FORM */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-200 mb-12">
            
          {step === 1 ? (
          <form onSubmit={handleSubmit} className="space-y-8">
            
            <div className="space-y-2 max-w-md">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Cattle Name / Tag</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)}
                required
                className="input-field" 
                placeholder="e.g. Bessie or Tag #102"
                disabled={loading}
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Multi-Angle Muzzle Scan (3 Images Required)</label>
                <p className="text-sm text-slate-500 mt-1">Upload three clear photos to generate a robust 3D biometric profile.</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Slot 1 */}
                <div className={`relative border-2 ${preview1 ? 'border-emerald-500 bg-emerald-50/30 border-solid' : 'border-slate-300 bg-slate-50 border-dashed'} rounded-xl p-4 text-center transition-all min-h-[180px] flex flex-col justify-center items-center`}>
                  {preview1 ? (
                    <div className="flex flex-col items-center">
                      <img src={preview1} alt="Preview 1" className={`max-h-32 w-auto object-contain rounded-lg shadow-sm mb-3 ${loading ? 'opacity-50' : ''}`} />
                      {!loading && <button type="button" onClick={() => removeFile(1)} className="text-[10px] font-bold text-rose-500 hover:text-rose-600 uppercase">Remove</button>}
                    </div>
                  ) : (
                    <div className="space-y-3 w-full">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-emerald-500 mb-2">
                         <span className="font-black text-lg">1</span>
                      </div>
                      <p className="text-sm font-bold text-slate-700">Straight-on</p>
                      
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <button type="button" onClick={() => fileInputRefCamera1.current?.click()} className="btn-primary py-2 text-xs flex justify-center items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                          Camera
                        </button>
                        <button type="button" onClick={() => fileInputRefGallery1.current?.click()} className="btn-secondary py-2 text-xs flex justify-center items-center gap-1">
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                           Upload
                        </button>
                      </div>
                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 1)} className="hidden" ref={fileInputRefGallery1} />
                      <input type="file" accept="image/*" capture="environment" onChange={(e) => handleFileChange(e, 1)} className="hidden" ref={fileInputRefCamera1} />
                    </div>
                  )}
                </div>

                {/* Slot 2 */}
                <div className={`relative border-2 ${preview2 ? 'border-emerald-500 bg-emerald-50/30 border-solid' : 'border-slate-300 bg-slate-50 border-dashed'} rounded-xl p-4 text-center transition-all min-h-[180px] flex flex-col justify-center items-center`}>
                  {preview2 ? (
                    <div className="flex flex-col items-center">
                      <img src={preview2} alt="Preview 2" className={`max-h-32 w-auto object-contain rounded-lg shadow-sm mb-3 ${loading ? 'opacity-50' : ''}`} />
                      {!loading && <button type="button" onClick={() => removeFile(2)} className="text-[10px] font-bold text-rose-500 hover:text-rose-600 uppercase">Remove</button>}
                    </div>
                  ) : (
                    <div className="space-y-3 w-full">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-emerald-500 mb-2">
                         <span className="font-black text-lg">2</span>
                      </div>
                      <p className="text-sm font-bold text-slate-700">Slight Left</p>
                      
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <button type="button" onClick={() => fileInputRefCamera2.current?.click()} className="btn-primary py-2 text-xs flex justify-center items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                          Camera
                        </button>
                        <button type="button" onClick={() => fileInputRefGallery2.current?.click()} className="btn-secondary py-2 text-xs flex justify-center items-center gap-1">
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                           Upload
                        </button>
                      </div>
                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 2)} className="hidden" ref={fileInputRefGallery2} />
                      <input type="file" accept="image/*" capture="environment" onChange={(e) => handleFileChange(e, 2)} className="hidden" ref={fileInputRefCamera2} />
                    </div>
                  )}
                </div>

                {/* Slot 3 */}
                <div className={`relative border-2 ${preview3 ? 'border-emerald-500 bg-emerald-50/30 border-solid' : 'border-slate-300 bg-slate-50 border-dashed'} rounded-xl p-4 text-center transition-all min-h-[180px] flex flex-col justify-center items-center`}>
                  {preview3 ? (
                    <div className="flex flex-col items-center">
                      <img src={preview3} alt="Preview 3" className={`max-h-32 w-auto object-contain rounded-lg shadow-sm mb-3 ${loading ? 'opacity-50' : ''}`} />
                      {!loading && <button type="button" onClick={() => removeFile(3)} className="text-[10px] font-bold text-rose-500 hover:text-rose-600 uppercase">Remove</button>}
                    </div>
                  ) : (
                    <div className="space-y-3 w-full">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-emerald-500 mb-2">
                         <span className="font-black text-lg">3</span>
                      </div>
                      <p className="text-sm font-bold text-slate-700">Slight Right</p>
                      
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <button type="button" onClick={() => fileInputRefCamera3.current?.click()} className="btn-primary py-2 text-xs flex justify-center items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                          Camera
                        </button>
                        <button type="button" onClick={() => fileInputRefGallery3.current?.click()} className="btn-secondary py-2 text-xs flex justify-center items-center gap-1">
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                           Upload
                        </button>
                      </div>
                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 3)} className="hidden" ref={fileInputRefGallery3} />
                      <input type="file" accept="image/*" capture="environment" onChange={(e) => handleFileChange(e, 3)} className="hidden" ref={fileInputRefCamera3} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded-xl text-sm font-bold flex items-start gap-3 ${
                message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800 border border-rose-200'
              }`}>
                {message.type === 'success' ? (
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                )}
                <span>{message.text}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || !file1 || !file2 || !file3}
              className="w-full btn-primary py-4 text-base shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span>Validating & Fusing AI Profile...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>Register Cattle</span>
                </>
              )}
            </button>
          </form>
          ) : step === 2 ? (
          <form onSubmit={handleVideoSubmit} className="space-y-8">
            <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Upload 15-Second Video</label>
                  <p className="text-sm text-slate-500 mt-1">Capture a short video of the cattle. Our AI will analyze frames to estimate BCS, weight, breed, and health status.</p>
                </div>
                
                <div className={`relative border-2 ${videoPreview ? 'border-emerald-500 bg-emerald-50/30 border-solid' : 'border-slate-300 bg-slate-50 border-dashed'} rounded-xl p-8 text-center transition-all min-h-[250px] flex flex-col justify-center items-center`}>
                    {videoPreview ? (
                        <div className="flex flex-col items-center w-full">
                            <video src={videoPreview} controls className="max-h-48 w-full object-contain rounded-lg shadow-sm mb-4" />
                            {!loading && <button type="button" onClick={() => { setVideoFile(null); setVideoPreview(null); }} className="text-xs font-bold text-rose-500 hover:text-rose-600 uppercase bg-rose-50 px-4 py-2 rounded-lg">Change Video</button>}
                        </div>
                    ) : (
                        <div className="space-y-4 w-full flex flex-col items-center">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-emerald-500 mb-2">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            </div>
                            <p className="text-sm font-bold text-slate-700">Select Video</p>
                            <div className="flex gap-4 mt-4">
                                <button type="button" onClick={() => videoInputRef.current?.click()} className="btn-primary py-3 px-6 text-sm flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                    Upload / Record
                                </button>
                            </div>
                            <input type="file" accept="video/*" capture="environment" onChange={handleVideoChange} className="hidden" ref={videoInputRef} />
                        </div>
                    )}
                </div>
            </div>

            {message && (
              <div className={`p-4 rounded-xl text-sm font-bold flex items-start gap-3 ${
                message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800 border border-rose-200'
              }`}>
                {message.type === 'success' ? (
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                ) : (
                  <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                )}
                <span>{message.text}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || !videoFile}
              className="w-full btn-primary py-4 text-base shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  <span>Analyzing Video Frames...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>Complete Registration</span>
                </>
              )}
            </button>
          </form>
          ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center flex-shrink-0 border border-white/30">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-black text-xl leading-tight">Registration Complete</h3>
                  <p className="text-emerald-100 font-medium text-sm mt-0.5">Cattle Profile Successfully Analyzed & Stored by Chimertech AI</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs bg-white/20 text-white font-bold px-2.5 py-0.5 rounded-full border border-white/20">{name || 'Cattle'}</span>
                    {currentCattleId && (
                      <span className="text-xs bg-white/20 text-white font-mono font-bold px-2.5 py-0.5 rounded-full border border-white/20">
                        MUZZ-{currentCattleId.slice(0, 8).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Retake Banner — shown when parts are missing */}
            {videoStats?.missing_parts?.length > 0 && (
              <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-amber-900 font-black text-base">Retake Required — Body Parts Not Captured</h4>
                    <p className="text-amber-800 text-sm mt-0.5">
                      The AI could not clearly see the following in your video:
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {videoStats.missing_parts.map((part: string) => (
                        <span key={part} className="text-xs font-black bg-amber-200 text-amber-900 px-2.5 py-0.5 rounded-full capitalize border border-amber-300">
                          {part.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="bg-amber-100 rounded-xl p-3 mb-3 border border-amber-200">
                  <p className="text-amber-800 text-xs font-medium">
                    <strong>How to retake:</strong> Record the cattle from the rear or side showing the underside (udder/teat area) clearly in good lighting. Walk slowly around the animal.
                  </p>
                </div>
                <button
                  onClick={retakeVideo}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black text-sm py-3 px-5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-400/30"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Re-record Video (Keep Muzzle Scan)
                </button>
              </div>
            )}

            {/* AI Analysis Stats Grid */}
            {videoStats && (() => {
              const bcsLabel = videoStats.bcs_score >= 4.5 ? 'Obese' : videoStats.bcs_score >= 3.5 ? 'Overconditioned' : videoStats.bcs_score >= 2.5 ? 'Ideal' : videoStats.bcs_score >= 1.5 ? 'Thin' : videoStats.bcs_score > 0 ? 'Emaciated' : 'N/A';
              const udderLabel = videoStats.udder_score >= 4.5 ? 'Excellent' : videoStats.udder_score >= 3.5 ? 'Good' : videoStats.udder_score >= 2.5 ? 'Average' : videoStats.udder_score >= 1.5 ? 'Below Average' : videoStats.udder_score > 0 ? 'Poor' : 'Not Visible';
              const teatLabel = videoStats.teat_score >= 4.5 ? 'Ideal' : videoStats.teat_score >= 3.5 ? 'Good' : videoStats.teat_score >= 2.5 ? 'Average' : videoStats.teat_score >= 1.5 ? 'Short' : videoStats.teat_score > 0 ? 'Deformed' : 'Not Visible';
              const isHealthy = !videoStats.disease_status || videoStats.disease_status.toLowerCase() === 'healthy';

              const ScoreDots = ({ score, max = 5, color = '#10b981' }: { score: number; max?: number; color?: string }) => (
                <div className="flex gap-0.5 mt-1">
                  {Array.from({ length: max }).map((_, i) => (
                    <div
                      key={i}
                      className="h-1.5 flex-1 rounded-full"
                      style={{ background: i < Math.round(score) ? color : '#e2e8f0' }}
                    />
                  ))}
                </div>
              );

              return (
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">AI Analysis Results</h4>
                  
                  {/* Core Vitals Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Breed</p>
                      <p className="text-slate-900 font-black text-sm mt-0.5">{videoStats.breed || 'Unknown'}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Age Estimate</p>
                      <p className="text-slate-900 font-black text-sm mt-0.5">{videoStats.age_estimate || 'N/A'}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Coat Color</p>
                      <p className="text-slate-900 font-black text-sm mt-0.5">{videoStats.coat_color || 'Unknown'}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Est. Weight</p>
                      <p className="text-slate-900 font-black text-sm mt-0.5">{videoStats.weight_kg ? `${videoStats.weight_kg} kg` : 'N/A'}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Est. Height</p>
                      <p className="text-slate-900 font-black text-sm mt-0.5">{videoStats.height_cm ? `${videoStats.height_cm} cm` : 'N/A'}</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Est. Value</p>
                      <p className="text-slate-900 font-black text-sm mt-0.5">{videoStats.estimated_value || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Score Rows — BCS, Health, Udder, Teat */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                    {/* BCS Score */}
                    <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-sm">
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">BCS Score</p>
                        <span className="text-emerald-700 font-black text-lg leading-none">{videoStats.bcs_score?.toFixed(1) || '—'}<span className="text-xs font-bold text-emerald-500">/5</span></span>
                      </div>
                      <p className="text-emerald-800 font-bold text-xs">{bcsLabel}</p>
                      <ScoreDots score={videoStats.bcs_score || 0} color="#10b981" />
                    </div>

                    {/* Health Status */}
                    <div className={`bg-white rounded-xl p-4 border shadow-sm ${isHealthy ? 'border-emerald-200' : 'border-rose-200'}`}>
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">Health Status</p>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
                        <p className={`font-black text-sm ${isHealthy ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {videoStats.disease_status || 'Healthy'}
                        </p>
                      </div>
                    </div>

                    {/* Udder Score */}
                    <div className={`bg-white rounded-xl p-4 border shadow-sm ${videoStats.udder_visible ? 'border-purple-200' : 'border-slate-200 opacity-75'}`}>
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Udder Score</p>
                        {videoStats.udder_visible ? (
                          <span className="text-purple-700 font-black text-lg leading-none">{videoStats.udder_score?.toFixed(1) || '—'}<span className="text-xs font-bold text-purple-400">/5</span></span>
                        ) : (
                          <span className="text-xs font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Not Captured</span>
                        )}
                      </div>
                      <p className={`font-bold text-xs ${videoStats.udder_visible ? 'text-purple-700' : 'text-slate-400'}`}>{udderLabel}</p>
                      {videoStats.udder_visible && <ScoreDots score={videoStats.udder_score || 0} color="#9333ea" />}
                      {!videoStats.udder_visible && (
                        <p className="text-[10px] text-slate-400 mt-1">Re-record video showing udder area</p>
                      )}
                    </div>

                    {/* Teat Score */}
                    <div className={`bg-white rounded-xl p-4 border shadow-sm ${videoStats.teat_visible ? 'border-blue-200' : 'border-slate-200 opacity-75'}`}>
                      <div className="flex items-start justify-between mb-1">
                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Teat Score</p>
                        {videoStats.teat_visible ? (
                          <span className="text-blue-700 font-black text-lg leading-none">{videoStats.teat_score?.toFixed(1) || '—'}<span className="text-xs font-bold text-blue-400">/5</span></span>
                        ) : (
                          <span className="text-xs font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Not Captured</span>
                        )}
                      </div>
                      <p className={`font-bold text-xs ${videoStats.teat_visible ? 'text-blue-700' : 'text-slate-400'}`}>{teatLabel}</p>
                      {videoStats.teat_visible && <ScoreDots score={videoStats.teat_score || 0} color="#2563eb" />}
                      {!videoStats.teat_visible && (
                        <p className="text-[10px] text-slate-400 mt-1">Re-record video showing teat area</p>
                      )}
                    </div>
                  </div>

                  {/* Observations */}
                  {videoStats.observations?.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-2">AI Observations</p>
                      <ul className="space-y-1.5">
                        {videoStats.observations.map((obs: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                            <span className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                            {obs}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* QR Code Card */}
            {currentCattleId && (
              <div className="mt-2">
                <CattleQRCodeCard
                  cattleId={currentCattleId}
                  cattleName={name || 'Registered Cattle'}
                  muzzleId={`MUZZ-${currentCattleId.slice(0, 8).toUpperCase()}`}
                  breed={videoStats?.breed}
                  healthStatus={videoStats?.disease_status || 'Healthy'}
                  bcsScore={videoStats?.bcs_score}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {videoStats?.missing_parts?.length > 0 && (
                <button
                  onClick={retakeVideo}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Retake Video
                </button>
              )}
              <button
                onClick={() => handleReset()}
                className="flex-1 btn-primary py-3 text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Register Another Cattle
              </button>
            </div>
          </div>
          )}
        </div>

        {/* CATTLE LIST */}
        <h2 className="text-xl font-black text-slate-900 mb-6">Registered Cattle ({cattleList.length})</h2>
        
        {cattleList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {cattleList.map(cattle => {
              // Extract muzzle tag from name e.g. "Bessie (MUZZ-AB12-0001)"
              const tagMatch = cattle.name.match(/\(([^)]+)\)/);
              const muzzleTag = tagMatch ? tagMatch[1] : cattle.id.substring(0, 8).toUpperCase();
              return (
              <div
                key={cattle.id}
                onClick={() => navigate(`/cattle/${cattle.id}`)}
                className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/50 border border-slate-200 flex flex-col items-center cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-emerald-300 hover:shadow-emerald-100/60 group"
              >
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 mb-4 border border-slate-200/60 relative">
                  <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-emerald-400 text-[10px] font-black tracking-widest px-2 py-0.5 rounded border border-emerald-500/30">
                    AI VERIFIED
                  </div>
                  <img src={cattle.display_image} alt={cattle.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                {/* Cattle name (without tag) */}
                <h3 className="text-base font-black text-slate-900 w-full truncate text-center">
                  {cattle.name.replace(/\s*\([^)]*\)/, '')}
                </h3>
                {/* Muzzle ID badge */}
                <div className="mt-1.5 flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-0.5">
                  <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                  </svg>
                  <span className="font-mono font-black text-[10px] text-emerald-700 tracking-wider">{muzzleTag}</span>
                </div>

                <div className="mt-3 flex gap-2 w-full pt-2 border-t border-slate-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedQrCattle(cattle);
                    }}
                    className="flex-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-bold text-xs py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-colors border border-slate-200 hover:border-emerald-300"
                  >
                    <span>📱</span> QR Code
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/cattle/${cattle.id}`);
                    }}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-colors shadow-sm"
                  >
                    View →
                  </button>
                </div>
              </div>
            );})}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center border-2 border-dashed border-slate-200 text-slate-500">
            You haven't registered any cattle yet. Upload a muzzle scan above to get started!
          </div>
        )}

        {/* QR Code Modal */}
        {selectedQrCattle && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
            <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-slate-50 rounded-3xl p-1.5 sm:p-3 shadow-2xl border border-slate-200">
              <button
                onClick={() => setSelectedQrCattle(null)}
                className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-8 h-8 sm:w-9 sm:h-9 bg-slate-200/80 hover:bg-slate-300 rounded-full flex items-center justify-center text-slate-700 font-bold transition-colors shadow-sm"
              >
                ✕
              </button>
              <CattleQRCodeCard
                cattleId={selectedQrCattle.id}
                cattleName={selectedQrCattle.name.replace(/\s*\([^)]*\)/, '')}
                muzzleId={selectedQrCattle.name.match(/\(([^)]+)\)/)?.[1] || `MUZZ-${selectedQrCattle.id.slice(0, 8).toUpperCase()}`}
                breed={selectedQrCattle.breed}
                healthStatus={selectedQrCattle.disease || selectedQrCattle.disease_status || 'Healthy'}
                bcsScore={selectedQrCattle.bcs_score}
                cattleImage={selectedQrCattle.display_image}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
