'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.extractArgs = extractArgs;
exports.randomPrompt = randomPrompt;
exports.composePrompt = composePrompt;

var _sprintfJs = require('sprintf-js');

var _sprintfJs2 = _interopRequireDefault(_sprintfJs);

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
//# sourceMappingURL=util.js.map
