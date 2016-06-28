'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _dialogAction = require('./dialog-action');

var _dialogAction2 = _interopRequireDefault(_dialogAction);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var IntentGroup = function () {
  function IntentGroup(id) {
    _classCallCheck(this, IntentGroup);

    this.id = id;
    this.handlers = {};
  }

  _createClass(IntentGroup, [{
    key: '_intentHandler',
    value: function _intentHandler(intent) {
      return this.handlers[intent];
    }
  }, {
    key: 'getId',
    value: function getId() {
      return this.id;
    }
  }, {
    key: 'on',
    value: function on(intent, dialogId, dialogArgs) {
      if (!this.handlers.hasOwnProperty(intent)) {
        if (Array.isArray(dialogId)) {
          this.handlers[intent] = (0, _utils.waterfall)(dialogId);
        } else if (typeof dialogId === 'string') {
          this.handlers[intent] = _dialogAction2.default.beginDialog(dialogId, dialogArgs);
        } else {
          this.handlers[intent] = (0, _utils.waterfall)([dialogId]);
        }
      } else {
        throw new Error('Intent[' + intent + '] already exists.');
      }
      return this;
    }
  }]);

  return IntentGroup;
}();

exports.default = IntentGroup;
//# sourceMappingURL=intent-group.js.map
