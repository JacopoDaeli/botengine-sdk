'use strict'

import dialogAction from './dialog-action'
import { waterfall } from '../utils'

export default class IntentGroup {
  constructor (id) {
    this.id = id
    this.handlers = {}
  }

  _intentHandler (intent) {
    return this.handlers[intent]
  }

  getId () {
    return this.id
  }

  on (intent, dialogId, dialogArgs) {
    if (!this.handlers.hasOwnProperty(intent)) {
      if (Array.isArray(dialogId)) {
        this.handlers[intent] = waterfall(dialogId)
      } else if (typeof dialogId === 'string') {
        this.handlers[intent] = dialogAction.beginDialog(dialogId, dialogArgs)
      } else {
        this.handlers[intent] = waterfall([dialogId])
      }
    } else {
      throw new Error(`Intent[${intent}] already exists.`)
    }
    return this
  }
}
