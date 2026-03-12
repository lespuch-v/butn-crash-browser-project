import { type SpeciesType, SpeciesType as ST } from '@models/species';

/** What kind of button this is */
export interface SpeciesComponent {
  type: SpeciesType;
}

export function createSpecies(type: SpeciesType = ST.Normal): SpeciesComponent {
  return { type };
}

export function createDefaultSpecies(): SpeciesComponent {
  return createSpecies();
}
