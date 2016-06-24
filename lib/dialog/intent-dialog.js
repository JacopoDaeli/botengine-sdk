'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _dialog = require('./dialog');

var _dialog2 = _interopRequireDefault(_dialog);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var IntentDialog = function (_Dialog) {
  _inherits(IntentDialog, _Dialog);

  function IntentDialog() {
    _classCallCheck(this, IntentDialog);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(IntentDialog).call(this));

    _this.groups = {};
    _this.confidenceThreshold = 0.1;
    _this.intentThreshold = 0.1; // TODO: replace this with the above one
    return _this;
  }

  _createClass(IntentDialog, [{
    key: 'begin',
    value: function begin(session, args) {
      var _this2 = this;

      if (this.beginDialog) {
        this.beginDialog(session, args, function () {
          _get(Object.getPrototypeOf(IntentDialog.prototype), 'begin', _this2).call(_this2, session, args);
        });
      } else {
        _get(Object.getPrototypeOf(IntentDialog.prototype), 'begin', this).call(this, session, args);
      }
    }
  }, {
    key: 'replyReceived',
    value: function replyReceived(session) {
      var _this3 = this;

      var msg = session.message;
      this.recognizeIntents(msg.language, msg.text, function (err, intents, entities) {
        if (!err) {
          var topIntent = _this3.findTopIntent(intents);
          var score = topIntent ? topIntent.score : 0;
          session.compareConfidence(msg.language, msg.text, score, function (handled) {
            if (!handled) {
              _this3.invokeIntent(session, intents, entities);
            }
          });
        } else {
          session.endDialog({
            error: new Error('Intent recognition error: ' + err.message)
          });
        }
      });
    }
  }, {
    key: 'dialogResumed',
    value: function dialogResumed(session, result) {}
  }]);

  return IntentDialog;
}(_dialog2.default);

IntentDialog.CAPTURE_THRESHOLD = 0.6;

exports.default = IntentDialog;
//# sourceMappingURL=intent-dialog.js.map
