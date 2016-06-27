'use strict'

export default class MemoryStorage {
  constructor () {
    this.store = {}
  }

  get (id, callback) {
    if (this.store.hasOwnProperty(id)) {
      callback(null, JSON.parse(this.store[id]))
    } else {
      callback(null, null)
    }
  }

  save (id, data, callback) {
    this.store[id] = JSON.stringify(data || {})
    if (callback) {
      callback(null)
    }
  }

  delete (id) {
    if (this.store.hasOwnProperty(id)) {
      delete this.store[id]
    }
  }
}
