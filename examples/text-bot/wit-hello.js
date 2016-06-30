'use strict'

var builder = require('../../')

// Create WIT Dialog and add it as the root '/' dialog for our Bot
const witDialogParams = {
  serviceUri: 'https://api.wit.ai/message?v=20160630&q=',
  bearerToken: '6XQCA36QGOX4HGBIPRNA6C5ZODPB3HQS'
}
const dialog = new builder.WitDialog(witDialogParams)
const textBot = new builder.TextBot()
textBot.add('/', dialog)

// Add intent handlers
dialog.on('say_hello', [
  function (session, args, next) {
    // Resolve and store any entities passed from WIT.
    const personName = builder.entityRecognizer.findEntity(args.entities, 'person_name')

    const person = session.dialogData.person = {
      name: personName ? personName.entity : null
    }

    // Prompt for person name
    if (!person.name) {
      builder.Prompt.text(session, 'What\'s your name?')
    } else {
      next()
    }
  },
  function (session, results) {
    const person = session.dialogData.person
    if (results.response) {
      person.name = results.response
    }

    if (person.name) {
      session.send('Hello %s', person.name)
    } else {
      session.send('Hello stranger!')
    }
  }
])

dialog.onDefault(builder.dialogAction.send('I\'m sorry I didn\'t understand. I can only say "Hello".'))

textBot.listenStdin()
