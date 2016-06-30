'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _intentDialog = require('./intent-dialog');

var _intentDialog2 = _interopRequireDefault(_intentDialog);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var WitDialog = function (_IntentDialog) {
  _inherits(WitDialog, _IntentDialog);

  function WitDialog(params) {
    _classCallCheck(this, WitDialog);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(WitDialog).call(this));

    _this.serviceUri = params.serviceUri;
    _this.bearerToken = params.bearerToken;
    return _this;
  }

  _createClass(WitDialog, [{
    key: 'recognizeIntents',
    value: function recognizeIntents(language, utterance, callback) {
      WitDialog.recognize(utterance, this.serviceUri, this.bearerToken, callback);
    }
  }]);

  return WitDialog;
}(_intentDialog2.default);

WitDialog.recognize = function (utterance, serviceUri, bearerToken, callback) {
  var uri = serviceUri.trim();
  if (uri.lastIndexOf('&q=') !== uri.length - 3) {
    uri += '&q=';
  }
  uri += encodeURIComponent(utterance || '');

  var reqOpts = {
    auth: {
      bearer: bearerToken
    }
  };

  console.log('Processing: "' + utterance + '".');

  _request2.default.get(uri, reqOpts, function (err, res, body) {
    var calledCallback = false;
    try {
      if (!err) {
        (function () {
          var result = JSON.parse(body);

          // console.log(result)

          var intents = (result.entities.intent || []).map(function (intent) {
            return {
              score: intent.confidence,
              intent: intent.value
            };
          });

          // console.log(intents)

          var entityKeys = Object.keys(result.entities).filter(function (key) {
            return key !== 'intent';
          });

          var entities = entityKeys.map(function (key) {
            return {
              confidence: result.entities[key][0].confidence,
              entity: result.entities[key][0].value,
              type: key,
              resolution: false
            };
          });

          calledCallback = true;
          callback(null, intents, entities);
        })();
      } else {
        calledCallback = true;
        callback(err);
      }
    } catch (e) {
      console.error(e.stack);
      if (!calledCallback) {
        callback(e);
      } else {
        console.error(e.toString());
      }
    }
  });
};

exports.default = WitDialog;
//# sourceMappingURL=wit-dialog.js.map
