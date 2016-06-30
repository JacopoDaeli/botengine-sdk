'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _dialog = require('./dialog');

var _dialog2 = _interopRequireDefault(_dialog);

var _intentGroup = require('./intent-group');

var _intentGroup2 = _interopRequireDefault(_intentGroup);

var _constants = require('../constants');

var _constants2 = _interopRequireDefault(_constants);

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
    value: function dialogResumed(session, result) {
      if (result.captured) {
        this.invokeIntent(session, result.captured.intents, result.captured.entities);
      } else {
        var activeGroup = session.dialogData[_constants2.default.Data.Group];
        var activeIntent = session.dialogData[_constants2.default.Data.Intent];
        var group = activeGroup ? this.groups[activeGroup] : null;
        var handler = group && activeIntent ? group._intentHandler(activeIntent) : null;
        if (handler) {
          handler(session, result);
        } else {
          _get(Object.getPrototypeOf(IntentDialog.prototype), 'dialogResumed', this).call(this, session, result);
        }
      }
    }
  }, {
    key: 'compareConfidence',
    value: function compareConfidence(action, language, utterance, score) {
      var _this4 = this;

      if (score < IntentDialog.CAPTURE_THRESHOLD && this.captureIntent) {
        this.recognizeIntents(language, utterance, function (err, intents, entities) {
          if (!err) {
            var matches = null;
            var topIntent = _this4.findTopIntent(intents);
            if (topIntent && topIntent.score > _this4.confidenceThreshold && topIntent.score > score) {
              matches = _this4.findHandler(topIntent);
            }
            if (matches) {
              _this4.captureIntent({
                next: action.next,
                userData: action.userData,
                dialogData: action.dialogData,
                endDialog: function endDialog() {
                  action.endDialog({
                    resumed: _dialog2.default.resumeReason.completed,
                    captured: {
                      intents: intents,
                      entities: entities
                    }
                  });
                },
                send: action.send
              }, topIntent, entities);
            } else {
              action.next();
            }
          } else {
            console.error('Intent recognition error: ' + err.message);
            action.next();
          }
        });
      } else {
        action.next();
      }
    }
  }, {
    key: 'addGroup',
    value: function addGroup(group) {
      var id = group.getId();
      if (!this.groups.hasOwnProperty(id)) {
        this.groups[id] = group;
      } else {
        throw new Error('Group of ' + id + ' already exists within the dialog.');
      }
      return this;
    }
  }, {
    key: 'onBegin',
    value: function onBegin(handler) {
      this.beginDialog = handler;
      return this;
    }
  }, {
    key: 'on',
    value: function on(intent, dialogId, dialogArgs) {
      this.getDefaultGroup().on(intent, dialogId, dialogArgs);
      return this;
    }
  }, {
    key: 'onDefault',
    value: function onDefault(dialogId, dialogArgs) {
      this.getDefaultGroup().on(_constants2.default.Intents.Default, dialogId, dialogArgs);
      return this;
    }
  }, {
    key: 'getThreshold',
    value: function getThreshold() {
      return this.confidenceThreshold;
    }
  }, {
    key: 'setThreshold',
    value: function setThreshold(score) {
      this.confidenceThreshold = score;
      return this;
    }
  }, {
    key: 'invokeIntent',
    value: function invokeIntent(session, intents, entities) {
      try {
        var match = null;
        var topIntent = this.findTopIntent(intents);
        if (topIntent && topIntent.score > this.confidenceThreshold) {
          match = this.findHandler(topIntent);
        }
        if (!match) {
          topIntent = {
            intent: _constants2.default.Intents.Default,
            score: 1.0
          };
          match = {
            groupId: _constants2.default.Id.DefaultGroup,
            handler: this.getDefaultGroup()._intentHandler(topIntent.intent)
          };
        }
        if (match && match.handler) {
          session.dialogData[_constants2.default.Data.Group] = match.groupId;
          session.dialogData[_constants2.default.Data.Intent] = topIntent.intent;
          match.handler(session, {
            intents: intents,
            entities: entities
          });
        } else {
          session.send();
        }
      } catch (e) {
        session.error(e instanceof Error ? e : new Error(e.toString()));
      }
    }
  }, {
    key: 'findTopIntent',
    value: function findTopIntent(intents) {
      var topIntent = null;
      if (intents) {
        for (var i = 0; i < intents.length; i++) {
          var intent = intents[i];
          if (!topIntent) {
            topIntent = intent;
          } else if (intent.score > topIntent.score) {
            topIntent = intent;
          }
        }
      }
      return topIntent;
    }
  }, {
    key: 'findHandler',
    value: function findHandler(intent) {
      for (var groupId in this.groups) {
        var handler = this.groups[groupId]._intentHandler(intent.intent);
        if (handler) return { groupId: groupId, handler: handler };
      }
      return null;
    }
  }, {
    key: 'getDefaultGroup',
    value: function getDefaultGroup() {
      var group = this.groups[_constants2.default.Id.DefaultGroup];
      if (!group) {
        this.groups[_constants2.default.Id.DefaultGroup] = group = new _intentGroup2.default(_constants2.default.Id.DefaultGroup);
      }
      return group;
    }
  }]);

  return IntentDialog;
}(_dialog2.default);

IntentDialog.CAPTURE_THRESHOLD = 0.6;

exports.default = IntentDialog;
//# sourceMappingURL=intent-dialog.js.map
