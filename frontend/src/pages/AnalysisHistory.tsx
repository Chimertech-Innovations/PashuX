import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getHistory, BASE_URL } from '@/lib/api';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import { generateHealthReportPDF } from '@/utils/pdfGenerator';
import CattleQRCodeCard from '@/components/cattle/CattleQRCodeCard';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AnalysisHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<any[]>([]);
  const [cattleList, setCattleList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cattleLoading, setCattleLoading] = useState(true);

  // Modal and action states for cattle cards
  const [selectedQrCattle, setSelectedQrCattle] = useState<any | null>(null);
  const [editingCattle, setEditingCattle] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    breed: string;
    gender: string;
    color: string;
    weight_kg: string;
    height_cm: string;
    estimated_value: string;
    disease: string;
  }>({
    name: '', breed: '', gender: 'Female', color: '', weight_kg: '', height_cm: '', estimated_value: '', disease: ''
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fetchCattle = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${BASE_URL}/api/muzzle/user/${user.id}`);
      const data = await res.json();
      if (res.ok) {
        setCattleList(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch cattle", err);
    } finally {
      setCattleLoading(false);
    }
  };

  useEffect(() => {
    if (!user) { 
      setLoading(false); 
      setCattleLoading(false);
      return; 
    }
    
    getHistory(user.id)
      .then(res => setHistory((res as any).history || []))
      .catch(() => {})
      .finally(() => setLoading(false));

    fetchCattle();
  }, [user]);

  const openEditModal = (cattle: any) => {
    setEditingCattle(cattle);
    setEditForm({
      name: cattle.name.replace(/\s*\([^)]*\)/, ''),
      breed: cattle.breed || '',
      gender: cattle.gender || cattle.sex || 'Female',
      color: cattle.color || cattle.coat_color || '',
      weight_kg: cattle.weight_kg ? cattle.weight_kg.toString() : '',
      height_cm: cattle.height_cm ? cattle.height_cm.toString() : '',
      estimated_value: cattle.estimated_value || '',
      disease: cattle.disease || cattle.disease_status || 'Healthy',
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCattle) return;
    setActionLoading(true);
    try {
      const formData = new FormData();
      if (editForm.name) formData.append('name', editForm.name);
      if (editForm.breed) formData.append('breed', editForm.breed);
      if (editForm.gender) formData.append('gender', editForm.gender);
      if (editForm.color) formData.append('coat_color', editForm.color);
      if (editForm.weight_kg) formData.append('weight_kg', editForm.weight_kg);
      if (editForm.height_cm) formData.append('height_cm', editForm.height_cm);
      if (editForm.estimated_value) formData.append('estimated_value', editForm.estimated_value);
      if (editForm.disease) formData.append('disease_status', editForm.disease);

      const res = await fetch(`${BASE_URL}/api/muzzle/${editingCattle.id}`, {
        method: 'PUT',
        body: formData,
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Cattle profile updated successfully!' });
        setEditingCattle(null);
        fetchCattle();
      } else {
        setMessage({ type: 'error', text: 'Failed to update cattle profile.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error updating cattle profile.' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDeleteCattle = async (cattleId: string, cattleName: string) => {
    if (!window.confirm(`Are you sure you want to delete profile '${cattleName}'? This action will permanently remove it.`)) {
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/api/muzzle/${cattleId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMessage({ type: 'success', text: `Cattle '${cattleName}' deleted successfully.` });
        setCattleList(prev => prev.filter(c => c.id !== cattleId));
      } else {
        setMessage({ type: 'error', text: 'Failed to delete cattle profile.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error deleting cattle profile.' });
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen pt-32 pb-24 px-6 flex items-center justify-center bg-slate-50">
        <div className="text-center glass-card p-12 max-w-md mx-auto bg-white border border-slate-200 shadow-xl rounded-3xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-5 border border-emerald-200 shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Sign in to view history</h2>
          <p className="text-slate-700 text-sm font-bold mb-8 leading-relaxed">
            Your analysis history and cattle profiles are stored securely.
          </p>
          <Link to="/auth" className="btn-primary px-8 py-3.5 text-sm font-extrabold shadow-md">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 lg:pt-36 pb-24 px-4 sm:px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 animate-fade-up">
          <p className="section-label mb-2">Your Data</p>
          <h1 className="text-display font-black text-slate-900 mb-2">Analysis History & Cattle Profiles</h1>
          <p className="text-slate-700 text-sm font-bold">View all your registered cattle profile cards and past diagnostic reports.</p>
        </div>

        {message && (
          <div className={`p-4 rounded-2xl mb-6 text-xs font-bold border ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* CATTLE PROFILE CARDS SECTION */}
        <div className="mb-14">
          <h2 className="text-xl font-black text-slate-900 mb-6">Registered Cattle Profiles ({cattleList.length})</h2>
          {cattleLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <SkeletonCard key={i} lines={2} />)}
            </div>
          ) : cattleList.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border-2 border-dashed border-slate-200 text-slate-500">
              No registered cattle profiles found. Go to <Link to="/farm" className="text-emerald-600 underline font-bold">Farm Management</Link> to scan & register your cattle.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {cattleList.map(cattle => {
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
                    <h3 className="text-base font-black text-slate-900 w-full truncate text-center">
                      {cattle.name.replace(/\s*\([^)]*\)/, '')}
                    </h3>
                    <div className="mt-1.5 flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-0.5">
                      <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                      </svg>
                      <span className="font-mono font-black text-[10px] text-emerald-700 tracking-wider">{muzzleTag}</span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5 w-full pt-2 border-t border-slate-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedQrCattle(cattle);
                        }}
                        className="flex-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 font-bold text-[11px] py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-colors border border-slate-200"
                      >
                        QR Code
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(cattle);
                        }}
                        className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-colors border border-amber-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCattle(cattle.id, cattle.name.replace(/\s*\([^)]*\)/, ''));
                        }}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-colors border border-rose-200"
                        title="Delete Cattle Profile"
                      >
                        Delete
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/cattle/${cattle.id}`);
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 px-2 rounded-xl flex items-center justify-center gap-1 transition-colors shadow-sm mt-1"
                      >
                        View Details →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SCAN HISTORY SECTION */}
        <div>
          <h2 className="text-xl font-black text-slate-900 mb-6">Diagnostic Scan History</h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <SkeletonCard key={i} lines={2} />)}
            </div>
          ) : history.length === 0 ? (
            <div className="glass-card p-12 text-center bg-white border border-slate-200 rounded-3xl shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-5 border border-slate-200">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-2">No diagnostic reports yet</h3>
              <p className="text-slate-700 text-sm font-bold">Use BCS or disease screening modules to generate health reports.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item: any) => {
                const result = item.analysis_results?.[0];
                const isBCS = item.analysis_type === 'bcs';
                return (
                  <div key={item.id} className="glass-card-hover p-6 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-5 animate-fade-up shadow-sm">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isBCS ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>
                      {isBCS ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-black ${isBCS ? 'text-emerald-700' : 'text-amber-800'}`}>
                          {isBCS ? 'BCS Detection' : 'Disease Detection'}
                        </span>
                        <span className={`
                          text-[10px] px-2 py-0.5 rounded-full font-bold uppercase
                          ${item.processing_status === 'completed' ? 'badge-green' :
                            item.processing_status === 'failed' ? 'badge-red' : 'badge-grey'}
                        `}>
                          {item.processing_status}
                        </span>
                      </div>
                      {result && (
                        <p className="text-sm font-extrabold text-slate-900 truncate">
                          {isBCS
                            ? `BCS ${result.bcs_score?.toFixed(1)} — ${result.result_json?.condition || 'Evaluated'}`
                            : result.result_json?.possible_condition}
                        </p>
                      )}
                      <p className="text-xs font-bold text-slate-500 mt-1">{formatDate(item.created_at)}</p>
                    </div>

                    <button
                      onClick={() => {
                        const resJson = result?.result_json || {};
                        generateHealthReportPDF({
                          requestId: item.id,
                          userEmail: user?.email,
                          date: formatDate(item.created_at),
                          analysisType: item.analysis_type,
                          bcsScore: result?.bcs_score ?? resJson.bcs_score,
                          bcsConfidence: result?.confidence ?? resJson.confidence,
                          possibleCondition: result?.possible_condition ?? resJson.possible_condition,
                          diseaseConfidence: result?.confidence ?? resJson.confidence,
                          severity: result?.severity ?? resJson.severity,
                          observations: result?.observations || resJson.observations || resJson.visible_signs,
                          recommendations: result?.recommendations || resJson.recommendations || resJson.next_steps,
                          aiSuggestions: resJson.ai_summary || resJson.condition,
                        });
                      }}
                      className="btn-secondary py-2 px-3.5 text-xs font-black flex items-center gap-1.5 self-start sm:self-center"
                    >
                      <span>📄</span> PDF
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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

        {/* Edit Cattle Profile Modal */}
        {editingCattle && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
            <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200">
              <button
                onClick={() => setEditingCattle(null)}
                className="absolute top-4 right-4 w-9 h-9 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-700 font-bold transition-colors"
              >
                ✕
              </button>

              <div className="mb-6">
                <h3 className="text-xl font-black text-slate-900">Edit Cattle Profile</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Update profile information stored in database.
                </p>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Cattle Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="input-field mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Breed</label>
                  <input
                    type="text"
                    value={editForm.breed}
                    onChange={(e) => setEditForm(prev => ({ ...prev, breed: e.target.value }))}
                    className="input-field mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Gender / Sex</label>
                  <select
                    value={editForm.gender}
                    onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                    className="input-field mt-1"
                  >
                    <option value="Female">Female (Cow)</option>
                    <option value="Male">Male (Bull)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Coat Color</label>
                  <input
                    type="text"
                    value={editForm.color}
                    onChange={(e) => setEditForm(prev => ({ ...prev, color: e.target.value }))}
                    className="input-field mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Weight (kg)</label>
                    <input
                      type="number"
                      value={editForm.weight_kg}
                      onChange={(e) => setEditForm(prev => ({ ...prev, weight_kg: e.target.value }))}
                      className="input-field mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Height (cm)</label>
                    <input
                      type="number"
                      value={editForm.height_cm}
                      onChange={(e) => setEditForm(prev => ({ ...prev, height_cm: e.target.value }))}
                      className="input-field mt-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Estimated Value</label>
                  <input
                    type="text"
                    value={editForm.estimated_value}
                    onChange={(e) => setEditForm(prev => ({ ...prev, estimated_value: e.target.value }))}
                    className="input-field mt-1"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Disease Status</label>
                  <input
                    type="text"
                    value={editForm.disease}
                    onChange={(e) => setEditForm(prev => ({ ...prev, disease: e.target.value }))}
                    className="input-field mt-1"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingCattle(null)}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md"
                  >
                    {actionLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
