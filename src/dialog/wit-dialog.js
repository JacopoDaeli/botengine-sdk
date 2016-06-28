'use strict'

// import request from 'request'
import IntentDialog from './intent-dialog'

export class WitDialog extends IntentDialog {
  constructor (serviceUri) {
    super()
    this.serviceUri = serviceUri
  }

  recognizeIntents (language, utterance, callback) {

  }
}
