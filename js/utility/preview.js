/**
 *  Utility for determining the preview value.
 */

import { html } from 'lit-html'
import DataType from './dataType'
import { autoDeepObject } from './deepObject'


const COMMON_PREVIEW_KEYS = [
  // First match wins.
  'title', 'label', 'subtitle', 'type', 'text', 'key', 'id', 'url', 'value',
  'doc', 'partial',
]
const VIDEO_EXT = [
  // Video extensions.
  'mp4', 'webm',
]


const guessPreviewForObject = (obj) => {
  const deepObj = autoDeepObject(obj)
  let previewValue = obj
  for (const key of COMMON_PREVIEW_KEYS) {
    previewValue = deepObj.get(key)
    if (!previewValue) {
      // Also check for translation marked keys.
      previewValue = deepObj.get(`${key}@`)
    }

    if (previewValue) {
      break
    }
  }

  // If the matched preview is also an object try again.
  if (DataType.isObject(previewValue)) {
    return guessPreviewForObject(previewValue)
  }

  return previewValue
}


const findPreviewValue = (mainConfig, subConfig, value, defaultValue) => {
  value = autoDeepObject(value)
  let previewValue = null

  const defaultPreviewField = mainConfig.get('preview_field')
  const defaultPreviewFields = mainConfig.get('preview_fields')
  const previewField = subConfig.preview_field
  const previewFields = subConfig.preview_fields

  let previewFieldKeys = (
    previewField
    || previewFields
    || defaultPreviewField
    || defaultPreviewFields
  )

  if (previewFieldKeys) {
    // Treat preview_type and preview_types as an array.
    if (!DataType.isArray(previewFieldKeys)) {
      previewFieldKeys = [previewFieldKeys]
    }

    for (const fieldKey of previewFieldKeys) {
      previewValue = value.get(fieldKey)

      // First matching field key becomes the value.
      if (previewValue) {
        break
      }
    }
  }

  if (!previewValue) {
    previewValue = value.obj
  }

  if (previewValue) {
    // Do not return a object as a preview.
    // Previews need to be something that can be displayed.
    if (DataType.isObject(previewValue)) {
      previewValue = guessPreviewForObject(previewValue)
    }

    return previewValue || defaultValue
  }

  return defaultValue
}

const templatePreviewValue = (previewValue, previewType, defaultValue) => {
  if (previewType == 'image' && previewValue) {
    if (previewValue.startsWith('http') || previewValue.startsWith('//')) {
      for (const videoExt of VIDEO_EXT) {
        if (previewValue.endsWith(`.${videoExt}`)) {
          return html`<video playsinline disableremoteplayback muted autoplay loop>
            <source src="${previewValue}" />
          </video>`
        }
      }

      return html`<img src="${previewValue}" class="selective__image__fingernail">`
    } else if (previewValue.startsWith('/')) {
      return html`<img src="${previewValue}" class="selective__image__fingernail">`
    }
  }

  return previewValue || defaultValue
}

export { findPreviewValue, templatePreviewValue }
