'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _promptType = require('./prompt-type');

var _promptType2 = _interopRequireDefault(_promptType);

var _dialog = require('../dialog');

var _dialog2 = _interopRequireDefault(_dialog);

var _entityRecognizer = require('../entity-recognizer');

var _entityRecognizer2 = _interopRequireDefault(_entityRecognizer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var SimplePromptRecognizer = function () {
  function SimplePromptRecognizer() {
    _classCallCheck(this, SimplePromptRecognizer);

    this.cancelExp = /^(cancel|nevermind|never mind|stop|forget it|quit)/i;
  }

  _createClass(SimplePromptRecognizer, [{
    key: 'recognize',
    value: function recognize(args, callback, session) {
      this.checkCanceled(args, function () {
        try {
          (function () {
            var score = 0.0;
            var response = null;
            var text = args.utterance.trim();
            switch (args.promptType) {
              default:
              case _promptType2.default.text:
                score = 0.1;
                response = text;
                break;
              case _promptType2.default.number:
                var n = _entityRecognizer2.default.parseNumber(text);
                if (!isNaN(n)) {
                  score = n.toString().length / text.length;
                  response = n;
                }
                break;
              case _promptType2.default.confirm:
                var b = _entityRecognizer2.default.parseBoolean(text);
                if (typeof b !== 'boolean') {
                  var _n = _entityRecognizer2.default.parseNumber(text);
                  if (!isNaN(_n) && _n > 0 && _n <= 2) {
                    b = _n === 1;
                  }
                }
                if (typeof b === 'boolean') {
                  score = 1.0;
                  response = b;
                }
                break;
              case _promptType2.default.time:
                var entity = _entityRecognizer2.default.recognizeTime(text, args.refDate ? new Date(args.refDate) : null);
                if (entity) {
                  score = entity.entity.length / text.length;
                  response = entity;
                }
                break;
              case _promptType2.default.choice:
                var best = _entityRecognizer2.default.findBestMatch(args.enumValues, text);
                if (!best) {
                  var _n2 = _entityRecognizer2.default.parseNumber(text);
                  if (!isNaN(_n2) && _n2 > 0 && _n2 <= args.enumValues.length) {
                    best = {
                      index: _n2 - 1,
                      entity: args.enumValues[_n2 - 1],
                      score: 1.0
                    };
                  }
                }
                if (best) {
                  score = best.score;
                  response = best;
                }
                break;
              case _promptType2.default.attachment:
                if (args.attachments && args.attachments.length > 0) {
                  score = 1.0;
                  response = args.attachments;
                }
                break;
            }
            args.compareConfidence(args.language, text, score, function (handled) {
              if (!handled && score > 0) {
                callback({
                  resumed: _dialog2.default.ResumeReason.completed,
                  promptType: args.promptType,
                  response: response
                });
              } else {
                callback({
                  resumed: _dialog2.default.ResumeReason.notCompleted,
                  promptType: args.promptType,
                  handled: handled
                });
              }
            });
          })();
        } catch (err) {
          callback({
            resumed: _dialog2.default.ResumeReason.notCompleted,
            promptType: args.promptType,
            error: err instanceof Error ? err : new Error(err.toString())
          });
        }
      }, callback);
    }
  }, {
    key: 'checkCanceled',
    value: function checkCanceled(args, onContinue, callback) {
      if (!this.cancelExp.test(args.utterance.trim())) {
        onContinue();
      } else {
        callback({
          resumed: _dialog2.default.ResumeReason.canceled,
          promptType: args.promptType
        });
      }
    }
  }]);

  return SimplePromptRecognizer;
}();

exports.default = SimplePromptRecognizer;
//# sourceMappingURL=simple-prompt-recognizer.js.map
