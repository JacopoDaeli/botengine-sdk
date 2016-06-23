'use strict'

export default class Dialog {
  begin (session, args) {
    this.replyReceived(session)
  }

  dialogResumed (session, result) {
    if (result.error) {
      return session.error(result.error)
    }
    session.send()
  }

  compareConfidence (action, language, utterance, score) {
    action.next()
  }
}
