'use strict'

import Session from './session'
import { extractArgs, composePrompt } from './utils'

export default class Message {
  setLanguage (lang) {
    this.language = lang
    return this
  }

  setText (ses, prompts) {
    const args = extractArgs(arguments, 2)
    const msg = typeof prompts === 'string' ? prompts : Message.randomPrompt(prompts)
    args.unshift(msg)
    this.text = Session.prototype.getText.apply(ses, args)
    return this
  }

  setNText (ses, msg, msgPlural, count) {
    this.text = ses.nGetText(msg, msgPlural, count)
    return this
  }

  composePrompt (ses, prompts) {
    const args = extractArgs(arguments, 2)
    this.text = composePrompt(ses, prompts, args)
    return this
  }

  addAttachment (attachment) {
    if (!this.attachments) {
      this.attachments = []
    }
    this.attachments.push(attachment)
    return this
  }

  setChannelData (data) {
    this.channelData = data
    return this
  }
}
