'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.preferButtons = preferButtons;
exports.getChannelId = getChannelId;
function preferButtons(session, choiceCnt, rePrompt) {
  switch (getChannelId(session)) {
    case 'facebook':
      return choiceCnt <= 3;
    case 'telegram':
    case 'kik':
      return true;
    default:
      return false;
  }
}

function getChannelId(session) {
  var account = session.message.from || session.message.to;
  return account.channelId.toLowerCase();
}
//# sourceMappingURL=channel.js.map
