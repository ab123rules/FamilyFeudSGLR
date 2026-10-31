import { gameReducer, newGame, undoable, matchSurveyAnswer, fmTotal, FAST_MONEY_GOAL } from './engine'
import { halloweenConfig, validateConfig, emptyConfig } from '../data/defaultConfig'

const play = (state, ...actions) => actions.reduce((s, a) => gameReducer(s, a), state)
const toRound = () => play(newGame(halloweenConfig()), { type: 'START_GAME' }, { type: 'START_ROUND' })
// Round 1 answers (sorted): Witch 30, Ghost 18, Vampire 14, Zombie 11, Superhero 9, Pirate 7, Princess 5, Skeleton 4

describe('face-off', () => {
  test('top answer wins control outright', () => {
    const s = play(toRound(), { type: 'BUZZ', team: 1 }, { type: 'REVEAL', index: 0 })
    expect(s.round.phase).toBe('playOrPass')
    expect(s.round.faceoffWinner).toBe(1)
    expect(s.round.bank).toBe(30)
  })

  test('non-top answer lets the opponent answer; higher answer wins', () => {
    let s = play(toRound(), { type: 'BUZZ', team: 0 }, { type: 'REVEAL', index: 3 })
    expect(s.round.phase).toBe('faceoff')
    expect(s.round.answering).toBe(1)
    s = gameReducer(s, { type: 'REVEAL', index: 1 })
    expect(s.round.faceoffWinner).toBe(1)
    expect(s.round.bank).toBe(11 + 18)
  })

  test('opponent with a lower answer loses the face-off', () => {
    const s = play(toRound(), { type: 'BUZZ', team: 0 }, { type: 'REVEAL', index: 1 }, { type: 'REVEAL', index: 5 })
    expect(s.round.faceoffWinner).toBe(0)
  })

  test('opponent missing after a hit gives control to the first team', () => {
    const s = play(toRound(), { type: 'BUZZ', team: 0 }, { type: 'REVEAL', index: 4 }, { type: 'STRIKE' })
    expect(s.round.faceoffWinner).toBe(0)
  })

  test('first buzzer misses, opponent hits anything and wins', () => {
    const s = play(toRound(), { type: 'BUZZ', team: 0 }, { type: 'STRIKE' }, { type: 'REVEAL', index: 7 })
    expect(s.round.faceoffWinner).toBe(1)
  })

  test('both miss, it keeps alternating until someone hits', () => {
    const s = play(toRound(), { type: 'BUZZ', team: 1 }, { type: 'STRIKE' }, { type: 'STRIKE' }, { type: 'REVEAL', index: 6 })
    expect(s.round.faceoffWinner).toBe(1)
    expect(s.round.strikes).toBe(0)
  })
})

describe('board play and steal', () => {
  const inControl = (team = 0) =>
    play(toRound(), { type: 'BUZZ', team }, { type: 'REVEAL', index: 0 }, { type: 'CHOOSE', choice: 'play' })

  test('pass hands control to the other team', () => {
    const s = play(toRound(), { type: 'BUZZ', team: 0 }, { type: 'REVEAL', index: 0 }, { type: 'CHOOSE', choice: 'pass' })
    expect(s.round.control).toBe(1)
  })

  test('clearing the board banks every point', () => {
    let s = inControl(0)
    for (let i = 1; i < 8; i++) s = gameReducer(s, { type: 'REVEAL', index: i })
    expect(s.round.phase).toBe('roundEnd')
    expect(s.round.result).toMatchObject({ team: 0, how: 'cleared', points: 98 })
    expect(s.scores).toEqual([98, 0])
  })

  test('three strikes opens the steal; a correct steal takes the whole bank', () => {
    let s = play(inControl(0), { type: 'REVEAL', index: 1 }, { type: 'STRIKE' }, { type: 'STRIKE' }, { type: 'STRIKE' })
    expect(s.round.phase).toBe('steal')
    s = gameReducer(s, { type: 'REVEAL', index: 2 })
    expect(s.round.result).toMatchObject({ team: 1, how: 'stolen', points: 30 + 18 + 14 })
    expect(s.scores).toEqual([0, 62])
  })

  test('a failed steal gives the bank to the controlling team', () => {
    const s = play(inControl(0), { type: 'STRIKE' }, { type: 'STRIKE' }, { type: 'STRIKE' }, { type: 'STRIKE' })
    expect(s.round.result).toMatchObject({ team: 0, how: 'defended', points: 30 })
  })

  test('revealing leftovers after the round adds no points', () => {
    let s = play(inControl(0), { type: 'STRIKE' }, { type: 'STRIKE' }, { type: 'STRIKE' }, { type: 'STRIKE' })
    s = play(s, { type: 'REVEAL_ALL' })
    expect(s.round.revealed.every(Boolean)).toBe(true)
    expect(s.scores).toEqual([30, 0])
  })
})

describe('typed answers', () => {
  test('a typed face-off answer reveals the matching tile', () => {
    const s = play(toRound(), { type: 'BUZZ', team: 0 }, { type: 'SUBMIT_ANSWER', text: 'a witch' })
    expect(s.round.revealed[0]).toBe(true)
    expect(s.round.faceoffWinner).toBe(0)
  })

  test('a typed answer not on the board is a strike', () => {
    let s = play(toRound(), { type: 'BUZZ', team: 0 }, { type: 'REVEAL', index: 0 }, { type: 'CHOOSE', choice: 'play' })
    s = gameReducer(s, { type: 'SUBMIT_ANSWER', text: 'astronaut' })
    expect(s.round.strikes).toBe(1)
    s = gameReducer(s, { type: 'SUBMIT_ANSWER', text: 'Zombies' })
    expect(s.round.revealed[3]).toBe(true)
  })

  test('repeating an answer already on the board is a strike', () => {
    let s = play(toRound(), { type: 'BUZZ', team: 0 }, { type: 'REVEAL', index: 0 }, { type: 'CHOOSE', choice: 'play' })
    s = gameReducer(s, { type: 'SUBMIT_ANSWER', text: 'witch' })
    expect(s.round.strikes).toBe(1)
  })

  test('a typed steal answer on the board takes the bank', () => {
    let s = play(toRound(), { type: 'BUZZ', team: 0 }, { type: 'REVEAL', index: 0 }, { type: 'CHOOSE', choice: 'play' },
      { type: 'STRIKE' }, { type: 'STRIKE' }, { type: 'STRIKE' })
    s = gameReducer(s, { type: 'SUBMIT_ANSWER', text: 'pirates' })
    expect(s.round.result).toMatchObject({ team: 1, how: 'stolen' })
  })
})

describe('game flow', () => {
  test('round 3 is double, round 4 triple', () => {
    let s = toRound()
    const finishRound = (st) =>
      play(st, { type: 'BUZZ', team: 0 }, { type: 'STRIKE' }, { type: 'STRIKE' }, { type: 'REVEAL', index: st.round.answers.length - 1 },
        { type: 'CHOOSE', choice: 'play' }, { type: 'STRIKE' }, { type: 'STRIKE' }, { type: 'STRIKE' }, { type: 'STRIKE' },
        { type: 'NEXT_ROUND' }, { type: 'START_ROUND' })
    s = finishRound(s)
    expect(s.round.multiplier).toBe(1)
    s = finishRound(s)
    expect(s.round.multiplier).toBe(2)
    s = finishRound(s)
    expect(s.round.multiplier).toBe(3)
    s = finishRound(s)
    expect(s.suddenDeath).toBe(true)
    expect(s.round.multiplier).toBe(3)
  })

  test('reaching the target ends the game', () => {
    let s = toRound()
    s = { ...s, scores: [290, 0] }
    s = play(s, { type: 'BUZZ', team: 0 }, { type: 'REVEAL', index: 0 }, { type: 'CHOOSE', choice: 'play' },
      { type: 'STRIKE' }, { type: 'STRIKE' }, { type: 'STRIKE' }, { type: 'STRIKE' }, { type: 'NEXT_ROUND' })
    expect(s.screen).toBe('gameOver')
    expect(s.winner).toBe(0)
  })

  test('sudden death: face-off winner takes the game with triple points', () => {
    let s = toRound()
    s = { ...s, roundIndex: 3, round: { ...s.round, phase: 'roundEnd', result: { team: 0, points: 0, how: 'defended' } } }
    s = play(s, { type: 'NEXT_ROUND' }, { type: 'START_ROUND' })
    expect(s.suddenDeath).toBe(true)
    s = play(s, { type: 'BUZZ', team: 1 }, { type: 'REVEAL', index: 2 }, { type: 'REVEAL', index: 1 })
    expect(s.round.result).toMatchObject({ team: 0, how: 'suddenDeath', points: (20 + 25) * 3 })
    s = gameReducer(s, { type: 'NEXT_ROUND' })
    expect(s.screen).toBe('gameOver')
    expect(s.winner).toBe(0)
  })
})

describe('fast money', () => {
  const fmGame = () => {
    let s = toRound()
    s = { ...s, screen: 'gameOver', winner: 1 }
    return gameReducer(s, { type: 'FM_START' })
  }

  test('auto-matches typed answers, including aliases and plurals', () => {
    const answers = [{ text: 'Frogs/Toads', points: 22 }, { text: 'Black cat/Cat', points: 49 }]
    expect(matchSurveyAnswer('a toad', answers)).toBe(0)
    expect(matchSurveyAnswer('Cats', answers)).toBe(1)
    expect(matchSurveyAnswer('broom', answers)).toBe(-1)
  })

  test('player one answers then reveals; player two needs to reach 200 combined', () => {
    let s = play(fmGame(), { type: 'FM_BEGIN_PLAYER' })
    expect(s.fm.timeLeft).toBe(20)
    for (const text of ['orange', 'pumpkin', 'coffin', 'bat', 'ghost']) s = gameReducer(s, { type: 'FM_ANSWER', text })
    expect(s.fm.phase).toBe('reveal')
    // Two clicks per row: answer, then points. 52+71+68 = 191 after three rows; bat (31) pushes past 200.
    for (let i = 0; i < 8; i++) s = gameReducer(s, { type: 'FM_REVEAL_NEXT' })
    expect(fmTotal(s.fm, s.config.fastMoney)).toBe(52 + 71 + 68 + 31)
    expect(s.fm.phase).toBe('done')
    expect(fmTotal(s.fm, s.config.fastMoney)).toBeGreaterThanOrEqual(FAST_MONEY_GOAL)
  })

  test('passing skips a question and returns to it', () => {
    let s = play(fmGame(), { type: 'FM_BEGIN_PLAYER' }, { type: 'FM_PASS' })
    expect(s.fm.qIndex).toBe(1)
    for (const text of ['x', 'y', 'z', 'w']) s = gameReducer(s, { type: 'FM_ANSWER', text })
    expect(s.fm.qIndex).toBe(0)
  })

  test('timer counts down and stops at zero', () => {
    let s = play(fmGame(), { type: 'FM_BEGIN_PLAYER' }, { type: 'FM_TOGGLE_TIMER' })
    for (let i = 0; i < 25; i++) s = gameReducer(s, { type: 'TICK' })
    expect(s.fm.timeLeft).toBe(0)
    expect(s.fm.running).toBe(false)
  })
})

describe('host tools', () => {
  test('undo steps back one host action', () => {
    const reducer = undoable(gameReducer)
    let s = { ...toRound(), past: [] }
    s = reducer(s, { type: 'BUZZ', team: 0 })
    s = reducer(s, { type: 'STRIKE' })
    s = reducer(s, { type: 'UNDO' })
    expect(s.round.faceoffMisses).toBe(0)
    expect(s.round.answering).toBe(0)
  })

  test('validation flags blank questions', () => {
    expect(validateConfig(halloweenConfig())).toEqual([])
    expect(validateConfig(emptyConfig()).length).toBeGreaterThan(0)
  })
})
