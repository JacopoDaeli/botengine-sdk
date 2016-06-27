'use strict'

import _ from 'lodash'
import Session from '../session'
import Dialog from './dialog'
import SimpleDialog from './simple-dialog'
import consts from '../constants'
import { extractArgs } from '../utils'

class DialogAction {
  send (msg) {
    const args = extractArgs(arguments, 2)
    args.splice(0, 0, msg)
    return function sendAction (s) {
      Session.prototype.send.apply(s, args)
    }
  }

  beginDialog (id, args) {
    return function beginDialogAction (s, a) {
      if (a && a.hasOwnProperty('resumed')) {
        let r = a
        if (r.error) {
          s.error(r.error)
        } else if (!s.messageSent()) {
          s.send()
        }
      } else {
        if (args) {
          a = a || {}
          for (var key in args) {
            if (args.hasOwnProperty(key)) {
              a[key] = args[key]
            }
          }
        }
        s.beginDialog(id, a)
      }
    }
  }

  endDialog (result) {
    return function endDialogAction (s) {
      s.endDialog(result)
    }
  }

  validatedPrompt (promptType, validator) {
    return new SimpleDialog((s, _r) => {
      let r = _r || {}
      let valid = false
      if (r.response) {
        try {
          valid = validator(r.response)
        } catch (e) {
          s.endDialog({
            resumed: Dialog.ResumeReason.notCompleted,
            error: e instanceof Error ? e : new Error(e.toString())
          })
        }
      }
      let canceled = false
      switch (r.resumed) {
        case Dialog.ResumeReason.canceled:
        case Dialog.ResumeReason.forward:
        case Dialog.ResumeReason.back:
          canceled = true
          break
      }
      if (valid || canceled) {
        s.endDialog(r)
      } else if (!s.dialogData.hasOwnProperty('prompt')) {
        s.dialogData = _.clone(r)
        s.dialogData.promptType = promptType
        if (!s.dialogData.hasOwnProperty('maxRetries')) {
          s.dialogData.maxRetries = 2
        }
        const a = _.clone(s.dialogData)
        a.maxRetries = 0
        s.beginDialog(consts.DialogId.Prompts, a)
      } else if (s.dialogData.maxRetries > 0) {
        s.dialogData.maxRetries--
        const a = _.clone(s.dialogData)
        a.maxRetries = 0
        a.prompt = s.dialogData.retryPrompt || `I didn't understand. ${s.dialogData.prompt}`
        s.beginDialog(consts.DialogId.Prompts, a)
      } else {
        s.endDialog({
          resumed: Dialog.ResumeReason.notCompleted
        })
      }
    })
  }
}

export default DialogAction
