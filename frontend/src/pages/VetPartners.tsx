import { Link } from 'react-router-dom';

const VET_PARTNERS = [
  {
    name: 'Dr. Ramesh Kumar, B.V.Sc & A.H.',
    role: 'Senior Dairy Cattle Specialist',
    region: 'Tamil Nadu & Karnataka Region',
    phone: '+91 98450 12345',
    clinic: 'Chimertech Veterinary Clinical Network',
    badge: 'VERIFIED VET PARTNER',
  },
  {
    name: 'Dr. Ananya Sharma, M.V.Sc (Theriogenology)',
    role: 'Reproductive & BCS Consultant',
    region: 'Maharashtra & Gujarat Region',
    phone: '+91 97120 67890',
    clinic: 'OpenPashu Dairy Health Clinic',
    badge: 'VERIFIED VET PARTNER',
  },
  {
    name: 'Dr. K. Senthil Nathan, B.V.Sc',
    role: 'Udder Health & Mastitis Specialist',
    region: 'Southern Dairy Cooperative Network',
    phone: '+91 94430 54321',
    clinic: 'Cooperative Vet Services',
    badge: 'EMERGENCY SUPPORT',
  },
];

export default function VetPartners() {
  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-20 px-4 sm:px-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-8 text-left">
        {/* Header Title */}
        <div className="space-y-3 border-b border-slate-200 pb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Veterinary Partner Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Connect with certified veterinary practitioners for confirmation, consultation, and treatment
          </p>
        </div>

        {/* Content Section */}
        <div className="bg-white rounded-2xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8 text-slate-700 text-sm leading-relaxed font-normal">
          
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">
              1. Veterinary Consultation Support
            </h2>
            <p>
              Users should consult licensed veterinarians for disease confirmation, treatment decisions, medication prescribing, and emergency conditions.
            </p>
          </section>

          {/* Directory Grid */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              2. Registered Veterinary Partners
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {VET_PARTNERS.map((vet, idx) => (
                <div key={idx} className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between hover:border-slate-400 transition-all">
                  <div className="space-y-1.5">
                    <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-800">
                      {vet.badge}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm pt-1">{vet.name}</h3>
                    <p className="text-xs text-slate-600 font-medium">{vet.role}</p>
                    <p className="text-[11px] text-slate-500">{vet.region}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <p className="text-xs font-semibold text-slate-800">{vet.clinic}</p>
                    <a
                      href={`tel:${vet.phone}`}
                      className="w-full py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs text-center block transition-colors"
                    >
                      Call {vet.phone}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Emergency Contact */}
          <section className="p-6 rounded-2xl bg-slate-900 text-white space-y-2 shadow-md">
            <h3 className="font-bold text-sm text-slate-100">Emergency Health Conditions</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-normal">
              If an animal shows acute emergency symptoms such as severe bloat, recumbency, or calving distress, contact a local veterinarian or emergency animal hospital immediately.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
