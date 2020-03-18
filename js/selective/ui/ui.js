/**
 * Base class for reusable UI elements.
 */

import {
  Base,
  compose,
} from '../../utility/compose'
import ConfigMixin from '../../mixin/config'
import UidMixin from '../../mixin/uid'
import Listeners from '../../utility/listeners'


export default class UI extends compose(ConfigMixin, UidMixin,)(Base) {
  constructor(config) {
    super()

    this.listeners = new Listeners()
  }

  get config() {
    return this.getConfig()
  }

  get template() {
    return 'Missing template for UI.'
  }

  get uid() {
    return this.getUid()
  }

  render() {
    // Trigger a render event.
    document.dispatchEvent(new CustomEvent('selective.render'))
  }
}
