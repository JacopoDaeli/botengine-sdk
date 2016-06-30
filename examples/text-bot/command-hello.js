'use strict'

var builder = require('../../')

var helloBot = new builder.TextBot()

helloBot.add('/', new builder.CommandDialog()
  .matches('^set name', builder.dialogAction.beginDialog('/profile'))
  .matches('^quit', builder.dialogAction.endDialog())
  .onDefault([
    function (session, args, next) {
      if (!session.userData.name) {
        session.beginDialog('/profile')
      } else {
        next()
      }
    },
    function (session, results) {
      session.send('Hello %s!', session.userData.name)
    }
  ]))

helloBot.add('/profile', [
  function (session) {
    if (session.userData.name) {
      builder.Prompt.text(session, 'What would you like to change it to?')
    } else {
      builder.Prompt.text(session, 'Hi! What is your name?')
    }
  },
  function (session, results) {
    session.userData.name = results.response
    session.endDialog()
  }
])

helloBot.listenStdin()
