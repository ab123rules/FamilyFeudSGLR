import React, { useEffect, useRef, useState } from 'react'
import { StrikeX } from './Art'

/* One slot on the 2 x 4 survey board. Hidden answers show the numbered oval;
   revealed ones flip to the answer and its points, like the show. */
function Tile({ answer, number, revealed, onClick, highlight }) {
  if (!answer) return <div className="tile tile-empty" />
  const clickable = Boolean(onClick) && !revealed
  return (
    <button
      type="button"
      className={`tile ${revealed ? 'is-revealed' : ''} ${highlight ? 'is-highlight' : ''}`}
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
      aria-label={revealed ? `${answer.text}, ${answer.points} points` : `Reveal answer ${number}`}
    >
      <span className="tile-inner">
        <span className="tile-face tile-front">
          <span className="tile-oval"><span className="num">{number}</span></span>
        </span>
        <span className="tile-face tile-back">
          <span className="tile-text">{answer.text.split('/')[0]}</span>
          <span className="tile-points"><span className="num">{answer.points}</span></span>
        </span>
      </span>
    </button>
  )
}

export function SurveyBoard({ answers, revealed, onReveal, bulbsActive }) {
  const slots = Array.from({ length: 8 }, (_, i) => i)
  return (
    <div className={`board-frame ${bulbsActive ? 'bulbs-chase' : ''}`}>
      <div className="board-bulbs" aria-hidden="true" />
      <div className="board-grid">
        {slots.map((i) => (
          <Tile
            key={i}
            number={i + 1}
            answer={answers[i]}
            revealed={revealed[i]}
            onClick={onReveal ? () => onReveal(i) : undefined}
          />
        ))}
      </div>
    </div>
  )
}

/** Animated number that ticks up when a score changes. */
export function CountUp({ value, duration = 900 }) {
  const [shown, setShown] = useState(value)
  useEffect(() => {
    if (shown === value) return
    const from = shown
    const start = performance.now()
    let raf
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setShown(Math.round(from + (value - from) * eased))
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return <>{shown}</>
}

/** Remembers the last rise of a value so it can be celebrated once. */
function useGain(value) {
  const prev = useRef(value)
  const [gain, setGain] = useState(null)
  useEffect(() => {
    if (value > prev.current) setGain({ amount: value - prev.current, key: `${value}-${Date.now()}` })
    prev.current = value
  }, [value])
  return gain
}

export function ScoreBox({ name, score, side, lit, label, buzzKey }) {
  const gain = useGain(score)
  return (
    <div className={`score-podium side-${side} ${lit ? 'is-lit' : ''}`}>
      <div className="score-box">
        {buzzKey && <span key={buzzKey} className="buzz-flash" aria-hidden="true" />}
        {gain && <span key={gain.key} className="score-glow" aria-hidden="true" />}
        <span className="score-num">
          <CountUp value={score} />
        </span>
        {gain && (
          <span key={`g${gain.key}`} className="score-gain" aria-hidden="true">
            +{gain.amount}
          </span>
        )}
      </div>
      <div className="score-name">{name}</div>
      <div className="score-tag" key={label}>
        {label || ' '}
      </div>
    </div>
  )
}

export function BankBox({ value, multiplier }) {
  const gain = useGain(value)
  return (
    <div className="bank-box">
      {gain && <span key={gain.key} className="bank-pulse" aria-hidden="true" />}
      <span className="score-num">
        <CountUp value={value} duration={500} />
      </span>
      {multiplier > 1 && <span className="bank-mult"><span className="num">×{multiplier}</span></span>}
    </div>
  )
}

const STRIKE_MS = 1500

/** Full-page strike takeover: the screen flashes red and shakes, and 1–3
    giant X's slam across the whole page, like the show's wall of X's. */
export function StrikeOverlay({ event }) {
  const [visible, setVisible] = useState(null)
  const timer = useRef(null)
  useEffect(() => {
    if (!event || event.type !== 'strike') return
    setVisible({ count: event.count, key: event.seq })
    document.documentElement.classList.add('is-striking')
    clearTimeout(timer.current)
    // Not tied to the effect cleanup: later events must not cancel the hide.
    timer.current = setTimeout(() => {
      setVisible(null)
      document.documentElement.classList.remove('is-striking')
    }, STRIKE_MS)
  }, [event])
  useEffect(
    () => () => {
      clearTimeout(timer.current)
      document.documentElement.classList.remove('is-striking')
    },
    [],
  )
  if (!visible) return null
  return (
    <div className={`strike-overlay count-${visible.count}`} key={visible.key} aria-live="assertive">
      <div className="strike-flash" />
      <div className="strike-row">
        {Array.from({ length: visible.count }, (_, i) => (
          <StrikeX key={i} className="strike-big" />
        ))}
      </div>
      <span className="sr-only">{visible.count} strike{visible.count > 1 ? 's' : ''}</span>
    </div>
  )
}

export function StrikeTally({ strikes }) {
  return (
    <div className="strike-tally" aria-label={`${strikes} of 3 strikes`}>
      {[0, 1, 2].map((i) => (
        <StrikeX key={i} className={`strike-small ${i < strikes ? 'is-on' : ''}`} />
      ))}
    </div>
  )
}
