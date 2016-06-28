'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _promptType = require('./prompt-type');

var _promptType2 = _interopRequireDefault(_promptType);

var _listStyle = require('./list-style');

var _listStyle2 = _interopRequireDefault(_listStyle);

var _simplePromptRecognizer = require('./simple-prompt-recognizer');

var _simplePromptRecognizer2 = _interopRequireDefault(_simplePromptRecognizer);

var _dialog = require('../dialog');

var _dialog2 = _interopRequireDefault(_dialog);

var _entityRecognizer = require('../entity-recognizer');

var _entityRecognizer2 = _interopRequireDefault(_entityRecognizer);

var _message = require('../../message');

var _message2 = _interopRequireDefault(_message);

var _channel = require('../../channel');

var _utils = require('../../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Prompt = function (_Dialog) {
  _inherits(Prompt, _Dialog);

  function Prompt() {
    _classCallCheck(this, Prompt);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(Prompt).apply(this, arguments));
  }

  _createClass(Prompt, [{
    key: 'begin',
    value: function begin(session, _args) {
      var args = args || {};
      args.maxRetries = args.maxRetries || 1;
      for (var key in args) {
        if (args.hasOwnProperty(key)) {
          session.dialogData[key] = args[key];
        }
      }
      this.sendPrompt(session, args);
    }
  }, {
    key: 'replyReceived',
    value: function replyReceived(session) {
      var _this2 = this;

      var args = session.dialogData;

      Prompt.options.recognizer.recognize({
        promptType: args.promptType,
        utterance: session.message.text,
        language: session.message.language,
        attachments: session.message.attachments,
        enumValues: args.enumValues,
        refDate: args.refDate,
        compareConfidence: function compareConfidence(language, utterance, score, callback) {
          session.compareConfidence(language, utterance, score, callback);
        }
      }, function (result) {
        if (!result.handled) {
          if (result.error || result.resumed === _dialog2.default.ResumeReason.completed || result.resumed === _dialog2.default.ResumeReason.canceled || args.maxRetries === 0) {
            result.promptType = args.promptType;
            session.endDialog(result);
          } else {
            args.maxRetries--;
            _this2.sendPrompt(session, args, true);
          }
        }
      });
    }
  }, {
    key: 'sendPrompt',
    value: function sendPrompt(session, args, _retry) {
      var retry = !!_retry;
      if (retry && _typeof(args.retryPrompt) === 'object' && !Array.isArray(args.retryPrompt)) {
        session.send(args.retryPrompt);
      } else if (_typeof(args.prompt) === 'object' && !Array.isArray(args.prompt)) {
        session.send(args.prompt);
      } else {
        (function () {
          var style = _listStyle2.default.none;
          if (args.promptType === _promptType2.default.choice || args.promptType === _promptType2.default.confirm) {
            style = args.listStyle;
            if (style === _listStyle2.default.auto) {
              if ((0, _channel.preferButtons)(session, args.enumValues.length, retry)) {
                style = _listStyle2.default.button;
              } else if (!retry) {
                style = args.enumValues.length < 3 ? _listStyle2.default.inline : _listStyle2.default.list;
              } else {
                style = _listStyle2.default.none;
              }
            }
          }
          var prompt = null;
          if (retry) {
            if (args.retryPrompt) {
              prompt = (0, _utils.randomPrompt)(args.retryPrompt);
            } else {
              var type = _promptType2.default[args.promptType];
              prompt = (0, _utils.randomPrompt)(Prompt.defaultRetryPrompt[type]);
            }
          } else {
            prompt = (0, _utils.randomPrompt)(args.prompt);
          }
          var connector = '';
          var list = null;
          var msg = new _message2.default();
          switch (style) {
            case _listStyle2.default.button:
              var a = {
                actions: []
              };
              for (var i = 0; i < session.dialogData.enumValues.length; i++) {
                var action = session.dialogData.enumValues[i];
                a.actions.push({
                  title: action,
                  message: action
                });
              }
              msg.setText(session, prompt).addAttachment(a);
              break;
            case _listStyle2.default.inline:
              list = ' ';
              args.enumValues.forEach(function (value, index) {
                list += '' + connector + (index + 1) + '. ' + value;
                if (index === args.enumValues.length - 2) {
                  connector = index === 0 ? ' or ' : ', or ';
                } else {
                  connector = ', ';
                }
              });
              msg.setText(session, prompt + '%s', list);
              break;
            case _listStyle2.default.list:
              list = '\n   ';
              args.enumValues.forEach(function (value, index) {
                list += '' + connector + (index + 1) + '. ' + value;
                connector = '\n   ';
              });
              msg.setText(session, prompt + '%s', list);
              break;
            default:
              msg.setText(session, prompt);
              break;
          }
          session.send(msg);
        })();
      }
    }
  }, {
    key: 'configure',
    value: function configure(options) {
      if (options) {
        for (var key in options) {
          if (options.hasOwnProperty(key)) {
            Prompt.options[key] = options[key];
          }
        }
      }
    }
  }, {
    key: 'text',
    value: function text(session, prompt) {
      (0, _utils.beginPrompt)(session, {
        promptType: _promptType2.default.text,
        prompt: prompt
      });
    }
  }, {
    key: 'number',
    value: function number(session, prompt, options) {
      var args = options || {};
      args.promptType = _promptType2.default.number;
      args.prompt = prompt;
      (0, _utils.beginPrompt)(session, args);
    }
  }, {
    key: 'confirm',
    value: function confirm(session, prompt, options) {
      var args = options || {};
      args.promptType = _promptType2.default.confirm;
      args.prompt = prompt;
      args.enumValues = ['yes', 'no'];
      args.listStyle = args.hasOwnProperty('listStyle') ? args.listStyle : _listStyle2.default.auto;
      (0, _utils.beginPrompt)(session, args);
    }
  }, {
    key: 'choice',
    value: function choice(session, prompt, choices, options) {
      var args = options || {};
      args.promptType = _promptType2.default.choice;
      args.prompt = prompt;
      args.listStyle = args.hasOwnProperty('listStyle') ? args.listStyle : _listStyle2.default.auto;
      args.enumValues = _entityRecognizer2.default.expandChoices(choices);
      (0, _utils.beginPrompt)(session, args);
    }
  }, {
    key: 'time',
    value: function time(session, prompt, options) {
      var args = options || {};
      args.promptType = _promptType2.default.time;
      args.prompt = prompt;
      (0, _utils.beginPrompt)(session, args);
    }
  }, {
    key: 'attachment',
    value: function attachment(session, prompt, options) {
      var args = options || {};
      args.promptType = _promptType2.default.attachment;
      args.prompt = prompt;
      (0, _utils.beginPrompt)(session, args);
    }
  }]);

  return Prompt;
}(_dialog2.default);

Prompt.options = {
  recognizer: new _simplePromptRecognizer2.default()
};

Prompt.defaultRetryPrompt = {
  text: 'I didn\'t understand. Please try again.',
  number: 'I didn\'t recognize that as a number. Please enter a number.',
  confirm: 'I didn\'t understand. Please answer \'yes\' or \'no\'.',
  choice: 'I didn\'t understand. Please choose an option from the list.',
  time: 'I didn\'t recognize the time you entered. Please try again.',
  attachment: 'I didn\'t receive a file. Please try again.'
};
//# sourceMappingURL=prompt.js.map
