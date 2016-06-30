'use strict'

import Dialog from './dialog'
import IntentGroup from './intent-group'
import consts from '../constants'

class IntentDialog extends Dialog {
  constructor () {
    super()
    this.groups = {}
    this.confidenceThreshold = 0.1
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
          if (!handled) this.invokeIntent(session, intents, entities)
        })
      } else {
        session.endDialog({
          error: new Error(`Intent recognition error: ${err.message}`)
        })
      }
    })
  }

  dialogResumed (session, result) {
    if (result.captured) {
      this.invokeIntent(session, result.captured.intents, result.captured.entities)
    } else {
      const activeGroup = session.dialogData[consts.Data.Group]
      const activeIntent = session.dialogData[consts.Data.Intent]
      const group = activeGroup ? this.groups[activeGroup] : null
      const handler = group && activeIntent ? group._intentHandler(activeIntent) : null
      if (handler) {
        handler(session, result)
      } else {
        super.dialogResumed.call(this, session, result)
      }
    }
  }

  compareConfidence (action, language, utterance, score) {
    if (score < IntentDialog.CAPTURE_THRESHOLD && this.captureIntent) {
      this.recognizeIntents(language, utterance, (err, intents, entities) => {
        if (!err) {
          let matches = null
          const topIntent = this.findTopIntent(intents)
          if (topIntent && topIntent.score > this.confidenceThreshold && topIntent.score > score) {
            matches = this.findHandler(topIntent)
          }
          if (matches) {
            this.captureIntent({
              next: action.next,
              userData: action.userData,
              dialogData: action.dialogData,
              endDialog: () => {
                action.endDialog({
                  resumed: Dialog.resumeReason.completed,
                  captured: { intents, entities }
                })
              },
              send: action.send
            }, topIntent, entities)
          } else {
            action.next()
          }
        } else {
          console.error(`Intent recognition error: ${err.message}`)
          action.next()
        }
      })
    } else {
      action.next()
    }
  }

  addGroup (group) {
    const id = group.getId()
    if (!this.groups.hasOwnProperty(id)) {
      this.groups[id] = group
    } else {
      throw new Error(`Group of ${id} already exists within the dialog.`)
    }
    return this
  }

  onBegin (handler) {
    this.beginDialog = handler
    return this
  }

  on (intent, dialogId, dialogArgs) {
    this.getDefaultGroup().on(intent, dialogId, dialogArgs)
    return this
  }

  onDefault (dialogId, dialogArgs) {
    this.getDefaultGroup().on(consts.Intents.Default, dialogId, dialogArgs)
    return this
  }

  getThreshold () {
    return this.confidenceThreshold
  }

  setThreshold (score) {
    this.confidenceThreshold = score
    return this
  }

  invokeIntent (session, intents, entities) {
    try {
      let match = null
      let topIntent = this.findTopIntent(intents)
      if (topIntent && topIntent.score > this.confidenceThreshold) {
        match = this.findHandler(topIntent)
      }
      if (!match) {
        topIntent = {
          intent: consts.Intents.Default,
          score: 1.0
        }
        match = {
          groupId: consts.Id.DefaultGroup,
          handler: this.getDefaultGroup()._intentHandler(topIntent.intent)
        }
      }
      if (match && match.handler) {
        session.dialogData[consts.Data.Group] = match.groupId
        session.dialogData[consts.Data.Intent] = topIntent.intent
        match.handler(session, { intents, entities })
      } else {
        session.send()
      }
    } catch (e) {
      session.error(e instanceof Error ? e : new Error(e.toString()))
    }
  }

  findTopIntent (intents) {
    let topIntent = null
    if (intents) {
      for (let i = 0; i < intents.length; i++) {
        const intent = intents[i]
        if (!topIntent || intent.score > topIntent.score) {
          topIntent = intent
        }
      }
    }
    return topIntent
  }

  findHandler (intent) {
    for (let groupId in this.groups) {
      // TODO: Change intent.intent (is ugly)
      const handler = this.groups[groupId]._intentHandler(intent.intent)
      if (handler) return { groupId, handler }
    }
    return null
  }

  getDefaultGroup () {
    let group = this.groups[consts.Id.DefaultGroup]
    if (!group) {
      group = new IntentGroup(consts.Id.DefaultGroup)
      this.groups[consts.Id.DefaultGroup] = group
    }
    return group
  }
}

IntentDialog.CAPTURE_THRESHOLD = 0.6

export default IntentDialog
