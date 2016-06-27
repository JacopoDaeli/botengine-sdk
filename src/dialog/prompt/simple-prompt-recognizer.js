'use strict'

import promptType from './prompt-type'
import Dialog from '../dialog'
import EntityRecognizer from '../entity-recognizer'

export default class SimplePromptRecognizer {
  constructor () {
    this.cancelExp = /^(cancel|nevermind|never mind|stop|forget it|quit)/i
  }

  recognize (args, callback, session) {
    this.checkCanceled(args, () => {
      try {
        let score = 0.0
        let response = null
        const text = args.utterance.trim()
        switch (args.promptType) {
          default:
          case promptType.text:
            score = 0.1
            response = text
            break
          case promptType.number:
            const n = EntityRecognizer.parseNumber(text)
            if (!isNaN(n)) {
              score = n.toString().length / text.length
              response = n
            }
            break
          case promptType.confirm:
            let b = EntityRecognizer.parseBoolean(text)
            if (typeof b !== 'boolean') {
              const n = EntityRecognizer.parseNumber(text)
              if (!isNaN(n) && n > 0 && n <= 2) {
                b = (n === 1)
              }
            }
            if (typeof b === 'boolean') {
              score = 1.0
              response = b
            }
            break
          case promptType.time:
            const entity = EntityRecognizer.recognizeTime(text, args.refDate ? new Date(args.refDate) : null)
            if (entity) {
              score = entity.entity.length / text.length
              response = entity
            }
            break
          case promptType.choice:
            let best = EntityRecognizer.findBestMatch(args.enumValues, text)
            if (!best) {
              const n = EntityRecognizer.parseNumber(text)
              if (!isNaN(n) && n > 0 && n <= args.enumValues.length) {
                best = {
                  index: n - 1,
                  entity: args.enumValues[n - 1],
                  score: 1.0
                }
              }
            }
            if (best) {
              score = best.score
              response = best
            }
            break
          case promptType.attachment:
            if (args.attachments && args.attachments.length > 0) {
              score = 1.0
              response = args.attachments
            }
            break
        }
        args.compareConfidence(args.language, text, score, (handled) => {
          if (!handled && score > 0) {
            callback({
              resumed: Dialog.ResumeReason.completed,
              promptType: args.promptType,
              response: response
            })
          } else {
            callback({
              resumed: Dialog.ResumeReason.notCompleted,
              promptType: args.promptType,
              handled: handled
            })
          }
        })
      } catch (err) {
        callback({
          resumed: Dialog.ResumeReason.notCompleted,
          promptType: args.promptType,
          error: err instanceof Error ? err : new Error(err.toString())
        })
      }
    }, callback)
  }

  checkCanceled (args, onContinue, callback) {
    if (!this.cancelExp.test(args.utterance.trim())) {
      onContinue()
    } else {
      callback({
        resumed: Dialog.ResumeReason.canceled,
        promptType: args.promptType
      })
    }
  }
}
