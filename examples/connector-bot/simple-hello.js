'use strict'

const restify = require('restify')
const builder = require('../../')

// Create bot and add dialogs
const restBot = new builder.ConnectorBot({
  appId: 'YourAppId',
  appSecret: 'YourAppSecret'
})

restBot.add('/', [
  function (session, args, next) {
    if (!session.userData.name) {
      session.send('Hello!')
      session.beginDialog('/profile')
    } else {
      next()
    }
  },
  function (session, results) {
    session.send('Hello %s!', session.userData.name)
  }
])

restBot.add('/profile', [
  function (session) {
    builder.Prompt.text(session, 'Hi! What is your name?')
  },
  function (session, results) {
    session.userData.name = results.response
    session.endDialog()
  }
])

// Setup Restify Bot Server
var botServer = restify.createServer()
botServer.post('/api/messages', restBot.verify(), restBot.listen())

botServer.listen(process.env.BOT_PORT || 3978, function () {
  console.log('SimpleHello ConnectorBot listening to %s', botServer.url)
})

const express = require('express')
const bodyParser = require('body-parser')

// Setup Restify API Server
var apiServer = express()

// parse application/x-www-form-urlencoded
apiServer.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
apiServer.use(bodyParser.json())

apiServer.use(function (req, res) {
  console.log(req.body)
  res.json(req.body)
})

const apiServerPort = process.env.API_PORT || 9000
apiServer.listen(apiServerPort, function () {
  console.log(`ConnectorBotAPI listening to http://[::]:${apiServerPort}`)
})
