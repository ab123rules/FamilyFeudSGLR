/* Browser storage is a convenience: everything works when it is unavailable. */

import { sanitizeConfig } from '../data/defaultConfig'

const SETUP_KEY = 'feud.halloween.setup.v1'
const GAME_KEY = 'feud.halloween.game.v1'

const read = (key) => {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const write = (key, value) => {
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage blocked — ignore */
  }
}

export const loadSetup = () => {
  const raw = read(SETUP_KEY)
  return raw ? sanitizeConfig(raw) : null
}
export const saveSetup = (config) => write(SETUP_KEY, config)

export const loadGame = () => {
  const game = read(GAME_KEY)
  return game && game.screen && game.screen !== 'setup' && game.config ? game : null
}
export const saveGame = (game) => {
  if (!game || game.screen === 'setup') write(GAME_KEY, null)
  else {
    const { past, event, ...rest } = game
    write(GAME_KEY, { ...rest, event: null })
  }
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Accepts an exported setup file; returns a config or throws a readable error. */
export function parseSetupFile(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error("That file isn't valid JSON. Export a setup from this app and try again.")
  }
  const ok = data && typeof data === 'object' && Array.isArray(data.rounds) && data.rounds.length > 0
  if (!ok) throw new Error("That file doesn't look like a Feud setup. Export one from this app and try again.")
  return sanitizeConfig(data)
}
