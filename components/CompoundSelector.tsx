
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { COMMON_COMPOUNDS } from '../constants';
import { ImageManager } from '../utils';

type CompoundImageState = string | null | 'loading' | 'error';
interface CompoundWithImageState {
    name: string;
    formula: string;
    imageUrl: CompoundImageState;
}

interface CompoundSelectorProps {
    reactant1: string;
    reactant2: string;
    setReactant1: (value: string) => void;
    setReactant2: (value: string) => void;
    isLoading: boolean;
    error: string | null;
}

interface CompoundCardProps {
    compound: CompoundWithImageState;
    onSelect: () => void;
    isSelected: boolean;
    selectionLabel: string | null;
    onVisible: () => void;
}

const CompoundCard: React.FC<CompoundCardProps> = ({ compound, onSelect, isSelected, selectionLabel, onVisible }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const isLoading = compound.imageUrl === 'loading';
    // If it's null, we consider it idle/waiting. 
    // If it has a string (URL or Base64), it's loaded.
    const isLoaded = typeof compound.imageUrl === 'string' && compound.imageUrl !== 'loading' && compound.imageUrl !== 'error';

    useEffect(() => {
        const currentRef = cardRef.current;
        if (!currentRef) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    onVisible();
                    observer.unobserve(currentRef);
                }
            },
            { rootMargin: '100px', threshold: 0.1 }
        );
        observer.observe(currentRef);
        return () => { if (currentRef) observer.unobserve(currentRef); };
    }, [onVisible]);


    return (
        <div
            ref={cardRef}
            className={`relative group bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-2xl p-4 text-center transition-all duration-300 transform hover:-translate-y-1 border-2 ${isSelected ? 'border-cyan-500 ring-4 ring-cyan-500/20' : 'border-slate-100 dark:border-slate-700'}`}
        >
            <div className="h-32 w-full mx-auto mb-3 flex items-center justify-center relative bg-slate-50 dark:bg-slate-900/50 rounded-lg overflow-hidden">
                {isLoading ? (
                    <div className="w-full h-full flex items-center justify-center relative">
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent skew-x-12 animate-[shimmer_1s_infinite]"></div>
                         <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-cyan-500 animate-spin"></div>
                    </div>
                ) : isLoaded ? (
                    <img 
                        src={compound.imageUrl!} 
                        alt={compound.name} 
                        className="h-full w-full object-contain animate-fade-in drop-shadow-lg transform transition-transform duration-500 hover:scale-110 p-2" 
                        onError={(e) => {
                            // If static image fails, hide it or replace it (though fallback logic handles most)
                            (e.target as HTMLImageElement).style.display = 'none';
                            ((e.target as HTMLImageElement).nextSibling as HTMLElement)?.classList.remove('hidden');
                        }}
                    />
                ) : (
                    // Idle state
                    <div className="text-4xl opacity-10 grayscale transform transition-transform group-hover:scale-110">🧪</div>
                )}
                {/* Fallback Icon if Image breaks */}
                <div className="hidden absolute inset-0 flex items-center justify-center text-4xl opacity-50 grayscale">🧪</div>
            </div>
            
            <div onClick={onSelect} className="cursor-pointer p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{compound.name}</h3>
                <p className="font-mono text-sm text-cyan-600 dark:text-cyan-400 font-semibold tracking-wider">{compound.formula}</p>
            </div>

            {isSelected && selectionLabel && (
                <div className="absolute -top-3 -right-3 bg-cyan-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-bounce z-10 border-2 border-white dark:border-slate-800">
                    {selectionLabel}
                </div>
            )}
        </div>
    );
};

export const CompoundSelector: React.FC<CompoundSelectorProps> = ({ reactant1, reactant2, setReactant1, setReactant2, isLoading: isReactionLoading, error }) => {
    const [compounds, setCompounds] = useState<CompoundWithImageState[]>(
        COMMON_COMPOUNDS.map(c => ({ ...c, imageUrl: null }))
    );
    
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollUp, setCanScrollUp] = useState(false);
    const [canScrollDown, setCanScrollDown] = useState(false);

    const checkScrollability = useCallback(() => {
        const el = scrollContainerRef.current;
        if (el) {
            setCanScrollUp(el.scrollTop > 5);
            setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 5);
        }
    }, []);

    useEffect(() => {
        const el = scrollContainerRef.current;
        if (el) {
            el.addEventListener('scroll', checkScrollability);
            window.addEventListener('resize', checkScrollability);
            checkScrollability();
            return () => { el.removeEventListener('scroll', checkScrollability); window.removeEventListener('resize', checkScrollability); };
        }
    }, [checkScrollability]);

    const handleScroll = (direction: 'up' | 'down') => {
        const el = scrollContainerRef.current;
        if (el) {
            const scrollAmount = el.clientHeight * 0.8;
            el.scrollBy({ top: direction === 'up' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };

    const loadImage = useCallback(async (formula: string) => {
        setCompounds(prev => {
            const current = prev.find(c => c.formula === formula);
            if (current && (current.imageUrl === 'loading' || (typeof current.imageUrl === 'string'))) {
                return prev;
            }
            return prev.map(c => c.formula === formula ? { ...c, imageUrl: 'loading' } : c);
        });

        const compoundInfo = COMMON_COMPOUNDS.find(c => c.formula === formula);
        if (!compoundInfo) return;

        try {
            // Pass the formula as the 3rd argument to check Static Library first
            const img = await ImageManager.getImage(
                `compound_${formula}`, 
                `3D ball-and-stick molecular model of ${formula} (${compoundInfo.name})`,
                formula 
            );
            
            setCompounds(prev => prev.map(c => c.formula === formula ? { 
                ...c, 
                imageUrl: img ? img : 'error' 
            } : c));
        } catch {
            setCompounds(prev => prev.map(c => c.formula === formula ? { ...c, imageUrl: 'error' } : c));
        }
    }, []);

    
    const handleSelect = (formula: string) => {
        const isR1 = reactant1 === formula;
        const isR2 = reactant2 === formula;
        if (isR1) { setReactant1(reactant2); setReactant2(''); }
        else if (isR2) { setReactant2(''); }
        else if (!reactant1) { setReactant1(formula); }
        else if (!reactant2) { setReactant2(formula); }
        else { setReactant2(formula); }
    };
    
    const selectionMap = useMemo(() => {
        const map = new Map<string, string>();
        if(reactant1) map.set(reactant1, "المتفاعل 1");
        if(reactant2) map.set(reactant2, "المتفاعل 2");
        return map;
    }, [reactant1, reactant2]);


    if (isReactionLoading) {
         return <div className="text-center bg-black/60 backdrop-blur-sm p-6 rounded-xl shadow-lg"><p className="text-2xl font-bold animate-pulse text-white">...يتم تحليل التفاعل</p></div>;
    }

    if (error) {
        return <div className="bg-yellow-400 text-black font-bold py-3 px-5 rounded-lg shadow-lg text-center m-4">{error}</div>;
    }

    return (
        <div className="w-full h-full p-4 flex flex-col relative">
            <div className="text-center mb-4 flex-shrink-0">
                <h2 className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 mb-2">مكتبة المركبات</h2>
                <p className="text-slate-600 dark:text-slate-300">اختر مركبين للتفاعل.</p>
            </div>
            
            <div className={`absolute top-24 left-1/2 -translate-x-1/2 z-20 transition-all duration-300 ${canScrollUp ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                 <button onClick={() => handleScroll('up')} className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-full p-2 shadow-lg border-2 border-white dark:border-slate-700 animate-bounce">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                 </button>
            </div>

            <div ref={scrollContainerRef} className="flex-grow overflow-y-auto scrollbar-hide pr-2 pb-12">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-4">
                    {compounds.map(compound => (
                        <CompoundCard 
                            key={compound.formula} 
                            compound={compound}
                            onSelect={() => handleSelect(compound.formula)}
                            isSelected={selectionMap.has(compound.formula)}
                            selectionLabel={selectionMap.get(compound.formula) || null}
                            onVisible={() => loadImage(compound.formula)}
                        />
                    ))}
                </div>
            </div>

            <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-20 transition-all duration-300 ${canScrollDown ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                 <button onClick={() => handleScroll('down')} className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-full p-2 shadow-lg border-2 border-white dark:border-slate-700 animate-bounce">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                 </button>
            </div>
        </div>
    );
};
