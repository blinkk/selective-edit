import {Base, Constructor} from './index';
import {Listeners} from '../utility/listeners';
import {UuidMixin} from './uuid';
import {findParentByClassname} from '../utility/dom';

export interface DroppableFieldComponent {
  droppableUi: DroppableUiComponent;
}

export interface DroppableUiComponent {
  listeners: Listeners;
  handleDragEnter(evt: DragEvent): void;
  handleDragLeave(evt: DragEvent): void;
  handleDragOver(evt: DragEvent): void;
  handleDrop(evt: DragEvent): void;
  validTypes: Array<string>;
}

export type DroppableHandler = (startIndex: number, endIndex: number) => void;

export function DroppableMixin<TBase extends Constructor>(Base: TBase) {
  return class DroppableClass extends Base implements DroppableFieldComponent {
    _droppableUi?: DroppableUiComponent;

    get droppableUi(): DroppableUiComponent {
      if (!this._droppableUi) {
        this._droppableUi = new DroppableUi();
      }
      return this._droppableUi;
    }

    set droppableUi(value: DroppableUiComponent) {
      this._droppableUi = value;
    }
  };
}

export class DroppableUi
  extends UuidMixin(Base)
  implements DroppableUiComponent
{
  listeners: Listeners;
  validTypes: Array<string>;

  constructor() {
    super();
    this.listeners = new Listeners();
    this.validTypes = [];
  }

  private findDropTarget(evt: DragEvent): HTMLElement | null {
    const target = findParentByClassname(
      evt.target as HTMLElement,
      'selective__droppable__target'
    );
    if (!target) {
      return null;
    }

    // Only allow dragging when the data transfer contains files.
    if (evt.dataTransfer?.types.includes('Files')) {
      evt.preventDefault();
      evt.stopPropagation();
      return target as HTMLElement;
    }

    return null;
  }

  handleDragEnter(evt: DragEvent): void {
    const target = this.findDropTarget(evt);
    if (!target) {
      return;
    }

    // Show that the element is hovering.
    target.classList.add('selective__droppable--hover');
  }

  handleDragLeave(evt: DragEvent): void {
    const target = this.findDropTarget(evt);
    if (!target) {
      return;
    }

    //  Make sure that the event target comes from the main element.
    if (target !== evt.target) {
      return;
    }

    // No longer hovering.
    target.classList.remove('selective__droppable--hover');
  }

  handleDragOver(evt: DragEvent): void {
    // Find the target and prevent the defaults if needed.
    this.findDropTarget(evt);
  }

  handleDrop(evt: DragEvent): void {
    const target = this.findDropTarget(evt);
    if (!target) {
      return;
    }

    // No longer hovering.
    target.classList.remove('selective__droppable--hover');

    const files: Array<File> = [];
    if (evt.dataTransfer?.items) {
      // Use DataTransferItemList interface to access the files.
      for (const item of evt.dataTransfer.items) {
        if (item.kind !== 'file') {
          // Skip non-file items.
          continue;
        }
        const file = item.getAsFile();
        if (file && this.isFileValid(file)) {
          files.push(file);
        }
      }
    } else {
      // Use DataTransfer interface to access the files.
      for (const file of evt.dataTransfer?.files || []) {
        if (this.isFileValid(file)) {
          files.push(file);
        }
      }
    }

    if (!files.length) {
      // No valid files. No need to trigger the files.
      return;
    }

    // Trigger with dropped files.
    this.listeners.trigger('files', files);
  }

  isFileValid(file: File): boolean {
    // Check the file against a list of valid file types.
    if (this.validTypes.length && !this.validTypes.includes(file.type)) {
      return false;
    }
    return true;
  }
}
