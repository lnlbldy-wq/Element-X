
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ReactionCanvas } from './components/ReactionCanvas';
import { MoleculeInfoCard } from './components/MoleculeInfoCard';
import { CompoundReactionResult } from './components/CompoundReactionResult';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ReactionSelection } from './components/ReactionSelection';
import { OrganicCompoundInfoCard } from './components/HydrocarbonInfoCard';
import { OrganicCompoundComparisonCard } from './components/HydrocarbonComparisonCard';
import { BiomoleculeInfoCard } from './components/BiomoleculeInfoCard';
import { GalvanicCellCard } from './components/GalvanicCellCard';
import { ThermoChemistryCard } from './components/ThermoChemistryCard';
import { SolutionChemistryCard } from './components/SolutionChemistryCard';
import { CompoundSelector } from './components/CompoundSelector';
import { ATOMS } from './constants';
import { cleanAndParseJSON, ImageManager } from './utils';
import type { Atom, Reaction, CompoundReaction, OrganicCompoundInfo, BiomoleculeInfo, GalvanicCellInfo, ThermoChemistryInfo, SolutionChemistryInfo } from './types';

type AppState = 'welcome' | 'simulation';
type SimulationMode = 'atoms' | 'compounds' | 'organic' | 'biochemistry' | 'electrochemistry' | 'thermochemistry' | 'solution';
type Theme = 'light' | 'dark';

// Enhanced retry logic for TEXT ONLY
async function callApiWithRetry<T>(apiCall: () => Promise<T>, maxRetries = 3): Promise<T> {
    if (!process.env.API_KEY) {
        throw new Error("مفتاح API غير موجود. يرجى إعداده في ملف .env أو إعدادات Vercel.");
    }
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            return await apiCall();
        } catch (error: any) {
            attempt++;
            if (attempt >= maxRetries) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
    }
    throw new Error("Failed after retries");
};

// SHARED SYSTEM INSTRUCTION FOR ACADEMIC ARABIC
const ACADEMIC_CHEMIST_PROMPT = `
You are an expert Academic Chemistry Professor (بروفيسور كيميائي أكاديمي). 
Your goal is to provide highly accurate, scientific, and educational responses in fluent, eloquent Arabic (اللغة العربية الفصحى السلسة).
Avoid robotic or literal translations. Use proper scientific terminology.
Provide deep insights, historical context where relevant, and clear explanations.
Always ensure the output is valid JSON strictly adhering to the schema.
`;

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('welcome');
  const [simulationMode, setSimulationMode] = useState<SimulationMode>('atoms');
  const [theme, setTheme] = useState<Theme>('light');
  const [missingApiKey, setMissingApiKey] = useState(false);
  
  // Atoms Mode State
  const [placedAtoms, setPlacedAtoms] = useState<Atom[]>([]);
  const [foundReactions, setFoundReactions] = useState<Reaction[] | null>(null);
  const [selectedReaction, setSelectedReaction] = useState<Reaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Compounds Mode State
  const [compoundReactionResult, setCompoundReactionResult] = useState<CompoundReaction | null>(null);
  const [isCompoundReactionLoading, setIsCompoundReactionLoading] = useState(false);
  const [compoundReactionError, setCompoundReactionError] = useState<string | null>(null);
  const [reactant1, setReactant1] = useState('');
  const [reactant2, setReactant2] = useState('');

  // Organic Mode State
  const [organicCompoundInfo, setOrganicCompoundInfo] = useState<OrganicCompoundInfo | null>(null);
  const [isOrganicCompoundLoading, setIsOrganicCompoundLoading] = useState(false);
  const [organicCompoundError, setOrganicCompoundError] = useState<string | null>(null);
  const [comparisonInfo, setComparisonInfo] = useState<{ a: OrganicCompoundInfo; b: OrganicCompoundInfo } | null>(null);

  // Biomolecule Mode State
  const [biomoleculeInfo, setBiomoleculeInfo] = useState<BiomoleculeInfo | null>(null);
  const [isBiomoleculeLoading, setIsBiomoleculeLoading] = useState(false);
  const [biomoleculeError, setBiomoleculeError] = useState<string | null>(null);

  // Galvanic Cell Mode State
  const [galvanicCellInfo, setGalvanicCellInfo] = useState<GalvanicCellInfo | null>(null);
  const [isGalvanicCellLoading, setIsGalvanicCellLoading] = useState(false);
  const [galvanicCellError, setGalvanicCellError] = useState<string | null>(null);

  // Thermo Chemistry Mode State
  const [thermoInfo, setThermoInfo] = useState<ThermoChemistryInfo | null>(null);
  const [isThermoLoading, setIsThermoLoading] = useState(false);
  const [thermoError, setThermoError] = useState<string | null>(null);

  // Solution Chemistry Mode State
  const [solutionInfo, setSolutionInfo] = useState<SolutionChemistryInfo | null>(null);
  const [isSolutionLoading, setIsSolutionLoading] = useState(false);
  const [solutionError, setSolutionError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!process.env.API_KEY) {
        setMissingApiKey(true);
        // We do NOT return/block here anymore. We allow the app to load in "Demo Mode".
    }
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // --- ATOM MODE LOGIC ---
  const handleAtomDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const atomId = e.dataTransfer.getData('application/react-flow');
    const atom = ATOMS.find((a) => a.id === atomId);
    
    if (atom) {
      const rect = (e.target as Element).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const newAtom: Atom = {
        ...atom,
        instanceId: Date.now(),
        x,
        y,
      };
      setPlacedAtoms((prev) => [...prev, newAtom]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleAnalyzeAtoms = async () => {
    if (placedAtoms.length < 2) return;
    
    setIsLoading(true);
    setError(null);
    setFoundReactions(null);
    setSelectedReaction(null);
    
    try {
        const atomCounts = placedAtoms.reduce((acc, atom) => {
            acc[atom.symbol] = (acc[atom.symbol] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        const atomString = Object.entries(atomCounts).map(([sym, count]) => `${count} ${sym}`).join(', ');

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await callApiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Identify up to 3 possible chemical reactions or molecules formed by exactly these atoms: ${atomString}. 
            If the atoms can form a stable molecule, return it. Classify reaction type. Provide detailed advanced properties like hybridization, polarity, etc.`,
            config: {
                systemInstruction: ACADEMIC_CHEMIST_PROMPT,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: {type: Type.STRING},
                            name: {type: Type.STRING},
                            formula: {type: Type.STRING},
                            emoji: {type: Type.STRING},
                            reactants: {type: Type.ARRAY, items: {type: Type.STRING}},
                            bondType: {type: Type.STRING},
                            reactionType: {type: Type.STRING},
                            explanation: {type: Type.STRING},
                            molecularDensity: {type: Type.STRING},
                            acidBase: {type: Type.STRING},
                            applications: {type: Type.STRING},
                            commonality: {type: Type.STRING},
                            molarMass: {type: Type.STRING},
                            state: {type: Type.STRING},
                            molecularGeometry: {type: Type.STRING},
                            hybridization: {type: Type.STRING},
                            polarity: {type: Type.STRING},
                            solubility: {type: Type.STRING},
                            magneticProfile: {type: Type.STRING},
                            crystalStructure: {type: Type.STRING},
                            discovery: {type: Type.STRING},
                            safety: {
                                type: Type.OBJECT,
                                properties: {
                                    warnings: {type: Type.ARRAY, items: {type: Type.STRING}},
                                    ghsSymbols: {type: Type.ARRAY, items: {type: Type.STRING}}
                                }
                            },
                            namingMethod: {type: Type.STRING},
                        },
                         required: ["id", "name", "formula", "emoji", "bondType", "explanation"]
                    }
                }
            }
        }));
        
        const result = cleanAndParseJSON(response.text || '');
        if (Array.isArray(result) && result.length > 0) {
             setFoundReactions(result);
        } else {
            setFoundReactions(null);
            setError("لم يتم العثور على تفاعلات مستقرة لهذه الذرات.");
        }
    } catch (e: any) {
        setError(e.message || 'حدث خطأ أثناء تحليل التفاعل.');
    } finally {
        setIsLoading(false);
    }
  };


  // --- COMPOUND MODE LOGIC ---
  const handleCompoundReaction = async (r1: string, r2: string) => {
    setIsCompoundReactionLoading(true);
    setCompoundReactionError(null);
    setCompoundReactionResult(null);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await callApiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Simulate reaction between ${r1} and ${r2}. Provide balanced equation, reaction type, visual observations (color, precipitate), reaction conditions (heat, catalyst), and enthalpy.`,
             config: {
                    systemInstruction: ACADEMIC_CHEMIST_PROMPT,
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            id: {type: Type.STRING},
                            balancedEquation: {type: Type.STRING},
                            reactionType: {type: Type.STRING},
                            explanation: {type: Type.STRING},
                            visualObservation: {type: Type.STRING},
                            conditions: {type: Type.STRING},
                            enthalpy: {type: Type.STRING},
                            products: {
                                type: Type.ARRAY, 
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: {type: Type.STRING},
                                        formula: {type: Type.STRING},
                                        state: {type: Type.STRING},
                                    }
                                }
                            },
                            safetyNotes: {type: Type.ARRAY, items: {type: Type.STRING}},
                        },
                        required: ["id", "balancedEquation", "reactionType", "explanation"]
                    }
             }
        }));

         const result = cleanAndParseJSON(response.text || '');
         if (result) {
             setCompoundReactionResult(result);
         }

    } catch (e: any) {
        setCompoundReactionError(e.message || "فشل في محاكاة التفاعل.");
    } finally {
        setIsCompoundReactionLoading(false);
    }
  };

  // --- ORGANIC MODE LOGIC ---
  const handleOrganicGeneration = async (family: string, carbons: number) => {
      setIsOrganicCompoundLoading(true);
      setOrganicCompoundError(null);
      setOrganicCompoundInfo(null);
      setComparisonInfo(null);

      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const textResp = await callApiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: `Generate info for ${family} with ${carbons} carbons. Include density, solubility details, number of isomers, toxicity/safety info, and typical reactivity.`,
              config: {
                systemInstruction: ACADEMIC_CHEMIST_PROMPT,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                         id: {type: Type.STRING},
                         name: {type: Type.STRING},
                         formula: {type: Type.STRING},
                         family: {type: Type.STRING},
                         description: {type: Type.STRING},
                         uses: {type: Type.STRING},
                         stateAtSTP: {type: Type.STRING},
                         iupacNaming: {type: Type.STRING},
                         boilingPoint: {type: Type.STRING},
                         meltingPoint: {type: Type.STRING},
                         density: {type: Type.STRING},
                         solubility: {type: Type.STRING},
                         isomersCount: {type: Type.STRING},
                         toxicity: {type: Type.STRING},
                         reactivity: {type: Type.STRING},
                    },
                    required: ["name", "formula", "description"]
                }
              }
          }));

          const info = cleanAndParseJSON(textResp.text || '');
          if (!info) throw new Error("Failed to parse compound data");
          
          setOrganicCompoundInfo({...info, lewisStructureImage: 'PENDING'});
          
          // Pass formula as 3rd arg for static lookup/fallback
          ImageManager.getImage(`organic_${family}_${carbons}`, `Lewis structure for ${info.name}`, info.formula).then(img => {
              setOrganicCompoundInfo(prev => prev ? {...prev, lewisStructureImage: img || undefined} : null);
          });

      } catch (e: any) {
          setOrganicCompoundError(e.message || "فشل في توليد بيانات المركب العضوي.");
      } finally {
          setIsOrganicCompoundLoading(false);
      }
  };

  const handleOrganicComparison = async (paramsA: { family: string; carbons: number }, paramsB: { family: string; carbons: number }) => {
      setIsOrganicCompoundLoading(true);
      setOrganicCompoundError(null);
      setOrganicCompoundInfo(null); 

      try {
           const fetchData = async (family: string, carbons: number) => {
               const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
               const textResp = await callApiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
                   model: 'gemini-2.5-flash',
                   contents: `Generate info for ${family} with ${carbons} carbons. Include density, solubility, toxicity, etc.`,
                    config: {
                        systemInstruction: ACADEMIC_CHEMIST_PROMPT,
                        responseMimeType: 'application/json', 
                        responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                             id: {type: Type.STRING},
                             name: {type: Type.STRING},
                             formula: {type: Type.STRING},
                             family: {type: Type.STRING},
                             description: {type: Type.STRING},
                             uses: {type: Type.STRING},
                             stateAtSTP: {type: Type.STRING},
                             iupacNaming: {type: Type.STRING},
                             boilingPoint: {type: Type.STRING},
                             meltingPoint: {type: Type.STRING},
                             density: {type: Type.STRING},
                             solubility: {type: Type.STRING},
                             isomersCount: {type: Type.STRING},
                             toxicity: {type: Type.STRING},
                             reactivity: {type: Type.STRING},
                        }, required: ["name", "formula"]
                    }}
               }));
               const data = cleanAndParseJSON(textResp.text || '{}');
               return data;
           };

           const infoA = await fetchData(paramsA.family, paramsA.carbons);
           const infoB = await fetchData(paramsB.family, paramsB.carbons);
           
           if (infoA && infoB) {
                // Trigger Image Fetches in background
                infoA.lewisStructureImage = 'PENDING';
                infoB.lewisStructureImage = 'PENDING';
                setComparisonInfo({ a: infoA, b: infoB });

                ImageManager.getImage(`organic_${paramsA.family}_${paramsA.carbons}`, `Lewis structure ${infoA.name}`, infoA.formula).then(img => {
                     setComparisonInfo(prev => prev ? {...prev, a: {...prev.a, lewisStructureImage: img || undefined}} : null);
                });
                ImageManager.getImage(`organic_${paramsB.family}_${paramsB.carbons}`, `Lewis structure ${infoB.name}`, infoB.formula).then(img => {
                     setComparisonInfo(prev => prev ? {...prev, b: {...prev.b, lewisStructureImage: img || undefined}} : null);
                });
           }

      } catch (e: any) {
           setOrganicCompoundError(e.message || "فشل في مقارنة المركبات.");
      } finally {
          setIsOrganicCompoundLoading(false);
      }
  };

  // --- BIOMOLECULE MODE LOGIC ---
  const handleBiomoleculeGenerate = async (moleculeName: string) => {
      setIsBiomoleculeLoading(true);
      setBiomoleculeError(null);
      setBiomoleculeInfo(null);
      
      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const textResp = await callApiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: `Detailed biochemistry info for ${moleculeName}. Include molecular weight, natural occurrence, metabolic role, and effects of deficiency/excess.`,
              config: {
                  systemInstruction: ACADEMIC_CHEMIST_PROMPT,
                  responseMimeType: 'application/json',
                  responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                          id: {type: Type.STRING},
                          name: {type: Type.STRING},
                          formula: {type: Type.STRING},
                          type: {type: Type.STRING},
                          description: {type: Type.STRING},
                          biologicalFunction: {type: Type.STRING},
                          molecularWeight: {type: Type.STRING},
                          occurrence: {type: Type.STRING},
                          metabolicRole: {type: Type.STRING},
                          deficiencyEffects: {type: Type.STRING},
                      }, required: ["name", "formula", "description"]
                  }
              }
          }));

          const data = cleanAndParseJSON(textResp.text || '{}');
          if (data) {
             setBiomoleculeInfo({...data, structureImage: 'PENDING'});
             // Pass formula/name as 3rd arg
             ImageManager.getImage(`bio_${moleculeName}`, `3D structure of ${moleculeName} molecule`, moleculeName).then(img => {
                 setBiomoleculeInfo(prev => prev ? {...prev, structureImage: img || undefined} : null);
             });
          }
      } catch(e: any) {
          setBiomoleculeError(e.message || "فشل في تحميل بيانات الجزيء الحيوي.");
      } finally {
          setIsBiomoleculeLoading(false);
      }
  };

  // --- GALVANIC CELL MODE LOGIC ---
  const handleGalvanicCellSimulate = async (metal1: string, metal2: string) => {
      setIsGalvanicCellLoading(true);
      setGalvanicCellError(null);
      setGalvanicCellInfo(null);

      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const textResp = await callApiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: `Simulate galvanic cell with ${metal1} and ${metal2}. Calculate Gibbs free energy, cell notation, and check spontaneity.`,
              config: {
                  systemInstruction: ACADEMIC_CHEMIST_PROMPT,
                  responseMimeType: 'application/json',
                  responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                          id: {type: Type.STRING},
                          anode: {type: Type.OBJECT, properties: {metal: {type: Type.STRING}, halfReaction: {type: Type.STRING}}},
                          cathode: {type: Type.OBJECT, properties: {metal: {type: Type.STRING}, halfReaction: {type: Type.STRING}}},
                          overallReaction: {type: Type.STRING},
                          cellPotential: {type: Type.STRING},
                          explanation: {type: Type.STRING},
                          cellNotation: {type: Type.STRING},
                          gibbsFreeEnergy: {type: Type.STRING},
                          spontaneity: {type: Type.STRING},
                      }, required: ["anode", "cathode", "cellPotential"]
                  }
              }
          }));

          const data = cleanAndParseJSON(textResp.text || '{}');
          if (data) {
             setGalvanicCellInfo({...data, diagramImage: 'PENDING'});
             ImageManager.getImage(`cell_${metal1}_${metal2}`, `Galvanic cell diagram ${metal1} ${metal2}`, `${metal1}-${metal2}`).then(img => {
                 setGalvanicCellInfo(prev => prev ? {...prev, diagramImage: img || undefined} : null);
             });
          }

      } catch(e: any) {
          setGalvanicCellError(e.message || "فشل في محاكاة الخلية الجلفانية.");
      } finally {
          setIsGalvanicCellLoading(false);
      }
  };

  // --- THERMOCHEMISTRY MODE LOGIC ---
  const handleThermoAnalyze = async (equation: string) => {
      setIsThermoLoading(true);
      setThermoError(null);
      setThermoInfo(null);

      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const textResp = await callApiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: `Analyze thermodynamics of: ${equation}. Include Activation Energy (Ea), Equilibrium Constant (Keq) approximation, and rate factors list (e.g. Temperature, Surface Area).`,
              config: {
                  systemInstruction: ACADEMIC_CHEMIST_PROMPT,
                  responseMimeType: 'application/json',
                  responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                          id: {type: Type.STRING},
                          equation: {type: Type.STRING},
                          enthalpyChange: {type: Type.STRING},
                          entropyChange: {type: Type.STRING},
                          gibbsFreeEnergyChange: {type: Type.STRING},
                          isExothermic: {type: Type.BOOLEAN},
                          isSpontaneous: {type: Type.BOOLEAN},
                          explanation: {type: Type.STRING},
                          energyProfileImage: {type: Type.STRING},
                          activationEnergy: {type: Type.STRING},
                          equilibriumConstant: {type: Type.STRING},
                          rateFactors: {type: Type.ARRAY, items: {type: Type.STRING}},
                      }, required: ["enthalpyChange", "isExothermic", "explanation"]
                  }
              }
          }));

          const data = cleanAndParseJSON(textResp.text || '{}');
          if (data) {
             setThermoInfo({...data, energyProfileImage: 'PENDING'});
             ImageManager.getImage(`thermo_${equation.replace(/[^a-zA-Z]/g, '')}`, `Energy profile diagram for ${equation}`, 'Energy').then(img => {
                 setThermoInfo(prev => prev ? {...prev, energyProfileImage: img || undefined} : null);
             });
          }

      } catch (e: any) {
          setThermoError(e.message || "فشل في تحليل التفاعل الحراري.");
      } finally {
          setIsThermoLoading(false);
      }
  };

  // --- SOLUTION CHEMISTRY MODE LOGIC ---
  const handleSolutionAnalyze = async (solute: string, solvent: string, concentration: number) => {
      setIsSolutionLoading(true);
      setSolutionError(null);
      setSolutionInfo(null);

      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const textResp = await callApiWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: `Analyze solution of ${solute} in ${solvent} at ${concentration}M. Include pH estimate, colligative properties (Boiling Point Elevation, Freezing Point Depression), and conductivity.`,
              config: {
                  systemInstruction: ACADEMIC_CHEMIST_PROMPT,
                  responseMimeType: 'application/json',
                  responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                          id: {type: Type.STRING},
                          soluteName: {type: Type.STRING},
                          soluteFormula: {type: Type.STRING},
                          solventName: {type: Type.STRING},
                          concentrationMolarity: {type: Type.STRING},
                          solutionDescription: {type: Type.STRING},
                          solutionType: {type: Type.STRING},
                          phLevel: {type: Type.STRING},
                          boilingPointElevation: {type: Type.STRING},
                          freezingPointDepression: {type: Type.STRING},
                          conductivity: {type: Type.STRING},
                      }, required: ["solutionDescription", "solutionType"]
                  }
              }
          }));

          const data = cleanAndParseJSON(textResp.text || '{}');
          if (data) {
             setSolutionInfo({...data, solutionImage: 'PENDING'});
             // Use solute name for fallback SVG generation, specify 'solution' type
             ImageManager.getImage(
                 `sol_${solute}_${solvent}`, 
                 `Scientific 3D illustration of ${solute} being dropped into ${solvent}, showing the dissolution process. Particles dispersing and dissolving in the liquid, reaction kinetics visualization.`, 
                 solute,
                 'solution'
             ).then(img => {
                 setSolutionInfo(prev => prev ? {...prev, solutionImage: img || undefined} : null);
             });
          }

      } catch (e: any) {
          setSolutionError(e.message || "فشل في تحليل المحلول.");
      } finally {
          setIsSolutionLoading(false);
      }
  };


  if (appState === 'welcome') {
    return <WelcomeScreen onStart={() => setAppState('simulation')} />;
  }

  return (
    <div className={`flex h-screen w-full bg-white dark:bg-gray-900 text-slate-900 dark:text-white transition-colors duration-300 overflow-hidden ${theme}`}>
      <Sidebar 
        atoms={ATOMS}
        onAtomClick={(id) => {
             const atom = ATOMS.find(a => a.id === id);
             if(atom) setPlacedAtoms(prev => [...prev, {...atom, instanceId: Date.now(), x: 100, y: 100}]);
        }}
        onModeChange={(mode) => setSimulationMode(mode)}
        currentMode={simulationMode}
        onCompoundReact={handleCompoundReaction}
        isCompoundLoading={isCompoundReactionLoading}
        reactant1={reactant1}
        setReactant1={setReactant1}
        reactant2={reactant2}
        setReactant2={setReactant2}
        onOrganicCompoundGenerate={handleOrganicGeneration}
        onOrganicCompoundCompare={handleOrganicComparison}
        isOrganicCompoundLoading={isOrganicCompoundLoading}
        onBiomoleculeGenerate={handleBiomoleculeGenerate}
        isBiomoleculeLoading={isBiomoleculeLoading}
        onGalvanicCellSimulate={handleGalvanicCellSimulate}
        isGalvanicCellLoading={isGalvanicCellLoading}
        onThermoAnalyze={handleThermoAnalyze}
        isThermoLoading={isThermoLoading}
        onSolutionAnalyze={handleSolutionAnalyze}
        isSolutionLoading={isSolutionLoading}
      />
      
      <main className="flex-grow flex flex-col relative h-full">
        <Header theme={theme} setTheme={setTheme} />
        {missingApiKey && (
            <div className="bg-red-500 text-white text-xs text-center p-1 absolute top-0 left-0 w-full z-50 opacity-90 hover:opacity-100 transition-opacity">
                وضع العرض (Demo Mode): مفتاح API مفقود. ستعمل الصور الثابتة فقط.
            </div>
        )}
        
        {simulationMode === 'atoms' && (
          <>
            <ReactionCanvas 
              atoms={placedAtoms}
              isPaused={isLoading} 
              pauseText={null}
              canvasRef={canvasRef}
              onDrop={handleAtomDrop}
              onDragOver={handleDragOver}
            />
             {/* Floating Controls */}
             <div className="absolute top-20 right-4 flex flex-col gap-2 z-10">
                <button 
                  onClick={() => { setPlacedAtoms([]); setFoundReactions(null); setSelectedReaction(null); setError(null); }}
                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-110"
                  title="مسح الكل"
                >
                  🗑️
                </button>
             </div>
             
             {/* Start Reaction Button */}
             {placedAtoms.length >= 2 && !isLoading && !foundReactions && !selectedReaction && (
               <button 
                 onClick={handleAnalyzeAtoms}
                 className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105 z-10 flex items-center gap-2"
               >
                 <span>🧪</span>
                 <span>بدء التفاعل</span>
               </button>
             )}
             
             {isLoading && (
               <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-20 pointer-events-none">
                 <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-xl flex items-center gap-3">
                   <div className="animate-spin h-6 w-6 border-4 border-cyan-500 border-t-transparent rounded-full"></div>
                   <span className="font-bold">جاري تحليل التفاعل...</span>
                 </div>
               </div>
             )}
             
             {error && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-red-100 dark:bg-red-900/80 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg shadow-lg z-20 text-center max-w-lg">
                    <p>{error}</p>
                </div>
             )}

            {foundReactions && !selectedReaction && (
              <ReactionSelection 
                reactions={foundReactions}
                onSelect={setSelectedReaction}
                onCancel={() => { setFoundReactions(null); setPlacedAtoms([]); }}
              />
            )}

            {selectedReaction && (
              <MoleculeInfoCard 
                reaction={selectedReaction}
                onNewReaction={() => {
                  setSelectedReaction(null);
                  setFoundReactions(null);
                  setPlacedAtoms([]);
                }}
              />
            )}
          </>
        )}

        {simulationMode === 'compounds' && (
             compoundReactionResult ? (
                 <CompoundReactionResult 
                    reaction={compoundReactionResult} 
                    onNewReaction={() => { setCompoundReactionResult(null); setReactant1(''); setReactant2(''); }} 
                 />
             ) : (
                 <CompoundSelector 
                    reactant1={reactant1}
                    reactant2={reactant2}
                    setReactant1={setReactant1}
                    setReactant2={setReactant2}
                    isLoading={isCompoundReactionLoading}
                    error={compoundReactionError}
                 />
             )
        )}

        {simulationMode === 'organic' && (
            comparisonInfo ? (
                <OrganicCompoundComparisonCard 
                    infoA={comparisonInfo.a}
                    infoB={comparisonInfo.b}
                    onNew={() => setComparisonInfo(null)}
                    onNewComparison={handleOrganicComparison}
                />
            ) : organicCompoundInfo ? (
                <OrganicCompoundInfoCard 
                    info={organicCompoundInfo} 
                    onNew={() => setOrganicCompoundInfo(null)} 
                />
            ) : (
                <div className="flex-grow flex items-center justify-center bg-slate-100 dark:bg-slate-800/50 bg-grid dark:bg-grid">
                     <div className="text-center p-8 max-w-lg">
                        <div className="text-6xl mb-4">🌿</div>
                        <h2 className="text-2xl font-bold text-cyan-600 dark:text-cyan-300 mb-2">مختبر الكيمياء العضوية</h2>
                        <p className="text-slate-600 dark:text-slate-400">استخدم القائمة الجانبية لتوليد أو مقارنة المركبات العضوية المختلفة.</p>
                        {isOrganicCompoundLoading && <p className="mt-4 animate-pulse text-cyan-500">جاري التحضير...</p>}
                        {organicCompoundError && <p className="mt-4 text-red-500 bg-red-100 dark:bg-red-900/20 p-2 rounded">{organicCompoundError}</p>}
                     </div>
                </div>
            )
        )}

        {simulationMode === 'biochemistry' && (
            biomoleculeInfo ? (
                <BiomoleculeInfoCard 
                    info={biomoleculeInfo} 
                    onNew={() => setBiomoleculeInfo(null)} 
                />
            ) : (
                 <div className="flex-grow flex items-center justify-center bg-slate-100 dark:bg-slate-800/50 bg-grid dark:bg-grid">
                     <div className="text-center p-8 max-w-lg">
                        <div className="text-6xl mb-4">🧬</div>
                        <h2 className="text-2xl font-bold text-cyan-600 dark:text-cyan-300 mb-2">مختبر الكيمياء الحيوية</h2>
                        <p className="text-slate-600 dark:text-slate-400">اختر جزيئاً حيوياً من القائمة الجانبية لاستكشافه.</p>
                        {isBiomoleculeLoading && <p className="mt-4 animate-pulse text-cyan-500">جاري التحميل...</p>}
                        {biomoleculeError && <p className="mt-4 text-red-500 bg-red-100 dark:bg-red-900/20 p-2 rounded">{biomoleculeError}</p>}
                     </div>
                </div>
            )
        )}

        {simulationMode === 'electrochemistry' && (
            galvanicCellInfo ? (
                <GalvanicCellCard 
                    info={galvanicCellInfo}
                    onNew={() => setGalvanicCellInfo(null)}
                />
            ) : (
                <div className="flex-grow flex items-center justify-center bg-slate-100 dark:bg-slate-800/50 bg-grid dark:bg-grid">
                     <div className="text-center p-8 max-w-lg">
                        <div className="text-6xl mb-4">⚡</div>
                        <h2 className="text-2xl font-bold text-cyan-600 dark:text-cyan-300 mb-2">مختبر الكيمياء الكهربائية</h2>
                        <p className="text-slate-600 dark:text-slate-400">حدد الأقطاب في القائمة الجانبية لبناء خلية جلفانية.</p>
                        {isGalvanicCellLoading && <p className="mt-4 animate-pulse text-cyan-500">جاري بناء الخلية...</p>}
                        {galvanicCellError && <p className="mt-4 text-red-500 bg-red-100 dark:bg-red-900/20 p-2 rounded">{galvanicCellError}</p>}
                     </div>
                </div>
            )
        )}

        {simulationMode === 'thermochemistry' && (
            thermoInfo ? (
                <ThermoChemistryCard 
                    info={thermoInfo}
                    onNew={() => setThermoInfo(null)}
                />
            ) : (
                 <div className="flex-grow flex items-center justify-center bg-slate-100 dark:bg-slate-800/50 bg-grid dark:bg-grid">
                     <div className="text-center p-8 max-w-lg">
                        <div className="text-6xl mb-4">🔥</div>
                        <h2 className="text-2xl font-bold text-cyan-600 dark:text-cyan-300 mb-2">مختبر الكيمياء الحرارية</h2>
                        <p className="text-slate-600 dark:text-slate-400">أدخل معادلة كيميائية في القائمة الجانبية لتحليل طاقتها.</p>
                        {isThermoLoading && <p className="mt-4 animate-pulse text-cyan-500">جاري الحساب...</p>}
                        {thermoError && <p className="mt-4 text-red-500 bg-red-100 dark:bg-red-900/20 p-2 rounded">{thermoError}</p>}
                     </div>
                </div>
            )
        )}

        {simulationMode === 'solution' && (
            solutionInfo ? (
                <SolutionChemistryCard 
                    info={solutionInfo}
                    onNew={() => setSolutionInfo(null)}
                />
            ) : (
                 <div className="flex-grow flex items-center justify-center bg-slate-100 dark:bg-slate-800/50 bg-grid dark:bg-grid">
                     <div className="text-center p-8 max-w-lg">
                        <div className="text-6xl mb-4">💧</div>
                        <h2 className="text-2xl font-bold text-cyan-600 dark:text-cyan-300 mb-2">مختبر المحاليل</h2>
                        <p className="text-slate-600 dark:text-slate-400">حدد المذاب والمذيب والتركيز لبدء التحليل.</p>
                        {isSolutionLoading && <p className="mt-4 animate-pulse text-cyan-500">جاري التحليل...</p>}
                         {solutionError && <p className="mt-4 text-red-500 bg-red-100 dark:bg-red-900/20 p-2 rounded">{solutionError}</p>}
                     </div>
                </div>
            )
        )}

      </main>
    </div>
  );
};

export default App;
