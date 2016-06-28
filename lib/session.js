'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('events');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _sprintfJs = require('sprintf-js');

var _sprintfJs2 = _interopRequireDefault(_sprintfJs);

var _dialog = require('./dialog/dialog');

var _dialog2 = _interopRequireDefault(_dialog);

var _sessionConfidenceComparator = require('session-confidence-comparator');

var _sessionConfidenceComparator2 = _interopRequireDefault(_sessionConfidenceComparator);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Session = function (_EventEmitter) {
  _inherits(Session, _EventEmitter);

  function Session(opts) {
    _classCallCheck(this, Session);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Session).call(this));

    _this.options = opts;
    _this.msgSent = false;
    _this._isReset = false;
    _this.lastSendTime = new Date().getTime();
    _this.sendQueue = [];
    _this.dialogs = opts.dialogs;

    if (typeof _this.options.minSendDelay !== 'number') {
      _this.options.minSendDelay = 1000;
    }
    return _this;
  }

  _createClass(Session, [{
    key: 'dispatch',
    value: function dispatch(sessionState, message) {
      var _this2 = this;

      var index = 0;
      var handlers = null;
      var next = function next() {
        var handler = index < handlers.length ? handlers[index] : null;
        if (handler) {
          index++;
          handler(_this2, next);
        } else {
          _this2.routeMessage();
        }
      };
      this.sessionState = sessionState || {
        callstack: [],
        lastAccess: 0
      };
      this.sessionState.lastAccess = new Date().getTime();
      this.message = message || {
        text: ''
      };
      if (!this.message.type) {
        this.message.type = 'Message';
      }
      handlers = this.dialogs.getMiddleware();
      next();
      return this;
    }
  }, {
    key: 'error',
    value: function error(_err) {
      var err = _err instanceof Error ? _err : new Error(_err.toString());
      console.error('Session Error: ' + err.message);
      this.emit('error', err);
      return this;
    }
  }, {
    key: 'getText',
    value: function getText(msgId) {
      var args = (0, _utils.extractArgs)(arguments, 1);
      return this.vGetText(msgId, args);
    }
  }, {
    key: 'nGetText',
    value: function nGetText(msgId, msgIdPlural, count) {
      var tmpl = null;
      if (this.options.localizer && this.message) {
        tmpl = this.options.localizer.ngettext(this.message.language || '', msgId, msgIdPlural, count);
      } else if (count === 1) {
        tmpl = msgId;
      } else {
        tmpl = msgIdPlural;
      }
      return _sprintfJs2.default.sprintf(tmpl, count);
    }
  }, {
    key: 'send',
    value: function send(msg) {
      var args = (0, _utils.extractArgs)(arguments, 1);
      var ss = this.sessionState;
      if (ss.callstack.length > 0) {
        ss.callstack[ss.callstack.length - 1].state = this.dialogData || {};
      }
      var message = typeof msg === 'string' ? this.createMessage(msg, args) : msg;
      this.delayedEmit('send', message);
      return this;
    }
  }, {
    key: 'getMessageReceived',
    value: function getMessageReceived() {
      return this.message.channelData;
    }
  }, {
    key: 'sendMessage',
    value: function sendMessage(msg) {
      return this.send({ channelData: msg });
    }
  }, {
    key: 'messageSent',
    value: function messageSent() {
      return this.messageSent;
    }
  }, {
    key: 'beginDialog',
    value: function beginDialog(id, args) {
      var dialog = this.dialogs.getDialog(id);
      if (!dialog) {
        throw new Error('Dialog[' + id + '] not found.');
      }
      var ss = this.sessionState;
      if (ss.callstack.length > 0) {
        ss.callstack[ss.callstack.length - 1].state = this.dialogData || {};
      }
      var cur = {
        id: id,
        state: {}
      };
      ss.callstack.push(cur);
      this.dialogData = cur.state;
      dialog.begin(this, args);
      return this;
    }
  }, {
    key: 'replaceDialog',
    value: function replaceDialog(id, args) {
      var dialog = this.dialogs.getDialog(id);
      if (!dialog) {
        throw new Error('Dialog[' + id + '] not found.');
      }
      var ss = this.sessionState;
      var cur = {
        id: id,
        state: {}
      };
      ss.callstack.pop();
      ss.callstack.push(cur);
      this.dialogData = cur.state;
      dialog.begin(this, args);
      return this;
    }
  }, {
    key: 'endDialog',
    value: function endDialog(result) {
      var args = (0, _utils.extractArgs)(arguments, 1);
      var ss = this.sessionState;
      if (!ss || !ss.callstack || ss.callstack.length === 0) {
        console.error('ERROR: Too many calls to session.endDialog().');
        return this;
      }
      var m = null;
      var r = {};
      if (result) {
        if (typeof result === 'string') {
          m = this.createMessage(result, args);
        } else if (result.hasOwnProperty('text') || result.hasOwnProperty('attachments') || result.hasOwnProperty('channelData')) {
          m = result;
        } else {
          r = result;
        }
      }
      if (!r.hasOwnProperty('resumed')) {
        r.resumed = _dialog2.default.ResumeReason.completed;
      }

      r.childId = ss.callstack[ss.callstack.length - 1].id;
      if (ss.callstack.length > 0) {
        ss.callstack.pop();
      }
      if (ss.callstack.length > 0) {
        var cur = ss.callstack[ss.callstack.length - 1];
        this.dialogData = cur.state;
        if (m) this.send(m);
        var d = this.dialogs.getDialog(cur.id);
        d.dialogResumed(this, r);
      } else {
        this.send(m);
        if (r.error) {
          this.emit('error', r.error);
        } else {
          if (!result) {
            this.delayedEmit('quit');
          }
        }
      }
      return this;
    }
  }, {
    key: 'compareConfidence',
    value: function compareConfidence(language, utterance, score, callback) {
      var comparer = new _sessionConfidenceComparator2.default(this, language, utterance, score, callback);
      comparer.next();
    }
  }, {
    key: 'reset',
    value: function reset(dialogId, dialogArgs) {
      this._isReset = true;
      this.sessionState.callstack = [];
      if (!dialogId) {
        dialogId = this.options.dialogId;
        dialogArgs = dialogArgs || this.options.dialogArgs;
      }
      this.beginDialog(dialogId, dialogArgs);
      return this;
    }
  }, {
    key: 'isReset',
    value: function isReset() {
      return this._isReset;
    }
  }, {
    key: 'createMessage',
    value: function createMessage(text, args) {
      var message = {
        text: this.vGetText(text, args)
      };
      if (this.message.language) {
        message.language = this.message.language;
      }
      return message;
    }
  }, {
    key: 'routeMessage',
    value: function routeMessage() {
      try {
        var ss = this.sessionState;
        if (ss.callstack.length === 0) {
          this.beginDialog(this.options.dialogId, this.options.dialogArgs);
        } else if (this.validateCallstack()) {
          var cur = ss.callstack[ss.callstack.length - 1];
          var dialog = this.dialogs.getDialog(cur.id);
          this.dialogData = cur.state;
          dialog.replyReceived(this);
        } else {
          console.error('Callstack is invalid, resetting session.');
          this.reset(this.options.dialogId, this.options.dialogArgs);
        }
      } catch (e) {
        this.error(e);
      }
    }
  }, {
    key: 'vGetText',
    value: function vGetText(msgId, args) {
      var tmpl = void 0;
      if (this.options.localizer && this.message) {
        tmpl = this.options.localizer.getText(this.message.language || '', msgId);
      } else {
        tmpl = msgId;
      }
      return args && args.length > 0 ? _sprintfJs2.default.vsprintf(tmpl, args) : tmpl;
    }
  }, {
    key: 'validateCallstack',
    value: function validateCallstack() {
      var ss = this.sessionState;
      for (var i = 0; i < ss.callstack.length; i++) {
        var id = ss.callstack[i].id;
        if (!this.dialogs.hasDialog(id)) {
          return false;
        }
      }
      return true;
    }
  }, {
    key: 'delayedEmit',
    value: function delayedEmit(event, message) {
      var _this3 = this;

      var now = new Date().getTime();
      var delaySend = function delaySend() {
        setTimeout(function () {
          var entry = _this3.sendQueue.shift();
          _this3.lastSendTime = now = new Date().getTime();
          _this3.emit(entry.event, _lodash2.default.clone(entry.msg));
          if (_this3.sendQueue.length > 0) {
            delaySend();
          }
        }, _this3.options.minSendDelay - (now - _this3.lastSendTime));
      };
      if (this.sendQueue.length === 0) {
        this.msgSent = true;
        if (now - this.lastSendTime >= this.options.minSendDelay) {
          this.lastSendTime = now;
          this.emit(event, _lodash2.default.clone(message));
        } else {
          this.sendQueue.push({
            event: event,
            msg: message
          });
          delaySend();
        }
      } else {
        this.sendQueue.push({
          event: event,
          msg: message
        });
      }
    }
  }]);

  return Session;
}(_events.EventEmitter);

exports.default = Session;
//# sourceMappingURL=session.js.map
