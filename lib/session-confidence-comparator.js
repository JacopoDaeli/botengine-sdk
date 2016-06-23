'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _dialog = require('./dialog/dialog');

var _dialog2 = _interopRequireDefault(_dialog);

var _session = require('./session');

var _session2 = _interopRequireDefault(_session);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SessionConfidenceComparor = function () {
  function SessionConfidenceComparor() {
    _classCallCheck(this, SessionConfidenceComparor);
  }

  _createClass(SessionConfidenceComparor, [{
    key: 'SessionConfidenceComparor',
    value: function SessionConfidenceComparor(session, language, utterance, score, callback) {
      this.session = session;
      this.language = language;
      this.utterance = utterance;
      this.score = score;
      this.callback = callback;
      this.index = session.sessionState.callstack.length - 1;
      this.userData = session.userData;
    }
  }, {
    key: 'next',
    value: function next() {
      this.index--;
      if (this.index >= 0) {
        this.getDialog().compareConfidence(this, this.language, this.utterance, this.score);
      } else {
        this.callback(false);
      }
    }
  }, {
    key: 'endDialog',
    value: function endDialog(result) {
      this.session.sessionState.callstack.splice(this.index + 1);
      this.getDialog().dialogResumed(this.session, result || {
        resumed: _dialog2.default.resumeReason.childEnded
      });
      this.callback(true);
    }
  }, {
    key: 'send',
    value: function send(msg) {
      var args = (0, _utils.extractArgs)(arguments, 1);
      args.splice(0, 0, [msg]);
      _session2.default.prototype.send.apply(this.session, args);
      this.callback(true);
    }
  }, {
    key: 'getDialog',
    value: function getDialog() {
      var cur = this.session.sessionState.callstack[this.index];
      this.dialogData = cur.state;
      return this.session.dialogs.getDialog(cur.id);
    }
  }]);

  return SessionConfidenceComparor;
}();

exports.default = SessionConfidenceComparor;
//# sourceMappingURL=session-confidence-comparator.js.map
