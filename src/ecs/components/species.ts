import { type SpeciesType, SpeciesType as ST } from '@models/species';

/** What kind of button this is */
export interface SpeciesComponent {
  type: SpeciesType;
}

export function createDefaultSpecies(): SpeciesComponent {
  return { type: ST.Normal };
}
