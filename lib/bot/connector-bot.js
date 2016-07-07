'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _nodeUuid = require('node-uuid');

var _nodeUuid2 = _interopRequireDefault(_nodeUuid);

var _dialogCollection = require('../dialog/dialog-collection');

var _dialogCollection2 = _interopRequireDefault(_dialogCollection);

var _restSession = require('../rest-session');

var _restSession2 = _interopRequireDefault(_restSession);

var _constants = require('../constants');

var _constants2 = _interopRequireDefault(_constants);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ConnectorBot = function (_DialogCollection) {
  _inherits(ConnectorBot, _DialogCollection);

  function ConnectorBot(options) {
    _classCallCheck(this, ConnectorBot);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(ConnectorBot).call(this));

    _this.options = {
      endpoint: process.env.ENDPOINT,
      appId: process.env.APP_ID || '',
      appSecret: process.env.APP_SECRET || '',
      defaultDialogId: '/',
      minSendDelay: 100
    };
    _this.configure(_this.options);
    return _this;
  }

  _createClass(ConnectorBot, [{
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
    key: 'verify',
    value: function verify(options) {
      var _this2 = this;

      this.configure(options);
      return function (req, res, next) {
        var authorized = false;
        var isSecure = req.headers['x-forwarded-proto'] === 'https' || req.headers['x-arr-ssl'];
        if (isSecure && _this2.options.appId && _this2.options.appSecret) {
          if (req.headers.hasOwnProperty('authorization')) {
            var tmp = req.headers['authorization'].split(' ');
            var buf = new Buffer(tmp[1], 'base64');
            var cred = buf.toString().split(':');
            if (cred[0] === _this2.options.appId && cred[1] === _this2.options.appSecret) {
              authorized = true;
            }
          }
        } else {
          authorized = true;
        }
        if (authorized) {
          next();
        } else {
          res.send(401);
        }
      };
    }
  }, {
    key: 'listen',
    value: function listen(dialogId, dialogArgs) {
      var _this3 = this;

      return function (req, res) {
        if (req.body) {
          console.log('req.body exists ...');
          console.log('Message type: ' + req.body.type);
          _this3.dispatchMessage(null, req.body, { dialogId: dialogId, dialogArgs: dialogArgs }, res);
        } else {
          (function () {
            var requestData = '';
            req.on('data', function (chunk) {
              return requestData += chunk;
            });
            req.on('end', function () {
              try {
                var msg = JSON.parse(requestData);
                console.log(msg);
                console.log('Message type: ' + msg.type);
                console.log(typeof msg === 'undefined' ? 'undefined' : _typeof(msg));
                _this3.dispatchMessage(null, msg, { dialogId: dialogId, dialogArgs: dialogArgs }, res);
              } catch (e) {
                var error = e instanceof Error ? e : new Error(e.toString());
                if (!res) return _this3.emit('error', error);
                return res.send(400);
              }
            });
          })();
        }
      };
    }
  }, {
    key: 'beginDialog',
    value: function beginDialog(address, dialogId, dialogArgs) {
      var message = address;
      message.type = 'Message';
      if (!message.from) {
        message.from = this.options.defaultFrom;
      }
      if (!message.to || !message.from) {
        throw new Error('Invalid address passed to ConnectorBot.beginDialog()');
      }
      if (!this.hasDialog(dialogId)) {
        throw new Error('Invalid dialog passed to ConnectorBot.beginDialog()');
      }
      this.dispatchMessage(message.to.id, message, { dialogId: dialogId, dialogArgs: dialogArgs });
    }
  }, {
    key: 'dispatchMessage',
    value: function dispatchMessage(userId, message, options, res) {
      var _this4 = this;

      try {
        var _ret2 = function () {
          if (!message || !message.type) {
            if (!res) return {
                v: _this4.emit('error', new Error('Invalid message'))
              };
            return {
              v: res.send(400)
            };
          }
          if (!userId) {
            if (message.from && message.from.id) {
              userId = message.from.id;
            } else {
              if (!res) return {
                  v: _this4.emit('error', new Error('Invalid message'))
                };
              return {
                v: res.send(400)
              };
            }
          }

          var sessionId = null;

          if (message.botConversationData && message.botConversationData[_constants2.default.Data.SessionId]) {
            sessionId = message.botConversationData[_constants2.default.Data.SessionId];
          } else {
            sessionId = _nodeUuid2.default.v1();
            message.botConversationData = message.botConversationData || {};
            message.botConversationData[_constants2.default.Data.SessionId] = sessionId;
          }

          _this4.emit(message.type, message);

          if (message.type === 'Message') {
            (function () {
              var ses = new _restSession2.default({
                localizer: _this4.options.localizer,
                minSendDelay: _this4.options.minSendDelay,
                dialogs: _this4,
                dialogId: options.dialogId || _this4.options.defaultDialogId,
                dialogArgs: options.dialogArgs || _this4.options.defaultDialogArgs
              });
              ses.on('send', function (_reply) {
                var reply = _reply || {};
                reply.botConversationData = message.botConversationData;
                if (reply.text && !reply.language && message.language) {
                  reply.language = message.language;
                }

                var data = {
                  userData: ses.userData,
                  conversationData: ses.conversationData,
                  perUserConversationData: ses.perUserInConversationData
                };

                data.perUserConversationData[_constants2.default.Data.SessionState] = ses.sessionState;

                _this4.saveData(userId, sessionId, data, reply, function (err) {
                  if (err) return _this4.emit('error', err);

                  var endpoint = null;

                  if (ses.message.to.channelId === 'emulator') {
                    endpoint = _this4.options.endpoint || 'http://localhost:9000';
                  } else {
                    endpoint = _this4.options.endpoint || 'https://api.ourapidomain.com';
                  }

                  if (res) {
                    _this4.emit('reply', reply);
                    res.send(200, reply);
                    res = null;
                  } else if (ses.message.conversationId) {
                    reply.from = ses.message.to;
                    reply.to = ses.message.replyTo ? ses.message.replyTo : ses.message.from;
                    reply.replyToMessageId = ses.message.id;
                    reply.conversationId = ses.message.conversationId;
                    reply.channelConversationId = ses.message.channelConversationId;
                    reply.channelMessageId = ses.message.channelMessageId;
                    reply.participants = ses.message.participants;
                    reply.totalParticipants = ses.message.totalParticipants;

                    if (!reply.language && ses.message.language) {
                      reply.language = ses.message.language;
                    }

                    _this4.emit('reply', reply);

                    (0, _utils.post)(_this4.options, endpoint, '/bot/v1.0/messages', reply, function (err, response) {
                      if (err) {
                        console.error(err);
                        _this4.emit('error', err);
                      } else if (response.statusCode >= 400) {
                        console.error(response.statusMessage);
                      }
                    });
                  } else {
                    reply.from = ses.message.from;
                    reply.to = ses.message.to;
                    _this4.emit('send', reply);
                    (0, _utils.post)(_this4.options, endpoint, '/bot/v1.0/messages', reply, function (err, response) {
                      if (err) {
                        console.error(err);
                        _this4.emit('error', err);
                      } else if (response.statusCode >= 400) {
                        console.error(response.statusMessage);
                      }
                    });
                  }
                });
              });
              ses.on('error', function (err) {
                console.error(err, ses.message);
                if (!res) return _this4.emit('error', err, ses.message);
                return res.send(500);
              });

              ses.on('quit', function () {
                return _this4.emit('quit', ses.message);
              });

              _this4.getData(userId, sessionId, message, function (err, data) {
                if (!err) {
                  var sessionState = null;
                  ses.userData = data.userData || {};
                  ses.conversationData = data.conversationData || {};
                  ses.perUserInConversationData = data.perUserConversationData || {};
                  if (ses.perUserInConversationData.hasOwnProperty(_constants2.default.Data.SessionState)) {
                    sessionState = ses.perUserInConversationData[_constants2.default.Data.SessionState];
                    delete ses.perUserInConversationData[_constants2.default.Data.SessionState];
                  }
                  if (options.replyToDialogId) {
                    if (sessionState && sessionState.callstack[sessionState.callstack.length - 1].id === options.replyToDialogId) {
                      ses.dispatch(sessionState, message);
                    }
                  } else {
                    ses.dispatch(sessionState, message);
                  }
                } else {
                  console.error(err, message);
                  _this4.emit('error', err, message);
                }
              });
            })();
          } else if (res) {
            var msg = null;
            switch (message.type) {
              case 'BotAddedToConversation':
                msg = _this4.options.groupWelcomeMessage;
                break;
              case 'UserAddedToConversation':
                msg = _this4.options.userWelcomeMessage;
                break;
              case 'EndOfConversation':
                msg = _this4.options.goodbyeMessage;
                break;
            }
            res.send(msg ? { type: message.type, text: msg } : {});
          }
        }();

        if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
      } catch (e) {
        var error = e instanceof Error ? e : new Error(e.toString());
        if (!res) return this.emit('error', error);
        return res.send(500);
      }
    }
  }, {
    key: 'getData',
    value: function getData(userId, sessionId, msg, callback) {
      var botPath = '/' + this.options.appId;
      var userPath = botPath + '/users/' + userId;
      var convoPath = botPath + '/conversations/' + sessionId;
      var perUserConvoPath = botPath + '/conversations/' + sessionId + '/users/' + userId;

      var ops = 3;
      var data = {};

      function load(id, field, store, botData) {
        data[field] = botData;
        if (store) {
          store.get(id, function (err, item) {
            if (callback) {
              if (!err) {
                data[field] = item;
                if (--ops === 0) {
                  callback(null, data);
                }
              } else {
                callback(err, null);
                callback = null;
              }
            }
          });
        } else if (callback && --ops === 0) {
          callback(null, data);
        }
      }

      load(userPath, 'userData', this.options.userStore, msg.botUserData);
      load(convoPath, 'conversationData', this.options.conversationStore, msg.botConversationData);
      load(perUserConvoPath, 'perUserConversationData', this.options.perUserInConversationStore, msg.botPerUserInConversationData);
    }
  }, {
    key: 'saveData',
    value: function saveData(userId, sessionId, data, msg, callback) {
      var botPath = '/' + this.options.appId;
      var userPath = botPath + '/users/' + userId;
      var convoPath = botPath + '/conversations/' + sessionId;
      var perUserConvoPath = botPath + '/conversations/' + sessionId + '/users/' + userId;

      var ops = 3;

      function save(id, field, store, botData) {
        if (store) {
          store.save(id, botData, function (err) {
            if (callback) {
              if (!err && --ops === 0) {
                callback(null);
              } else {
                callback(err);
                callback = null;
              }
            }
          });
        } else {
          msg[field] = botData;
          if (callback && --ops === 0) {
            callback(null);
          }
        }
      }

      save(userPath, 'botUserData', this.options.userStore, data.userData);
      save(convoPath, 'botConversationData', this.options.conversationStore, data.conversationData);
      save(perUserConvoPath, 'botPerUserInConversationData', this.options.perUserInConversationStore, data.perUserConversationData);
    }
  }]);

  return ConnectorBot;
}(_dialogCollection2.default);

exports.default = ConnectorBot;
//# sourceMappingURL=connector-bot.js.map
