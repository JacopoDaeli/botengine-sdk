'use strict'

class Dialog {
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

Dialog.resumeReason = {}
Dialog.resumeReason.completed = 0
Dialog.resumeReason.notCompleted = 1
Dialog.resumeReason.canceled = 2
Dialog.resumeReason.back = 3
Dialog.resumeReason.forward = 4
Dialog.resumeReason.captureCompleted = 5
Dialog.resumeReason.childEnded = 6

export default Dialog
