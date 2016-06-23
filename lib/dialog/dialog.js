'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Dialog = function () {
  function Dialog() {
    _classCallCheck(this, Dialog);
  }

  _createClass(Dialog, [{
    key: 'begin',
    value: function begin(session, args) {
      this.replyReceived(session);
    }
  }, {
    key: 'dialogResumed',
    value: function dialogResumed(session, result) {
      if (result.error) {
        return session.error(result.error);
      }
      session.send();
    }
  }, {
    key: 'compareConfidence',
    value: function compareConfidence(action, language, utterance, score) {
      action.next();
    }
  }]);

  return Dialog;
}();

Dialog.resumeReason = {};
Dialog.resumeReason.completed = 0;
Dialog.resumeReason.notCompleted = 1;
Dialog.resumeReason.canceled = 2;
Dialog.resumeReason.back = 3;
Dialog.resumeReason.forward = 4;
Dialog.resumeReason.captureCompleted = 5;
Dialog.resumeReason.childEnded = 6;

exports.default = Dialog;
//# sourceMappingURL=dialog.js.map
