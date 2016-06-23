'use strict'

import { EventEmitter } from 'events'
import Dialog from './dialog/dialog'

export default class Session extends EventEmitter {
  constructor (opts) {
    super()
    this.options = opts
    this.msgSent = false
    this._isReset = false
    this.lastSendTime = new Date().getTime()
    this.sendQueue = []
    this.dialogs = opts.dialogs

    if (typeof this.options.minSendDelay !== 'number') {
      this.options.minSendDelay = 1000
    }
  }

  dispatch (sessionState, message) {

  }

  error (_err) {
    let err = _err instanceof Error ? _err : new Error(_err.toString())
    console.error(`Session Error: ${err.message}`)
    this.emit('error', err)
    return this
  }

  getText (msgId) {

  }

  nGetText (msgId, msgIdPlural, count) {

  }

  send (msg) {

  }

  getMessageReceived () {

  }

  sendMessage (msg) {

  }

  messageSent () {
    return this.messageSent
  }

  beginDialog (id, args) {

  }

  replaceDialog (id, args) {

  }

  endDialog (result) {

  }

  compareConfidence (language, utterance, score, callback) {

  }

  reset () {

  }

  isReset () {

  }

  createMessage (text, args) {

  }

  routeMessage () {

  }

  vGetText (msgId, args) {

  }

  validateCallstack () {

  }

  delayedEmit (event, message) {

  }
}
