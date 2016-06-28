'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _session = require('../session');

var _session2 = _interopRequireDefault(_session);

var _dialog = require('./dialog');

var _dialog2 = _interopRequireDefault(_dialog);

var _simpleDialog = require('./simple-dialog');

var _simpleDialog2 = _interopRequireDefault(_simpleDialog);

var _constants = require('../constants');

var _constants2 = _interopRequireDefault(_constants);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DialogAction = function () {
  function DialogAction() {
    _classCallCheck(this, DialogAction);
  }

  _createClass(DialogAction, [{
    key: 'send',
    value: function send(msg) {
      var args = (0, _utils.extractArgs)(arguments, 2);
      args.splice(0, 0, msg);
      return function sendAction(s) {
        _session2.default.prototype.send.apply(s, args);
      };
    }
  }, {
    key: 'beginDialog',
    value: function beginDialog(id, args) {
      return function beginDialogAction(s, a) {
        if (a && a.hasOwnProperty('resumed')) {
          var r = a;
          if (r.error) {
            s.error(r.error);
          } else if (!s.messageSent()) {
            s.send();
          }
        } else {
          if (args) {
            a = a || {};
            for (var key in args) {
              if (args.hasOwnProperty(key)) {
                a[key] = args[key];
              }
            }
          }
          s.beginDialog(id, a);
        }
      };
    }
  }, {
    key: 'endDialog',
    value: function endDialog(result) {
      return function endDialogAction(s) {
        s.endDialog(result);
      };
    }
  }, {
    key: 'validatedPrompt',
    value: function validatedPrompt(promptType, validator) {
      return new _simpleDialog2.default(function (s, _r) {
        var r = _r || {};
        var valid = false;
        if (r.response) {
          try {
            valid = validator(r.response);
          } catch (e) {
            s.endDialog({
              resumed: _dialog2.default.ResumeReason.notCompleted,
              error: e instanceof Error ? e : new Error(e.toString())
            });
          }
        }
        var canceled = false;
        switch (r.resumed) {
          case _dialog2.default.ResumeReason.canceled:
          case _dialog2.default.ResumeReason.forward:
          case _dialog2.default.ResumeReason.back:
            canceled = true;
            break;
        }
        if (valid || canceled) {
          s.endDialog(r);
        } else if (!s.dialogData.hasOwnProperty('prompt')) {
          s.dialogData = _lodash2.default.clone(r);
          s.dialogData.promptType = promptType;
          if (!s.dialogData.hasOwnProperty('maxRetries')) {
            s.dialogData.maxRetries = 2;
          }
          var a = _lodash2.default.clone(s.dialogData);
          a.maxRetries = 0;
          s.beginDialog(_constants2.default.DialogId.Prompts, a);
        } else if (s.dialogData.maxRetries > 0) {
          s.dialogData.maxRetries--;
          var _a = _lodash2.default.clone(s.dialogData);
          _a.maxRetries = 0;
          _a.prompt = s.dialogData.retryPrompt || 'I didn\'t understand. ' + s.dialogData.prompt;
          s.beginDialog(_constants2.default.DialogId.Prompts, _a);
        } else {
          s.endDialog({
            resumed: _dialog2.default.ResumeReason.notCompleted
          });
        }
      });
    }
  }]);

  return DialogAction;
}();

exports.default = DialogAction;
//# sourceMappingURL=dialog-action.js.map
