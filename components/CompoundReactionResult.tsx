
import React from 'react';
import type { CompoundReaction } from '../types';

interface CompoundReactionResultProps {
  reaction: CompoundReaction;
  onNewReaction: () => void;
}

const DetailBox: React.FC<{ title: string; content?: string; icon: string; className?: string }> = ({ title, content, icon, className }) => {
    if(!content) return null;
    return (
        <div className={`flex-1 p-4 rounded-lg border ${className}`}>
            <h4 className="text-sm font-bold uppercase tracking-wide mb-1 opacity-80 flex items-center gap-2">
                <span>{icon}</span> {title}
            </h4>
            <p className="text-lg font-semibold">{content}</p>
        </div>
    );
};

export const CompoundReactionResult: React.FC<CompoundReactionResultProps> = ({ reaction, onNewReaction }) => {
  if (reaction.id === 'none') {
    return (
      <div className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xl p-6 w-full max-w-3xl m-4 text-slate-800 dark:text-white relative flex flex-col animate-slide-up max-h-[90vh] overflow-y-auto scrollbar-hide items-center text-center">
        <div className="text-5xl mb-4">🤷‍♂️</div>
        <h2 className="text-3xl font-bold text-cyan-600 dark:text-cyan-300 mb-4">لا يوجد تفاعل</h2>
        <p className="text-md text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
          {reaction.explanation || 'لا يوجد تفاعل كيميائي متوقع بين هذه المواد في الظروف القياسية.'}
        </p>
        <button 
            onClick={onNewReaction}
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-colors w-full text-lg mt-2 max-w-xs"
        >
            تفاعل جديد
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xl p-6 w-full max-w-3xl m-4 text-slate-800 dark:text-white relative flex flex-col animate-slide-up max-h-[90vh] overflow-y-auto scrollbar-hide">
      <h2 className="text-3xl font-bold text-cyan-600 dark:text-cyan-300 mb-4 text-center">نتائج التفاعل</h2>
      
      <div className="w-full text-center bg-white/50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-300 dark:border-slate-700 mb-4">
        <h3 className="text-lg text-slate-700 dark:text-slate-300 font-semibold mb-2">المعادلة الكيميائية الموزونة</h3>
        <p dir="ltr" className="text-2xl font-mono text-center py-2 text-emerald-800 dark:text-emerald-200 font-bold">{reaction.balancedEquation}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4 text-right">
           <DetailBox 
                title="نوع التفاعل" 
                content={reaction.reactionType} 
                icon="🔄" 
                className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100" 
           />
           <DetailBox 
                title="المحتوى الحراري" 
                content={reaction.enthalpy} 
                icon="🌡️" 
                className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-100" 
           />
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4 text-right">
           <DetailBox 
                title="الملاحظات المرئية" 
                content={reaction.visualObservation} 
                icon="👀" 
                className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-100" 
           />
           <DetailBox 
                title="شروط التفاعل" 
                content={reaction.conditions} 
                icon="⚙️" 
                className="bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100" 
           />
      </div>
      
      <div className="w-full text-right bg-white/50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-300 dark:border-slate-700 mb-4">
        <h3 className="text-lg text-cyan-600 dark:text-cyan-400 font-semibold mb-2">شرح التفاعل</h3>
        <p className="text-md text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{reaction.explanation}</p>
      </div>

      {reaction.safetyNotes && reaction.safetyNotes.length > 0 && (
          <div className="w-full text-right bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 p-4 rounded-lg mb-4">
              <h3 className="text-lg text-red-700 dark:text-red-400 font-semibold mb-3">⚠️ تحذيرات السلامة</h3>
              <ul className="list-disc list-inside text-md text-red-800 dark:text-red-200 leading-relaxed space-y-1">
                  {reaction.safetyNotes.map((note, index) => <li key={index}>{note}</li>)}
              </ul>
          </div>
      )}

      <div className="w-full mt-4 flex flex-col gap-3">
        <button 
            onClick={onNewReaction}
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-colors w-full text-lg mt-2"
        >
            تفاعل جديد
        </button>
      </div>
    </div>
  );
};
