'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _dialogCollection = require('../dialog/dialog-collection');

var _dialogCollection2 = _interopRequireDefault(_dialogCollection);

var _session = require('../session');

var _session2 = _interopRequireDefault(_session);

var _memoryStorage = require('../storage/memory-storage');

var _memoryStorage2 = _interopRequireDefault(_memoryStorage);

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var _readline = require('readline');

var _readline2 = _interopRequireDefault(_readline);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var TextBot = function (_DialogCollection) {
  _inherits(TextBot, _DialogCollection);

  function TextBot(options) {
    _classCallCheck(this, TextBot);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(TextBot).call(this));

    _this.options = options || {
      maxSessionAge: 14400000,
      defaultDialogId: '/',
      minSendDelay: 1000
    };
    _this.configure(_this.options);
    return _this;
  }

  _createClass(TextBot, [{
    key: 'configure',
    value: function configure(options) {
      if (options) {
        for (var key in options) {
          if (options.hasOwnProperty(key)) {
            this.options[key] = options[key];
          }
        }
      }
    }
  }, {
    key: 'beginDialog',
    value: function beginDialog(address, dialogId, dialogArgs) {
      if (!this.hasDialog(dialogId)) {
        throw new Error('Invalid dialog passed to TextBot.beginDialog().');
      }
      var message = address || {};
      var userId = message.to ? message.to.address : 'user';
      this.dispatchMessage(userId, message, null, dialogId, dialogArgs, true);
    }
  }, {
    key: 'processMessage',
    value: function processMessage(message, callback) {
      this.emit('message', message);
      if (!message.id) {
        message.id = _nodeUuid2.default.v1();
      }
      if (!message.from) {
        message.from = {
          channelId: 'text',
          address: 'user'
        };
      }
      this.dispatchMessage(message.from.address, message, callback, this.options.defaultDialogId, this.options.defaultDialogArgs);
    }
  }, {
    key: 'listenStdin',
    value: function listenStdin() {
      var _this2 = this;

      function onMessage(message) {
        console.log(message.text);
      }

      this.on('reply', onMessage);
      this.on('send', onMessage);
      this.on('quit', function () {
        rl.close();
        process.exit();
      });

      var rl = _readline2.default.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
      });

      rl.on('line', function (line) {
        _this2.processMessage({
          text: line || ''
        });
      });
    }
  }, {
    key: 'dispatchMessage',
    value: function dispatchMessage(userId, message, callback, dialogId, dialogArgs, newSessionState) {
      var _this3 = this;

      if (newSessionState === undefined) {
        newSessionState = false;
      }
      var ses = new _session2.default({
        localizer: this.options.localizer,
        minSendDelay: this.options.minSendDelay,
        dialogs: this,
        dialogId: dialogId,
        dialogArgs: dialogArgs
      });
      ses.on('send', function (reply) {
        _this3.saveData(userId, ses.userData, ses.sessionState, function () {
          if (reply && reply.text) {
            if (callback) {
              callback(null, reply);
              callback = null;
            } else if (message.id || message.conversationId) {
              reply.from = message.to;
              reply.to = reply.replyTo || reply.to;
              reply.conversationId = message.conversationId;
              reply.language = message.language;
              _this3.emit('reply', reply);
            } else {
              _this3.emit('send', reply);
            }
          }
        });
      });
      ses.on('error', function (err) {
        if (callback) {
          callback(err, null);
          callback = null;
        } else {
          _this3.emit('error', err, message);
        }
      });
      ses.on('quit', function () {
        _this3.emit('quit', message);
      });
      this.getData(userId, function (err, userData, sessionState) {
        if (!err) {
          ses.userData = userData || {};
          ses.dispatch(newSessionState ? null : sessionState, message);
        } else {
          _this3.emit('error', err, message);
        }
      });
    }
  }, {
    key: 'getData',
    value: function getData(userId, callback) {
      var _this4 = this;

      if (!this.options.userStore) {
        this.options.userStore = new _memoryStorage2.default();
      }
      if (!this.options.sessionStore) {
        this.options.sessionStore = new _memoryStorage2.default();
      }
      var ops = 2;
      var userData = null;
      var sessionState = null;
      this.options.userStore.get(userId, function (err, data) {
        if (!err) {
          userData = data;
          if (--ops === 0) {
            callback(null, userData, sessionState);
          }
        } else {
          callback(err, null, null);
        }
      });
      this.options.sessionStore.get(userId, function (err, data) {
        if (!err) {
          if (data && new Date().getTime() - data.lastAccess < _this4.options.maxSessionAge) {
            sessionState = data;
          }
          if (--ops === 0) {
            callback(null, userData, sessionState);
          }
        } else {
          callback(err, null, null);
        }
      });
    }
  }, {
    key: 'saveData',
    value: function saveData(userId, userData, sessionState, callback) {
      var ops = 2;

      function onComplete(err) {
        if (!err) {
          if (--ops === 0) {
            callback(null);
          }
        } else {
          callback(err);
        }
      }
      this.options.userStore.save(userId, userData, onComplete);
      this.options.sessionStore.save(userId, sessionState, onComplete);
    }
  }]);

  return TextBot;
}(_dialogCollection2.default);

exports.default = TextBot;
//# sourceMappingURL=text-bot.js.map
