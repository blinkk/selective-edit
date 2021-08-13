import {Base, Constructor} from './index';
import {Listeners} from '../utility/listeners';
import {UuidMixin} from './uuid';
import {findParentDraggable} from '../utility/dom';

export interface SortableFieldComponent {
  sortableUi: SortableUiComponent;
}

export interface SortableUiComponent {
  /**
   * Is the sortable component currently draggable?
   *
   * If a user is focused inside a draggable object don't allow the
   * item to be dragged.
   *
   * For instance, if there is an `input` inside of a draggable item
   * you do not want to allow it to be dragged while in the input
   * as that would mess up things like selecting text using the mouse.
   */
  canDrag: boolean;
  listeners: Listeners;
  handleDragEnter(evt: DragEvent): void;
  handleDragLeave(evt: DragEvent): void;
  handleDragOver(evt: DragEvent): void;
  handleDragStart(evt: DragEvent): void;
  handleDrop(evt: DragEvent): void;
  handleFocusIn(evt: FocusEvent): void;
  handleFocusOut(evt: FocusEvent): void;
}

export type SortableHandler = (startIndex: number, endIndex: number) => void;

export function SortableMixin<TBase extends Constructor>(Base: TBase) {
  return class SortableClass extends Base implements SortableFieldComponent {
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

export class SortableUi extends UuidMixin(Base) implements SortableUiComponent {
  private dragOrigin?: HTMLElement;
  private dragFocused?: boolean;
  listeners: Listeners;

  constructor() {
    super();
    this.dragFocused = false;
    this.listeners = new Listeners();
  }

  private findDragTarget(evt: DragEvent): HTMLElement | null {
    const target = evt.target;

    if (!this.dragOrigin || !target) {
      return null;
    }

    // Only allow dragging to the target if it has the matching type.
    if (evt.dataTransfer?.types.includes(this.transferType)) {
      evt.preventDefault();
      evt.stopPropagation();
      return findParentDraggable(target as HTMLElement);
    }

    return null;
  }

  get canDrag(): boolean {
    return !this.dragFocused;
  }

  handleDragEnter(evt: DragEvent): void {
    const target = this.findDragTarget(evt);
    if (!target) {
      return;
    }

    // Show that the element is hovering.
    target.classList.add('selective__sortable--hover');

    const currentIndex = parseInt(target.dataset.index as string);
    const startIndex = parseInt(this.dragOrigin?.dataset.index as string);

    //  Make sure that the event target comes from the main element.
    if (target !== evt.target) {
      return;
    }

    // Hovering over self, ignore.
    if (currentIndex === startIndex) {
      return;
    }

    if (currentIndex < startIndex) {
      target.classList.add('selective__sortable--above');
    } else {
      target.classList.add('selective__sortable--below');
    }
  }

  handleDragLeave(evt: DragEvent): void {
    const target = this.findDragTarget(evt);
    if (!target) {
      return;
    }

    //  Make sure that the event target comes from the main element.
    if (target !== evt.target) {
      return;
    }

    // No longer hovering.
    target.classList.remove(
      'selective__sortable--hover',
      'selective__sortable--above',
      'selective__sortable--below'
    );
  }

  handleDragOver(evt: DragEvent): void {
    // Find the target and prevent the defaults if needed.
    const target = this.findDragTarget(evt);
    if (!target) {
      return;
    }

    if (evt.dataTransfer) {
      evt.dataTransfer.dropEffect = 'move';
    }
  }

  handleDragStart(evt: DragEvent): void {
    evt.stopPropagation();

    this.dragOrigin =
      findParentDraggable(evt.target as HTMLElement) || undefined;

    if (evt.dataTransfer && this.dragOrigin) {
      evt.dataTransfer.effectAllowed = 'move';

      evt.dataTransfer.setData(
        'text/plain',
        this.dragOrigin.dataset.index as string
      );

      // Use a custom transfer type to contain drags just to this list.
      evt.dataTransfer.setData(
        this.transferType,
        this.dragOrigin.dataset.index as string
      );

      // Allow for custom preview for dragging.
      const previewEl = this.dragOrigin.querySelector(
        '.selective__sortable__preview'
      );
      if (previewEl) {
        evt.dataTransfer.setDragImage(previewEl, 0, 0);
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleFocusIn(evt: FocusEvent) {
    // Do not allow dragging if the target is a form input.
    const inputElement = (evt.target as HTMLElement).closest(
      'input, textarea, [contenteditable="true"]'
    );

    this.dragFocused = Boolean(inputElement);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleFocusOut(evt: FocusEvent) {
    this.dragFocused = false;
  }

  handleDrop(evt: DragEvent): void {
    const target = this.findDragTarget(evt);
    if (!target) {
      return;
    }

    const currentIndex = parseInt(target.dataset.index as string);
    const startIndex = parseInt(evt?.dataTransfer?.getData('text/plain') || '');

    // No longer hovering.
    target.classList.remove(
      'selective__sortable--hover',
      'selective__sortable--above',
      'selective__sortable--below'
    );

    // Reset the drag element.
    this.dragOrigin = undefined;

    this.listeners.trigger('sort', startIndex, currentIndex, target);
  }

  get transferType(): string {
    return `sortable/${this.uid}`;
  }
}
