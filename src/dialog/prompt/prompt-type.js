'use strict'

const promptType = {}

promptType[promptType['text'] = 0] = 'text'
promptType[promptType['number'] = 1] = 'number'
promptType[promptType['confirm'] = 2] = 'confirm'
promptType[promptType['choice'] = 3] = 'choice'
promptType[promptType['time'] = 4] = 'time'
promptType[promptType['attachment'] = 5] = 'attachment'

export default promptType
