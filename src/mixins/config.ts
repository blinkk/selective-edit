import {Config} from '../utility/config';
import {Constructor} from './index';

export function ConfigMixin<TBase extends Constructor>(Base: TBase) {
  return class ConfigClass extends Base {
    _config?: Config;

    get config(): Config | undefined {
      return this._config;
    }

    set config(config: Config | undefined) {
      this._config = config;
    }
  };
}
