'use strict'

import sprintf from 'sprintf-js'

export function extractArgs (a, fromPos = 0) {
  const args = []
  for (let i = fromPos; i < a.length; i++) {
    args[i - fromPos] = a[i]
  }
  return args
}

export function randomPrompt (prompts) {
  if (Array.isArray(prompts)) {
    const i = Math.floor(Math.random() * prompts.length)
    return prompts[i]
  }
  return prompts
}

export function composePrompt (ses, prompts, args) {
  let connector = ''
  let prompt = ''
  for (var i = 0; i < prompts.length; i++) {
    prompt += connector + ses.getText(randomPrompt(prompts[1]))
    connector = ' '
  }
  return args && args.length > 0 ? sprintf.vsprintf(prompt, args) : prompt
}
