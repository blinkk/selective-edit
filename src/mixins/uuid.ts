import {Constructor} from './index';
import {generateUUID} from '../utility/uuid';

export function UuidMixin<TBase extends Constructor>(Base: TBase) {
  return class UuidClass extends Base {
    _uuid?: string;

    get uuid(): string {
      if (!this._uuid) {
        this._uuid = generateUUID();
      }
      return this._uuid;
    }

    get uid(): string {
      return this.uuid.slice(0, 8);
    }
  };
}
