'use strict'

import { EventEmitter } from 'events'
import _ from 'lodash'
import sprintf from 'sprintf-js'
import Dialog from './dialog/dialog'
import SessionConfidenceComparor from 'session-confidence-comparator'
import { extractArgs } from './utils'

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
    let index = 0
    let handlers = null
    const next = () => {
      const handler = index < handlers.length ? handlers[index] : null
      if (handler) {
        index++
        handler(this, next)
      } else {
        this.routeMessage()
      }
    }
    this.sessionState = sessionState || {
      callstack: [],
      lastAccess: 0
    }
    this.sessionState.lastAccess = new Date().getTime()
    this.message = message || {
      text: ''
    }
    if (!this.message.type) {
      this.message.type = 'Message'
    }
    handlers = this.dialogs.getMiddleware()
    next()
    return this
  }

  error (_err) {
    let err = _err instanceof Error ? _err : new Error(_err.toString())
    console.error(`Session Error: ${err.message}`)
    this.emit('error', err)
    return this
  }

  getText (msgId) {
    const args = extractArgs(arguments, 1)
    return this.vGetText(msgId, args)
  }

  nGetText (msgId, msgIdPlural, count) {
    let tmpl = null
    if (this.options.localizer && this.message) {
      tmpl = this.options.localizer.ngettext(this.message.language || '', msgId, msgIdPlural, count)
    } else if (count === 1) {
      tmpl = msgId
    } else {
      tmpl = msgIdPlural
    }
    return sprintf.sprintf(tmpl, count)
  }

  send (msg) {
    const args = extractArgs(arguments, 1)
    const ss = this.sessionState
    if (ss.callstack.length > 0) {
      ss.callstack[ss.callstack.length - 1].state = this.dialogData || {}
    }
    const message = typeof msg === 'string' ? this.createMessage(msg, args) : msg
    this.delayedEmit('send', message)
    return this
  }

  getMessageReceived () {
    return this.message.channelData
  }

  sendMessage (msg) {
    return this.send({ channelData: msg })
  }

  messageSent () {
    return this.messageSent
  }

  beginDialog (id, args) {
    const dialog = this.dialogs.getDialog(id)
    if (!dialog) {
      throw new Error(`Dialog[${id}] not found.`)
    }
    const ss = this.sessionState
    if (ss.callstack.length > 0) {
      ss.callstack[ss.callstack.length - 1].state = this.dialogData || {}
    }
    const cur = {
      id: id,
      state: {}
    }
    ss.callstack.push(cur)
    this.dialogData = cur.state
    dialog.begin(this, args)
    return this
  }

  replaceDialog (id, args) {
    const dialog = this.dialogs.getDialog(id)
    if (!dialog) {
      throw new Error(`Dialog[${id}] not found.`)
    }
    const ss = this.sessionState
    const cur = {
      id: id,
      state: {}
    }
    ss.callstack.pop()
    ss.callstack.push(cur)
    this.dialogData = cur.state
    dialog.begin(this, args)
    return this
  }

  endDialog (result) {
    const args = extractArgs(arguments, 1)
    const ss = this.sessionState
    if (!ss || !ss.callstack || ss.callstack.length === 0) {
      console.error('ERROR: Too many calls to session.endDialog().')
      return this
    }
    let m = null
    let r = {}
    if (result) {
      if (typeof result === 'string') {
        m = this.createMessage(result, args)
      } else if (result.hasOwnProperty('text') || result.hasOwnProperty('attachments') || result.hasOwnProperty('channelData')) {
        m = result
      } else {
        r = result
      }
    }
    if (!r.hasOwnProperty('resumed')) {
      r.resumed = Dialog.ResumeReason.completed
    }

    r.childId = ss.callstack[ss.callstack.length - 1].id
    if (ss.callstack.length > 0) {
      ss.callstack.pop()
    }
    if (ss.callstack.length > 0) {
      const cur = ss.callstack[ss.callstack.length - 1]
      this.dialogData = cur.state
      if (m) this.send(m)
      const d = this.dialogs.getDialog(cur.id)
      d.dialogResumed(this, r)
    } else {
      this.send(m)
      if (r.error) {
        this.emit('error', r.error)
      } else {
        if (!result) {
          this.delayedEmit('quit')
        }
      }
    }
    return this
  }

  compareConfidence (language, utterance, score, callback) {
    const comparer = new SessionConfidenceComparor(this, language, utterance, score, callback)
    comparer.next()
  }

  reset (dialogId, dialogArgs) {
    this._isReset = true
    this.sessionState.callstack = []
    if (!dialogId) {
      dialogId = this.options.dialogId
      dialogArgs = dialogArgs || this.options.dialogArgs
    }
    this.beginDialog(dialogId, dialogArgs)
    return this
  }

  isReset () {
    return this._isReset
  }

  createMessage (text, args) {
    const message = {
      text: this.vGetText(text, args)
    }
    if (this.message.language) {
      message.language = this.message.language
    }
    return message
  }

  routeMessage () {
    try {
      const ss = this.sessionState
      if (ss.callstack.length === 0) {
        this.beginDialog(this.options.dialogId, this.options.dialogArgs)
      } else if (this.validateCallstack()) {
        const cur = ss.callstack[ss.callstack.length - 1]
        const dialog = this.dialogs.getDialog(cur.id)
        this.dialogData = cur.state
        dialog.replyReceived(this)
      } else {
        console.error('Callstack is invalid, resetting session.')
        this.reset(this.options.dialogId, this.options.dialogArgs)
      }
    } catch (e) {
      this.error(e)
    }
  }

  vGetText (msgId, args) {
    let tmpl
    if (this.options.localizer && this.message) {
      tmpl = this.options.localizer.getText(this.message.language || '', msgId)
    } else {
      tmpl = msgId
    }
    return args && args.length > 0 ? sprintf.vsprintf(tmpl, args) : tmpl
  }

  validateCallstack () {
    const ss = this.sessionState
    for (let i = 0; i < ss.callstack.length; i++) {
      const id = ss.callstack[i].id
      if (!this.dialogs.hasDialog(id)) {
        return false
      }
    }
    return true
  }

  delayedEmit (event, message) {
    let now = new Date().getTime()
    const delaySend = () => {
      setTimeout(() => {
        const entry = this.sendQueue.shift()
        this.lastSendTime = now = new Date().getTime()
        this.emit(entry.event, _.clone(entry.msg))
        if (this.sendQueue.length > 0) {
          delaySend()
        }
      }, (this.options.minSendDelay - (now - this.lastSendTime)))
    }
    if (this.sendQueue.length === 0) {
      this.msgSent = true
      if ((now - this.lastSendTime) >= this.options.minSendDelay) {
        this.lastSendTime = now
        this.emit(event, _.clone(message))
      } else {
        this.sendQueue.push({
          event,
          msg: message
        })
        delaySend()
      }
    } else {
      this.sendQueue.push({
        event,
        msg: message
      })
    }
  }
}
