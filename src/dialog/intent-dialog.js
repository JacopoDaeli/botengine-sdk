'use strict'

import Dialog from './dialog'

class IntentDialog extends Dialog {
  constructor () {
    super()
    this.groups = {}
    this.confidenceThreshold = 0.1
    this.intentThreshold = 0.1 // TODO: replace this with the above one
  }

  begin (session, args) {
    if (this.beginDialog) {
      this.beginDialog(session, args, () => {
        super.begin.call(this, session, args)
      })
    } else {
      super.begin.call(this, session, args)
    }
  }

  replyReceived (session) {
    const msg = session.message
    this.recognizeIntents(msg.language, msg.text, (err, intents, entities) => {
      if (!err) {
        const topIntent = this.findTopIntent(intents)
        const score = topIntent ? topIntent.score : 0
        session.compareConfidence(msg.language, msg.text, score, (handled) => {
          if (!handled) {
            this.invokeIntent(session, intents, entities)
          }
        })
      } else {
        session.endDialog({
          error: new Error(`Intent recognition error: ${err.message}`)
        })
      }
    })
  }

  dialogResumed (session, result) {

  }
}

IntentDialog.CAPTURE_THRESHOLD = 0.6

export default IntentDialog
