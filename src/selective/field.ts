import {Types} from './types';

export interface FieldComponent {
  /**
   * Field can define any properties or methods they need.
   */
  [x: string]: any;
}

export type FieldConstructor = (types: Types) => FieldComponent;

export class Field implements FieldComponent {}
