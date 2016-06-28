'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _chronoNode = require('chrono-node');

var _chronoNode2 = _interopRequireDefault(_chronoNode);

var _utils = require('../utils');

var utils = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var entityRecognizer = {
  findEntity: function findEntity(entities, type) {
    for (var i = 0; i < entities.length; i++) {
      if (entities[i].type === type) {
        return entities[i];
      }
    }
    return null;
  },
  findAllEntities: function findAllEntities(entities, type) {
    var found = [];
    for (var i = 0; i < entities.length; i++) {
      if (entities[i].type === type) {
        found.push(entities[i]);
      }
    }
    return found;
  },
  parseTime: function parseTime(entities) {
    if (typeof entities === 'string') {
      entities = this.recognizeTime(entities);
    }
    return this.resolveTime(entities);
  },
  resolveTime: function resolveTime(entities) {
    var _this = this;

    var now = new Date();
    var resolvedDate = null;
    var date = null;
    var time = null;
    entities.forEach(function (entity) {
      if (entity.resolution) {
        switch (entity.resolution.resolution_type || entity.type) {
          case 'builtin.datetime':
          case 'builtin.datetime.date':
          case 'builtin.datetime.time':
            var parts = (entity.resolution.date || entity.resolution.time).split('T');
            if (!date && _this.dateExp.test(parts[0])) {
              date = parts[0];
            }
            if (!time && parts[1]) {
              time = 'T' + parts[1];
              if (time === 'TMO') {
                time = 'T08:00:00';
              } else if (time === 'TNI') {
                time = 'T20:00:00';
              } else if (time.length === 3) {
                time = time + ':00:00';
              } else if (time.length === 6) {
                time = time + ':00';
              }
            }
            break;
          case 'chrono.duration':
            resolvedDate = entity.duration.resolution.start;
        }
      }
    });
    if (!resolvedDate && (date || time)) {
      if (!date) {
        date = utils.toDate8601(now);
      }
      if (time) {
        date += time;
      }
      resolvedDate = new Date(date);
    }
    return resolvedDate;
  },
  recognizeTime: function recognizeTime(utterance, refDate) {
    var response = null;
    try {
      var results = _chronoNode2.default.parse(utterance, refDate);
      if (results && results.length > 0) {
        var duration = results[0];
        response = {
          type: 'chrono.duration',
          entity: duration.text,
          startIndex: duration.index,
          endIndex: duration.index + duration.text.length,
          resolution: {
            resolution_type: 'chrono.duration',
            start: duration.start.date()
          }
        };
        if (duration.end) {
          response.resolution.end = duration.end.date();
        }
        if (duration.ref) {
          response.resolution.ref = duration.ref;
        }
        response.score = duration.text.length / utterance.length;
      }
    } catch (err) {
      console.error('Error recognizing time: ' + err.toString());
      response = null;
    }
    return response;
  },
  parseNumber: function parseNumber(entities) {
    var entity = null;
    if (typeof entities === 'string') {
      entity = {
        type: 'text',
        entity: entities.trim()
      };
    } else {
      entity = this.findEntity(entities, 'builtin.number');
    }
    if (entity) {
      var match = this.numberExp.exec(entity.entity);
      if (match) {
        return Number(match[0]);
      }
    }
    return Number.NaN;
  },
  parseBoolean: function parseBoolean(utterance) {
    utterance = utterance.trim();
    if (this.yesExp.test(utterance)) {
      return true;
    } else if (this.noExp.test(utterance)) {
      return false;
    }
    return undefined;
  },
  findBestMatch: function findBestMatch(choices, utterance, threshold) {
    if (threshold === undefined) {
      threshold = 0.6;
    }
    var best = null;
    var matches = this.findAllMatches(choices, utterance, threshold);
    matches.forEach(function (value) {
      if (!best || value.score > best.score) {
        best = value;
      }
    });
    return best;
  },
  findAllMatches: function findAllMatches(choices, utterance, threshold) {
    if (threshold === void 0) {
      threshold = 0.6;
    }
    var matches = [];
    utterance = utterance.trim().toLowerCase();
    var tokens = utterance.split(' ');
    this.expandChoices(choices).forEach(function (choice, index) {
      var score = 0.0;
      var value = choice.trim().toLowerCase();
      if (value.indexOf(utterance) >= 0) {
        score = utterance.length / value.length;
      } else if (utterance.indexOf(value) >= 0) {
        score = Math.min(0.5 + value.length / utterance.length, 0.9);
      } else {
        var matched = '';
        tokens.forEach(function (token) {
          if (value.indexOf(token) >= 0) {
            matched += token;
          }
        });
        score = matched.length / value.length;
      }
      if (score > threshold) {
        matches.push({
          index: index,
          entity: choice,
          score: score
        });
      }
    });
    return matches;
  },
  expandChoices: function expandChoices(choices) {
    if (!choices) {
      return [];
    } else if (Array.isArray(choices)) {
      return choices;
    } else if (typeof choices === 'string') {
      return choices.split('|');
    } else if ((typeof choices === 'undefined' ? 'undefined' : _typeof(choices)) === 'object') {
      var list = [];
      for (var key in choices) {
        list.push(key);
      }
      return list;
    } else {
      return [choices.toString()];
    }
  }
};

exports.default = entityRecognizer;
//# sourceMappingURL=entity-recognizer.js.map
