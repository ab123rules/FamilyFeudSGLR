/* Synthesized show sounds (Web Audio) — no audio files to load. */

let ctx = null
let muted = false

function audio() {
  if (!ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function tone({ freq, type = 'sine', at = 0, dur = 0.3, gain = 0.18, slideTo, attack = 0.005 }) {
  const ac = audio()
  if (!ac || muted) return
  const t0 = ac.currentTime + at
  const osc = ac.createOscillator()
  const amp = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur)
  amp.gain.setValueAtTime(0.0001, t0)
  amp.gain.exponentialRampToValueAtTime(gain, t0 + attack)
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(amp).connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.05)
}

export const sfx = {
  /** The bright two-bell "ding" of a revealed answer. */
  ding() {
    tone({ freq: 1567.98, type: 'triangle', dur: 1.1, gain: 0.22 })
    tone({ freq: 2093, type: 'sine', at: 0.04, dur: 1.2, gain: 0.12 })
    tone({ freq: 783.99, type: 'sine', dur: 0.9, gain: 0.08 })
  },
  /** The harsh strike buzzer. */
  strike() {
    tone({ freq: 98, type: 'square', dur: 0.85, gain: 0.16, attack: 0.01 })
    tone({ freq: 104, type: 'sawtooth', dur: 0.85, gain: 0.12, attack: 0.01 })
  },
  /** Face-off buzz-in. */
  buzz() {
    tone({ freq: 523, type: 'square', dur: 0.35, gain: 0.1 })
    tone({ freq: 659, type: 'square', at: 0.02, dur: 0.33, gain: 0.07 })
  },
  /** Fast Money duplicate: "eh-eh". */
  duplicate() {
    tone({ freq: 220, type: 'square', dur: 0.18, gain: 0.12 })
    tone({ freq: 220, type: 'square', at: 0.24, dur: 0.18, gain: 0.12 })
  },
  /** Fast Money zero — low thud. */
  zero() {
    tone({ freq: 140, type: 'square', dur: 0.5, gain: 0.12, slideTo: 90 })
  },
  timeUp() {
    tone({ freq: 196, type: 'sawtooth', dur: 1.2, gain: 0.14 })
    tone({ freq: 207, type: 'square', dur: 1.2, gain: 0.08 })
  },
  /** Round / game win flourish, in a minor key for the spooky edition. */
  fanfare() {
    ;[392, 466.16, 587.33, 783.99].forEach((f, i) =>
      tone({ freq: f, type: 'triangle', at: i * 0.12, dur: i === 3 ? 1.2 : 0.3, gain: 0.16 }),
    )
  },
  /** Low organ swell for intros. */
  organ() {
    ;[110, 164.81, 220, 261.63].forEach((f, i) =>
      tone({ freq: f, type: 'sawtooth', at: i * 0.05, dur: 2.2, gain: 0.05, attack: 0.4 }),
    )
  },
}

export const setMuted = (value) => {
  muted = value
}

export function playEvent(event) {
  if (!event) return
  switch (event.type) {
    case 'reveal':
      sfx.ding()
      break
    case 'strike':
      sfx.strike()
      break
    case 'buzz':
      sfx.buzz()
      break
    case 'duplicate':
      sfx.duplicate()
      break
    case 'fmZero':
      sfx.zero()
      break
    case 'timeUp':
      sfx.timeUp()
      break
    case 'roundWon':
      sfx.ding()
      setTimeout(() => sfx.fanfare(), 500)
      break
    case 'gameWon':
    case 'fmWon':
      sfx.fanfare()
      setTimeout(() => sfx.fanfare(), 650)
      break
    case 'fmLost':
      sfx.zero()
      break
    default:
  }
}
