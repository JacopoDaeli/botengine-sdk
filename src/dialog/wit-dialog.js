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
    WitDialog.recognize(utterance, this.serviceUri, this.bearerToken, callback)
  }
}

WitDialog.recognize = function (utterance, serviceUri, bearerToken, callback) {
  let uri = serviceUri.trim()
  if (uri.lastIndexOf('&q=') !== (uri.length - 3)) {
    uri += '&q='
  }
  uri += encodeURIComponent(utterance || '')

  const reqOpts = {
    auth: {
      bearer: bearerToken
    }
  }

  console.log(`Processing: "${utterance}".`)

  request.get(uri, reqOpts, (err, res, body) => {
    let calledCallback = false
    try {
      if (!err) {
        const result = JSON.parse(body)

        // console.log(result)

        const intents = (result.entities.intent || []).map((intent) => {
          return {
            score: intent.confidence,
            intent: intent.value
          }
        })

        // console.log(intents)

        const entityKeys = Object.keys(result.entities).filter((key) => {
          return key !== 'intent'
        })

        const entities = entityKeys.map((key) => {
          return {
            confidence: result.entities[key][0].confidence,
            entity: result.entities[key][0].value,
            type: key,
            resolution: false
          }
        })

        calledCallback = true
        callback(null, intents, entities)
      } else {
        calledCallback = true
        callback(err)
      }
    } catch (e) {
      console.error(e.stack)
      if (!calledCallback) {
        callback(e)
      } else {
        console.error(e.toString())
      }
    }
  })
}

export default WitDialog
