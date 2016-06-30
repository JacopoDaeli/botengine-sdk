'use strict'

import Dialog from './dialog'
import DialogAction from './dialog-action'
import consts from '../constants'
import { waterfall } from '../utils'

class CommandDialog extends Dialog {
  constructor () {
    super()
    this.commands = []
  }

  begin (session, args) {
    if (this.beginDialog) {
      session.dialogData[consts.Data.Handler] = -1
      this.beginDialog(session, args, () => {
        super.begin.call(this, session, args)
      })
    } else {
      super.begin.call(this, session, args)
    }
  }

  replyReceived (session) {
    let score = 0.0
    let expression = null
    let matches = null
    const text = session.message.text
    let matched = null
    for (let i = 0; i < this.commands.length; i++) {
      const cmd = this.commands[i]
      for (let j = 0; j < cmd.expressions.length; j++) {
        expression = cmd.expressions[j]
        if (expression.test(text)) {
          matched = cmd
          session.dialogData[consts.Data.Handler] = i
          matches = expression.exec(text)
          if (matches) {
            let length = 0
            matches.forEach((value) => {
              if (value) length += value.length
            })
            score = length / text.length
          }
          break
        }
      }
      if (matched) break
    }
    if (!matched && this.default) {
      expression = null
      matched = this.default
      session.dialogData[consts.Data.Handler] = this.commands.length
    }
    if (matched) {
      session.compareConfidence(session.message.language, text, score, (handled) => {
        if (!handled) {
          matched.fn(session, {
            expression: expression,
            matches: matches
          })
        }
      })
    } else {
      session.send()
    }
  }

  dialogResumed (session, result) {
    let cur = null
    const handler = session.dialogData[consts.Data.Handler]

    if (handler >= 0 && handler < this.commands.length) {
      cur = this.commands[handler]
    } else if (handler >= this.commands.length && this.default) {
      cur = this.default
    }
    if (cur) {
      cur.fn(session, result)
    } else {
      super.dialogResumed.call(this, session, result)
    }
  }

  onBegin (handler) {
    this.beginDialog = handler
    return this
  }

  matches (patterns, dialogId, dialogArgs) {
    let fn = null
    const p = (!Array.isArray(patterns) ? [patterns] : patterns)
    if (Array.isArray(dialogId)) {
      fn = waterfall(dialogId)
    } else if (typeof dialogId === 'string') {
      fn = DialogAction.beginDialog(dialogId, dialogArgs)
    } else {
      fn = waterfall([dialogId])
    }
    const expressions = []
    for (let i = 0; i < p.length; i++) {
      expressions.push(new RegExp(p[i], 'i'))
    }
    this.commands.push({ expressions, fn })
    return this
  }

  onDefault (dialogId, dialogArgs) {
    let fn = null
    if (Array.isArray(dialogId)) {
      fn = waterfall(dialogId)
    } else if (typeof dialogId === 'string') {
      fn = DialogAction.beginDialog(dialogId, dialogArgs)
    } else {
      fn = waterfall([dialogId])
    }
    this.default = { fn }
    return this
  }
}

export default CommandDialog
