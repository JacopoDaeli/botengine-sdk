'use strict'

export function preferButtons (session, choiceCnt, rePrompt) {
  switch (getChannelId(session)) {
    case 'facebook':
      return (choiceCnt <= 3)
    case 'telegram':
    case 'kik':
      return true
    default:
      return false
  }
}

export function getChannelId (session) {
  var account = session.message.from || session.message.to
  return account.channelId.toLowerCase()
}
