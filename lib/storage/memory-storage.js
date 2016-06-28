'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MemoryStorage = function () {
  function MemoryStorage() {
    _classCallCheck(this, MemoryStorage);

    this.store = {};
  }

  _createClass(MemoryStorage, [{
    key: 'get',
    value: function get(id, callback) {
      if (this.store.hasOwnProperty(id)) {
        callback(null, JSON.parse(this.store[id]));
      } else {
        callback(null, null);
      }
    }
  }, {
    key: 'save',
    value: function save(id, data, callback) {
      this.store[id] = JSON.stringify(data || {});
      if (callback) {
        callback(null);
      }
    }
  }, {
    key: 'delete',
    value: function _delete(id) {
      if (this.store.hasOwnProperty(id)) {
        delete this.store[id];
      }
    }
  }]);

  return MemoryStorage;
}();

exports.default = MemoryStorage;
//# sourceMappingURL=memory-storage.js.map
