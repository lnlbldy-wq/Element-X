
import React from 'react';
import type { GalvanicCellInfo } from '../types';

export const GalvanicCellCard: React.FC<{ info: GalvanicCellInfo; onNew: () => void }> = ({ info, onNew }) => {
  return (
    <div className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xl p-6 w-full max-w-3xl m-4 text-slate-800 dark:text-white relative flex flex-col animate-slide-up max-h-[90vh] overflow-y-auto scrollbar-hide">
      <h2 className="text-3xl font-bold text-cyan-600 dark:text-cyan-300 mb-4 text-center">
        خلية {info.anode.metal}-{info.cathode.metal} الجلفانية
      </h2>

      <div className="w-full bg-white/50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-300 dark:border-slate-700 mb-4">
        <h3 className="text-lg text-cyan-600 dark:text-cyan-400 font-semibold mb-2 text-center">مخطط الخلية</h3>
        <div className="bg-white dark:bg-slate-900 p-2 rounded-md shadow-inner flex justify-center items-center min-h-[250px]">
          {info.diagramImage === 'PENDING' ? (
             <p className="animate-pulse text-slate-500">...جاري تحميل المخطط</p>
          ) : info.diagramImage ? (
            <img src={info.diagramImage} alt="Galvanic Cell Diagram" className="max-w-full h-auto" />
          ) : (
             <div className="text-center opacity-60">
                 <div className="text-4xl mb-2">⚡</div>
                 <p className="text-xs text-slate-500">المخطط غير متوفر</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="text-center bg-white/50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-300 dark:border-slate-700">
            <h3 className="text-sm text-slate-600 dark:text-slate-400 font-semibold mb-1">جهد الخلية القياسي (E°cell)</h3>
            <p dir="ltr" className="text-2xl font-mono text-emerald-600 dark:text-emerald-300 font-bold">{info.cellPotential}</p>
          </div>
           <div className="text-center bg-white/50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-300 dark:border-slate-700">
            <h3 className="text-sm text-slate-600 dark:text-slate-400 font-semibold mb-1">طاقة غيبس الحرة (ΔG°)</h3>
            <p dir="ltr" className="text-2xl font-mono text-indigo-600 dark:text-indigo-300 font-bold">{info.gibbsFreeEnergy || "N/A"}</p>
          </div>
      </div>
      
      {info.cellNotation && (
           <div className="w-full text-center bg-slate-200 dark:bg-slate-700 p-3 rounded-lg border border-slate-300 dark:border-slate-600 mb-4">
                <h3 className="text-xs text-slate-500 dark:text-slate-400 font-semibold mb-1 uppercase tracking-widest">الرمز الاصطلاحي للخلية</h3>
                <code dir="ltr" className="text-xl font-mono font-bold text-slate-800 dark:text-slate-100">{info.cellNotation}</code>
           </div>
      )}

      <div className="grid md:grid-cols-2 gap-4 mb-4 text-center">
        <div className="w-full bg-red-100 dark:bg-red-900/50 p-4 rounded-lg border border-red-300 dark:border-red-700">
          <h3 className="text-lg text-red-700 dark:text-red-400 font-semibold mb-2">المصعد (أكسدة)</h3>
          <p className="text-xl font-bold text-red-800 dark:text-red-300 mb-2">{info.anode.metal}</p>
          <code dir="ltr" className="text-md font-mono text-red-900 dark:text-red-200">{info.anode.halfReaction}</code>
        </div>
        <div className="w-full bg-blue-100 dark:bg-blue-900/50 p-4 rounded-lg border border-blue-300 dark:border-blue-700">
          <h3 className="text-lg text-blue-700 dark:text-blue-400 font-semibold mb-2">المهبط (اختزال)</h3>
          <p className="text-xl font-bold text-blue-800 dark:text-blue-300 mb-2">{info.cathode.metal}</p>
          <code dir="ltr" className="text-md font-mono text-blue-900 dark:text-blue-200">{info.cathode.halfReaction}</code>
        </div>
      </div>
      
      <div className="w-full text-center bg-white/50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-300 dark:border-slate-700 mb-4">
        <h3 className="text-lg text-slate-700 dark:text-slate-300 font-semibold mb-2">التفاعل الكلي</h3>
        <code dir="ltr" className="text-lg font-mono text-slate-800 dark:text-slate-200">{info.overallReaction}</code>
      </div>

      <div className="w-full text-right bg-white/50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-300 dark:border-slate-700 mb-4">
        <h3 className="text-lg text-cyan-600 dark:text-cyan-400 font-semibold mb-2">شرح عمل الخلية</h3>
        <p className="text-md text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{info.explanation}</p>
      </div>
      
      <div className="w-full mt-4 flex flex-col gap-3">
        <button 
          onClick={onNew}
          className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-colors w-full text-lg mt-2"
        >
          محاكاة جديدة
        </button>
      </div>
    </div>
  );
};
