
import React, { useState } from 'react';
import type { Reaction } from '../types';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { cleanAndParseJSON, ImageManager } from '../utils';

interface MoleculeInfoCardProps {
  reaction: Reaction;
  onNewReaction: () => void;
}

interface ElectronConfigInfo {
    atomSymbol: string;
    atomName: string;
    configuration: string;
    bondingExplanation: string;
}

const InfoRow: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => {
    if (!value) return null;
    return (
        <div className="flex justify-between items-start py-3 border-b border-slate-300 dark:border-slate-700 last:border-b-0">
            <dt className="text-md text-cyan-600 dark:text-cyan-400 font-semibold">{label}</dt>
            <dd className="text-md text-slate-700 dark:text-slate-200 text-left">{value}</dd>
        </div>
    );
};

const AdvancedInfoRow: React.FC<{ label: string; value?: string; icon: string }> = ({ label, value, icon }) => {
    if (!value) return null;
    return (
        <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-start gap-3 transition-transform hover:scale-[1.02]">
            <div className="text-2xl bg-cyan-50 dark:bg-cyan-900/30 p-2 rounded-full">{icon}</div>
            <div className="flex-grow text-right">
                <div className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-1">{label}</div>
                <div className="text-sm text-slate-800 dark:text-slate-200 leading-snug">{value}</div>
            </div>
        </div>
    );
};

const GHSPictogram: React.FC<{ symbol: string }> = ({ symbol }) => {
    const symbolMap: Record<string, { emoji: string, title: string }> = {
        'GHS01': { emoji: '💣', title: 'Explosive' },
        'GHS02': { emoji: '🔥', title: 'Flammable' },
        'GHS03': { emoji: '💥', title: 'Oxidizing' },
        'GHS04': { emoji: '💨', title: 'Compressed Gas' },
        'GHS05': { emoji: '🧪', title: 'Corrosive' },
        'GHS06': { emoji: '💀', title: 'Toxic' },
        'GHS07': { emoji: '!', title: 'Harmful' },
        'GHS08': { emoji: '⚕️', title: 'Health Hazard' },
        'GHS09': { emoji: '🌳', title: 'Environmental Hazard' },
    };
    const item = symbolMap[symbol];
    if (!item) return null;
    return (
        <div title={item.title} className="text-4xl p-2 bg-white border-2 border-red-600 rounded-md">
            {item.emoji}
        </div>
    );
};


export const MoleculeInfoCard: React.FC<MoleculeInfoCardProps> = ({ reaction, onNewReaction }) => {
  const [balancedEquation, setBalancedEquation] = useState<string | null>(null);
  const [balancingSteps, setBalancingSteps] = useState<string[] | null>(null);
  const [isBalancing, setIsBalancing] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  
  const [showDetails, setShowDetails] = useState(false);
  const [electronConfigs, setElectronConfigs] = useState<ElectronConfigInfo[] | null>(null);
  const [isFetchingConfig, setIsFetchingConfig] = useState(false);

  const [lewisImage, setLewisImage] = useState<string | null>(null);
  const [isFetchingImage, setIsFetchingImage] = useState(false);


  const handleBalanceEquation = async () => {
    setIsBalancing(true);
    setBalanceError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const reactantsList = reaction.reactants || [];
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Given the reactants that form the product ${reaction.formula}, provide a balanced chemical equation and a step-by-step guide. Reactants: ${reactantsList.join(', ') || 'constituent atoms'}.`,
        config: {
          systemInstruction: "You are a chemistry teacher. Output Arabic JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              balancedEquation: { type: Type.STRING },
              steps: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["balancedEquation", "steps"]
          }
        }
      });
      
      const result = cleanAndParseJSON(response.text || '');
      if (result && result.balancedEquation) {
          setBalancedEquation(result.balancedEquation);
          setBalancingSteps(result.steps);
      } else {
          setBalanceError('فشل في الموازنة.');
      }
    } catch (e: any) {
      setBalanceError('حدث خطأ أثناء الموازنة.');
    } finally {
      setIsBalancing(false);
    }
  };

   const fetchElectronConfig = async () => {
        setIsFetchingConfig(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response: GenerateContentResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Electron configuration for ${reaction.formula}.`,
                config: {
                    systemInstruction: "Output Arabic JSON.",
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            configurations: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        atomSymbol: { type: Type.STRING },
                                        atomName: { type: Type.STRING },
                                        configuration: { type: Type.STRING },
                                        bondingExplanation: { type: Type.STRING }
                                    },
                                    required: ["atomSymbol", "atomName", "configuration", "bondingExplanation"]
                                }
                            }
                        },
                        required: ["configurations"]
                    }
                }
            });
            const result = cleanAndParseJSON(response.text || '');
            if (result?.configurations) {
                setElectronConfigs(result.configurations);
            }
        } catch (e: any) {
             console.error("Config fetch failed", e);
        } finally {
            setIsFetchingConfig(false);
        }
    };

    const fetchLewisImage = async () => {
      setIsFetchingImage(true);
      try {
          const img = await ImageManager.getImage(`lewis_${reaction.formula}`, `Pristine Lewis structure for ${reaction.formula}`);
          setLewisImage(img);
      } catch {
          // Ignore
      } finally {
          setIsFetchingImage(false);
      }
    };

    const handleShowDetails = async () => {
        setShowDetails(true);
        if (!electronConfigs && !isFetchingConfig) fetchElectronConfig();
        if (!lewisImage && !isFetchingImage) fetchLewisImage();
    };


  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-30 animate-fade-in">
      <div className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xl p-6 w-full max-w-2xl m-4 text-slate-800 dark:text-white relative flex flex-col items-center text-center animate-slide-up max-h-[90vh] overflow-y-auto scrollbar-hide">
        
        <div className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 hidden md:block">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </div>
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 hidden md:block">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        </div>
        
        <div className="text-6xl mb-4">{reaction.emoji}</div>
        <h2 className="text-3xl font-bold text-cyan-600 dark:text-cyan-300 mb-2">{reaction.name}</h2>
        <p className="text-xl font-mono text-slate-600 dark:text-slate-300 mb-6">{reaction.formula}</p>

        <div className="w-full text-right bg-white/50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-300 dark:border-slate-700 mb-4">
            <h3 className="text-lg text-slate-700 dark:text-slate-300 font-bold mb-2 border-b border-slate-200 dark:border-slate-700 pb-1">الخصائص العامة</h3>
            <dl>
                <InfoRow label="الكتلة المولية" value={reaction.molarMass} />
                <InfoRow label="الحالة (STP)" value={reaction.state} />
                <InfoRow label="الهندسة الجزيئية" value={reaction.molecularGeometry} />
                <InfoRow label="الكثافة" value={reaction.molecularDensity} />
                <InfoRow label="نوع التفاعل" value={reaction.reactionType} />
                <InfoRow label="نوع الرابطة" value={reaction.bondType} />
                <InfoRow label="حمض/قاعدة" value={reaction.acidBase} />
            </dl>
        </div>

        {(reaction.hybridization || reaction.polarity || reaction.solubility || reaction.magneticProfile || reaction.discovery) && (
            <div className="w-full text-right bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">🔬</span>
                    <h3 className="text-lg text-slate-800 dark:text-white font-bold">الخصائص المتقدمة</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <AdvancedInfoRow label="التهجين المداري" value={reaction.hybridization} icon="⚛️" />
                    <AdvancedInfoRow label="القطبية" value={reaction.polarity} icon="🔌" />
                    <AdvancedInfoRow label="الذوبانية" value={reaction.solubility} icon="💧" />
                    <AdvancedInfoRow label="الخواص المغناطيسية" value={reaction.magneticProfile} icon="🧲" />
                    {reaction.crystalStructure && <AdvancedInfoRow label="البنية البلورية" value={reaction.crystalStructure} icon="🧊" />}
                </div>
                 
                {reaction.discovery && (
                    <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800/50 flex gap-3 items-start">
                         <span className="text-2xl">📜</span>
                         <div>
                             <div className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-1">الاكتشاف والتاريخ</div>
                             <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{reaction.discovery}"</p>
                         </div>
                    </div>
                )}
            </div>
        )}
        
        {reaction.safety && (reaction.safety.warnings.length > 0 || reaction.safety.ghsSymbols.length > 0) && (
            <div className="w-full text-right bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 p-4 rounded-lg mb-4">
                <h3 className="text-lg text-red-700 dark:text-red-400 font-semibold mb-3">معلومات السلامة</h3>
                <p className="text-md text-red-800 dark:text-red-200 leading-relaxed text-right mb-4">
                    {reaction.safety.warnings.join('، ')}
                </p>
                <div className="flex gap-4 justify-end flex-wrap">
                    {reaction.safety.ghsSymbols.map(symbol => <GHSPictogram key={symbol} symbol={symbol} />)}
                </div>
            </div>
        )}

        {showDetails && (
          <div className="w-full text-right bg-indigo-50 dark:bg-indigo-900/50 border border-indigo-300 dark:border-indigo-700 p-4 rounded-lg mb-4 animate-fade-in">
            <h3 className="text-lg text-indigo-700 dark:text-indigo-400 font-semibold mb-2">تركيب لويس</h3>
             <div className="bg-white dark:bg-slate-900 p-4 rounded-md shadow-inner text-slate-800 dark:text-slate-200 flex justify-center items-center min-h-[250px] relative overflow-hidden">
                {isFetchingImage ? (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                         <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-500 animate-spin mb-3"></div>
                         <p className="animate-pulse text-slate-500 dark:text-slate-400 text-sm">...جاري إنشاء الصورة</p>
                    </div>
                ) : lewisImage ? (
                     <img src={lewisImage} alt={`Lewis structure for ${reaction.name}`} className="max-w-full h-auto bg-white rounded shadow-sm" />
                ) : (
                    <div className="text-center opacity-60">
                         <div className="text-4xl mb-2">🧪</div>
                         <p className="text-xs text-slate-500 dark:text-slate-400">تعذر تحميل الصورة</p>
                    </div>
                )}
            </div>
            
            <div className="mt-4 pt-4 border-t border-indigo-200 dark:border-indigo-600">
                <h4 className="text-md text-indigo-700 dark:text-indigo-400 font-semibold mb-2">التوزيع الإلكتروني</h4>
                {isFetchingConfig && <p className="text-slate-500 dark:text-slate-400 animate-pulse text-center">...جاري التحميل</p>}
                {electronConfigs && (
                    <div className="space-y-4 text-right">
                        {electronConfigs.map((config, index) => (
                            <div key={index} className="p-2 bg-white/50 dark:bg-slate-800/50 rounded-md border border-slate-200 dark:border-slate-700">
                                <p className="font-bold text-slate-800 dark:text-slate-200">{config.atomName} ({config.atomSymbol})</p>
                                <p dir="ltr" className="font-mono text-left text-base text-slate-600 dark:text-slate-300 my-1">{config.configuration}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{config.bondingExplanation}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
          </div>
        )}

        {balancedEquation && balancingSteps && (
          <div className="w-full text-right bg-emerald-50 dark:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-700 p-4 rounded-lg mb-4 animate-fade-in">
            <h3 className="text-lg text-emerald-700 dark:text-emerald-400 font-semibold mb-3">المعادلة الموزونة</h3>
            <p dir="ltr" className="text-xl font-mono text-center py-2 text-emerald-800 dark:text-emerald-200">{balancedEquation}</p>
            <h4 className="text-md text-emerald-700 dark:text-emerald-400 font-semibold mt-4 mb-2">خطوات الوزن</h4>
            <ol className="list-decimal list-inside text-md text-emerald-800 dark:text-emerald-300 leading-relaxed space-y-2">
              {balancingSteps.map((step, index) => <li key={index}>{step}</li>)}
            </ol>
          </div>
        )}

        <div className="w-full mt-4 flex flex-col gap-3">
            <div className="flex flex-col md:flex-row gap-3">
              {!showDetails && (
                  <button
                      onClick={handleShowDetails}
                      className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-colors w-full text-lg"
                  >
                     عرض تركيب لويس والتحليل
                  </button>
              )}
              {!balancedEquation && (
                  <button
                      onClick={handleBalanceEquation}
                      disabled={isBalancing}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-colors w-full text-lg disabled:opacity-50"
                  >
                      {isBalancing ? '...يتم الوزن' : 'وزن المعادلة'}
                  </button>
              )}
            </div>
            {balanceError && <p className="text-red-500 text-sm mt-2 text-center">{balanceError}</p>}
            <button 
                onClick={onNewReaction}
                className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-colors w-full text-lg mt-2"
            >
                تفاعل جديد
            </button>
        </div>

      </div>
    </div>
  );
};
