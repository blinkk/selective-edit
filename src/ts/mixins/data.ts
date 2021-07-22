import {DeepObject, autoDeepObject} from '../utility/deepObject';

import {Constructor} from './index';

export function DataMixin<TBase extends Constructor>(Base: TBase) {
  return class DataClass extends Base {
    _data?: DeepObject;

    get data(): DeepObject | undefined {
      return this._data;
    }

    set data(data: DeepObject | Record<string, any> | undefined) {
      if (data === undefined) {
        this._data = undefined;
      } else {
        this._data = autoDeepObject(data);
      }
    }
  };
}
