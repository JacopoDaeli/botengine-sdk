'use strict'

import Dialog from './dialog/dialog'
import Session from './session'
import { extractArgs } from './utils'

export default class SessionConfidenceComparor {
  SessionConfidenceComparor (session, language, utterance, score, callback) {
    this.session = session
    this.language = language
    this.utterance = utterance
    this.score = score
    this.callback = callback
    this.index = session.sessionState.callstack.length - 1
    this.userData = session.userData
  }

  next () {
    this.index--
    if (this.index >= 0) {
      this.getDialog().compareConfidence(this, this.language, this.utterance, this.score)
    } else {
      this.callback(false)
    }
  }

  endDialog (result) {
    this.session.sessionState.callstack.splice(this.index + 1)
    this.getDialog().dialogResumed(this.session, result || {
      resumed: Dialog.resumeReason.childEnded
    })
    this.callback(true)
  }

  send (msg) {
    const args = extractArgs(arguments, 1)
    args.splice(0, 0, [msg])
    Session.prototype.send.apply(this.session, args)
    this.callback(true)
  }

  getDialog () {
    const cur = this.session.sessionState.callstack[this.index]
    this.dialogData = cur.state
    return this.session.dialogs.getDialog(cur.id)
  }
}
