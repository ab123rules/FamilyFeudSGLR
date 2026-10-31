import React, { useEffect, useRef, useState } from 'react'
import { SpookyConfetti, StageBackdrop } from './Art'
import { CountUp } from './Board'
import { DockButton, HostDock, PeekCard } from './Show'
import { FAST_MONEY_GOAL, FAST_MONEY_SECONDS, fmPoints, fmTotal } from '../game/engine'

function FmRow({ entry, question, hidden }) {
  const showText = !hidden && entry.shown >= 1 && entry.text
  const showPoints = !hidden && entry.shown >= 2
  return (
    <div className={`fm-row ${hidden ? 'is-covered' : ''}`}>
      <span className={`fm-answer ${showText ? 'is-on' : ''}`}>{showText ? entry.text : ''}</span>
      <span className={`fm-points ${showPoints ? 'is-on' : ''}`}>{showPoints && <span className="num">{fmPoints(entry, question)}</span>}</span>
    </div>
  )
}

export default function FastMoney({ game, dispatch, tools, peeking }) {
  const { fm, config } = game
  const questions = config.fastMoney
  const total = fmTotal(fm, questions)
  const [draft, setDraft] = useState('')
  const inputRef = useRef(null)
  const playerLabel = fm.players[fm.player] || `Player ${fm.player + 1}`

  useEffect(() => {
    if (fm.phase === 'play') inputRef.current?.focus()
  }, [fm.phase, fm.qIndex])

  // Duplicate takeover: its own timer so later events can't leave it stuck.
  const [dupKey, setDupKey] = useState(null)
  const dupTimer = useRef(null)
  useEffect(() => {
    if (game.event?.type !== 'duplicate') return
    setDupKey(game.event.seq)
    clearTimeout(dupTimer.current)
    dupTimer.current = setTimeout(() => setDupKey(null), 1100)
  }, [game.event])
  useEffect(() => () => clearTimeout(dupTimer.current), [])

  const submit = (e) => {
    e.preventDefault()
    if (!draft.trim()) return
    if (!fm.running && fm.timeLeft > 0 && fm.entries[fm.player].every((x) => !x.text)) dispatch({ type: 'FM_TOGGLE_TIMER' })
    dispatch({ type: 'FM_ANSWER', text: draft })
    setDraft('')
  }

  const q = questions[fm.qIndex]
  const revealQ = fm.entries[fm.player].findIndex((e) => e.shown < 2)
  const peekQ = fm.phase === 'play' ? fm.qIndex : Math.max(0, revealQ)

  let dock
  if (fm.phase === 'ready') {
    dock = (
      <HostDock
        title={fm.player === 0 ? 'Fast Money! Who is playing first?' : `${fm.players[0] || 'Player 1'} has ${total} points. Bring in player two!`}
        detail={
          fm.player === 0
            ? 'Send the second player out of the room. Player one gets 20 seconds for five questions.'
            : 'Player two gets 25 seconds. Repeat one of player one’s answers and you’ll hear the buzzer, so answer again.'
        }
        tools={tools}
      >
        <input
          className="field dock-field"
          aria-label={`Player ${fm.player + 1} name`}
          value={fm.players[fm.player]}
          onChange={(e) => dispatch({ type: 'FM_SET_PLAYER', index: fm.player, name: e.target.value })}
        />
        <DockButton tone="primary" onClick={() => dispatch({ type: 'FM_BEGIN_PLAYER' })}>
          Start player {fm.player + 1}
        </DockButton>
      </HostDock>
    )
  } else if (fm.phase === 'play') {
    dock = (
      <HostDock
        title={`${playerLabel}, question ${fm.qIndex + 1} of 5`}
        detail={
          fm.running
            ? 'Type what they say and press Enter. The next question comes up automatically.'
            : 'The clock starts with the first answer, or start it yourself.'
        }
        tools={tools}
      >
        <form className="dock-form" onSubmit={submit}>
          <input
            ref={inputRef}
            className="field dock-field"
            aria-label="Contestant's answer"
            placeholder={`${playerLabel}'s answer`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <DockButton tone="primary" onClick={submit} keyHint="Enter">Lock in</DockButton>
        </form>
        <DockButton onClick={() => dispatch({ type: 'FM_PASS' })}>Pass</DockButton>
        {fm.player === 1 && (
          <DockButton tone="danger" onClick={() => { dispatch({ type: 'FM_DUPLICATE' }); setDraft('') }}>
            Duplicate
          </DockButton>
        )}
        <DockButton onClick={() => dispatch({ type: 'FM_TOGGLE_TIMER' })} disabled={fm.timeLeft === 0}>
          {fm.running ? 'Pause clock' : 'Start clock'}
        </DockButton>
        <DockButton tone={fm.timeLeft === 0 ? 'primary' : 'default'} onClick={() => dispatch({ type: 'FM_END_PLAYER' })}>
          {fm.timeLeft === 0 ? 'Time’s up: reveal' : 'Done'}
        </DockButton>
      </HostDock>
    )
  } else if (fm.phase === 'reveal') {
    const col = fm.entries[fm.player]
    const nextQ = col.findIndex((e) => e.shown < 2)
    const nextEntry = col[nextQ]
    dock = (
      <HostDock
        title={nextQ === -1 ? `${playerLabel} finished with ${total} points` : `Q${nextQ + 1}: ${questions[nextQ].question}`}
        detail={
          nextQ === -1
            ? 'Continue to the next player.'
            : nextEntry.shown === 0
              ? `“${nextEntry.text || 'no answer'}”. Read it out, then show it.`
              : 'Check the match, then: survey says…'
        }
        tools={tools}
      >
        {nextQ !== -1 && nextEntry.text && (
          <select
            className="field dock-field"
            aria-label="Matching survey answer"
            value={nextEntry.match}
            onChange={(e) => dispatch({ type: 'FM_SET_MATCH', player: fm.player, q: nextQ, match: Number(e.target.value) })}
          >
            <option value={-1}>Not on the survey: 0</option>
            {questions[nextQ].answers.map((a, i) => (
              <option key={i} value={i}>{`${a.text}: ${a.points}`}</option>
            ))}
          </select>
        )}
        <DockButton tone="primary" onClick={() => dispatch({ type: 'FM_REVEAL_NEXT' })} keyHint="Space">
          {nextQ === -1 ? 'Continue' : nextEntry.shown === 0 ? 'Show answer' : 'Survey says'}
        </DockButton>
      </HostDock>
    )
  } else {
    const won = total >= FAST_MONEY_GOAL
    dock = (
      <HostDock
        title={won ? `${total} points. They win Fast Money!` : `So close: ${total} points`}
        detail={won ? 'Cue the screaming.' : `They needed ${FAST_MONEY_GOAL}. Give them a big hand anyway!`}
        tools={tools}
      >
        <DockButton tone="primary" onClick={() => dispatch({ type: 'TO_SETUP' })}>New game</DockButton>
      </HostDock>
    )
  }

  const won = fm.phase === 'done' && total >= FAST_MONEY_GOAL
  const lowTime = fm.phase === 'play' && fm.timeLeft <= 5

  return (
    <div className="show-screen fm-screen">
      <StageBackdrop />
      {won && <SpookyConfetti />}
      <div className="fm-head">
        <h1 className="fm-title">Fast Money</h1>
        {['play', 'ready'].includes(fm.phase) && (
          <div className={`fm-timer ${lowTime ? 'is-low' : ''}`} aria-live="polite">
            <span className="num">{fm.phase === 'play' ? fm.timeLeft : FAST_MONEY_SECONDS[fm.player]}</span>
          </div>
        )}
      </div>
      <div className="board-frame fm-frame">
        <div className="board-bulbs" aria-hidden="true" />
        <div className="fm-grid">
          {[0, 1].map((p) => (
            <div key={p} className="fm-col">
              {fm.entries[p].map((entry, q) => (
                <FmRow key={q} entry={entry} question={questions[q]} hidden={p === 0 && fm.hideFirst} />
              ))}
            </div>
          ))}
        </div>
        <div className="fm-total">
          <span>Total</span>
          <span className="fm-total-num">
            <span className="num"><CountUp value={total} duration={700} /></span>
          </span>
        </div>
      </div>
      {won && <div className="fm-win-banner">Winners!</div>}
      {dupKey && (
        <div className="fm-dup" key={dupKey} aria-live="assertive">
          <span>Duplicate!</span>
        </div>
      )}
      {fm.phase === 'play' && (
        <div className="question-bar">
          <span>{q.question}</span>
        </div>
      )}
      {dock}
      {peeking && fm.phase !== 'done' && (
        <PeekCard title={`Answer key, question ${peekQ + 1}`} answers={questions[peekQ].answers} />
      )}
    </div>
  )
}
