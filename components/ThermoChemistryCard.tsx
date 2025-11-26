
import React from 'react';
import type { ThermoChemistryInfo } from '../types';

interface ThermoChemistryCardProps {
  info: ThermoChemistryInfo;
  onNew: () => void;
}

const ValueDisplay: React.FC<{ label: string; value: string; unit?: string; subValue?: string }> = ({ label, value, unit, subValue }) => (
    <div className="flex-1 bg-white/50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-300 dark:border-slate-700 text-center flex flex-col justify-center min-w-[150px]">
        <h4 className="text-sm text-slate-600 dark:text-slate-400 font-semibold mb-1">{label}</h4>
        <p className="text-xl font-bold text-cyan-600 dark:text-cyan-300">
            {value} <span className="text-sm font-normal text-slate-500">{unit}</span>
        </p>
        {subValue && <p className="text-xs text-slate-400 mt-1">{subValue}</p>}
    </div>
);

export const ThermoChemistryCard: React.FC<ThermoChemistryCardProps> = ({ info, onNew }) => {
  return (
    <div className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xl p-6 w-full max-w-4xl m-4 text-slate-800 dark:text-white relative flex flex-col animate-slide-up max-h-[90vh] overflow-y-auto scrollbar-hide">
      <h2 className="text-3xl font-bold text-cyan-600 dark:text-cyan-300 mb-2 text-center">تحليل الكيمياء الحرارية</h2>
      <p dir="ltr" className="text-xl font-mono text-slate-600 dark:text-slate-300 mb-6 text-center">{info.equation}</p>

      <div className="w-full bg-white/50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-300 dark:border-slate-700 mb-4">
        <h3 className="text-lg text-cyan-600 dark:text-cyan-400 font-semibold mb-2 text-center">مخطط طاقة التفاعل</h3>
        <div className="bg-white dark:bg-slate-900 p-2 rounded-md shadow-inner flex justify-center items-center min-h-[250px]">
          {info.energyProfileImage === 'PENDING' ? (
             <p className="animate-pulse text-slate-500">...جاري تحميل المخطط</p>
          ) : info.energyProfileImage ? (
            <img src={info.energyProfileImage} alt="Energy Profile Diagram" className="max-w-full h-auto" />
          ) : (
            <div className="text-center opacity-60">
                 <div className="text-4xl mb-2">🔥</div>
                 <p className="text-xs text-slate-500">المخطط غير متوفر</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className={`flex-1 p-4 rounded-lg border text-center ${info.isExothermic ? 'bg-red-100 dark:bg-red-900/50 border-red-300 dark:border-red-700' : 'bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700'}`}>
              <h4 className={`text-xl font-bold ${info.isExothermic ? 'text-red-700 dark:text-red-300' : 'text-blue-700 dark:text-blue-300'}`}>
                  {info.isExothermic ? 'طارد للحرارة' : 'ماص للحرارة'}
              </h4>
          </div>
          <div className={`flex-1 p-4 rounded-lg border text-center ${info.isSpontaneous ? 'bg-green-100 dark:bg-green-900/50 border-green-300 dark:border-green-600' : 'bg-yellow-100 dark:bg-yellow-900/50 border-yellow-300 dark:border-yellow-700'}`}>
               <h4 className={`text-xl font-bold ${info.isSpontaneous ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
                  {info.isSpontaneous ? 'تلقائي' : 'غير تلقائي'}
              </h4>
               <p className="text-xs text-slate-500">(عند الظروف القياسية)</p>
          </div>
      </div>
      
      <h3 className="text-lg text-slate-700 dark:text-slate-300 font-bold mb-3 mt-2 border-b border-slate-200 dark:border-slate-700 pb-2">الدوال الديناميكية الحرارية</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <ValueDisplay label="ΔH° (الإنثالبي)" value={info.enthalpyChange.split(' ')[0]} unit={info.enthalpyChange.split(' ')[1] || ''} />
        <ValueDisplay label="ΔS° (الإنتروبي)" value={info.entropyChange.split(' ')[0]} unit={info.entropyChange.split(' ')[1] || ''} />
        <ValueDisplay label="ΔG° (طاقة غيبس)" value={info.gibbsFreeEnergyChange.split(' ')[0]} unit={info.gibbsFreeEnergyChange.split(' ')[1] || ''} />
      </div>

      <h3 className="text-lg text-slate-700 dark:text-slate-300 font-bold mb-3 mt-2 border-b border-slate-200 dark:border-slate-700 pb-2">الحركية والاتزان</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
         <ValueDisplay label="طاقة التنشيط (Ea)" value={info.activationEnergy || "N/A"} />
         <ValueDisplay label="ثابت الاتزان (Keq)" value={info.equilibriumConstant || "N/A"} subValue="قيمة تقريبية" />
      </div>

      {info.rateFactors && info.rateFactors.length > 0 && (
          <div className="w-full text-right bg-white/50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-300 dark:border-slate-700 mb-4">
              <h3 className="text-lg text-slate-700 dark:text-slate-300 font-bold mb-3 border-b border-slate-200 dark:border-slate-700 pb-1">
                  ⚡ عوامل سرعة التفاعل
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {info.rateFactors.map((factor, index) => (
                      <li key={index} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm transition-transform hover:scale-[1.02]">
                          <span className="text-indigo-500 text-lg">•</span>
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{factor}</span>
                      </li>
                  ))}
              </ul>
          </div>
      )}
      
      <div className="w-full text-right bg-white/50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-300 dark:border-slate-700 mb-4">
        <h3 className="text-lg text-cyan-600 dark:text-cyan-400 font-semibold mb-2">شرح التحليل</h3>
        <p className="text-md text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{info.explanation}</p>
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
