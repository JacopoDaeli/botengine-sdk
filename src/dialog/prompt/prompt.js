'use strict'

import promptType from './prompt-type'
import listStyle from './list-style'
import SimplePromptRecognizer from './simple-prompt-recognizer'
import Dialog from '../dialog'
import entityRecognizer from '../entity-recognizer'
import Message from '../../message'
import { preferButtons } from '../../channel'
import { randomPrompt, beginPrompt } from '../../utils'

class Prompt extends Dialog {
  begin (session, _args) {
    const args = _args || {}
    args.maxRetries = args.maxRetries || 1
    for (let key in args) {
      if (args.hasOwnProperty(key)) {
        session.dialogData[key] = args[key]
      }
    }
    this.sendPrompt(session, args)
  }

  replyReceived (session) {
    const args = session.dialogData

    Prompt.options.recognizer.recognize({
      promptType: args.promptType,
      utterance: session.message.text,
      language: session.message.language,
      attachments: session.message.attachments,
      enumValues: args.enumValues,
      refDate: args.refDate,
      compareConfidence (language, utterance, score, callback) {
        session.compareConfidence(language, utterance, score, callback)
      }
    }, (result) => {
      if (!result.handled) {
        if (result.error || result.resumed === Dialog.resumeReason.completed ||
          result.resumed === Dialog.resumeReason.canceled || args.maxRetries === 0) {
          result.promptType = args.promptType
          session.endDialog(result)
        } else {
          args.maxRetries--
          this.sendPrompt(session, args, true)
        }
      }
    })
  }

  sendPrompt (session, args, _retry) {
    let retry = !!_retry
    if (retry && typeof args.retryPrompt === 'object' && !Array.isArray(args.retryPrompt)) {
      session.send(args.retryPrompt)
    } else if (typeof args.prompt === 'object' && !Array.isArray(args.prompt)) {
      session.send(args.prompt)
    } else {
      let style = listStyle.none
      if (args.promptType === promptType.choice || args.promptType === promptType.confirm) {
        style = args.listStyle
        if (style === listStyle.auto) {
          if (preferButtons(session, args.enumValues.length, retry)) {
            style = listStyle.button
          } else if (!retry) {
            style = args.enumValues.length < 3 ? listStyle.inline : listStyle.list
          } else {
            style = listStyle.none
          }
        }
      }
      let prompt = null
      if (retry) {
        if (args.retryPrompt) {
          prompt = randomPrompt(args.retryPrompt)
        } else {
          let type = promptType[args.promptType]
          prompt = randomPrompt(Prompt.defaultRetryPrompt[type])
        }
      } else {
        prompt = randomPrompt(args.prompt)
      }
      let connector = ''
      let list = null
      const msg = new Message()
      switch (style) {
        case listStyle.button:
          let a = {
            actions: []
          }
          for (let i = 0; i < session.dialogData.enumValues.length; i++) {
            const action = session.dialogData.enumValues[i]
            a.actions.push({
              title: action,
              message: action
            })
          }
          msg.setText(session, prompt)
            .addAttachment(a)
          break
        case listStyle.inline:
          list = ' '
          args.enumValues.forEach((value, index) => {
            list += `${connector}${(index + 1)}. ${value}`
            if (index === args.enumValues.length - 2) {
              connector = index === 0 ? ' or ' : ', or '
            } else {
              connector = ', '
            }
          })
          msg.setText(session, prompt + '%s', list)
          break
        case listStyle.list:
          list = '\n   '
          args.enumValues.forEach((value, index) => {
            list += `${connector}${(index + 1)}. ${value}`
            connector = '\n   '
          })
          msg.setText(session, prompt + '%s', list)
          break
        default:
          msg.setText(session, prompt)
          break
      }
      session.send(msg)
    }
  }
}

Prompt.configure = function (options) {
  if (options) {
    for (let key in options) {
      if (options.hasOwnProperty(key)) {
        Prompt.options[key] = options[key]
      }
    }
  }
}

Prompt.text = function (session, prompt) {
  beginPrompt(session, {
    promptType: promptType.text,
    prompt
  })
}

Prompt.number = function (session, prompt, options) {
  const args = options || {}
  args.promptType = promptType.number
  args.prompt = prompt
  beginPrompt(session, args)
}

Prompt.confirm = function (session, prompt, options) {
  const args = options || {}
  args.promptType = promptType.confirm
  args.prompt = prompt
  args.enumValues = ['yes', 'no']
  args.listStyle = args.hasOwnProperty('listStyle') ? args.listStyle : listStyle.auto
  beginPrompt(session, args)
}

Prompt.choice = function (session, prompt, choices, options) {
  const args = options || {}
  args.promptType = promptType.choice
  args.prompt = prompt
  args.listStyle = args.hasOwnProperty('listStyle') ? args.listStyle : listStyle.auto
  args.enumValues = entityRecognizer.expandChoices(choices)
  beginPrompt(session, args)
}

Prompt.time = function (session, prompt, options) {
  const args = options || {}
  args.promptType = promptType.time
  args.prompt = prompt
  beginPrompt(session, args)
}

Prompt.attachment = function (session, prompt, options) {
  const args = options || {}
  args.promptType = promptType.attachment
  args.prompt = prompt
  beginPrompt(session, args)
}

Prompt.options = {
  recognizer: new SimplePromptRecognizer()
}

Prompt.defaultRetryPrompt = {
  text: 'I didn\'t understand. Please try again.',
  number: 'I didn\'t recognize that as a number. Please enter a number.',
  confirm: 'I didn\'t understand. Please answer \'yes\' or \'no\'.',
  choice: 'I didn\'t understand. Please choose an option from the list.',
  time: 'I didn\'t recognize the time you entered. Please try again.',
  attachment: 'I didn\'t receive a file. Please try again.'
}

export default Prompt
