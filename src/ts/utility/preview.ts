/**
 *  Utility for determining the preview value given an object.
 */
import {TemplateResult, html} from 'lit-html';
import {DataType} from './dataType';
import {autoDeepObject} from './deepObject';

const COMMON_PREVIEW_KEYS = [
  // First match wins.
  'title',
  'label',
  'subtitle',
  'type',
  'text',
  'key',
  'id',
  'url',
  'value',
  'doc',
  'partial',
];
const VIDEO_EXT = [
  // Video extensions.
  'mp4',
  'webm',
];

export enum PreviewTypes {
  Image = 'image',
  Text = 'text',
}

/**
 * In the editor configuration it allows for providing a list of preview keys
 * or a single preview key to use for finding the preview value. This method
 * combines them into a single array to normalize the value for other methods.
 *
 * @param previewKeys Array of preview keys to use for previewing a field.
 * @param previewKey Preview key to use for previewing a field.
 */
export function combinePreviewKeys(
  previewKeys?: Array<string>,
  previewKey?: string
): Array<string> {
  // Copy the array to prevent modifying the original array.
  const allKeys = [...(previewKeys ?? [])];
  if (previewKey) {
    allKeys.push(previewKey);
  }
  return allKeys;
}

function guessPreviewForObject(obj: Record<string, any>): any {
  const deepObj = autoDeepObject(obj);
  let previewValue = obj;
  for (const key of COMMON_PREVIEW_KEYS) {
    previewValue = deepObj.get(key);
    if (!previewValue) {
      // Also check for translation marked keys.
      previewValue = deepObj.get(`${key}@`);
    }

    if (previewValue) {
      break;
    }
  }

  // If the matched preview is also an object try again.
  if (DataType.isObject(previewValue)) {
    return guessPreviewForObject(previewValue);
  }

  return previewValue;
}

export function findPreviewValue(
  value: Record<string, any>,
  previewFieldKeys: Array<string>,
  defaultValue: string
): string {
  value = autoDeepObject(value);
  let previewValue = null;

  if (previewFieldKeys) {
    for (const fieldKey of previewFieldKeys) {
      previewValue = value.get(fieldKey);

      // First matching field key becomes the value.
      if (previewValue && DataType.isString(previewValue)) {
        return previewValue;
      }
    }
  }

  return defaultValue;
}

export function findOrGuessPreviewValue(
  value: Record<string, any>,
  previewFieldKeys: Array<string>,
  defaultValue: string
): string {
  value = autoDeepObject(value);
  let previewValue = null;

  if (previewFieldKeys) {
    for (const fieldKey of previewFieldKeys) {
      previewValue = value.get(fieldKey);

      // First matching field key becomes the value.
      if (previewValue) {
        break;
      }
    }
  }

  if (!previewValue) {
    previewValue = value.obj;
  }

  if (previewValue) {
    // Do not return a object as a preview.
    // Previews need to be something that can be displayed.
    if (DataType.isObject(previewValue)) {
      previewValue = guessPreviewForObject(previewValue);
    }

    return previewValue || defaultValue;
  }

  return defaultValue;
}

export function templatePreviewValue(
  previewValue: string,
  previewType: PreviewTypes,
  defaultValue: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  index?: number
): TemplateResult {
  if (previewType === PreviewTypes.Image && DataType.isString(previewValue)) {
    if (previewValue.startsWith('http') || previewValue.startsWith('//')) {
      for (const videoExt of VIDEO_EXT) {
        if (previewValue.endsWith(`.${videoExt}`)) {
          return html`<video
            playsinline
            disableremoteplayback
            muted
            autoplay
            loop
          >
            <source src="${previewValue}" />
          </video>`;
        }
      }

      return html`<img
        src="${previewValue}"
        class="selective__image__fingernail"
      />`;
    } else if (previewValue.startsWith('/')) {
      return html`<img
        src="${previewValue}"
        class="selective__image__fingernail"
      />`;
    }
  }

  // Prevent having `[Object]` style preview values.
  if (!DataType.isString(previewValue)) {
    previewValue = defaultValue;
  }

  return html`${previewValue || defaultValue}`;
}

export function templateIndex(index?: number): TemplateResult {
  return index !== undefined
    ? html`<span class="selective__index">${index + 1}</span>`
    : html``;
}
