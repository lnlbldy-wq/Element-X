
import React from 'react';
import type { BiomoleculeInfo } from '../types';

interface BiomoleculeInfoCardProps {
  info: BiomoleculeInfo;
  onNew: () => void;
}

const BioInfoRow: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => {
    if (!value) return null;
    return (
        <div className="flex justify-between items-start py-2 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
            <dt className="text-sm text-cyan-700 dark:text-cyan-400 font-bold">{label}</dt>
            <dd className="text-sm text-slate-700 dark:text-slate-300 text-left max-w-[70%]">{value}</dd>
        </div>
    );
};

export const BiomoleculeInfoCard: React.FC<BiomoleculeInfoCardProps> = ({ info, onNew }) => {
  return (
    <div className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xl p-6 w-full max-w-3xl m-4 text-slate-800 dark:text-white relative flex flex-col animate-slide-up max-h-[90vh] overflow-y-auto scrollbar-hide">
      <h2 className="text-3xl font-bold text-cyan-600 dark:text-cyan-300 mb-2 text-center">{info.name}</h2>
      <p className="text-xl font-mono text-slate-600 dark:text-slate-300 mb-6 text-center">{info.formula}</p>

      <div className="w-full text-right bg-white/50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-300 dark:border-slate-700 mb-4">
        <h3 className="text-lg text-cyan-600 dark:text-cyan-400 font-semibold mb-2">التركيب البنائي</h3>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-md shadow-inner flex justify-center items-center min-h-[200px]">
            {info.structureImage === 'PENDING' ? (
                 <p className="animate-pulse text-slate-500 dark:text-slate-400">...جاري تحميل الصورة</p>
            ) : info.structureImage ? (
                <img src={info.structureImage} alt={`Structure for ${info.name}`} className="max-w-full h-auto" />
            ) : (
                <div className="text-center opacity-60">
                     <div className="text-4xl mb-2">🧬</div>
                     <p className="text-xs text-slate-500 dark:text-slate-400">الصورة غير متوفرة</p>
                </div>
            )}
        </div>
      </div>
      
       <div className="w-full text-right bg-white/50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-300 dark:border-slate-700 mb-4">
            <h3 className="text-lg text-slate-700 dark:text-slate-300 font-bold mb-2 border-b border-slate-200 dark:border-slate-700 pb-1">بطاقة تعريفية</h3>
            <dl>
                <BioInfoRow label="النوع" value={info.type} />
                <BioInfoRow label="الوزن الجزيئي" value={info.molecularWeight} />
                <BioInfoRow label="التواجد في الطبيعة" value={info.occurrence} />
            </dl>
        </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
             <h3 className="text-lg text-emerald-700 dark:text-emerald-400 font-semibold mb-2">الوظيفة الحيوية</h3>
             <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{info.biologicalFunction}</p>
          </div>
          
           <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800">
             <h3 className="text-lg text-indigo-700 dark:text-indigo-400 font-semibold mb-2">الدور الأيضي</h3>
             <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{info.metabolicRole || "غير محدد"}</p>
          </div>
      </div>

      <div className="w-full text-right bg-white/50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-300 dark:border-slate-700 mb-4">
        <h3 className="text-lg text-cyan-600 dark:text-cyan-400 font-semibold mb-2">الوصف</h3>
        <p className="text-md text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{info.description}</p>
      </div>

      {info.deficiencyEffects && (
         <div className="w-full text-right bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800 mb-4">
            <h3 className="text-lg text-red-600 dark:text-red-400 font-semibold mb-2">التأثيرات السريرية (نقص/زيادة)</h3>
            <p className="text-md text-slate-700 dark:text-slate-300 leading-relaxed">{info.deficiencyEffects}</p>
        </div>
      )}
      
      <div className="w-full mt-4 flex flex-col gap-3">
        <button 
            onClick={onNew}
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-colors w-full text-lg mt-2"
        >
            استكشاف جديد
        </button>
      </div>
    </div>
  );
};
