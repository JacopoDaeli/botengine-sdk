'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.extractArgs = extractArgs;
function extractArgs(a) {
  var fromPos = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

  var args = [];
  for (var i = fromPos; i < a.length; i++) {
    args[i - fromPos] = a[i];
  }
  return args;
}
//# sourceMappingURL=util.js.map
