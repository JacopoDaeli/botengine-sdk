'use strict'

import uuid from 'node-uuid'
import DialogCollection from '../dialog/dialog-collection'
import RESTSession from '../rest-session'
import consts from '../constants'
import { post } from '../utils'

class ConnectorBot extends DialogCollection {
  constructor (options) {
    super()
    this.options = {
      endpoint: process.env.ENDPOINT,
      appId: process.env.APP_ID || '',
      appSecret: process.env.APP_SECRET || '',
      defaultDialogId: '/',
      minSendDelay: 100
    }
    this.configure(this.options)
  }

  configure (options) {
    if (options) {
      for (let key in options) {
        if (options.hasOwnProperty(key)) {
          this.options[key] = options[key]
        }
      }
    }
  }

  verify (options) {
    this.configure(options)
    return (req, res, next) => {
      let authorized = false
      const isSecure = req.headers['x-forwarded-proto'] === 'https' || req.headers['x-arr-ssl']
      if (isSecure && this.options.appId && this.options.appSecret) {
        if (req.headers.hasOwnProperty('authorization')) {
          const tmp = req.headers['authorization'].split(' ')
          const buf = new Buffer(tmp[1], 'base64')
          const cred = buf.toString().split(':')
          if (cred[0] === this.options.appId && cred[1] === this.options.appSecret) {
            authorized = true
          }
        }
      } else {
        authorized = true
      }
      if (authorized) {
        next()
      } else {
        res.send(401)
      }
    }
  }

  listen (dialogId, dialogArgs) {
    return (req, res) => {
      if (req.body) {
        console.log('req.body exists ...')
        console.log('Message type: ' + req.body.type)
        this.dispatchMessage(null, req.body, { dialogId, dialogArgs }, res)
      } else {
        let requestData = ''
        req.on('data', (chunk) => requestData += chunk)
        req.on('end', () => {
          try {
            console.log('******')
            console.log(requestData)
            console.log('******')
            const msg = JSON.parse(requestData)
            console.log(msg)
            console.log('Message type: ' + msg.type)
            this.dispatchMessage(null, msg, { dialogId, dialogArgs }, res)
          } catch (e) {
            console.error(e.stack)
            this.emit('error', new Error('Invalid message'))
            res.send(400)
          }
        })
      }
    }
  }

  beginDialog (address, dialogId, dialogArgs) {
    const message = address
    message.type = 'Message'
    if (!message.from) {
      message.from = this.options.defaultFrom
    }
    if (!message.to || !message.from) {
      throw new Error('Invalid address passed to ConnectorBot.beginDialog()')
    }
    if (!this.hasDialog(dialogId)) {
      throw new Error('Invalid dialog passed to ConnectorBot.beginDialog()')
    }
    this.dispatchMessage(message.to.id, message, { dialogId, dialogArgs })
  }

  dispatchMessage (userId, message, options, res) {
    try {
      if (!message || !message.type) {
        this.emit('error', new Error('Invalid message'))
        return res ? res.send(400) : null
      }
      if (!userId) {
        if (message.from && message.from.id) {
          userId = message.from.id
        } else {
          this.emit('error', new Error('Invalid message'))
          return res ? res.send(400) : null
        }
      }

      let sessionId = null

      if (message.botConversationData && message.botConversationData[consts.Data.SessionId]) {
        sessionId = message.botConversationData[consts.Data.SessionId]
      } else {
        sessionId = uuid.v1()
        message.botConversationData = message.botConversationData || {}
        message.botConversationData[consts.Data.SessionId] = sessionId
      }

      this.emit(message.type, message)

      if (message.type === 'Message') {
        const ses = new RESTSession({
          localizer: this.options.localizer,
          minSendDelay: this.options.minSendDelay,
          dialogs: this,
          dialogId: options.dialogId || this.options.defaultDialogId,
          dialogArgs: options.dialogArgs || this.options.defaultDialogArgs
        })
        ses.on('send', (_reply) => {
          let reply = _reply || {}
          reply.botConversationData = message.botConversationData
          if (reply.text && !reply.language && message.language) {
            reply.language = message.language
          }

          const data = {
            userData: ses.userData,
            conversationData: ses.conversationData,
            perUserConversationData: ses.perUserInConversationData
          }

          data.perUserConversationData[consts.Data.SessionState] = ses.sessionState

          this.saveData(userId, sessionId, data, reply, (err) => {
            if (err) return this.emit('error', err)

            let endpoint = null

            if (ses.message.to.channelId === 'emulator') {
              endpoint = this.options.endpoint || 'http://localhost:9000'
            } else {
              endpoint = this.options.endpoint || 'https://api.ourapidomain.com'
            }

            if (res) {
              this.emit('reply', reply)
              res.send(200, reply)
              res = null
            } else if (ses.message.conversationId) {
              reply.from = ses.message.to
              reply.to = ses.message.replyTo ? ses.message.replyTo : ses.message.from
              reply.replyToMessageId = ses.message.id
              reply.conversationId = ses.message.conversationId
              reply.channelConversationId = ses.message.channelConversationId
              reply.channelMessageId = ses.message.channelMessageId
              reply.participants = ses.message.participants
              reply.totalParticipants = ses.message.totalParticipants

              if (!reply.language && ses.message.language) {
                reply.language = ses.message.language
              }

              this.emit('reply', reply)

              post(this.options, endpoint, '/bot/v1.0/messages', reply, (err, response) => {
                if (err) {
                  console.error(err)
                  this.emit('error', err)
                } else if (response.statusCode >= 400) {
                  console.error(response.statusMessage)
                }
              })
            } else {
              reply.from = ses.message.from
              reply.to = ses.message.to
              this.emit('send', reply)
              post(this.options, endpoint, '/bot/v1.0/messages', reply, (err, response) => {
                if (err) {
                  console.error(err)
                  this.emit('error', err)
                } else if (response.statusCode >= 400) {
                  console.error(response.statusMessage)
                }
              })
            }
          })
        })
        ses.on('error', (err) => {
          console.error(err, ses.message)
          this.emit('error', err, ses.message)
          return res ? res.send(500) : null
        })

        ses.on('quit', () => this.emit('quit', ses.message))

        this.getData(userId, sessionId, message, (err, data) => {
          if (!err) {
            let sessionState = null
            ses.userData = data.userData || {}
            ses.conversationData = data.conversationData || {}
            ses.perUserInConversationData = data.perUserConversationData || {}
            if (ses.perUserInConversationData.hasOwnProperty(consts.Data.SessionState)) {
              sessionState = ses.perUserInConversationData[consts.Data.SessionState]
              delete ses.perUserInConversationData[consts.Data.SessionState]
            }
            if (options.replyToDialogId) {
              if (sessionState && sessionState.callstack[sessionState.callstack.length - 1].id === options.replyToDialogId) {
                ses.dispatch(sessionState, message)
              }
            } else {
              ses.dispatch(sessionState, message)
            }
          } else {
            console.error(err, message)
            this.emit('error', err, message)
          }
        })
      } else if (res) {
        let msg = null
        switch (message.type) {
          case 'BotAddedToConversation':
            msg = this.options.groupWelcomeMessage
            break
          case 'UserAddedToConversation':
            msg = this.options.userWelcomeMessage
            break
          case 'EndOfConversation':
            msg = this.options.goodbyeMessage
            break
        }
        res.send(msg ? { type: message.type, text: msg } : {})
      }
    } catch (e) {
      console.error(e)
      const error = e instanceof Error ? e : new Error(e.toString())
      this.emit('error', error)
      return res ? res.send(500) : null
    }
  }

  getData (userId, sessionId, msg, callback) {
    const botPath = `/${this.options.appId}`
    const userPath = `${botPath}/users/${userId}`
    const convoPath = `${botPath}/conversations/${sessionId}`
    const perUserConvoPath = `${botPath}/conversations/${sessionId}/users/${userId}`

    let ops = 3
    const data = {}

    function load (id, field, store, botData) {
      data[field] = botData
      if (store) {
        store.get(id, (err, item) => {
          if (callback) {
            if (!err) {
              data[field] = item
              if (--ops === 0) {
                callback(null, data)
              }
            } else {
              callback(err, null)
              callback = null
            }
          }
        })
      } else if (callback && --ops === 0) {
        callback(null, data)
      }
    }

    load(userPath, 'userData', this.options.userStore, msg.botUserData)
    load(convoPath, 'conversationData', this.options.conversationStore, msg.botConversationData)
    load(perUserConvoPath, 'perUserConversationData', this.options.perUserInConversationStore, msg.botPerUserInConversationData)
  }

  saveData (userId, sessionId, data, msg, callback) {
    const botPath = `/${this.options.appId}`
    const userPath = `${botPath}/users/${userId}`
    const convoPath = `${botPath}/conversations/${sessionId}`
    const perUserConvoPath = `${botPath}/conversations/${sessionId}/users/${userId}`

    let ops = 3

    function save (id, field, store, botData) {
      if (store) {
        store.save(id, botData, (err) => {
          if (callback) {
            if (!err && --ops === 0) {
              callback(null)
            } else {
              callback(err)
              callback = null
            }
          }
        })
      } else {
        msg[field] = botData
        if (callback && --ops === 0) {
          callback(null)
        }
      }
    }

    save(userPath, 'botUserData', this.options.userStore, data.userData)
    save(convoPath, 'botConversationData', this.options.conversationStore, data.conversationData)
    save(perUserConvoPath, 'botPerUserInConversationData', this.options.perUserInConversationStore, data.perUserConversationData)
  }
}

export default ConnectorBot
