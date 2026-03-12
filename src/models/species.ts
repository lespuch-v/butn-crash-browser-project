export enum SpeciesType {
  Normal = 'normal',
  Shadered = 'shadered',
  // Future species - add as we build modifiers
  // Explosive = 'explosive',
  // Sticky = 'sticky',
  // Ghost = 'ghost',
  // Magnet = 'magnet',
}

export interface SpeciesTraits {
  type: SpeciesType;
  canBeClicked: boolean;
  spawnsOnClick: boolean;
  chainReacts: boolean;
}

export const SPECIES_TRAITS: Record<SpeciesType, SpeciesTraits> = {
  [SpeciesType.Normal]: {
    type: SpeciesType.Normal,
    canBeClicked: true,
    spawnsOnClick: true,
    chainReacts: false,
  },
  [SpeciesType.Shadered]: {
    type: SpeciesType.Shadered,
    canBeClicked: true,
    spawnsOnClick: true,
    chainReacts: true,
  },
};
