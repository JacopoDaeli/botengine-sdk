'use strict'

var builder = require('../../')

var helloBot = new builder.TextBot()

helloBot.add('/', [
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
])

helloBot.add('/profile', [
  function (session) {
    builder.Prompt.text(session, 'Hi! What is your name?')
  },
  function (session, results) {
    session.userData.name = results.response
    session.endDialog()
  }
])

helloBot.listenStdin()
