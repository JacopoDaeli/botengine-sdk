'use strict'

import DialogCollection from '../dialog/dialog-collection'
import Session from '../session'
import MemoryStorage from '../storage/memory-storage'
import uuid from 'node-uuid'
import readline from 'readline'

class TextBot extends DialogCollection {
  constructor (options) {
    super()
    this.options = options || {
      maxSessionAge: 14400000,
      defaultDialogId: '/',
      minSendDelay: 10
    }
    this.configure(this.options)
  }

  configure (options) {
    if (options) {
      for (var key in options) {
        if (options.hasOwnProperty(key)) {
          this.options[key] = options[key]
        }
      }
    }
  }

  beginDialog (address, dialogId, dialogArgs) {
    if (!this.hasDialog(dialogId)) {
      throw new Error('Invalid dialog passed to TextBot.beginDialog().')
    }
    const message = address || {}
    const userId = message.to ? message.to.address : 'user'
    this.dispatchMessage(userId, message, null, dialogId, dialogArgs, true)
  }

  processMessage (message, callback) {
    this.emit('message', message)
    if (!message.id) {
      message.id = uuid.v1()
    }
    if (!message.from) {
      message.from = {
        channelId: 'text',
        address: 'user'
      }
    }
    this.dispatchMessage(message.from.address, message, callback, this.options.defaultDialogId, this.options.defaultDialogArgs)
  }

  listenStdin () {
    function onMessage (message) {
      console.log(message.text)
    }

    this.on('reply', onMessage)
    this.on('send', onMessage)
    this.on('quit', () => {
      rl.close()
      process.exit()
    })

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    })

    rl.on('line', (line) => {
      this.processMessage({
        text: line || ''
      })
    })
  }

  dispatchMessage (userId, message, callback, dialogId, dialogArgs, newSessionState) {
    if (newSessionState === undefined) {
      newSessionState = false
    }
    const ses = new Session({
      localizer: this.options.localizer,
      minSendDelay: this.options.minSendDelay,
      dialogs: this,
      dialogId: dialogId,
      dialogArgs: dialogArgs
    })
    ses.on('send', (reply) => {
      this.saveData(userId, ses.userData, ses.sessionState, () => {
        if (reply && reply.text) {
          if (callback) {
            callback(null, reply)
            callback = null
          } else if (message.id || message.conversationId) {
            reply.from = message.to
            reply.to = reply.replyTo || reply.to
            reply.conversationId = message.conversationId
            reply.language = message.language
            this.emit('reply', reply)
          } else {
            this.emit('send', reply)
          }
        }
      })
    })
    ses.on('error', (err) => {
      if (callback) {
        callback(err, null)
        callback = null
      } else {
        this.emit('error', err, message)
      }
    })
    ses.on('quit', () => {
      this.emit('quit', message)
    })
    this.getData(userId, (err, userData, sessionState) => {
      if (!err) {
        ses.userData = userData || {}
        ses.dispatch(newSessionState ? null : sessionState, message)
      } else {
        this.emit('error', err, message)
      }
    })
  }

  getData (userId, callback) {
    if (!this.options.userStore) {
      this.options.userStore = new MemoryStorage()
    }
    if (!this.options.sessionStore) {
      this.options.sessionStore = new MemoryStorage()
    }
    let ops = 2
    let userData = null
    let sessionState = null
    this.options.userStore.get(userId, (err, data) => {
      if (!err) {
        userData = data
        if (--ops === 0) {
          callback(null, userData, sessionState)
        }
      } else {
        callback(err, null, null)
      }
    })
    this.options.sessionStore.get(userId, (err, data) => {
      if (!err) {
        if (data && (new Date().getTime() - data.lastAccess) < this.options.maxSessionAge) {
          sessionState = data
        }
        if (--ops === 0) {
          callback(null, userData, sessionState)
        }
      } else {
        callback(err, null, null)
      }
    })
  }

  saveData (userId, userData, sessionState, callback) {
    let ops = 2

    function onComplete (err) {
      if (!err) {
        if (--ops === 0) {
          callback(null)
        }
      } else {
        callback(err)
      }
    }
    this.options.userStore.save(userId, userData, onComplete)
    this.options.sessionStore.save(userId, sessionState, onComplete)
  }
}

export default TextBot
