import {Config, autoConfig} from '../utility/config';

import {Base} from '../mixins';
import {ClassManager} from '../utility/classes';
import {ConfigMixin} from '../mixins/config';
import {Types} from './types';

export class SelectiveEditor extends ConfigMixin(Base) {
  container: HTMLElement;
  types: Types;

  constructor(container: HTMLElement, config: Config | Record<string, any>) {
    super();
    this.container = container;
    this.config = autoConfig(config);
    this.types = {
      fields: new ClassManager(),
      rules: new ClassManager(),
    };
  }
}
