import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

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
      const res = await fetch(`http://localhost:8000/api/muzzle/user/${user.id}`);
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
      const res = await fetch('http://localhost:8000/api/muzzle/register', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: `Cattle registered successfully! Proceeding to Step 2...` });
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
          const res = await fetch(`http://localhost:8000/api/muzzle/${currentCattleId}/video-analysis`, {
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
        <h1 className="text-3xl font-black text-slate-900 mb-2">Farm Management</h1>
        <p className="text-slate-500 font-medium mb-8">Register new cattle using AI Muzzle Scanning and Video Analysis.</p>

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
              <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6 text-center">
                  <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md mx-auto mb-4">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h3 className="text-emerald-900 font-black text-2xl mb-1">Registration Complete</h3>
                  <p className="text-emerald-700 font-bold text-sm">Cattle Profile Successfully Analyzed & Stored</p>
              </div>

              {videoStats && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                          <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-0.5">Breed</p>
                          <p className="text-slate-900 font-bold">{videoStats.breed || 'Unknown'}</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                          <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-0.5">BCS Score</p>
                          <p className="text-slate-900 font-bold">{videoStats.bcs_score || 'N/A'}</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                          <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-0.5">Est. Weight</p>
                          <p className="text-slate-900 font-bold">{videoStats.weight_kg ? `${videoStats.weight_kg} kg` : 'N/A'}</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                          <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-0.5">Height</p>
                          <p className="text-slate-900 font-bold">{videoStats.height_cm ? `${videoStats.height_cm} cm` : 'N/A'}</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
                          <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-0.5">Health Status</p>
                          <p className={`font-bold ${videoStats.disease_status && videoStats.disease_status.toLowerCase() !== 'healthy' ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {videoStats.disease_status || 'Healthy'}
                          </p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                          <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-0.5">Coat Color</p>
                          <p className="text-slate-900 font-bold">{videoStats.coat_color || 'Unknown'}</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                          <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-0.5">Est. Value</p>
                          <p className="text-slate-900 font-bold">{videoStats.estimated_value || 'N/A'}</p>
                      </div>
                  </div>
              )}

              <button 
                  onClick={() => handleReset()}
                  className="w-full btn-primary py-4 text-base mt-4 shadow-lg shadow-emerald-500/20"
              >
                  Register Another Cattle
              </button>
          </div>
          )}
        </div>

        {/* CATTLE LIST */}
        <h2 className="text-xl font-black text-slate-900 mb-6">Registered Cattle ({cattleList.length})</h2>
        
        {cattleList.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {cattleList.map(cattle => (
              <div key={cattle.id} className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/50 border border-slate-200 flex flex-col items-center">
                <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 mb-4 border border-slate-200/60 relative">
                  <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-emerald-400 text-[10px] font-black tracking-widest px-2 py-0.5 rounded border border-emerald-500/30">
                    AI VERIFIED
                  </div>
                  <img src={cattle.display_image} alt={cattle.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-lg font-black text-slate-900 w-full truncate text-center">{cattle.name}</h3>
                <p className="text-slate-500 font-mono text-xs uppercase mt-1">ID: {cattle.name.split('(')[1]?.replace(')', '') || cattle.id.substring(0, 8)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center border-2 border-dashed border-slate-200 text-slate-500">
            You haven't registered any cattle yet. Upload a muzzle scan above to get started!
          </div>
        )}

      </div>
    </div>
  );
}
