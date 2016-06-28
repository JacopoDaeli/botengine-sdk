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

const resumeReason = {}

resumeReason[resumeReason['completed'] = 0] = 'completed'
resumeReason[resumeReason['notCompleted'] = 1] = 'notCompleted'
resumeReason[resumeReason['canceled'] = 2] = 'canceled'
resumeReason[resumeReason['back'] = 3] = 'back'
resumeReason[resumeReason['forward'] = 4] = 'forward'
resumeReason[resumeReason['captureCompleted'] = 5] = 'captureCompleted'
resumeReason[resumeReason['childEnded'] = 6] = 'childEnded'

Dialog.resumeReason = resumeReason

export default Dialog
