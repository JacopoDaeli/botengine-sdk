'use strict'

import request from 'request'
import IntentDialog from './intent-dialog'

export class WitDialog extends IntentDialog {
  constructor (serviceUri) {
    super()
    this.serviceUri = serviceUri
  }

  recognizeIntents (language, utterance, callback) {
    let uri = this.serviceUri.trim()
    if (uri.lastIndexOf('&q=') !== uri.length - 3) {
      uri += '&q='
    }
    uri += encodeURIComponent(utterance || '')
    request.get(uri, (err, res, body) => {
      let calledCallback = false
      try {
        if (!err) {
          const result = JSON.parse(body)
          if (result.intents.length === 1 && typeof result.intents[0].score !== 'number') {
            result.intents[0].score = 1.0
          }
          calledCallback = true
          callback(null, result.intents, result.entities)
        } else {
          calledCallback = true
          callback(err)
        }
      } catch (e) {
        if (!calledCallback) {
          callback(e)
        } else {
          console.error(e.toString())
        }
      }
    })
  }
}
