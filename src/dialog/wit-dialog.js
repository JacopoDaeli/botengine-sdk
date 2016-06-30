'use strict'

import request from 'request'
import IntentDialog from './intent-dialog'

class WitDialog extends IntentDialog {
  constructor (params) {
    super()
    this.serviceUri = params.serviceUri
    this.bearerToken = params.bearerToken
  }

  recognizeIntents (language, utterance, callback) {
    WitDialog.recognize(utterance, this.serviceUri, callback)
  }
}

WitDialog.recognize = function (utterance, serviceUri, callback) {
  let uri = serviceUri.trim()
  if (uri.lastIndexOf('&q=') !== (uri.length - 3)) {
    uri += '&q='
  }
  uri += encodeURIComponent(utterance || '')

  request.get(uri, (err, res, body) => {
    let calledCallback = false
    try {
      if (!err) {
        const result = JSON.parse(body)

        const intents = (result.entities.intent || []).map((intent) => {
          return {
            score: intent.confidence,
            task: intent.value
          }
        })

        const entityKeys = Object.keys(entities).filter((key) => {
          return key !== 'intent'
        })

        const entities = entityKeys.map((key) => {
          return {
            score: result.entities[key][0].confidence,
            value: result.entities[key].value,
            name: key
          }
        })

        // if (intents.length === 1 && typeof intents[0].score !== 'number') {
        //   intents[0].score = 1.0
        // }

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

export default WitDialog
