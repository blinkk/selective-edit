import {Constructor} from './index';
import {DeepObject} from '../utility/deepObject';

export function DataMixin<TBase extends Constructor>(Base: TBase) {
  return class DataClass extends Base {
    _data?: DeepObject;

    get data(): DeepObject | undefined {
      return this._data;
    }

    set data(data: DeepObject | undefined) {
      this._data = data;
    }
  };
}
