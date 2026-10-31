import React, { useEffect, useRef, useState } from 'react'
import { FeudLogo, Icon, Pumpkin, SpookyConfetti, StageBackdrop } from './Art'
import { BankBox, ScoreBox, StrikeOverlay, StrikeTally, SurveyBoard } from './Board'
import { judgeAnswer, multiplierLabel, other, playerName } from '../game/engine'

/* ---------------- Host dock (bottom bar on every show screen) ---------------- */

export function HostDock({ title, detail, children, tools }) {
  return (
    <div className="host-dock">
      <div className="host-copy" key={title}>
        <p className="host-title">{title}</p>
        {detail && <p className="host-detail">{detail}</p>}
      </div>
      <div className="host-actions">{children}</div>
      <div className="host-tools">{tools}</div>
    </div>
  )
}

export function Key({ children }) {
  return <kbd className="key">{children}</kbd>
}

export function DockButton({ onClick, tone = 'default', children, disabled, keyHint }) {
  return (
    <button type="button" className={`dock-btn tone-${tone}`} onClick={onClick} disabled={disabled}>
      {children}
      {keyHint && <Key>{keyHint}</Key>}
    </button>
  )
}

/** Host types what the contestant said; the app reveals the match or calls the strike. */
function AnswerField({ round, dispatch, onVerdict, focusKey }) {
  const [draft, setDraft] = useState('')
  const inputRef = useRef(null)
  useEffect(() => {
    inputRef.current?.focus()
  }, [focusKey])

  const submit = (e) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    const verdict = judgeAnswer(round, text)
    const shown = verdict.index !== undefined ? round.answers[verdict.index].text.split('/')[0].toUpperCase() : ''
    onVerdict(
      verdict.result === 'hit'
        ? { tone: 'hit', text: `“${text}” matched ${shown}` }
        : verdict.result === 'repeat'
          ? { tone: 'miss', text: `${shown} is already on the board. That's a strike.` }
          : { tone: 'miss', text: `“${text}” isn't on the board. That's a strike.` },
    )
    dispatch({ type: 'SUBMIT_ANSWER', text })
    setDraft('')
  }

  return (
    <form className="dock-form" onSubmit={submit}>
      <input
        ref={inputRef}
        className="field dock-field"
        aria-label="Type the contestant's answer"
        placeholder="Type their answer…"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        autoComplete="off"
        spellCheck="false"
      />
      <DockButton tone="primary" onClick={submit} keyHint="Enter">
        Check
      </DockButton>
    </form>
  )
}

/** The answer key, shown only while the host holds H or the eye button. */
export function PeekCard({ title, answers }) {
  return (
    <div className="peek-card" role="dialog" aria-label="Answer key">
      <p className="peek-title">{title}</p>
      <ol>
        {answers.map((a, i) => (
          <li key={i}>
            <span>{a.text}</span>
            <span>{a.points}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function HostTools({ muted, onToggleMute, onUndo, canUndo, onPeek, onMenu }) {
  return (
    <>
      {onPeek && (
        <button
          type="button"
          className="tool-btn"
          title="Hold to peek at the answers (or hold H)"
          aria-label="Hold to peek at the answers"
          onPointerDown={() => onPeek(true)}
          onPointerUp={() => onPeek(false)}
          onPointerLeave={() => onPeek(false)}
        >
          <Icon name="eye" />
        </button>
      )}
      <button type="button" className="tool-btn" onClick={onUndo} disabled={!canUndo} title="Undo (U)" aria-label="Undo">
        <Icon name="undo" />
      </button>
      <button type="button" className="tool-btn" onClick={onToggleMute} title="Sound (M)" aria-label={muted ? 'Unmute' : 'Mute'}>
        <Icon name={muted ? 'mute' : 'sound'} />
      </button>
      <button
        type="button"
        className="tool-btn"
        title="Full screen (F)"
        aria-label="Full screen"
        onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.())}
      >
        <Icon name="expand" />
      </button>
      <button type="button" className="tool-btn" onClick={onMenu} title="Host menu" aria-label="Host menu">
        <Icon name="menu" />
      </button>
    </>
  )
}

/** Score fixes and exits, for judges' rulings and early endings. */
export function HostMenu({ game, dispatch, onClose }) {
  const teams = game.config.teams
  return (
    <div className="menu-scrim" onClick={onClose}>
      <div className="host-menu" role="dialog" aria-label="Host menu" onClick={(e) => e.stopPropagation()}>
        <div className="host-menu-head">
          <h2>Host menu</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close menu">
            <Icon name="close" />
          </button>
        </div>
        {game.scores && (
          <div className="adjust-grid">
            {teams.map((t, i) => (
              <div key={i} className="adjust-row">
                <span className="adjust-name">{t.name}</span>
                <span className="adjust-score">{game.scores[i]}</span>
                {[-10, -5, 5, 10].map((d) => (
                  <button key={d} type="button" className="ghost-btn" onClick={() => dispatch({ type: 'ADJUST_SCORE', team: i, delta: d })}>
                    {d > 0 ? `+${d}` : d}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
        <div className="shortcut-list">
          <h3>Keyboard</h3>
          <ul>
            <li><Key>A</Key> / <Key>L</Key> left or right team buzzes in</li>
            <li>Type the answer, then <Key>Enter</Key>: it reveals the match or gives a strike</li>
            <li>Close call? Click a tile to accept it anyway</li>
            <li><Key>Space</Key> continue</li>
            <li><Key>H</Key> hold to peek at the answers</li>
            <li><Key>U</Key> undo · <Key>M</Key> sound · <Key>F</Key> full screen</li>
          </ul>
        </div>
        <div className="menu-actions">
          {['round', 'roundIntro'].includes(game.screen) && (
            <button type="button" className="ghost-btn" onClick={() => { dispatch({ type: 'END_GAME_NOW' }); onClose() }}>
              End game now
            </button>
          )}
          <button
            type="button"
            className="ghost-btn danger"
            onClick={() => {
              if (window.confirm('Leave this game and go back to Host setup? The game in progress will be lost.')) {
                dispatch({ type: 'TO_SETUP' })
                onClose()
              }
            }}
          >
            Back to setup
          </button>
        </div>
      </div>
    </div>
  )
}

/* ---------------- Title ---------------- */

export function TitleScreen({ game, dispatch, tools }) {
  const [a, b] = game.config.teams
  return (
    <div className="show-screen title-screen">
      <StageBackdrop />
      <div className="title-stack">
        <FeudLogo className="title-logo" />
        <div className="versus">
          <span className="versus-team team-0">{a.name}</span>
          <span className="versus-vs">vs</span>
          <span className="versus-team team-1">{b.name}</span>
        </div>
      </div>
      <Pumpkin className="title-pumpkin pumpkin-left" />
      <Pumpkin className="title-pumpkin pumpkin-right" />
      <HostDock title="Welcome everyone to the show" detail="Introduce the families, then start round one." tools={tools}>
        <DockButton tone="primary" onClick={() => dispatch({ type: 'START_GAME' })} keyHint="Space">
          Start round 1
        </DockButton>
      </HostDock>
    </div>
  )
}

/* ---------------- Round intro splash ---------------- */

export function RoundIntro({ game, dispatch }) {
  const { round, suddenDeath, roundIndex } = game
  return (
    <button type="button" className="show-screen round-intro" onClick={() => dispatch({ type: 'START_ROUND' })}>
      <StageBackdrop />
      <div className="intro-card">
        <span className="intro-round">{suddenDeath ? 'Sudden Death' : `Round ${roundIndex + 1}`}</span>
        <span className={`intro-mult mult-${round.multiplier}`}>
          {suddenDeath ? 'Triple points · top answer wins' : multiplierLabel(round.multiplier, false)}
        </span>
      </div>
    </button>
  )
}

/* ---------------- Main round ---------------- */

function roundPrompt(game, dispatch) {
  const { round, config } = game
  const teamName = (t) => config.teams[t].name
  const faceoffPlayer = (t) => playerName(config, t, round.faceoffSlot)

  switch (round.phase) {
    case 'faceoff': {
      if (round.buzzed === null) {
        return {
          title: game.suddenDeath
            ? `Sudden Death! ${faceoffPlayer(0)} vs ${faceoffPlayer(1)}, hands on the buzzers`
            : `Face-off: ${faceoffPlayer(0)} vs ${faceoffPlayer(1)}`,
          detail: 'Read the question out loud. The first player to hit the buzzer answers first.',
          actions: [
            { label: `${teamName(0)} buzzed`, onClick: () => dispatch({ type: 'BUZZ', team: 0 }), key: 'A', tone: 'team0' },
            { label: `${teamName(1)} buzzed`, onClick: () => dispatch({ type: 'BUZZ', team: 1 }), key: 'L', tone: 'team1' },
          ],
        }
      }
      // After both face-off players miss, teammates take turns down the line.
      const who =
        round.faceoffMisses >= 2
          ? `${teamName(round.answering)}, next player up`
          : `${faceoffPlayer(round.answering)} (${teamName(round.answering)})`
      let detail = 'Type their answer and press Enter.'
      if (round.firstHit) detail = `Type their answer. They need one ranked higher than #${round.firstHit.index + 1} to win control.`
      else if (round.faceoffMisses > 0) detail = 'Nobody has hit the board yet. Any answer on the board wins control.'
      return {
        title: `${who}: your answer?`,
        detail,
        field: true,
        actions: [{ label: 'No answer', onClick: () => dispatch({ type: 'STRIKE' }), tone: 'danger' }],
      }
    }
    case 'playOrPass':
      return {
        title: `${teamName(round.faceoffWinner)} won the face-off. Play or pass?`,
        detail: 'Ask the face-off winner, then tap their choice.',
        actions: [
          { label: 'Play', onClick: () => dispatch({ type: 'CHOOSE', choice: 'play' }), tone: 'primary' },
          { label: `Pass to ${teamName(other(round.faceoffWinner))}`, onClick: () => dispatch({ type: 'CHOOSE', choice: 'pass' }) },
        ],
      }
    case 'play': {
      const next = playerName(config, round.control, round.faceoffSlot + 1 + round.turn)
      return {
        title: `${next}, ${teamName(round.control)}: your answer?`,
        detail: `${3 - round.strikes} strike${3 - round.strikes === 1 ? '' : 's'} left. Type their answer and press Enter.`,
        field: true,
        actions: [{ label: 'Time’s up', onClick: () => dispatch({ type: 'STRIKE' }), tone: 'danger' }],
      }
    }
    case 'steal': {
      const stealer = other(round.control)
      return {
        title: `${teamName(stealer)}, huddle up! One answer steals all ${round.bank} points`,
        detail: 'Type the captain’s answer and press Enter.',
        field: true,
        actions: [{ label: 'No answer', onClick: () => dispatch({ type: 'STRIKE' }), tone: 'danger' }],
      }
    }
    case 'roundEnd': {
      const { result } = round
      const verb = {
        cleared: 'cleared the board for',
        stolen: 'stole',
        defended: 'held on to',
        suddenDeath: 'won Sudden Death with',
      }[result.how]
      const hidden = round.revealed.some((r) => !r)
      return {
        title: `${teamName(result.team)} ${verb} ${result.points} points!`,
        detail: hidden ? 'Reveal the rest of the board for the audience, then move on.' : 'Ready for the next round?',
        actions: [
          ...(hidden ? [{ label: 'Reveal the rest', onClick: () => dispatch({ type: 'REVEAL_ALL' }) }] : []),
          {
            label: game.suddenDeath ? 'See the winner' : 'Next round',
            onClick: () => dispatch({ type: 'NEXT_ROUND' }),
            key: 'Space',
            tone: 'primary',
          },
        ],
      }
    }
    default:
      return { title: '', actions: [] }
  }
}

export function RoundScreen({ game, dispatch, tools, peeking }) {
  const { round, config, scores } = game
  const prompt = roundPrompt(game, dispatch)
  const [verdict, setVerdict] = useState(null)
  useEffect(() => setVerdict(null), [round.question])

  const podiumLabel = (team) => {
    if (round.phase === 'faceoff') {
      if (round.answering === team) return 'Answering'
      return round.buzzed === null ? playerName(config, team, round.faceoffSlot) : ' '
    }
    if (round.phase === 'playOrPass') return round.faceoffWinner === team ? 'Won the face-off' : ''
    if (round.phase === 'play') return round.control === team ? 'Playing' : ''
    if (round.phase === 'steal') return round.control === team ? '' : 'Stealing'
    if (round.phase === 'roundEnd') return round.result.team === team ? `+${round.result.points}` : ''
    return ''
  }
  const lit = (team) =>
    (round.phase === 'faceoff' && round.answering === team) ||
    (round.phase === 'playOrPass' && round.faceoffWinner === team) ||
    (round.phase === 'play' && round.control === team) ||
    (round.phase === 'steal' && round.control !== team) ||
    (round.phase === 'roundEnd' && round.result.team === team)

  const buzzKey = (team) => (game.event?.type === 'buzz' && game.event.team === team ? `buzz-${game.event.seq}` : null)

  const canReveal =
    (round.phase === 'faceoff' && round.answering !== null) || ['play', 'steal', 'roundEnd'].includes(round.phase)

  return (
    <div className={`show-screen round-screen phase-${round.phase}`}>
      <StageBackdrop />
      <div className="round-label">
        {game.suddenDeath ? 'Sudden Death' : `Round ${game.roundIndex + 1}`}
        <span>{multiplierLabel(round.multiplier, game.suddenDeath)}</span>
      </div>
      <div className="show-main">
        <ScoreBox name={config.teams[0].name} score={scores[0]} side="left" lit={lit(0)} label={podiumLabel(0)} buzzKey={buzzKey(0)} />
        <div className="center-col">
          <BankBox value={round.bank} multiplier={round.multiplier} />
          <SurveyBoard
            answers={round.answers}
            revealed={round.revealed}
            onReveal={canReveal ? (i) => dispatch({ type: 'REVEAL', index: i }) : undefined}
            bulbsActive={round.phase === 'roundEnd'}
          />
          <div className="under-board">
            {['play', 'steal'].includes(round.phase) && <StrikeTally strikes={round.strikes} />}
          </div>
        </div>
        <ScoreBox name={config.teams[1].name} score={scores[1]} side="right" lit={lit(1)} label={podiumLabel(1)} buzzKey={buzzKey(1)} />
      </div>
      <div className="question-bar">
        <span>{round.question}</span>
      </div>
      <HostDock
        title={prompt.title}
        detail={
          <>
            {verdict && <span className={`verdict verdict-${verdict.tone}`}>{verdict.text} </span>}
            {prompt.detail}
          </>
        }
        tools={tools}
      >
        {prompt.field && (
          <AnswerField
            round={round}
            dispatch={dispatch}
            onVerdict={setVerdict}
            focusKey={`${round.phase}-${round.answering}`}
          />
        )}
        {prompt.actions.map((a) => (
          <DockButton key={a.label} onClick={a.onClick} tone={a.tone} keyHint={a.key}>
            {a.label}
          </DockButton>
        ))}
      </HostDock>
      {peeking && <PeekCard title="Answer key, host only" answers={round.answers} />}
      <StrikeOverlay event={game.event} />
    </div>
  )
}

/* ---------------- Game over ---------------- */

export function GameOver({ game, dispatch, tools }) {
  const { config, scores, winner } = game
  return (
    <div className="show-screen gameover-screen">
      <StageBackdrop />
      {winner !== null && <SpookyConfetti />}
      <div className="gameover-stack">
        <FeudLogo className="gameover-logo" subtitle="" />
        {winner !== null ? (
          <h1 className="winner-name">
            <span className={`team-${winner}`}>{config.teams[winner].name}</span> win the game!
          </h1>
        ) : (
          <h1 className="winner-name">It's a tie!</h1>
        )}
        <div className="final-scores">
          {config.teams.map((t, i) => (
            <div key={i} className={`final-score ${winner === i ? 'is-winner' : ''}`}>
              <span className="final-num"><span className="num">{scores[i]}</span></span>
              <span className="final-name">{t.name}</span>
            </div>
          ))}
        </div>
      </div>
      <HostDock
        title={winner !== null && config.fastMoneyEnabled ? `${config.teams[winner].name} are playing Fast Money!` : 'That’s our show!'}
        detail={winner !== null && config.fastMoneyEnabled ? 'Pick two players. One leaves the room while the other plays.' : 'Thanks for playing.'}
        tools={tools}
      >
        {winner !== null && config.fastMoneyEnabled && (
          <DockButton tone="primary" onClick={() => dispatch({ type: 'FM_START' })} keyHint="Space">
            Play Fast Money
          </DockButton>
        )}
        <DockButton onClick={() => dispatch({ type: 'TO_SETUP' })}>New game</DockButton>
      </HostDock>
    </div>
  )
}
