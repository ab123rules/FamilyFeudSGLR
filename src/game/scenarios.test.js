/* Every host action in every phase: what should happen, and what must be ignored. */
import { gameReducer, newGame, undoable, matchSurveyAnswer, fmTotal } from './engine'
import { halloweenConfig, sanitizeConfig, validateConfig } from '../data/defaultConfig'

const run = (state, ...actions) => actions.reduce((s, a) => gameReducer(s, a), state)
const A = (type, extra = {}) => ({ type, ...extra })
const startRound = (config = halloweenConfig()) => run(newGame(config), A('START_GAME'), A('START_ROUND'))
// Round 1 sorted: Witch 30, Ghost 18, Vampire 14, Zombie 11, Superhero 9, Pirate 7, Princess 5, Skeleton 4
const controlled = (team = 0) => run(startRound(), A('BUZZ', { team }), A('REVEAL', { index: 0 }), A('CHOOSE', { choice: 'play' }))
const stealing = () => run(controlled(0), A('STRIKE'), A('STRIKE'), A('STRIKE'))
const stealDefended = () => run(stealing(), A('STRIKE'))

describe('screens ignore actions that do not belong to them', () => {
  test('title: only START_GAME moves on', () => {
    const s = newGame(halloweenConfig())
    for (const a of [A('BUZZ', { team: 0 }), A('REVEAL', { index: 0 }), A('STRIKE'), A('START_ROUND'), A('NEXT_ROUND'), A('FM_START')]) {
      expect(gameReducer(s, a)).toBe(s)
    }
  })

  test('round intro: board actions are ignored until the round starts', () => {
    const s = run(newGame(halloweenConfig()), A('START_GAME'))
    expect(s.screen).toBe('roundIntro')
    for (const a of [A('BUZZ', { team: 0 }), A('REVEAL', { index: 0 }), A('STRIKE'), A('SUBMIT_ANSWER', { text: 'witch' })]) {
      expect(gameReducer(s, a)).toBe(s)
    }
  })
})

describe('face-off before anyone buzzes', () => {
  test('reveal, strike, typed answers and play/pass are all ignored', () => {
    const s = startRound()
    for (const a of [A('REVEAL', { index: 0 }), A('STRIKE'), A('SUBMIT_ANSWER', { text: 'witch' }), A('CHOOSE', { choice: 'play' }), A('NEXT_ROUND'), A('REVEAL_ALL')]) {
      expect(gameReducer(s, a)).toBe(s)
    }
  })

  test('only the first buzz counts', () => {
    const s = run(startRound(), A('BUZZ', { team: 1 }), A('BUZZ', { team: 0 }))
    expect(s.round.buzzed).toBe(1)
    expect(s.round.answering).toBe(1)
  })
})

describe('face-off answers', () => {
  test('second player tying the first player’s points does not win', () => {
    const config = halloweenConfig()
    config.rounds[0].answers = [{ text: 'A', points: 40 }, { text: 'B', points: 20 }, { text: 'C', points: 20 }]
    const s = run(startRound(config), A('BUZZ', { team: 0 }), A('REVEAL', { index: 1 }), A('REVEAL', { index: 2 }))
    expect(s.round.faceoffWinner).toBe(0)
  })

  test('answers tied for the top spot both count as the #1 answer', () => {
    const config = halloweenConfig()
    config.rounds[0].answers = [{ text: 'A', points: 30 }, { text: 'B', points: 30 }, { text: 'C', points: 10 }]
    const s = run(startRound(config), A('BUZZ', { team: 1 }), A('REVEAL', { index: 1 }))
    expect(s.round.faceoffWinner).toBe(1)
  })

  test('second player repeating the first answer is a miss, so the first team wins', () => {
    const s = run(startRound(), A('BUZZ', { team: 0 }), A('SUBMIT_ANSWER', { text: 'ghost' }), A('SUBMIT_ANSWER', { text: 'GHOSTS' }))
    expect(s.round.faceoffWinner).toBe(0)
    expect(s.event.type).toBe('strike')
  })

  test('misses keep alternating teams; whoever hits first wins', () => {
    let s = run(startRound(), A('BUZZ', { team: 0 }))
    const order = []
    for (let i = 0; i < 5; i++) {
      order.push(s.round.answering)
      s = gameReducer(s, A('SUBMIT_ANSWER', { text: 'nonsense' }))
    }
    expect(order).toEqual([0, 1, 0, 1, 0])
    expect(s.round.answering).toBe(1)
    s = gameReducer(s, A('SUBMIT_ANSWER', { text: 'skeletons' }))
    expect(s.round.faceoffWinner).toBe(1)
  })

  test('face-off misses never count toward the three strikes', () => {
    const s = run(startRound(), A('BUZZ', { team: 0 }), A('STRIKE'), A('STRIKE'), A('REVEAL', { index: 2 }), A('CHOOSE', { choice: 'play' }))
    expect(s.round.strikes).toBe(0)
    expect(s.round.phase).toBe('play')
  })

  test('face-off points go into the bank at the round multiplier', () => {
    let s = startRound()
    s = { ...s, round: { ...s.round, multiplier: 2 } }
    s = run(s, A('BUZZ', { team: 0 }), A('REVEAL', { index: 3 }), A('REVEAL', { index: 1 }))
    expect(s.round.bank).toBe((11 + 18) * 2)
  })

  test('a face-off that clears a one-answer board ends the round at play/pass', () => {
    const config = halloweenConfig()
    config.rounds[0].answers = [{ text: 'Only', points: 50 }]
    const s = run(startRound(config), A('BUZZ', { team: 1 }), A('REVEAL', { index: 0 }), A('CHOOSE', { choice: 'pass' }))
    expect(s.round.phase).toBe('roundEnd')
    expect(s.round.result).toMatchObject({ team: 0, points: 50, how: 'cleared' })
  })
})

describe('play or pass', () => {
  test('board actions wait for the choice', () => {
    const s = run(startRound(), A('BUZZ', { team: 0 }), A('REVEAL', { index: 0 }))
    for (const a of [A('REVEAL', { index: 1 }), A('STRIKE'), A('SUBMIT_ANSWER', { text: 'ghost' }), A('BUZZ', { team: 1 }), A('NEXT_ROUND')]) {
      expect(gameReducer(s, a)).toBe(s)
    }
  })
})

describe('board play', () => {
  test('revealing a tile twice or a slot that does not exist is ignored', () => {
    const s = run(controlled(0), A('REVEAL', { index: 1 }))
    expect(gameReducer(s, A('REVEAL', { index: 1 }))).toBe(s)
    expect(gameReducer(s, A('REVEAL', { index: 9 }))).toBe(s)
    expect(gameReducer(s, A('REVEAL', { index: -1 }))).toBe(s)
  })

  test('player turns advance on every answer, right or wrong', () => {
    const s = run(controlled(0), A('SUBMIT_ANSWER', { text: 'ghost' }), A('SUBMIT_ANSWER', { text: 'nope' }))
    expect(s.round.turn).toBe(2)
  })

  test('blank typed answers are strikes, not crashes', () => {
    const s = run(controlled(0), A('SUBMIT_ANSWER', { text: '   ' }))
    expect(s.round.strikes).toBe(1)
  })

  test('buzzing mid-round does nothing', () => {
    const s = controlled(0)
    expect(gameReducer(s, A('BUZZ', { team: 1 }))).toBe(s)
  })

  test('the last answer on the board wins the round even with two strikes', () => {
    let s = run(controlled(0), A('STRIKE'), A('STRIKE'))
    for (let i = 1; i < 8; i++) s = gameReducer(s, A('REVEAL', { index: i }))
    expect(s.round.result).toMatchObject({ team: 0, how: 'cleared' })
  })
})

describe('steal', () => {
  test('a typed repeat of a revealed answer fails the steal', () => {
    const s = run(stealing(), A('SUBMIT_ANSWER', { text: 'witch' }))
    expect(s.round.result).toMatchObject({ team: 0, how: 'defended' })
  })

  test('a correct steal includes the stolen answer in the bank', () => {
    const s = run(stealing(), A('SUBMIT_ANSWER', { text: 'skeleton' }))
    expect(s.round.result).toMatchObject({ team: 1, points: 34, how: 'stolen' })
    expect(s.scores).toEqual([0, 34])
  })

  test('the round cannot be skipped mid-steal', () => {
    const s = stealing()
    expect(gameReducer(s, A('NEXT_ROUND'))).toBe(s)
  })
})

describe('after the round', () => {
  test('only reveals (worth nothing) and next round are accepted', () => {
    const s = stealDefended()
    for (const a of [A('STRIKE'), A('SUBMIT_ANSWER', { text: 'ghost' }), A('CHOOSE', { choice: 'play' }), A('BUZZ', { team: 0 })]) {
      expect(gameReducer(s, a)).toBe(s)
    }
    const r = run(s, A('REVEAL', { index: 5 }))
    expect(r.round.bank).toBe(s.round.bank)
    expect(r.scores).toEqual(s.scores)
    const all = run(r, A('REVEAL_ALL'))
    expect(gameReducer(all, A('REVEAL_ALL'))).toBe(all)
  })
})

describe('winning the game', () => {
  const playOut = (s) =>
    run(s, A('BUZZ', { team: 0 }), A('REVEAL', { index: 0 }), A('CHOOSE', { choice: 'play' }),
      A('STRIKE'), A('STRIKE'), A('STRIKE'), A('STRIKE'), A('NEXT_ROUND'), A('START_ROUND'))

  test('a custom target ends the game as soon as a round pushes a team over it', () => {
    const config = { ...halloweenConfig(), targetScore: 45 }
    let s = startRound(config)
    s = run(s, A('BUZZ', { team: 0 }), A('REVEAL', { index: 0 }), A('CHOOSE', { choice: 'play' }), A('REVEAL', { index: 1 }),
      A('STRIKE'), A('STRIKE'), A('STRIKE'), A('STRIKE'), A('NEXT_ROUND'))
    expect(s.screen).toBe('gameOver')
    expect(s.winner).toBe(0)
  })

  test('extra rounds stay triple, then Sudden Death', () => {
    const config = halloweenConfig()
    config.rounds.push({ question: 'Fifth', answers: [{ text: 'x', points: 10 }] })
    let s = startRound(config)
    for (let i = 0; i < 4; i++) s = playOut(s)
    expect(s.roundIndex).toBe(4)
    expect(s.suddenDeath).toBe(false)
    expect(s.round.multiplier).toBe(3)
    s = playOut(s)
    expect(s.suddenDeath).toBe(true)
  })

  test('the Sudden Death winner wins even if they were behind', () => {
    let s = startRound()
    s = { ...s, scores: [250, 10], roundIndex: 3, round: { ...s.round, phase: 'roundEnd', result: { team: 0, points: 0, how: 'defended' } } }
    s = run(s, A('NEXT_ROUND'), A('START_ROUND'), A('BUZZ', { team: 1 }), A('SUBMIT_ANSWER', { text: 'freddy krueger' }))
    expect(s.round.result.team).toBe(1)
    s = gameReducer(s, A('NEXT_ROUND'))
    expect(s.winner).toBe(1)
  })

  test('Sudden Death has no play/pass or steal', () => {
    let s = startRound()
    s = { ...s, roundIndex: 3, round: { ...s.round, phase: 'roundEnd', result: { team: 0, points: 0, how: 'defended' } } }
    s = run(s, A('NEXT_ROUND'), A('START_ROUND'), A('BUZZ', { team: 0 }), A('STRIKE'), A('STRIKE'), A('STRIKE'), A('REVEAL', { index: 4 }))
    expect(s.round.phase).toBe('roundEnd')
    expect(s.round.result.how).toBe('suddenDeath')
  })

  test('ending early on a tie has no winner and no Fast Money', () => {
    const s = run(startRound(), A('END_GAME_NOW'))
    expect(s.winner).toBeNull()
    expect(gameReducer(s, A('FM_START'))).toBe(s)
  })

  test('score fixes never go below zero', () => {
    const s = run(startRound(), A('ADJUST_SCORE', { team: 0, delta: -10 }))
    expect(s.scores[0]).toBe(0)
  })
})

describe('fast money', () => {
  const fm = () => {
    const s = { ...startRound(), screen: 'gameOver', winner: 0 }
    return gameReducer(s, A('FM_START'))
  }
  const answerAll = (s, answers) => answers.reduce((st, text) => gameReducer(st, A('FM_ANSWER', { text })), s)

  test('nothing happens before a player is started', () => {
    const s = fm()
    for (const a of [A('FM_ANSWER', { text: 'orange' }), A('FM_PASS'), A('FM_TOGGLE_TIMER'), A('TICK'), A('FM_REVEAL_NEXT'), A('FM_END_PLAYER')]) {
      expect(gameReducer(s, a)).toBe(s)
    }
  })

  test('the clock only runs when started and stops at zero', () => {
    let s = run(fm(), A('FM_BEGIN_PLAYER'))
    expect(gameReducer(s, A('TICK'))).toBe(s)
    s = run(s, A('FM_TOGGLE_TIMER'), A('TICK'), A('FM_TOGGLE_TIMER'), A('TICK'))
    expect(s.fm.timeLeft).toBe(19)
    s = run(s, A('FM_TOGGLE_TIMER'), ...Array(30).fill(A('TICK')))
    expect(s.fm.timeLeft).toBe(0)
    expect(gameReducer(s, A('FM_TOGGLE_TIMER'))).toBe(s)
  })

  test('player two gets 25 seconds and player one’s answers are covered', () => {
    let s = run(fm(), A('FM_BEGIN_PLAYER'))
    s = answerAll(s, ['purple', 'ice', 'cave', 'owl', 'wind'])
    for (let i = 0; i < 10; i++) s = gameReducer(s, A('FM_REVEAL_NEXT'))
    expect(fmTotal(s.fm, s.config.fastMoney)).toBe(7 + 4 + 6 + 6)
    s = gameReducer(s, A('FM_REVEAL_NEXT'))
    expect(s.fm.phase).toBe('ready')
    s = gameReducer(s, A('FM_BEGIN_PLAYER'))
    expect(s.fm.timeLeft).toBe(25)
    expect(s.fm.hideFirst).toBe(true)
  })

  test('duplicates of player one are buzzed and not recorded, by wording or by survey answer', () => {
    let s = run(fm(), A('FM_BEGIN_PLAYER'))
    // 0 + 71 + 68 + 49 + 0 = 188, short of 200, so player two plays.
    s = answerAll(s, ['pumpkin', 'pumpkin', 'coffin', 'cat', 'zzz'])
    for (let i = 0; i < 11; i++) s = gameReducer(s, A('FM_REVEAL_NEXT'))
    s = gameReducer(s, A('FM_BEGIN_PLAYER'))
    expect(s.fm.player).toBe(1)
    let d = gameReducer(s, A('FM_ANSWER', { text: 'PUMPKIN!' }))
    expect(d.event.type).toBe('duplicate')
    expect(d.fm.qIndex).toBe(0)
    expect(d.fm.entries[1][0].text).toBe('')
    d = run(d, A('FM_ANSWER', { text: 'black' }), A('FM_ANSWER', { text: 'jack-o-lantern' }))
    expect(d.event.type).toBe('duplicate')
    expect(d.fm.qIndex).toBe(1)
  })

  test('blank answers are ignored; unanswered rows reveal as zero', () => {
    let s = run(fm(), A('FM_BEGIN_PLAYER'), A('FM_ANSWER', { text: '  ' }))
    expect(s.fm.qIndex).toBe(0)
    s = run(s, A('FM_ANSWER', { text: 'orange' }), A('FM_END_PLAYER'))
    expect(s.fm.phase).toBe('reveal')
    for (let i = 0; i < 6; i++) s = gameReducer(s, A('FM_REVEAL_NEXT'))
    expect(fmTotal(s.fm, s.config.fastMoney)).toBe(52)
  })

  test('passing every question keeps the player on the board', () => {
    let s = run(fm(), A('FM_BEGIN_PLAYER'))
    for (let i = 0; i < 7; i++) s = gameReducer(s, A('FM_PASS'))
    expect(s.fm.phase).toBe('play')
    expect(s.fm.qIndex).toBe(2)
  })

  test('the host can only fix matches during that player’s reveal', () => {
    let s = run(fm(), A('FM_BEGIN_PLAYER'))
    expect(gameReducer(s, A('FM_SET_MATCH', { player: 0, q: 0, match: 1 }))).toBe(s)
    s = answerAll(s, ['tangerine', 'x', 'x', 'x', 'x'])
    expect(s.fm.entries[0][0].match).toBe(-1)
    s = gameReducer(s, A('FM_SET_MATCH', { player: 0, q: 0, match: 0 }))
    s = run(s, A('FM_REVEAL_NEXT'), A('FM_REVEAL_NEXT'))
    expect(fmTotal(s.fm, s.config.fastMoney)).toBe(52)
    expect(gameReducer(s, A('FM_SET_MATCH', { player: 1, q: 0, match: 0 }))).toBe(s)
  })

  test('falling short of 200 after both players is a loss', () => {
    let s = run(fm(), A('FM_BEGIN_PLAYER'), A('FM_END_PLAYER'))
    for (let i = 0; i < 6; i++) s = gameReducer(s, A('FM_REVEAL_NEXT'))
    s = run(s, A('FM_BEGIN_PLAYER'), A('FM_END_PLAYER'))
    for (let i = 0; i < 6; i++) s = gameReducer(s, A('FM_REVEAL_NEXT'))
    expect(s.fm.phase).toBe('done')
    expect(s.event.type).toBe('fmLost')
  })

  test('the game cannot be ended from the host menu during Fast Money', () => {
    const s = fm()
    expect(gameReducer(s, A('END_GAME_NOW'))).toBe(s)
  })
})

describe('undo', () => {
  const reducer = undoable(gameReducer)
  const withHistory = (s, ...actions) => actions.reduce((st, a) => reducer(st, a), { ...s, past: [] })

  test('undo with nothing to undo does nothing', () => {
    const s = { ...startRound(), past: [] }
    expect(reducer(s, A('UNDO'))).toBe(s)
  })

  test('undo walks a whole round back to the face-off and clears sound events', () => {
    let s = withHistory(startRound(), A('BUZZ', { team: 0 }), A('REVEAL', { index: 0 }), A('CHOOSE', { choice: 'play' }), A('STRIKE'))
    for (let i = 0; i < 4; i++) s = reducer(s, A('UNDO'))
    expect(s.round.phase).toBe('faceoff')
    expect(s.round.buzzed).toBeNull()
    expect(s.event).toBeNull()
  })

  test('undo restores scores after an awarded round', () => {
    let s = withHistory(stealing(), A('SUBMIT_ANSWER', { text: 'pirate' }))
    expect(s.scores[1]).toBeGreaterThan(0)
    s = reducer(s, A('UNDO'))
    expect(s.scores).toEqual([0, 0])
    expect(s.round.phase).toBe('steal')
  })

  test('undoing a Fast Money answer keeps the clock where it is', () => {
    const base = { ...startRound(), screen: 'gameOver', winner: 0 }
    let s = withHistory(base, A('FM_START'), A('FM_BEGIN_PLAYER'), A('FM_TOGGLE_TIMER'), A('FM_ANSWER', { text: 'orange' }))
    for (let i = 0; i < 6; i++) s = reducer(s, A('TICK'))
    s = reducer(s, A('UNDO'))
    expect(s.fm.entries[0][0].text).toBe('')
    expect(s.fm.timeLeft).toBe(14)
    expect(s.fm.running).toBe(true)
  })
})

describe('answer matching', () => {
  const answers = [
    { text: "Reese's cups", points: 24 },
    { text: "M&M's", points: 9 },
    { text: 'Cobwebs/Spiderwebs', points: 20 },
    { text: 'Black cat/Cat', points: 49 },
  ]
  test.each([
    ['reeses', 0],
    ['REESE’S CUP', 0],
    ['m&ms', 1],
    ['spider webs', 2],
    ['a cobweb', 2],
    ['the cats', 3],
    ['', -1],
    ['the', -1],
    ['dog', -1],
  ])('%s → %i', (guess, expected) => {
    expect(matchSurveyAnswer(guess, answers)).toBe(expected)
  })
})

describe('setup data', () => {
  test('garbage becomes a playable default setup', () => {
    for (const raw of [null, 42, 'x', [], {}]) expect(validateConfig(sanitizeConfig(raw))).toEqual([])
  })

  test('a partial file keeps what it has and fills the rest', () => {
    const c = sanitizeConfig({ rounds: [{ question: 'Q', answers: [{ text: 'A', points: '12' }, { points: 3 }] }], teams: [{ name: 'Bats' }] })
    expect(c.rounds).toHaveLength(1)
    expect(c.rounds[0].answers[0]).toEqual({ text: 'A', points: 12 })
    expect(c.teams[0].name).toBe('Bats')
    expect(c.teams[1].name).toBe('The Goblins')
    expect(c.fastMoney).toHaveLength(5)
  })

  test('Fast Money questions are only required when Fast Money is on', () => {
    const c = halloweenConfig()
    c.fastMoney[2] = { question: '', answers: [] }
    expect(validateConfig(c)).toHaveLength(2)
    expect(validateConfig({ ...c, fastMoneyEnabled: false })).toEqual([])
  })
})
