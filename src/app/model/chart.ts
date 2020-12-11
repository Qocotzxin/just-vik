export enum Lapse {
  week = 'Última Semana',
  month = 'Último Mes',
  year = 'Último Año',
}

export interface TypeSelectorOptions {
  type: string;
  text: string;
  ariaLabel?: string;
  color?: string;
}
