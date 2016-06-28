'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _events = require('events');

var _simpleDialog = require('./simple-dialog');

var _simpleDialog2 = _interopRequireDefault(_simpleDialog);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var DialogCollection = function (_EventEmitter) {
  _inherits(DialogCollection, _EventEmitter);

  function DialogCollection() {
    _classCallCheck(this, DialogCollection);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(DialogCollection).call(this));

    _this.middleware = [];
    _this.dialogs = {};
    _this.add(DialogCollection.systemDialogs);
    return _this;
  }

  _createClass(DialogCollection, [{
    key: 'add',
    value: function add(id, dialog) {
      var dialogs = null;
      if (typeof id === 'string') {
        if (Array.isArray(dialog)) {
          dialog = new _simpleDialog2.default((0, _utils.waterfall)(dialog));
        } else if (typeof dialog === 'function') {
          dialog = new _simpleDialog2.default((0, _utils.waterfall)([dialog]));
        }
        var _a = null;
        dialogs = (_a = {}, _a[id] = dialog, _a);
      } else {
        dialogs = id;
      }
      for (var key in dialogs) {
        if (!this.dialogs.hasOwnProperty(key)) {
          this.dialogs[key] = dialogs[key];
        } else {
          throw new Error('Dialog[' + key + '] already exists.');
        }
      }
      return this;
    }
  }, {
    key: 'getDialog',
    value: function getDialog(id) {
      return this.dialogs[id];
    }
  }, {
    key: 'getMiddleware',
    value: function getMiddleware() {
      return this.middleware;
    }
  }, {
    key: 'hasDialog',
    value: function hasDialog(id) {
      return this.dialogs.hasOwnProperty(id);
    }
  }, {
    key: 'use',
    value: function use(fn) {
      this.middleware.push(fn);
      return this;
    }
  }]);

  return DialogCollection;
}(_events.EventEmitter);

DialogCollection.systemDialogs = {};
//# sourceMappingURL=dialog-collection.js.map
