'use strict';

// import request from 'request'

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.WitDialog = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _intentDialog = require('./intent-dialog');

var _intentDialog2 = _interopRequireDefault(_intentDialog);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var WitDialog = exports.WitDialog = function (_IntentDialog) {
  _inherits(WitDialog, _IntentDialog);

  function WitDialog(serviceUri) {
    _classCallCheck(this, WitDialog);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(WitDialog).call(this));

    _this.serviceUri = serviceUri;
    return _this;
  }

  _createClass(WitDialog, [{
    key: 'recognizeIntents',
    value: function recognizeIntents(language, utterance, callback) {}
  }]);

  return WitDialog;
}(_intentDialog2.default);
//# sourceMappingURL=wit-dialog.js.map
