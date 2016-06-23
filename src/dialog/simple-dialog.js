'use strict'

import Dialog from './dialog'

export default class SimpleDialog extends Dialog {
  constructor (fn) {
    super()
    this.fn = fn
  }

  begin (session, args) {
    this.fn(session, args)
  }

  replyReceived (session) {
    const lang = session.message.language
    const text = session.message.text
    session.compareConfidence(lang, text, 0.0, (handled) => {
      if (!handled) {
        this.fn(session)
      }
    })
  }

  dialogResumed (session, result) {
    this.fn(session, result)
  }
}
