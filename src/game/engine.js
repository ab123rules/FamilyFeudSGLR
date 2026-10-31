/* ------------------------------------------------------------------ */
/*  Family Feud rules engine — a pure reducer, so the rules are testable */
/*                                                                      */
/*  Format follows the current TV show:                                 */
/*   - Face-off: first to buzz answers. The #1 answer wins control      */
/*     outright; otherwise the opponent answers and the higher answer   */
/*     wins. Misses pass the face-off back and forth until someone hits.*/
/*   - Winner chooses PLAY or PASS.                                     */
/*   - Controlling team answers in turn; 3 strikes hands the opponent   */
/*     one group answer to steal the entire bank.                       */
/*   - Rounds 1-2 single, round 3 double, round 4+ triple points.       */
/*   - First team to the target (300) at the end of a round wins. If    */
/*     nobody gets there, a triple-points Sudden Death face-off decides.*/
/*   - Winners play Fast Money: two players, five questions, 20 and 25  */
/*     seconds, 200 points to win.                                      */
/* ------------------------------------------------------------------ */

export const STANDARD_MULTIPLIERS = [1, 1, 2, 3]
export const FAST_MONEY_GOAL = 200
export const FAST_MONEY_SECONDS = [20, 25]
export const MAX_ANSWERS = 8

export const other = (team) => (team === 0 ? 1 : 0)

export const multiplierFor = (roundIndex, suddenDeath) =>
  suddenDeath ? 3 : STANDARD_MULTIPLIERS[roundIndex] ?? 3

export const multiplierLabel = (multiplier, suddenDeath) => {
  if (suddenDeath) return 'Sudden Death'
  if (multiplier === 2) return 'Double Points'
  if (multiplier === 3) return 'Triple Points'
  return 'Single Points'
}

export function prepareAnswers(answers = []) {
  return answers
    .map((a) => ({ text: String(a.text || '').trim(), points: Math.max(0, Math.round(Number(a.points) || 0)) }))
    .filter((a) => a.text && a.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, MAX_ANSWERS)
}

export const playerName = (config, team, slot) => {
  const players = config.teams[team].players.filter((p) => p.trim())
  if (players.length === 0) return `${config.teams[team].name} player`
  return players[((slot % players.length) + players.length) % players.length]
}

/* ---------------- Fast Money answer matching ---------------- */

const normalizeWord = (w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w)

export const normalizeAnswer = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !['a', 'an', 'the', 'some', 'my', 'your'].includes(w))
    .map(normalizeWord)
    .join(' ')

/** Survey answers may list aliases with "/", e.g. "Frogs/Toads". Returns index or -1. */
export function matchSurveyAnswer(guess, answers) {
  const g = normalizeAnswer(guess)
  if (!g) return -1
  const squash = (s) => s.replace(/ /g, '')
  for (let i = 0; i < answers.length; i++) {
    const aliases = answers[i].text.split('/').map(normalizeAnswer).filter(Boolean)
    if (aliases.some((a) => a === g || squash(a) === squash(g))) return i
  }
  for (let i = 0; i < answers.length; i++) {
    const aliases = answers[i].text.split('/').map(normalizeAnswer).filter(Boolean)
    if (aliases.some((a) => (a.length >= 3 && g.includes(a)) || (g.length >= 3 && a.includes(g)))) return i
  }
  return -1
}

/** Judges a typed main-round answer: a new hit, a repeat of a revealed answer, or a miss. */
export function judgeAnswer(round, text) {
  const index = matchSurveyAnswer(text, round.answers)
  if (index === -1) return { result: 'miss' }
  return { result: round.revealed[index] ? 'repeat' : 'hit', index }
}

/* ---------------- State construction ---------------- */

export const initialGameState = { screen: 'setup', config: null, event: null }

function makeEvent(state, type, extra = {}) {
  return { type, seq: (state.event?.seq || 0) + 1, ...extra }
}

export function normalizeConfig(config) {
  return {
    ...config,
    targetScore: Math.max(1, Number(config.targetScore) || 300),
    rounds: config.rounds.map((r) => ({ question: r.question.trim(), answers: prepareAnswers(r.answers) })),
    suddenDeath: { question: config.suddenDeath.question.trim(), answers: prepareAnswers(config.suddenDeath.answers) },
    fastMoney: config.fastMoney.map((q) => ({ question: q.question.trim(), answers: prepareAnswers(q.answers) })),
  }
}

function buildRound(state, roundIndex, suddenDeath) {
  const q = suddenDeath ? state.config.suddenDeath : state.config.rounds[roundIndex]
  const multiplier = multiplierFor(roundIndex, suddenDeath)
  return {
    ...state,
    screen: 'roundIntro',
    roundIndex,
    suddenDeath,
    round: {
      question: q.question,
      answers: q.answers,
      revealed: q.answers.map(() => false),
      multiplier,
      phase: 'faceoff', // faceoff | playOrPass | play | steal | roundEnd
      buzzed: null, // team that buzzed first
      answering: null, // team whose player is answering in the face-off
      firstHit: null, // { team, index } — first face-off answer that was on the board
      faceoffMisses: 0,
      faceoffWinner: null,
      control: null,
      strikes: 0,
      bank: 0,
      turn: 0,
      faceoffSlot: roundIndex,
      result: null, // { team, points, how: 'cleared' | 'stolen' | 'defended' | 'suddenDeath' }
    },
  }
}

export function newGame(config) {
  return {
    screen: 'title',
    config: normalizeConfig(config),
    scores: [0, 0],
    roundIndex: 0,
    suddenDeath: false,
    round: null,
    winner: null,
    fm: null,
    event: null,
  }
}

/* ---------------- Round helpers ---------------- */

const setRevealed = (revealed, i) => revealed.map((v, idx) => (idx === i ? true : v))

function award(state, round, team, how) {
  const scores = [...state.scores]
  scores[team] += round.bank
  return {
    ...state,
    scores,
    round: { ...round, phase: 'roundEnd', result: { team, points: round.bank, how } },
  }
}

function faceoffWon(state, round, team, event) {
  if (state.suddenDeath) {
    return { ...award(state, round, team, 'suddenDeath'), event: makeEvent(state, 'roundWon', { team }) }
  }
  return { ...state, round: { ...round, phase: 'playOrPass', faceoffWinner: team, answering: null }, event }
}

function revealAnswer(state, index) {
  const r = state.round
  if (index < 0 || index >= r.answers.length || r.revealed[index]) return state
  const revealed = setRevealed(r.revealed, index)

  if (r.phase === 'roundEnd') {
    return { ...state, round: { ...r, revealed }, event: makeEvent(state, 'reveal', { index, quiet: true }) }
  }

  const points = r.answers[index].points * r.multiplier
  const round = { ...r, revealed, bank: r.bank + points }
  const ding = makeEvent(state, 'reveal', { index })

  if (r.phase === 'faceoff') {
    if (r.answering === null) return state
    const team = r.answering
    const isTop = r.answers[index].points === r.answers[0].points
    if (isTop) return faceoffWon(state, round, team, ding)
    if (r.firstHit) {
      const beatsFirst = r.answers[index].points > r.answers[r.firstHit.index].points
      return faceoffWon(state, round, beatsFirst ? team : r.firstHit.team, ding)
    }
    if (r.faceoffMisses === 0 && team === r.buzzed) {
      return { ...state, round: { ...round, firstHit: { team, index }, answering: other(team) }, event: ding }
    }
    return faceoffWon(state, round, team, ding)
  }

  if (r.phase === 'play') {
    const advanced = { ...round, turn: r.turn + 1 }
    if (revealed.every(Boolean)) {
      return { ...award(state, advanced, r.control, 'cleared'), event: makeEvent(state, 'roundWon', { index, team: r.control }) }
    }
    return { ...state, round: advanced, event: ding }
  }

  if (r.phase === 'steal') {
    return { ...award(state, round, other(r.control), 'stolen'), event: makeEvent(state, 'roundWon', { index, team: other(r.control) }) }
  }

  return state
}

function strike(state) {
  const r = state.round
  if (r.phase === 'faceoff') {
    if (r.answering === null) return state
    const event = makeEvent(state, 'strike', { count: 1 })
    if (r.firstHit) return faceoffWon(state, r, r.firstHit.team, event)
    return {
      ...state,
      round: { ...r, faceoffMisses: r.faceoffMisses + 1, answering: other(r.answering) },
      event,
    }
  }
  if (r.phase === 'play') {
    const strikes = r.strikes + 1
    const round = { ...r, strikes, turn: r.turn + 1, phase: strikes >= 3 ? 'steal' : 'play' }
    return { ...state, round, event: makeEvent(state, 'strike', { count: strikes }) }
  }
  if (r.phase === 'steal') {
    return { ...award(state, r, r.control, 'defended'), event: makeEvent(state, 'strike', { count: 1 }) }
  }
  return state
}

function nextAfterRound(state) {
  const { scores, config, round } = state
  if (state.suddenDeath) return { ...state, screen: 'gameOver', winner: round.result.team, event: makeEvent(state, 'gameWon') }
  const leader = scores[0] === scores[1] ? null : scores[0] > scores[1] ? 0 : 1
  if (leader !== null && scores[leader] >= config.targetScore) {
    return { ...state, screen: 'gameOver', winner: leader, event: makeEvent(state, 'gameWon') }
  }
  if (state.roundIndex + 1 < config.rounds.length) return buildRound(state, state.roundIndex + 1, false)
  return buildRound(state, config.rounds.length, true)
}

/* ---------------- Fast Money ---------------- */

const emptyFmColumn = () => Array.from({ length: 5 }, () => ({ text: '', match: -1, shown: 0, passed: false }))

function nextOpenQuestion(column, from) {
  for (let step = 1; step <= column.length; step++) {
    const i = (from + step) % column.length
    if (!column[i].text) return i
  }
  return -1
}

export const fmPoints = (entry, question) => (entry.match >= 0 ? question.answers[entry.match]?.points || 0 : 0)

export function fmTotal(fm, questions) {
  return fm.entries.reduce(
    (sum, col) => sum + col.reduce((s, e, q) => s + (e.shown === 2 ? fmPoints(e, questions[q]) : 0), 0),
    0,
  )
}

function fastMoney(state, action) {
  const fm = state.fm
  const questions = state.config.fastMoney
  switch (action.type) {
    case 'FM_SET_PLAYER': {
      const players = [...fm.players]
      players[action.index] = action.name
      return { ...state, fm: { ...fm, players } }
    }
    case 'FM_BEGIN_PLAYER':
      if (fm.phase !== 'ready') return state
      return {
        ...state,
        fm: { ...fm, phase: 'play', qIndex: 0, timeLeft: FAST_MONEY_SECONDS[fm.player], running: false, hideFirst: fm.player === 1 },
      }
    case 'FM_TOGGLE_TIMER':
      if (fm.phase !== 'play' || fm.timeLeft <= 0) return state
      return { ...state, fm: { ...fm, running: !fm.running } }
    case 'TICK': {
      if (fm.phase !== 'play' || !fm.running) return state
      const timeLeft = Math.max(0, fm.timeLeft - 1)
      if (timeLeft === 0) return { ...state, fm: { ...fm, timeLeft, running: false }, event: makeEvent(state, 'timeUp') }
      return { ...state, fm: { ...fm, timeLeft } }
    }
    case 'FM_ANSWER': {
      if (fm.phase !== 'play') return state
      const text = String(action.text || '').trim()
      if (!text) return state
      const match = matchSurveyAnswer(text, questions[fm.qIndex].answers)
      if (fm.player === 1) {
        // Repeating player one's answer gets the buzzer and must answer again.
        const first = fm.entries[0][fm.qIndex]
        const sameText = first.text && normalizeAnswer(first.text) === normalizeAnswer(text)
        const sameSurvey = match >= 0 && first.match === match
        if (sameText || sameSurvey) return { ...state, event: makeEvent(state, 'duplicate') }
      }
      const entries = fm.entries.map((col) => col.map((e) => ({ ...e })))
      const col = entries[fm.player]
      col[fm.qIndex] = { ...col[fm.qIndex], text, match, passed: false }
      const nextQ = nextOpenQuestion(col, fm.qIndex)
      if (nextQ === -1) return { ...state, fm: { ...fm, entries, running: false, phase: 'reveal', hideFirst: false } }
      return { ...state, fm: { ...fm, entries, qIndex: nextQ } }
    }
    case 'FM_PASS': {
      if (fm.phase !== 'play') return state
      const entries = fm.entries.map((col) => col.map((e) => ({ ...e })))
      entries[fm.player][fm.qIndex].passed = true
      const nextQ = nextOpenQuestion(entries[fm.player], fm.qIndex)
      return { ...state, fm: { ...fm, entries, qIndex: nextQ === -1 ? fm.qIndex : nextQ } }
    }
    case 'FM_DUPLICATE':
      if (fm.phase !== 'play' || fm.player !== 1) return state
      return { ...state, event: makeEvent(state, 'duplicate') }
    case 'FM_END_PLAYER':
      if (fm.phase !== 'play') return state
      return { ...state, fm: { ...fm, phase: 'reveal', running: false, hideFirst: false } }
    case 'FM_SET_MATCH': {
      if (fm.phase !== 'reveal' || fm.player !== action.player) return state
      const entries = fm.entries.map((col) => col.map((e) => ({ ...e })))
      entries[action.player][action.q].match = action.match
      return { ...state, fm: { ...fm, entries } }
    }
    case 'FM_REVEAL_NEXT': {
      if (fm.phase !== 'reveal') return state
      const col = fm.entries[fm.player]
      const q = col.findIndex((e) => e.shown < 2)
      if (q === -1) {
        if (fm.player === 0 && fmTotal(fm, questions) < FAST_MONEY_GOAL) {
          return { ...state, fm: { ...fm, player: 1, phase: 'ready' } }
        }
        const total = fmTotal(fm, questions)
        return {
          ...state,
          fm: { ...fm, phase: 'done' },
          event: makeEvent(state, total >= FAST_MONEY_GOAL ? 'fmWon' : 'fmLost'),
        }
      }
      const entries = fm.entries.map((c) => c.map((e) => ({ ...e })))
      const entry = entries[fm.player][q]
      // Blank answers skip straight to their 0.
      entry.shown = entry.text ? entry.shown + 1 : 2
      const nextFm = { ...fm, entries }
      let event = state.event
      if (entry.shown === 2) {
        const pts = fmPoints(entry, questions[q])
        event = makeEvent(state, pts > 0 ? 'reveal' : 'fmZero', { points: pts })
        if (fmTotal(nextFm, questions) >= FAST_MONEY_GOAL) {
          return { ...state, fm: { ...nextFm, phase: 'done' }, event: makeEvent(state, 'fmWon') }
        }
      }
      return { ...state, fm: nextFm, event }
    }
    default:
      return state
  }
}

/* ---------------- Reducer ---------------- */

export function gameReducer(state, action) {
  switch (action.type) {
    case 'NEW_GAME':
      return newGame(action.config)
    case 'RESTORE':
      return action.state
    case 'TO_SETUP':
      return { ...initialGameState }
    case 'START_GAME':
      if (state.screen !== 'title') return state
      return buildRound(state, 0, false)
    case 'START_ROUND':
      if (state.screen !== 'roundIntro') return state
      return { ...state, screen: 'round' }
    case 'BUZZ': {
      const r = state.round
      if (state.screen !== 'round' || r.phase !== 'faceoff' || r.buzzed !== null) return state
      return { ...state, round: { ...r, buzzed: action.team, answering: action.team }, event: makeEvent(state, 'buzz', { team: action.team }) }
    }
    case 'REVEAL':
      if (state.screen !== 'round') return state
      return revealAnswer(state, action.index)
    case 'REVEAL_ALL': {
      const r = state.round
      if (state.screen !== 'round' || r.phase !== 'roundEnd' || r.revealed.every(Boolean)) return state
      return { ...state, round: { ...r, revealed: r.revealed.map(() => true) }, event: makeEvent(state, 'reveal', { quiet: true }) }
    }
    case 'STRIKE':
      if (state.screen !== 'round') return state
      return strike(state)
    case 'SUBMIT_ANSWER': {
      // Typed answer: reveal it if it's on the board, otherwise it's a strike
      // (repeating an answer already on the board is a strike too, like the show).
      const r = state.round
      if (state.screen !== 'round' || !['faceoff', 'play', 'steal'].includes(r.phase)) return state
      if (r.phase === 'faceoff' && r.answering === null) return state
      const verdict = judgeAnswer(r, action.text)
      return verdict.result === 'hit' ? revealAnswer(state, verdict.index) : strike(state)
    }
    case 'CHOOSE': {
      const r = state.round
      if (state.screen !== 'round' || r.phase !== 'playOrPass') return state
      const control = action.choice === 'play' ? r.faceoffWinner : other(r.faceoffWinner)
      const round = { ...r, phase: 'play', control, turn: 0 }
      // A tiny board can be cleared in the face-off; nothing is left to play for.
      if (r.revealed.every(Boolean)) return { ...award(state, round, control, 'cleared'), event: makeEvent(state, 'roundWon', { team: control }) }
      return { ...state, round }
    }
    case 'NEXT_ROUND':
      if (state.screen !== 'round' || state.round.phase !== 'roundEnd') return state
      return nextAfterRound(state)
    case 'ADJUST_SCORE': {
      const scores = [...state.scores]
      scores[action.team] = Math.max(0, scores[action.team] + action.delta)
      return { ...state, scores }
    }
    case 'END_GAME_NOW': {
      if (!['title', 'roundIntro', 'round'].includes(state.screen)) return state
      const winner = state.scores[0] === state.scores[1] ? null : state.scores[0] > state.scores[1] ? 0 : 1
      return { ...state, screen: 'gameOver', winner, event: makeEvent(state, 'gameWon') }
    }
    case 'FM_START': {
      if (state.screen !== 'gameOver' || state.winner === null) return state
      const players = [playerName(state.config, state.winner, 0), playerName(state.config, state.winner, 1)]
      return {
        ...state,
        screen: 'fastMoney',
        fm: { phase: 'ready', player: 0, players, entries: [emptyFmColumn(), emptyFmColumn()], qIndex: 0, timeLeft: FAST_MONEY_SECONDS[0], running: false, hideFirst: false },
      }
    }
    default:
      if (state.screen === 'fastMoney' && state.fm) return fastMoney(state, action)
      return state
  }
}

/* ---------------- Undo wrapper ---------------- */

// Transient actions keep history as-is; reset actions start a fresh history.
const TRANSIENT = new Set(['TICK', 'FM_SET_PLAYER', 'FM_TOGGLE_TIMER'])
const RESETS = new Set(['RESTORE', 'NEW_GAME', 'TO_SETUP'])

export function undoable(reducer) {
  return (state, action) => {
    const { past = [], ...present } = state
    if (action.type === 'UNDO') {
      if (past.length === 0) return state
      const prev = past[past.length - 1]
      // Undoing a Fast Money answer must not hand back clock time.
      const keepClock =
        present.fm?.phase === 'play' && prev.fm?.phase === 'play' && present.fm.player === prev.fm.player
      const fm = keepClock ? { ...prev.fm, timeLeft: present.fm.timeLeft, running: present.fm.running } : prev.fm
      return { ...prev, fm, past: past.slice(0, -1), event: null }
    }
    const next = reducer(present, action)
    if (next === present) return state
    if (TRANSIENT.has(action.type)) return { ...next, past }
    if (RESETS.has(action.type)) return { ...next, past: [] }
    return { ...next, past: [...past, present].slice(-80) }
  }
}
