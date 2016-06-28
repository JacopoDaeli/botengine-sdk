'use strict'

import chrono from 'node-chrono'
import * as utils from '../utils'

const entityRecognizer = {
  findEntity (entities, type) {
    for (let i = 0; i < entities.length; i++) {
      if (entities[i].type === type) {
        return entities[i]
      }
    }
    return null
  },
  findAllEntities (entities, type) {
    const found = []
    for (let i = 0; i < entities.length; i++) {
      if (entities[i].type === type) {
        found.push(entities[i])
      }
    }
    return found
  },
  parseTime (entities) {
    if (typeof entities === 'string') {
      entities = this.recognizeTime(entities)
    }
    return this.resolveTime(entities)
  },
  resolveTime (entities) {
    const now = new Date()
    let resolvedDate = null
    let date = null
    let time = null
    entities.forEach((entity) => {
      if (entity.resolution) {
        switch (entity.resolution.resolution_type || entity.type) {
          case 'builtin.datetime':
          case 'builtin.datetime.date':
          case 'builtin.datetime.time':
            const parts = (entity.resolution.date || entity.resolution.time).split('T')
            if (!date && this.dateExp.test(parts[0])) {
              date = parts[0]
            }
            if (!time && parts[1]) {
              time = 'T' + parts[1]
              if (time === 'TMO') {
                time = 'T08:00:00'
              } else if (time === 'TNI') {
                time = 'T20:00:00'
              } else if (time.length === 3) {
                time = time + ':00:00'
              } else if (time.length === 6) {
                time = time + ':00'
              }
            }
            break
          case 'chrono.duration':
            resolvedDate = entity.duration.resolution.start
        }
      }
    })
    if (!resolvedDate && (date || time)) {
      if (!date) {
        date = utils.toDate8601(now)
      }
      if (time) {
        date += time
      }
      resolvedDate = new Date(date)
    }
    return resolvedDate
  },
  recognizeTime (utterance, refDate) {
    let response = null
    try {
      const results = chrono.parse(utterance, refDate)
      if (results && results.length > 0) {
        let duration = results[0]
        response = {
          type: 'chrono.duration',
          entity: duration.text,
          startIndex: duration.index,
          endIndex: duration.index + duration.text.length,
          resolution: {
            resolution_type: 'chrono.duration',
            start: duration.start.date()
          }
        }
        if (duration.end) {
          response.resolution.end = duration.end.date()
        }
        if (duration.ref) {
          response.resolution.ref = duration.ref
        }
        response.score = duration.text.length / utterance.length
      }
    } catch (err) {
      console.error(`Error recognizing time: ${err.toString()}`)
      response = null
    }
    return response
  },
  parseNumber (entities) {
    let entity = null
    if (typeof entities === 'string') {
      entity = {
        type: 'text',
        entity: entities.trim()
      }
    } else {
      entity = this.findEntity(entities, 'builtin.number')
    }
    if (entity) {
      const match = this.numberExp.exec(entity.entity)
      if (match) {
        return Number(match[0])
      }
    }
    return Number.NaN
  },
  parseBoolean (utterance) {
    utterance = utterance.trim()
    if (this.yesExp.test(utterance)) {
      return true
    } else if (this.noExp.test(utterance)) {
      return false
    }
    return undefined
  },
  findBestMatch (choices, utterance, threshold) {
    if (threshold === undefined) {
      threshold = 0.6
    }
    let best = null
    const matches = this.findAllMatches(choices, utterance, threshold)
    matches.forEach((value) => {
      if (!best || value.score > best.score) {
        best = value
      }
    })
    return best
  },
  findAllMatches (choices, utterance, threshold) {
    if (threshold === void 0) {
      threshold = 0.6
    }
    const matches = []
    utterance = utterance.trim().toLowerCase()
    const tokens = utterance.split(' ')
    this.expandChoices(choices).forEach((choice, index) => {
      let score = 0.0
      const value = choice.trim().toLowerCase()
      if (value.indexOf(utterance) >= 0) {
        score = utterance.length / value.length
      } else if (utterance.indexOf(value) >= 0) {
        score = Math.min(0.5 + (value.length / utterance.length), 0.9)
      } else {
        let matched = ''
        tokens.forEach((token) => {
          if (value.indexOf(token) >= 0) {
            matched += token
          }
        })
        score = matched.length / value.length
      }
      if (score > threshold) {
        matches.push({
          index: index,
          entity: choice,
          score: score
        })
      }
    })
    return matches
  },
  expandChoices (choices) {
    if (!choices) {
      return []
    } else if (Array.isArray(choices)) {
      return choices
    } else if (typeof choices === 'string') {
      return choices.split('|')
    } else if (typeof choices === 'object') {
      const list = []
      for (let key in choices) {
        list.push(key)
      }
      return list
    } else {
      return [choices.toString()]
    }
  }
}

export default entityRecognizer
