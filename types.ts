
export interface Atom {
  id: string;
  name: string;
  symbol: string;
  color: string;
  textColor: string;
  radius: number;
  valency?: string; // e.g., "+1", "-2", "+2, +3"
  oxidationStates?: number[];
  instanceId?: number;
  x?: number;
  y?: number;
}

export interface Reaction {
  id: string;
  name: string;
  formula: string;
  emoji: string;
  reactants: string[];
  reactionType?: string; // Added field for reaction classification
  bondType: string;
  explanation: string;
  molecularDensity?: string;
  acidBase?: string;
  applications?: string;
  commonality?: string; // e.g., "شائع جدًا", "شائع", "غير شائع"
  // New detailed fields
  molarMass?: string;
  state?: string;
  molecularGeometry?: string;
  lewisStructure?: string;
  safety?: {
    warnings: string[];
    ghsSymbols: string[];
  };
  namingMethod?: string;
  // Comprehensive Data Fields
  hybridization?: string; // e.g., sp3, sp2
  polarity?: string; // e.g., Polar, Non-polar
  solubility?: string; // e.g., Soluble in water
  magneticProfile?: string; // e.g., Diamagnetic, Paramagnetic
  crystalStructure?: string; // e.g., Cubic, Hexagonal
  discovery?: string; // e.g., Discovered by X in Y
}

export interface Product {
  name: string;
  formula: string;
  state: string; // e.g., "(s)", "(l)", "(g)", "(aq)"
}

export interface CompoundReaction {
  id: string; // 'none' if no reaction
  balancedEquation: string;
  reactionType: string;
  explanation: string;
  products: Product[];
  safetyNotes: string[];
  // New Fields
  enthalpy?: string; // e.g. Exothermic
  visualObservation?: string; // e.g. "Blue precipitate forms"
  conditions?: string; // e.g. "Requires heat"
}

export interface OrganicCompoundInfo {
  id: string;
  name: string;
  formula: string;
  family: string;
  description: string;
  uses: string;
  stateAtSTP: string;
  iupacNaming: string;
  boilingPoint?: string;
  meltingPoint?: string;
  lewisStructureImage?: string; 
  // New Fields
  density?: string;
  solubility?: string; // Water vs Organic solvents
  isomersCount?: string; // Approx number of isomers
  toxicity?: string;
  reactivity?: string; // Typical reactions
}

export interface BiomoleculeInfo {
  id: string;
  name: string;
  formula: string;
  type: string;
  description: string;
  biologicalFunction: string;
  structureImage: string;
  // New Fields
  molecularWeight?: string;
  occurrence?: string; // Where found in nature
  metabolicRole?: string; // Role in metabolism
  deficiencyEffects?: string;
}

export interface GalvanicCellInfo {
  id: string;
  anode: {
    metal: string;
    halfReaction: string;
  };
  cathode: {
    metal: string;
    halfReaction: string;
  };
  overallReaction: string;
  cellPotential: string;
  explanation: string;
  diagramImage: string;
  // New Fields
  cellNotation?: string; // Zn | Zn2+ || Cu2+ | Cu
  gibbsFreeEnergy?: string; // -nFE
  spontaneity?: string;
}

export interface ThermoChemistryInfo {
  id: string;
  equation: string;
  enthalpyChange: string; // e.g., "-285.8 kJ/mol"
  entropyChange: string; // e.g., "-163.3 J/mol·K"
  gibbsFreeEnergyChange: string; // e.g., "-237.1 kJ/mol"
  isExothermic: boolean;
  isSpontaneous: boolean;
  explanation: string;
  energyProfileImage: string; 
  // New Fields
  activationEnergy?: string;
  equilibriumConstant?: string; // K_eq
  rateFactors?: string[]; // CHANGED to string array
}

export interface SolutionChemistryInfo {
  id: string;
  soluteName: string;
  soluteFormula: string;
  solventName: string;
  concentrationMolarity: string;
  solutionDescription: string;
  solutionType: string; // e.g., "محلول إلكتروليتي قوي", "محلول غير إلكتروليتي"
  solutionImage: string;
  // New Fields
  phLevel?: string;
  boilingPointElevation?: string;
  freezingPointDepression?: string;
  conductivity?: string;
}


export interface DisplayCompound {
  name: string;
  formula: string;
  imageUrl: string;
}
