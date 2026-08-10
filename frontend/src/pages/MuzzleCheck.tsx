import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BASE_URL } from '@/lib/api';
import { compressImage } from '@/utils/imageCompressor';
import AngleCameraModal from '@/components/ui/AngleCameraModal';

export default function MuzzleCheck() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth', { state: { message: 'Please log in to identify cattle' } });
    }
  }, [user, navigate]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const rawFile = e.target.files[0];
      const selectedFile = await compressImage(rawFile);
      const previewUrl = URL.createObjectURL(selectedFile);
      
      setFile(selectedFile);
      setPreview(previewUrl);
      
      setResult(null);
      setError(null);
    }
  };

  const handleCameraCapture = async (capturedFile: File) => {
    const compressed = await compressImage(capturedFile);
    setFile(compressed);
    setPreview(URL.createObjectURL(compressed));
    setResult(null);
    setError(null);
    setIsCameraOpen(false);
  };

  const removeFile = () => {
    setFile(null); 
    setPreview(null); 
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = () => {
    removeFile();
    setResult(null);
    setError(null);
  };

  const handleIdentify = async () => {
    if (!file) {
      setError('Please upload a muzzle image.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${BASE_URL}/api/muzzle/identify`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setResult(data);
      } else {
        setError(data.detail || 'Identification failed');
        // If OpenAI told them to retake the photo, clear the preview so they can try again
        if (data.detail && (data.detail.toLowerCase().includes('retake') || data.detail.toLowerCase().includes('blurry') || data.detail.toLowerCase().includes('valid'))) {
           handleReset(); // clears file and preview
           setError(data.detail); // restore error since handleReset clears it
        }
      }
    } catch (err) {
      setError('Network error connecting to backend.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="pt-24 pb-20 min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3 tracking-tight">AI Muzzle Identification</h1>
          <p className="text-slate-500 font-medium max-w-xl mx-auto text-sm sm:text-base">
            Instantly identify cattle by scanning their unique multi-angle muzzle pattern.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scanner Side */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  1
              </span>
              Scan Muzzle (1 Image)
              </h2>
              {result && (
                  <button type="button" onClick={handleReset} className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
                      + Scan Another Cattle
                  </button>
              )}
          </div>
            
            <div className="space-y-4">
              <div className="max-w-xs mx-auto">
                <div className={`relative border-2 ${preview ? 'border-emerald-500 bg-emerald-50/30 border-solid' : 'border-dashed border-slate-300 hover:border-emerald-400 bg-slate-50'} rounded-xl p-3 text-center transition-all flex flex-col justify-center min-h-[200px]`}>
                  {preview ? (
                    <div className="flex flex-col items-center">
                      <img src={preview} alt="Preview" className={`max-h-32 w-auto object-contain rounded-md mb-2 ${loading ? 'opacity-50' : ''}`} />
                      {!loading && !result && (
                        <button type="button" onClick={removeFile} className="text-[12px] font-bold text-rose-500 hover:text-rose-600 uppercase">Remove</button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2 text-emerald-500 shadow-sm">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </div>
                      <p className="text-[12px] font-bold text-slate-700 uppercase">Scan Muzzle Image</p>
                      <div className="grid grid-cols-2 gap-2 mt-3 relative z-10">
                        <button type="button" onClick={() => setIsCameraOpen(true)} className="btn-primary py-2 text-xs flex justify-center items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /></svg>
                          Camera
                        </button>
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-secondary py-2 text-xs flex justify-center items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          Upload
                        </button>
                      </div>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleFileChange} className="sr-only" ref={fileInputRef} disabled={loading} />
                </div>
              </div>
            </div>

            {isCameraOpen && (
              <AngleCameraModal
                angleName="front"
                angleLabel="Muzzle Identity"
                onCapture={handleCameraCapture}
                onClose={() => setIsCameraOpen(false)}
              />
            )}

            <div className="mt-6 flex gap-3">
              {preview && !loading && !result && (
                <button 
                  onClick={handleReset}
                  className="px-4 py-3 rounded-xl font-bold text-sm text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  Clear
                </button>
              )}
              
              <button 
                onClick={handleIdentify}
                disabled={loading || !file || !!result}
                className="flex-1 btn-primary py-3.5 shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>Analyzing...</span>
                  </>
                ) : result ? (
                  <span>Analysis Complete</span>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <span>Identify Cattle</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Side */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-200 flex flex-col">
            <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                2
              </span>
              Match Results
            </h2>
            
            <div className="flex-1 flex flex-col justify-center">
              {loading ? (
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-slate-500 font-bold text-sm">Validating & searching database...</p>
                </div>
              ) : error ? (
                <div className="text-center p-6 bg-rose-50 rounded-2xl border border-rose-100">
                  <div className="w-12 h-12 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <p className="text-rose-800 font-black mb-1">{error}</p>
                </div>
              ) : result ? (
                result.status === 'not_found' ? (
                  <div className="text-center p-6 bg-amber-50 rounded-2xl border border-amber-200">
                    <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h3 className="text-amber-900 font-black text-lg mb-2">No Match Found</h3>
                    <p className="text-amber-700/80 font-medium text-sm mb-6 leading-relaxed">
                      This muzzle pattern does not exist in your database. The AI requires a registered pattern to identify cattle.
                    </p>
                    <Link to="/farm" className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl transition-colors text-sm shadow-md">
                      Register this Cattle
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </Link>
                  </div>
                ) : (
                  <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <div>
                        <h3 className="text-emerald-900 font-black text-xl leading-none">Match Found!</h3>
                        <p className="text-emerald-700 font-bold text-xs mt-1">
                          Similarity Score: {((result.cattle.similarity || 0) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm">
                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-0.5">Name / Tag</p>
                        <p className="text-slate-900 font-black text-lg">{result.cattle.name}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm">
                          <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-0.5">Breed</p>
                          <p className="text-slate-900 font-bold">{result.cattle.breed || 'Unknown'}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm">
                          <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-0.5">BCS Score</p>
                          <p className="text-slate-900 font-bold">{result.cattle.bcs_score || 'N/A'}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm">
                          <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-0.5">Est. Weight</p>
                          <p className="text-slate-900 font-bold">{result.cattle.weight_kg ? `${result.cattle.weight_kg} kg` : 'N/A'}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm">
                          <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-0.5">Height</p>
                          <p className="text-slate-900 font-bold">{result.cattle.height_cm ? `${result.cattle.height_cm} cm` : 'N/A'}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm col-span-2">
                          <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-0.5">Health Status</p>
                          <p className={`font-bold ${result.cattle.disease && result.cattle.disease.toLowerCase() !== 'healthy' ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {result.cattle.disease || 'Healthy'}
                          </p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm">
                          <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-0.5">Color</p>
                          <p className="text-slate-900 font-bold">{result.cattle.color || 'Unknown'}</p>
                        </div>
                        <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm">
                          <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-0.5">Est. Value</p>
                          <p className="text-slate-900 font-bold">{result.cattle.estimated_value || 'N/A'}</p>
                        </div>
                      </div>

                      {result.cattle.id && (
                        <button
                          onClick={() => navigate(`/cattle/${result.cattle.id}`)}
                          className="w-full mt-2 flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black rounded-2xl transition-all duration-200 shadow-lg shadow-emerald-500/30 text-sm group"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          View Full Cattle Profile
                          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center text-slate-400 flex flex-col items-center">
                  <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <p className="font-medium text-sm">Upload a muzzle scan on the left to see results</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
