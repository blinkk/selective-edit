import {Constructor} from './index';

export interface SortableUiComponent {
  handleDragEnter(evt: Event): void;
  handleDragLeave(evt: Event): void;
  handleDragOver(evt: Event): void;
  handleDragStart(evt: Event): void;
  handleDrop(evt: Event): void;
}

export function SortableMixin<TBase extends Constructor>(Base: TBase) {
  return class SortableClass extends Base {
    _sortableUi?: SortableUiComponent;

    get sortableUi(): SortableUiComponent {
      if (!this._sortableUi) {
        this._sortableUi = new SortableUi();
      }
      return this._sortableUi;
    }

    set sortableUi(value: SortableUiComponent) {
      this._sortableUi = value;
    }
  };
}

export class SortableUi implements SortableUiComponent {
  handleDragEnter(evt: Event): void {}
  handleDragLeave(evt: Event): void {}
  handleDragOver(evt: Event): void {}
  handleDragStart(evt: Event): void {}
  handleDrop(evt: Event): void {}
}
