'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.extractArgs = extractArgs;
exports.randomPrompt = randomPrompt;
exports.composePrompt = composePrompt;
exports.waterfall = waterfall;
exports.beginPrompt = beginPrompt;

var _sprintfJs = require('sprintf-js');

var _sprintfJs2 = _interopRequireDefault(_sprintfJs);

var _dialog = require('./dialog/dialog');

var _dialog2 = _interopRequireDefault(_dialog);

var _constants = require('./constants');

var _constants2 = _interopRequireDefault(_constants);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function extractArgs(a) {
  var fromPos = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

  var args = [];
  for (var i = fromPos; i < a.length; i++) {
    args[i - fromPos] = a[i];
  }
  return args;
}

function randomPrompt(prompts) {
  if (Array.isArray(prompts)) {
    var i = Math.floor(Math.random() * prompts.length);
    return prompts[i];
  }
  return prompts;
}

function composePrompt(ses, prompts, args) {
  var connector = '';
  var prompt = '';
  for (var i = 0; i < prompts.length; i++) {
    prompt += connector + ses.getText(randomPrompt(prompts[1]));
    connector = ' ';
  }
  return args && args.length > 0 ? _sprintfJs2.default.vsprintf(prompt, args) : prompt;
}

function waterfall(steps) {
  return function waterfallAction(s, r) {
    var skip = function skip(result) {
      result = result || {};
      if (!result.resumed) {
        result.resumed = _dialog2.default.ResumeReason.forward;
      }
      waterfallAction(s, result);
    };
    if (r && r.hasOwnProperty('resumed')) {
      var step = s.dialogData[_constants2.default.Data.WaterfallStep];
      switch (r.resumed) {
        case _dialog2.default.ResumeReason.back:
          step -= 1;
          break;
        default:
          step++;
      }
      if (step >= 0 && step < steps.length) {
        try {
          s.dialogData[_constants2.default.Data.WaterfallStep] = step;
          steps[step](s, r, skip);
        } catch (e) {
          delete s.dialogData[_constants2.default.Data.WaterfallStep];
          s.endDialog({
            resumed: _dialog2.default.ResumeReason.notCompleted,
            error: e instanceof Error ? e : new Error(e.toString())
          });
        }
      } else {
        s.endDialog(r);
      }
    } else if (steps && steps.length > 0) {
      try {
        s.dialogData[_constants2.default.Data.WaterfallStep] = 0;
        steps[0](s, r, skip);
      } catch (e) {
        delete s.dialogData[_constants2.default.Data.WaterfallStep];
        s.endDialog({
          resumed: _dialog2.default.ResumeReason.notCompleted,
          error: e instanceof Error ? e : new Error(e.toString())
        });
      }
    } else {
      s.endDialog({
        resumed: _dialog2.default.ResumeReason.notCompleted
      });
    }
  };
}

function beginPrompt(session, args) {
  session.beginDialog(_constants2.default.DialogId.Prompts, args);
}
//# sourceMappingURL=utils.js.map
