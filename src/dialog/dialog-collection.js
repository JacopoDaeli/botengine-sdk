'use strict'

import { EventEmitter } from 'events'
import SimpleDialog from './simple-dialog'
import Prompt from './prompt/prompt'
import consts from '../constants'
import { waterfall } from '../utils'

class DialogCollection extends EventEmitter {
  constructor () {
    super()
    this.middleware = []
    this.dialogs = {}
    DialogCollection.systemDialogs[consts.DialogId.Prompt] = new Prompt()
    this.add(DialogCollection.systemDialogs)
  }

  add (id, dialog) {
    let dialogs = null
    if (typeof id === 'string') {
      if (Array.isArray(dialog)) {
        dialog = new SimpleDialog(waterfall(dialog))
      } else if (typeof dialog === 'function') {
        dialog = new SimpleDialog(waterfall([dialog]))
      }
      let _a = null
      dialogs = (_a = {}, _a[id] = dialog, _a)
    } else {
      dialogs = id
    }
    for (let key in dialogs) {
      if (!this.dialogs.hasOwnProperty(key)) {
        this.dialogs[key] = dialogs[key]
      } else {
        throw new Error(`Dialog[${key}] already exists.`)
      }
    }
    return this
  }

  getDialog (id) {
    return this.dialogs[id]
  }

  getMiddleware () {
    return this.middleware
  }

  hasDialog (id) {
    return this.dialogs.hasOwnProperty(id)
  }

  use (fn) {
    this.middleware.push(fn)
    return this
  }
}

DialogCollection.systemDialogs = {}

export default DialogCollection
