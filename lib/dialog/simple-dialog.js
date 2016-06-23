'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _dialog = require('./dialog');

var _dialog2 = _interopRequireDefault(_dialog);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var SimpleDialog = function (_Dialog) {
  _inherits(SimpleDialog, _Dialog);

  function SimpleDialog(fn) {
    _classCallCheck(this, SimpleDialog);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(SimpleDialog).call(this));

    _this.fn = fn;
    return _this;
  }

  _createClass(SimpleDialog, [{
    key: 'begin',
    value: function begin(session, args) {
      this.fn(session, args);
    }
  }, {
    key: 'replyReceived',
    value: function replyReceived(session) {
      var _this2 = this;

      var lang = session.message.language;
      var text = session.message.text;
      session.compareConfidence(lang, text, 0.0, function (handled) {
        if (!handled) {
          _this2.fn(session);
        }
      });
    }
  }, {
    key: 'dialogResumed',
    value: function dialogResumed(session, result) {
      this.fn(session, result);
    }
  }]);

  return SimpleDialog;
}(_dialog2.default);

exports.default = SimpleDialog;
//# sourceMappingURL=simple-dialog.js.map
