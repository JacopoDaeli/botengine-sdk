'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _dialog = require('./dialog');

var _dialog2 = _interopRequireDefault(_dialog);

var _dialogAction = require('./dialog-action');

var _dialogAction2 = _interopRequireDefault(_dialogAction);

var _constants = require('../constants');

var _constants2 = _interopRequireDefault(_constants);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CommandDialog = function (_Dialog) {
  _inherits(CommandDialog, _Dialog);

  function CommandDialog() {
    _classCallCheck(this, CommandDialog);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(CommandDialog).call(this));

    _this.commands = [];
    return _this;
  }

  _createClass(CommandDialog, [{
    key: 'begin',
    value: function begin(session, args) {
      var _this2 = this;

      if (this.beginDialog) {
        session.dialogData[_constants2.default.Data.Handler] = -1;
        this.beginDialog(session, args, function () {
          _get(Object.getPrototypeOf(CommandDialog.prototype), 'begin', _this2).call(_this2, session, args);
        });
      } else {
        _get(Object.getPrototypeOf(CommandDialog.prototype), 'begin', this).call(this, session, args);
      }
    }
  }, {
    key: 'replyReceived',
    value: function replyReceived(session) {
      var score = 0.0;
      var expression = null;
      var matches = null;
      var text = session.message.text;
      var matched = null;
      for (var i = 0; i < this.commands.length; i++) {
        var cmd = this.commands[i];
        for (var j = 0; j < cmd.expressions.length; j++) {
          expression = cmd.expressions[j];
          if (expression.test(text)) {
            matched = cmd;
            session.dialogData[_constants2.default.Data.Handler] = i;
            matches = expression.exec(text);
            if (matches) {
              var length = 0;
              matches.forEach(function (value) {
                if (value) length += value.length;
              });
              score = length / text.length;
            }
            break;
          }
        }
        if (matched) break;
      }
      if (!matched && this.default) {
        expression = null;
        matched = this.default;
        session.dialogData[_constants2.default.Data.Handler] = this.commands.length;
      }
      if (matched) {
        session.compareConfidence(session.message.language, text, score, function (handled) {
          if (!handled) {
            matched.fn(session, {
              expression: expression,
              matches: matches
            });
          }
        });
      } else {
        session.send();
      }
    }
  }, {
    key: 'dialogResumed',
    value: function dialogResumed(session, result) {
      var cur = null;
      var handler = session.dialogData[_constants2.default.Data.Handler];

      if (handler >= 0 && handler < this.commands.length) {
        cur = this.commands[handler];
      } else if (handler >= this.commands.length && this.default) {
        cur = this.default;
      }
      if (cur) {
        cur.fn(session, result);
      } else {
        _get(Object.getPrototypeOf(CommandDialog.prototype), 'dialogResumed', this).call(this, session, result);
      }
    }
  }, {
    key: 'onBegin',
    value: function onBegin(handler) {
      this.beginDialog = handler;
      return this;
    }
  }, {
    key: 'matches',
    value: function matches(patterns, dialogId, dialogArgs) {
      var fn = null;
      var p = !Array.isArray(patterns) ? [patterns] : patterns;
      if (Array.isArray(dialogId)) {
        fn = (0, _utils.waterfall)(dialogId);
      } else if (typeof dialogId === 'string') {
        fn = _dialogAction2.default.beginDialog(dialogId, dialogArgs);
      } else {
        fn = (0, _utils.waterfall)([dialogId]);
      }
      var expressions = [];
      for (var i = 0; i < p.length; i++) {
        expressions.push(new RegExp(p[i], 'i'));
      }
      this.commands.push({ expressions: expressions, fn: fn });
      return this;
    }
  }, {
    key: 'onDefault',
    value: function onDefault(dialogId, dialogArgs) {
      var fn = null;
      if (Array.isArray(dialogId)) {
        fn = (0, _utils.waterfall)(dialogId);
      } else if (typeof dialogId === 'string') {
        fn = _dialogAction2.default.beginDialog(dialogId, dialogArgs);
      } else {
        fn = (0, _utils.waterfall)([dialogId]);
      }
      this.default = { fn: fn };
      return this;
    }
  }]);

  return CommandDialog;
}(_dialog2.default);

exports.default = CommandDialog;
//# sourceMappingURL=command-dialog.js.map
