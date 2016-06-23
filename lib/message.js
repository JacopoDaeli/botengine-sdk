'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _session = require('./session');

var _session2 = _interopRequireDefault(_session);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Message = function () {
  function Message() {
    _classCallCheck(this, Message);
  }

  _createClass(Message, [{
    key: 'setLanguage',
    value: function setLanguage(lang) {
      this.language = lang;
      return this;
    }
  }, {
    key: 'setText',
    value: function setText(ses, prompts) {
      var args = (0, _utils.extractArgs)(arguments, 2);
      var msg = typeof prompts === 'string' ? prompts : Message.randomPrompt(prompts);
      args.unshift(msg);
      this.text = _session2.default.prototype.getText.apply(ses, args);
      return this;
    }
  }, {
    key: 'setNText',
    value: function setNText(ses, msg, msgPlural, count) {
      this.text = ses.nGetText(msg, msgPlural, count);
      return this;
    }
  }, {
    key: 'composePrompt',
    value: function composePrompt(ses, prompts) {
      var args = (0, _utils.extractArgs)(arguments, 2);
      this.text = (0, _utils.composePrompt)(ses, prompts, args);
      return this;
    }
  }, {
    key: 'addAttachment',
    value: function addAttachment(attachment) {
      if (!this.attachments) {
        this.attachments = [];
      }
      this.attachments.push(attachment);
      return this;
    }
  }, {
    key: 'setChannelData',
    value: function setChannelData(data) {
      this.channelData = data;
      return this;
    }
  }]);

  return Message;
}();

exports.default = Message;
//# sourceMappingURL=message.js.map
