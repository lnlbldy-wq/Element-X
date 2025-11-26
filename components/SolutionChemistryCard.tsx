
import React from 'react';
import type { SolutionChemistryInfo } from '../types';

const InfoRow: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => {
    if (!value) return null;
    return (
        <div className="flex justify-between items-start py-3 border-b border-slate-300 dark:border-slate-700 last:border-b-0">
            <dt className="text-md text-cyan-600 dark:text-cyan-400 font-semibold">{label}</dt>
            <dd className="text-md text-slate-700 dark:text-slate-200 text-left">{value}</dd>
        </div>
    );
};


export const SolutionChemistryCard: React.FC<{ info: SolutionChemistryInfo; onNew: () => void }> = ({ info, onNew }) => {
  return (
    <div className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xl p-6 w-full max-w-3xl m-4 text-slate-800 dark:text-white relative flex flex-col animate-slide-up max-h-[90vh] overflow-y-auto scrollbar-hide">
      <h2 className="text-3xl font-bold text-cyan-600 dark:text-cyan-300 mb-4 text-center">
        تحليل محلول {info.soluteName}
      </h2>

      <div className="w-full bg-white/50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-300 dark:border-slate-700 mb-4">
        <h3 className="text-lg text-cyan-600 dark:text-cyan-400 font-semibold mb-2 text-center">نظرة مجهرية على الذوبان</h3>
        <div className="bg-white dark:bg-slate-900 p-2 rounded-md shadow-inner flex justify-center items-center min-h-[250px]">
          {info.solutionImage === 'PENDING' ? (
             <p className="animate-pulse text-slate-500">...جاري تحميل المخطط</p>
          ) : info.solutionImage ? (
            <img src={info.solutionImage} alt="Solution dissolution process" className="max-w-full h-auto" />
          ) : (
             <div className="text-center opacity-60">
                 <div className="text-4xl mb-2">💧</div>
                 <p className="text-xs text-slate-500">الصورة غير متوفرة</p>
            </div>
          )}
        </div>
      </div>
      
       <div className="w-full text-right bg-white/50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-300 dark:border-slate-700 mb-4">
            <h3 className="text-lg text-slate-700 dark:text-slate-300 font-bold mb-3 border-b border-slate-200 dark:border-slate-700 pb-1">خصائص المحلول الأساسية</h3>
            <dl>
                <InfoRow label="المذاب" value={`${info.soluteName} (${info.soluteFormula})`} />
                <InfoRow label="المذيب" value={info.solventName} />
                <InfoRow label="التركيز المولاري" value={info.concentrationMolarity} />
                <InfoRow label="نوع المحلول" value={<span className="font-bold text-indigo-600 dark:text-indigo-400">{info.solutionType}</span>} />
                <InfoRow label="الرقم الهيدروجيني (pH) التقديري" value={info.phLevel} />
                <InfoRow label="التوصيل الكهربائي" value={info.conductivity} />
            </dl>
        </div>

        <div className="w-full text-right bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
            <h3 className="text-lg text-blue-700 dark:text-blue-400 font-bold mb-3 border-b border-blue-200 dark:border-blue-800 pb-1">الخواص الجامعة (Colligative Properties)</h3>
            <dl>
                <InfoRow label="الارتفاع في درجة الغليان" value={info.boilingPointElevation} />
                <InfoRow label="الانخفاض في درجة التجمد" value={info.freezingPointDepression} />
            </dl>
        </div>

      <div className="w-full text-right bg-white/50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-300 dark:border-slate-700 mb-4">
        <h3 className="text-lg text-cyan-600 dark:text-cyan-400 font-semibold mb-2">شرح عملية الذوبان</h3>
        <p className="text-md text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{info.solutionDescription}</p>
      </div>
      
      <div className="w-full mt-4 flex flex-col gap-3">
        <button 
          onClick={onNew}
          className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-colors w-full text-lg mt-2"
        >
          تحليل جديد
        </button>
      </div>
    </div>
  );
};
