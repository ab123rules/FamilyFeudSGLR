import React, { useRef, useState } from 'react'
import { FeudLogo, Icon, StageBackdrop } from './Art'
import { MAX_ANSWERS, multiplierFor, multiplierLabel } from '../game/engine'
import { blankQuestion, emptyConfig, halloweenConfig, validateConfig } from '../data/defaultConfig'
import { downloadJson, parseSetupFile } from '../game/storage'

/* The editor is the board itself: type straight into the eight tiles.
   An empty tile stays a dark plate, a filled one lights up blue. */
function QuestionEditor({ value, onChange, idPrefix, compact }) {
  const slots = Array.from({ length: MAX_ANSWERS }, (_, i) => value.answers[i] || { text: '', points: '' })
  const setAnswer = (i, patch) => {
    const answers = slots.map((a, idx) => (idx === i ? { ...a, ...patch } : a))
    // Trim trailing blanks so saved files stay tidy.
    while (answers.length && !String(answers[answers.length - 1].text).trim() && answers[answers.length - 1].points === '') answers.pop()
    onChange({ ...value, answers })
  }
  const sortAnswers = () =>
    onChange({
      ...value,
      answers: value.answers
        .filter((a) => String(a.text).trim())
        .sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0)),
    })
  const total = value.answers.reduce((s, a) => s + (Number(a.points) || 0), 0)
  const filled = value.answers.filter((a) => String(a.text).trim()).length

  return (
    <div className={`q-editor ${compact ? 'is-compact' : ''}`}>
      <input
        id={`${idPrefix}-q`}
        className="q-input"
        value={value.question}
        placeholder="Type the survey question…"
        aria-label="Survey question"
        onChange={(e) => onChange({ ...value, question: e.target.value })}
      />
      <div className="board-frame edit-frame">
        <div className="board-bulbs" aria-hidden="true" />
        <ol className="board-grid edit-grid">
          {slots.map((a, i) => {
            const on = String(a.text).trim() !== ''
            return (
              <li key={i} className={`edit-tile ${on ? 'is-on' : ''}`}>
                <span className="edit-num"><span className="num">{i + 1}</span></span>
                <input
                  className="edit-text"
                  value={a.text}
                  placeholder={i === 0 ? 'Top answer' : `Answer ${i + 1}`}
                  aria-label={`Answer ${i + 1}`}
                  onChange={(e) => setAnswer(i, { text: e.target.value })}
                />
                <input
                  className="edit-points"
                  type="number"
                  min="0"
                  max="100"
                  inputMode="numeric"
                  value={a.points}
                  placeholder="–"
                  aria-label={`Points for answer ${i + 1}`}
                  onChange={(e) => setAnswer(i, { points: e.target.value === '' ? '' : Number(e.target.value) })}
                />
              </li>
            )
          })}
        </ol>
      </div>
      <div className="q-footer">
        <span className={`q-total ${total > 100 ? 'is-over' : ''}`}>
          <strong>{filled}</strong> answer{filled === 1 ? '' : 's'} · <strong>{total}</strong> of 100 surveyed
          {total > 100 ? ' (over 100)' : ''}
        </span>
        <button type="button" className="text-btn" onClick={sortAnswers}>
          Sort highest first
        </button>
      </div>
    </div>
  )
}

function TeamEditor({ team, index, onChange }) {
  const setPlayer = (i, name) => onChange({ ...team, players: team.players.map((p, idx) => (idx === i ? name : p)) })
  return (
    <div className={`team-editor team-${index}`}>
      <label className="field-label" htmlFor={`team-${index}`}>Team {index + 1}</label>
      <input
        id={`team-${index}`}
        className="field team-name-input"
        aria-label={`Team ${index + 1} name`}
        value={team.name}
        onChange={(e) => onChange({ ...team, name: e.target.value })}
      />
      <ol className="player-list">
        {team.players.map((p, i) => (
          <li key={i}>
            <input
              className="field field-sm"
              value={p}
              aria-label={`${team.name} player ${i + 1}`}
              onChange={(e) => setPlayer(i, e.target.value)}
            />
            {team.players.length > 1 && (
              <button
                type="button"
                className="icon-btn"
                aria-label={`Remove ${p || `player ${i + 1}`}`}
                onClick={() => onChange({ ...team, players: team.players.filter((_, idx) => idx !== i) })}
              >
                <Icon name="close" size={14} />
              </button>
            )}
          </li>
        ))}
      </ol>
      {team.players.length < 10 && (
        <button
          type="button"
          className="ghost-btn"
          onClick={() => onChange({ ...team, players: [...team.players, `Player ${team.players.length + 1}`] })}
        >
          <Icon name="plus" size={16} /> Add player
        </button>
      )}
    </div>
  )
}

export default function Setup({ config, setConfig, onStart, savedGame, onResume }) {
  const [tab, setTab] = useState('r0')
  const [fileError, setFileError] = useState('')
  const fileInput = useRef(null)
  const issues = validateConfig(config)

  const update = (patch) => setConfig({ ...config, ...patch })
  const setRound = (i, q) => update({ rounds: config.rounds.map((r, idx) => (idx === i ? q : r)) })
  const setFm = (i, q) => update({ fastMoney: config.fastMoney.map((r, idx) => (idx === i ? q : r)) })
  const setTeam = (i, t) => update({ teams: config.teams.map((x, idx) => (idx === i ? t : x)) })

  const addRound = () => {
    update({ rounds: [...config.rounds, blankQuestion()] })
    setTab(`r${config.rounds.length}`)
  }
  const removeRound = (i) => {
    update({ rounds: config.rounds.filter((_, idx) => idx !== i) })
    setTab(`r${Math.max(0, i - 1)}`)
  }

  const importFile = async (file) => {
    setFileError('')
    try {
      setConfig(parseSetupFile(await file.text()))
      setTab('r0')
    } catch (err) {
      setFileError(err.message)
    }
  }

  const replaceWith = (next, label) => {
    if (window.confirm(`Replace every question with ${label}? Export first if you want to keep the current ones.`)) {
      setConfig(next)
      setTab('r0')
    }
  }

  const roundIndex = tab.startsWith('r') ? Number(tab.slice(1)) : -1

  return (
    <div className="setup-screen">
      <StageBackdrop calm />
      <header className="setup-header">
        <FeudLogo className="setup-logo" subtitle="" />
        <div className="setup-title">
          <h1>Build tonight’s board</h1>
          <p>Type your surveys straight onto the board. It all saves in this browser as you go.</p>
        </div>
        <div className="setup-actions">
          {savedGame && (
            <button type="button" className="ghost-btn ghost-btn-lg" onClick={onResume}>
              Resume game in progress
            </button>
          )}
          <button type="button" className="primary-btn" disabled={issues.length > 0} onClick={onStart}>
            Start the show <Icon name="arrow" size={20} />
          </button>
        </div>
      </header>

      {issues.length > 0 && (
        <div className="issues-bar" role="status">
          <strong>{issues.length} thing{issues.length > 1 ? 's' : ''} left before you can start:</strong>{' '}
          {issues.slice(0, 3).join(' · ')}
          {issues.length > 3 && ` · and ${issues.length - 3} more`}
        </div>
      )}

      <div className="setup-layout">
        <aside className="setup-side">
          <section className="side-section">
            <h2>Teams</h2>
            <div className="team-grid">
              {config.teams.map((t, i) => (
                <TeamEditor key={i} index={i} team={t} onChange={(next) => setTeam(i, next)} />
              ))}
            </div>
            <p className="panel-note">Face-offs rotate down each team's list, one player per round.</p>
          </section>

          <section className="side-section">
            <h2>Rules</h2>
            <label className="field-label" htmlFor="target">Points to win</label>
            <input
              id="target"
              className="field field-points"
              type="number"
              min="50"
              step="10"
              value={config.targetScore}
              onChange={(e) => update({ targetScore: e.target.value === '' ? '' : Number(e.target.value) })}
            />
            <label className="check-row">
              <input
                type="checkbox"
                checked={config.fastMoneyEnabled}
                onChange={(e) => update({ fastMoneyEnabled: e.target.checked })}
              />
              Play Fast Money after the game
            </label>
            <div className="ladder" aria-label="Points per round">
              {config.rounds.map((_, i) => (
                <span key={i} className={`ladder-step mult-${multiplierFor(i, false)}`}>
                  <small>R{i + 1}</small>×{multiplierFor(i, false)}
                </span>
              ))}
              <span className="ladder-step ladder-sd">
                <small>SD</small>×3
              </span>
            </div>
            <p className="panel-note">
              First to {config.targetScore || 300} after a round wins. If nobody makes it, Sudden Death settles it.
            </p>
          </section>

          <section className="side-section">
            <h2>Question file</h2>
            <div className="file-actions">
              <button type="button" className="text-btn" onClick={() => downloadJson('feud-setup.json', config)}>
                Export
              </button>
              <button type="button" className="text-btn" onClick={() => fileInput.current?.click()}>
                Import
              </button>
              <button type="button" className="text-btn" onClick={() => replaceWith(halloweenConfig(), 'the Halloween sample')}>
                Load Halloween sample
              </button>
              <button type="button" className="text-btn" onClick={() => replaceWith({ ...emptyConfig(), teams: config.teams }, 'blank questions')}>
                Start blank
              </button>
            </div>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                if (e.target.files?.[0]) importFile(e.target.files[0])
                e.target.value = ''
              }}
            />
            {fileError && <p className="field-error">{fileError}</p>}
          </section>
        </aside>

        <main className="setup-main">
          <div className="tab-strip" role="tablist" aria-label="Survey questions">
            {config.rounds.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={tab === `r${i}`}
                className={`tab ${tab === `r${i}` ? 'is-active' : ''}`}
                onClick={() => setTab(`r${i}`)}
              >
                Round {i + 1}
                <small>{multiplierLabel(multiplierFor(i, false), false)}</small>
              </button>
            ))}
            <button type="button" className="tab tab-add" onClick={addRound} aria-label="Add a round">
              <Icon name="plus" size={18} />
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'sd'}
              className={`tab ${tab === 'sd' ? 'is-active' : ''}`}
              onClick={() => setTab('sd')}
            >
              Sudden Death<small>Tiebreaker</small>
            </button>
            {config.fastMoneyEnabled && (
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'fm'}
                className={`tab ${tab === 'fm' ? 'is-active' : ''}`}
                onClick={() => setTab('fm')}
              >
                Fast Money<small>5 questions</small>
              </button>
            )}
          </div>

          <div className="tab-body" role="tabpanel">
            {roundIndex >= 0 && config.rounds[roundIndex] && (
              <>
                <QuestionEditor
                  idPrefix={`r${roundIndex}`}
                  value={config.rounds[roundIndex]}
                  onChange={(q) => setRound(roundIndex, q)}
                />
                {config.rounds.length > 1 && (
                  <button type="button" className="text-btn danger remove-round" onClick={() => removeRound(roundIndex)}>
                    Remove round {roundIndex + 1}
                  </button>
                )}
              </>
            )}
            {tab === 'sd' && (
              <>
                <p className="tab-note">
                  Only used if nobody reaches {config.targetScore || 300}. One face-off at triple points, and the winner takes the game.
                </p>
                <QuestionEditor idPrefix="sd" value={config.suddenDeath} onChange={(q) => update({ suddenDeath: q })} />
              </>
            )}
            {tab === 'fm' && (
              <>
                <p className="tab-note">
                  Both players get these five questions, with 20 and 25 seconds. 200 points between them wins.
                </p>
                <div className="fm-editors">
                  {config.fastMoney.map((q, i) => (
                    <div key={i} className="fm-editor">
                      <h3>Question {i + 1}</h3>
                      <QuestionEditor compact idPrefix={`fm${i}`} value={q} onChange={(next) => setFm(i, next)} />
                    </div>
                  ))}
                </div>
              </>
            )}
            <p className="hint-line">
              Accept more than one wording with a slash, like <em>Frogs/Toads</em>. The board shows the first.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
