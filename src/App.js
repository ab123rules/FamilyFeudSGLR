import React, { useState, useEffect, useMemo } from 'react'

/* ------------------------------------------------------------------ */
/*  QUESTION BANK — 10 categories, host picks & orders 6 before start */
/* ------------------------------------------------------------------ */
const CATEGORY_BANK = [
  {
    id: 1,
    title: 'Name an app people use every day',
    answers: [
      { text: 'Instagram', points: 30 },
      { text: 'TikTok', points: 25 },
      { text: 'Snapchat', points: 20 },
      { text: 'YouTube', points: 15 },
      { text: 'WhatsApp', points: 10 },
      { text: 'Facebook', points: 8 },
      { text: 'Spotify', points: 5 },
      { text: 'Gmail', points: 3 },
    ],
  },
  {
    id: 2,
    title: 'Name a World Cup football player',
    answers: [
      { text: 'Messi', points: 30 },
      { text: 'Ronaldo', points: 25 },
      { text: 'Kylian Mbappé', points: 20 },
      { text: 'Neymar', points: 15 },
      { text: 'Lamine Yamal', points: 10 },
      { text: 'Erling Haaland', points: 8 },
      { text: 'Luka Modrić', points: 5 },
      { text: 'Jude Bellingham', points: 3 },
      { text: 'Vini Jr.', points: 2 },
    ],
  },
  {
    id: 3,
    title: 'Name something you do in the morning',
    answers: [
      { text: 'Brush your teeth', points: 30 },
      { text: 'Eat breakfast', points: 25 },
      { text: 'Shower', points: 20 },
      { text: 'Check your phone', points: 15 },
      { text: 'Get dressed', points: 10 },
      { text: 'Drink coffee', points: 8 },
      { text: 'Make your bed', points: 5 },
      { text: 'Wash your face', points: 3 },
    ],
  },
  {
    id: 4,
    title: 'Name a reason someone might be late',
    answers: [
      { text: 'Traffic', points: 30 },
      { text: 'Overslept', points: 25 },
      { text: 'Missed the bus/train', points: 20 },
      { text: 'Bad weather', points: 15 },
      { text: 'Forgot something at home', points: 10 },
      { text: 'Car trouble', points: 8 },
      { text: 'Too much work', points: 5 },
      { text: "Couldn't find keys", points: 3 },
    ],
  },
  {
    id: 5,
    title: 'Name a place people take selfies',
    answers: [
      { text: 'Beach', points: 30 },
      { text: 'In front of a mirror', points: 25 },
      { text: 'Tourist attraction/Landmark', points: 20 },
      { text: 'Concert', points: 15 },
      { text: 'Vacation destination', points: 10 },
      { text: 'Gym', points: 8 },
      { text: 'Restaurant', points: 5 },
      { text: 'Car', points: 3 },
    ],
  },
  {
    id: 6,
    title: 'Name something students carry every day',
    answers: [
      { text: 'Backpack', points: 30 },
      { text: 'Phone', points: 25 },
      { text: 'Laptop', points: 20 },
      { text: 'Water bottle', points: 15 },
      { text: 'Notebook', points: 10 },
      { text: 'Pencil/Pen', points: 8 },
      { text: 'Student ID', points: 5 },
      { text: 'Charger', points: 3 },
    ],
  },
  {
    id: 7,
    title: 'Name something people always lose',
    answers: [
      { text: 'Keys', points: 30 },
      { text: 'Phone', points: 25 },
      { text: 'Wallet', points: 20 },
      { text: 'Socks', points: 15 },
      { text: 'TV remote', points: 10 },
      { text: 'Glasses', points: 8 },
      { text: 'Charger', points: 5 },
      { text: 'Earbuds', points: 3 },
    ],
  },
  {
    id: 8,
    title: 'Name a reason people check their phones',
    answers: [
      { text: 'Text messages', points: 30 },
      { text: 'Social media', points: 25 },
      { text: 'Notifications', points: 20 },
      { text: 'Time', points: 15 },
      { text: 'Phone call', points: 10 },
      { text: 'Email', points: 8 },
      { text: 'Weather', points: 5 },
      { text: 'News', points: 3 },
    ],
  },
  {
    id: 9,
    title: 'Name a famous superhero',
    answers: [
      { text: 'Spider-Man', points: 30 },
      { text: 'Batman', points: 25 },
      { text: 'Superman', points: 20 },
      { text: 'Iron Man', points: 15 },
      { text: 'Wonder Woman', points: 10 },
      { text: 'Captain America', points: 8 },
      { text: 'Hulk', points: 5 },
      { text: 'Thor', points: 3 },
    ],
  },
  {
    id: 10,
    title: 'Name something people are afraid of',
    answers: [
      { text: 'Spiders', points: 30 },
      { text: 'Heights', points: 25 },
      { text: 'Snakes', points: 20 },
      { text: 'The dark', points: 15 },
      { text: 'Public speaking', points: 10 },
      { text: 'Ocean', points: 8 },
      { text: 'Failure', points: 5 },
      { text: 'Ghosts', points: 3 },
    ],
  },
]

const TOTAL_ROUNDS = 6
const SESSION_SECONDS = 30 * 60
const FACEOFF_SECONDS = 20
const PLAYORPASS_SECONDS = 5
const STEAL_SECONDS = 20

const multiplierForRound = (roundIndex) => {
  if (roundIndex === 4) return 2
  if (roundIndex === 5) return 3
  return 1
}

const fmtClock = (totalSeconds) => {
  const s = Math.max(0, totalSeconds)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${String(r).padStart(2, '0')}`
}

const normalizeSearchText = (value) => value.toLowerCase().trim()

const timerColorClasses = (secondsLeft, totalSeconds) => {
  const ratio = totalSeconds > 0 ? secondsLeft / totalSeconds : 0
  if (ratio > 0.5) return 'text-ok border-ok'
  if (ratio > 0.25) return 'text-gold border-gold'
  return 'text-bad border-bad animate-pulse'
}

/* ------------------------------------------------------------------ */
/*  Small presentational helpers                                      */
/* ------------------------------------------------------------------ */

function CountdownRing({ seconds, total, size = 96 }) {
  const colorClass = timerColorClasses(seconds, total)
  return (
    <div
      className={`flex items-center justify-center rounded-full border-4 font-display tabular-nums ${colorClass}`}
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {seconds}
    </div>
  )
}

function TeamBadge({ label, color }) {
  const cls = color === 'A' ? 'bg-teamA/20 text-teamA-glow border-teamA' : 'bg-teamB/20 text-teamB-glow border-teamB'
  return (
    <span className={`inline-block rounded-full border px-3 py-1 text-sm font-bold uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  )
}

function StrikeMarks({ strikes, flash }) {
  return (
    <div className={`flex gap-3 ${flash ? 'strike-shake' : ''}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 font-display text-3xl transition-colors ${
            i < strikes ? 'border-bad bg-bad/20 text-bad' : 'border-stage-700 text-stage-700'
          }`}
        >
          X
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Setup screen                                                      */
/* ------------------------------------------------------------------ */

function SetupScreen({ setup, setSetup, onStart }) {
  const { teamAName, teamBName, teamAPlayers, teamBPlayers, selectedCatIds, options } = setup

  const toggleCategory = (id) => {
    setSetup((s) => {
      const has = s.selectedCatIds.includes(id)
      if (has) {
        return { ...s, selectedCatIds: s.selectedCatIds.filter((c) => c !== id) }
      }
      if (s.selectedCatIds.length >= 6) return s
      return { ...s, selectedCatIds: [...s.selectedCatIds, id] }
    })
  }

  const updatePlayer = (team, idx, value) => {
    setSetup((s) => {
      const key = team === 'A' ? 'teamAPlayers' : 'teamBPlayers'
      const next = [...s[key]]
      next[idx] = value
      return { ...s, [key]: next }
    })
  }

  const canStart = selectedCatIds.length === 6

  return (
    <div className="min-h-screen bg-stage-950 px-6 py-10 text-stage-100 sm:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 text-center">
          <p className="mb-2 font-sans text-sm uppercase tracking-[0.35em] text-gold">Host Setup</p>
          <h1 className="font-display text-5xl tracking-wide text-white sm:text-6xl">FEUD NIGHT</h1>
          <p className="mt-3 font-sans text-stage-400">Set up teams, pick 6 categories, then hit start.</p>
        </div>

        {/* Teams */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-teamA/40 bg-teamA-dim/40 p-6">
            <input
              className="mb-4 w-full rounded-lg border border-teamA/50 bg-stage-900 px-4 py-2 font-display text-2xl text-teamA-glow outline-none focus:border-teamA"
              value={teamAName}
              onChange={(e) => setSetup((s) => ({ ...s, teamAName: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-2">
              {teamAPlayers.map((p, i) => (
                <input
                  key={i}
                  value={p}
                  onChange={(e) => updatePlayer('A', i, e.target.value)}
                  placeholder={`Player ${i + 1}`}
                  className="rounded-md border border-stage-700 bg-stage-900 px-3 py-2 text-sm text-stage-100 outline-none focus:border-teamA"
                />
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-teamB/40 bg-teamB-dim/40 p-6">
            <input
              className="mb-4 w-full rounded-lg border border-teamB/50 bg-stage-900 px-4 py-2 font-display text-2xl text-teamB-glow outline-none focus:border-teamB"
              value={teamBName}
              onChange={(e) => setSetup((s) => ({ ...s, teamBName: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-2">
              {teamBPlayers.map((p, i) => (
                <input
                  key={i}
                  value={p}
                  onChange={(e) => updatePlayer('B', i, e.target.value)}
                  placeholder={`Player ${i + 1}`}
                  className="rounded-md border border-stage-700 bg-stage-900 px-3 py-2 text-sm text-stage-100 outline-none focus:border-teamB"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8 rounded-2xl border border-stage-700 bg-stage-900 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl tracking-wide text-white">Pick 6 categories, in play order</h2>
            <span className={`font-sans text-sm ${canStart ? 'text-ok' : 'text-gold'}`}>
              {selectedCatIds.length} / 6 selected
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {CATEGORY_BANK.map((cat) => {
              const order = selectedCatIds.indexOf(cat.id)
              const isSelected = order !== -1
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                    isSelected
                      ? 'border-gold bg-gold/10 text-white'
                      : 'border-stage-700 bg-stage-800 text-stage-300 hover:border-stage-500'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-sm ${
                      isSelected ? 'bg-gold text-stage-950' : 'bg-stage-700 text-stage-400'
                    }`}
                  >
                    {isSelected ? order + 1 : '—'}
                  </span>
                  <span className="font-sans text-sm">{cat.title}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Options */}
        <div className="mb-10 rounded-2xl border border-stage-700 bg-stage-900 p-6">
          <h2 className="mb-4 font-display text-xl tracking-wide text-white">Speed-control options</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-8">
            <label className="flex cursor-pointer items-center gap-3 font-sans text-sm text-stage-200">
              <input
                type="checkbox"
                checked={options.capBoard}
                onChange={(e) => setSetup((s) => ({ ...s, options: { ...s.options, capBoard: e.target.checked } }))}
                className="h-5 w-5 accent-gold"
              />
              Cap board play at 3 answers max (even before 3 strikes)
            </label>
            <label className="flex cursor-pointer items-center gap-3 font-sans text-sm text-stage-200">
              <input
                type="checkbox"
                checked={options.skipReRead}
                onChange={(e) => setSetup((s) => ({ ...s, options: { ...s.options, skipReRead: e.target.checked } }))}
                className="h-5 w-5 accent-gold"
              />
              Skip re-reading the question after face-off (just show "GO")
            </label>
          </div>
        </div>

        <div className="text-center">
          <button
            disabled={!canStart}
            onClick={onStart}
            className={`rounded-full px-12 py-4 font-display text-2xl tracking-wide transition-transform ${
              canStart
                ? 'host-pulse bg-gold text-stage-950 hover:scale-105'
                : 'cursor-not-allowed bg-stage-700 text-stage-500'
            }`}
          >
            START GAME
          </button>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Top bar — always-visible scoreboard + session clock                */
/* ------------------------------------------------------------------ */

function TopBar({ teamAName, teamBName, scores, roundIndex, sessionSeconds, multiplier }) {
  return (
    <div className="grid grid-cols-3 items-center gap-4 border-b border-stage-800 bg-stage-900/80 px-6 py-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="h-3 w-3 rounded-full bg-teamA" />
        <div>
          <p className="font-sans text-xs uppercase tracking-widest text-stage-400">{teamAName}</p>
          <p className="font-display text-4xl leading-none text-teamA-glow">{scores.A}</p>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <p className="font-sans text-xs uppercase tracking-widest text-stage-400">
          Round {roundIndex + 1} of {TOTAL_ROUNDS}
          {multiplier > 1 && <span className="ml-2 text-gold">· {multiplier}X POINTS</span>}
        </p>
        <p
          className={`font-display text-3xl tabular-nums ${
            sessionSeconds < 120 ? 'text-bad' : sessionSeconds < 300 ? 'text-gold' : 'text-white'
          }`}
        >
          {fmtClock(sessionSeconds)}
        </p>
        <p className="font-sans text-[10px] uppercase tracking-widest text-stage-500">Session Time Left</p>
      </div>

      <div className="flex items-center justify-end gap-3">
        <div className="text-right">
          <p className="font-sans text-xs uppercase tracking-widest text-stage-400">{teamBName}</p>
          <p className="font-display text-4xl leading-none text-teamB-glow">{scores.B}</p>
        </div>
        <div className="h-3 w-3 rounded-full bg-teamB" />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Host instruction banner — the most important element               */
/* ------------------------------------------------------------------ */

function HostBanner({ text, sub, onSkip, skipLabel, warn }) {
  return (
    <div
      className={`host-pulse mx-6 mt-6 rounded-2xl border-2 border-gold bg-gold/10 px-6 py-4 sm:mx-10 ${
        warn ? 'warn-flash' : ''
      }`}
    >
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="font-sans text-[11px] uppercase tracking-[0.3em] text-gold">Host — Do This Now</p>
          <p className="font-display text-xl leading-tight text-white sm:text-2xl">{text}</p>
          {sub && <p className="mt-1 font-sans text-sm text-stage-300">{sub}</p>}
        </div>
        {onSkip && (
          <button
            onClick={onSkip}
            className="shrink-0 rounded-full border border-stage-500 px-4 py-2 font-sans text-xs uppercase tracking-widest text-stage-200 hover:border-gold hover:text-gold"
          >
            {skipLabel || 'Skip / Next Phase'} ⏭
          </button>
        )}
      </div>
    </div>
  )
}

function QuestionSearchPanel({ query, onQueryChange, results, totalAnswers }) {
  return (
    <div className="mx-6 mt-4 rounded-2xl border border-stage-700 bg-stage-900/95 px-4 py-4 shadow-lg shadow-black/20 sm:mx-10 sm:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-sans text-[11px] uppercase tracking-[0.3em] text-stage-400">Question database</p>
          <p className="mt-1 font-display text-lg text-white sm:text-xl">Search all loaded answers</p>
        </div>
        <div className="w-full lg:max-w-xl">
          <input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search for an answer, like 'phone' or 'traffic'"
            className="w-full rounded-xl border border-stage-600 bg-stage-950 px-4 py-3 font-sans text-sm text-white outline-none placeholder:text-stage-500 focus:border-gold"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {query ? (
          results.length > 0 ? (
            results.slice(0, 8).map((item) => (
              <span
                key={`${item.categoryId}-${item.answer}`}
                className="rounded-full border border-cyan-300/70 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-100"
              >
                {item.answer} <span className="text-cyan-200/70">·</span> {item.question}
              </span>
            ))
          ) : (
            <p className="font-sans text-sm text-stage-400">No database matches found.</p>
          )
        ) : (
          <p className="font-sans text-sm text-stage-400">{totalAnswers} answers are loaded from the full category bank.</p>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Answer board                                                       */
/* ------------------------------------------------------------------ */

function AnswerBoard({ board, onReveal, revealAll, searchQuery }) {
  const normalizedQuery = normalizeSearchText(searchQuery || '')
  const hasQuery = normalizedQuery.length > 0

  return (
    <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
      {board.map((a, i) => {
        const isSearchMatch = hasQuery && normalizeSearchText(a.text).includes(normalizedQuery)
        const isVisible = a.revealed || revealAll
        const cardClass = isVisible
          ? `flip-in border-gold bg-gold/10 ${isSearchMatch ? 'ring-2 ring-cyan-300/80 shadow-[0_0_24px_rgba(34,211,238,0.2)]' : ''}`
          : `border-stage-700 bg-stage-800 hover:border-stage-500 ${isSearchMatch ? 'border-cyan-300 bg-cyan-400/12 ring-2 ring-cyan-300/70 shadow-[0_0_24px_rgba(34,211,238,0.18)]' : ''}`

        return (
          <button
            key={i}
            disabled={a.revealed || !onReveal}
            onClick={() => onReveal && onReveal(i)}
            className={`flex items-center justify-between rounded-xl border-2 px-5 py-4 text-left transition-all ${cardClass} ${
              onReveal && !a.revealed ? 'cursor-pointer' : 'cursor-default'
            }`}
          >
            <span className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-stage-950 font-display text-sm text-stage-400">
                {i + 1}
              </span>
              <span className={`font-display text-lg font-semibold tracking-wide sm:text-xl ${isVisible ? 'text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.75)]' : 'text-stage-300'}`}>
                {isVisible ? a.text : '???'}
              </span>
            </span>
            <span className="font-display text-2xl text-gold drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
              {isVisible ? a.points : ''}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Confetti                                                           */
/* ------------------------------------------------------------------ */

function Confetti() {
  const pieces = useMemo(() => {
    const colors = ['#FFC94D', '#2F6FFF', '#FF3B5C', '#33D17A', '#ffffff']
    return Array.from({ length: 90 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 2.5,
      color: colors[i % colors.length],
      size: 6 + Math.random() * 8,
      rotate: Math.random() * 360,
    }))
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.4,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  MAIN APP                                                            */
/* ------------------------------------------------------------------ */

const defaultSetup = {
  teamAName: 'Team A',
  teamBName: 'Team B',
  teamAPlayers: Array.from({ length: 8 }, (_, i) => `Player ${i + 1}`),
  teamBPlayers: Array.from({ length: 8 }, (_, i) => `Player ${i + 1}`),
  selectedCatIds: CATEGORY_BANK.slice(0, 6).map((c) => c.id),
  options: { capBoard: false, skipReRead: false },
}

export default function App() {
  const [screen, setScreen] = useState('setup') // setup | game | final
  const [setup, setSetup] = useState(defaultSetup)

  const [roundIndex, setRoundIndex] = useState(0)
  const [phase, setPhase] = useState('faceoff') // faceoff | playOrPass | board | steal | reveal
  const [board, setBoard] = useState([])
  const [strikes, setStrikes] = useState(0)
  const [controllingTeam, setControllingTeam] = useState(null) // 'A' | 'B'
  const [buzzTeam, setBuzzTeam] = useState(null)
  const [roundPoints, setRoundPoints] = useState(0)
  const [scores, setScores] = useState({ A: 0, B: 0 })
  const [teamATurn, setTeamATurn] = useState(0)
  const [teamBTurn, setTeamBTurn] = useState(0)
  const [roundSummary, setRoundSummary] = useState({ boardTeam: null, boardPoints: 0, stealTeam: null, stealPoints: 0 })
  const [boardCommitted, setBoardCommitted] = useState(false)
  const [answerSearch, setAnswerSearch] = useState('')

  const [phaseSeconds, setPhaseSeconds] = useState(FACEOFF_SECONDS)
  const [sessionSeconds, setSessionSeconds] = useState(SESSION_SECONDS)
  const [flashStrike, setFlashStrike] = useState(false)

  const multiplier = multiplierForRound(roundIndex)
  const questionDatabase = useMemo(
    () =>
      CATEGORY_BANK.flatMap((cat) =>
        cat.answers.map((answer) => ({
          categoryId: cat.id,
          question: cat.title,
          answer: answer.text,
          points: answer.points,
        })),
      ),
    [],
  )
  const searchResults = useMemo(() => {
    const query = normalizeSearchText(answerSearch)
    if (!query) return []
    return questionDatabase.filter((item) => {
      return normalizeSearchText(item.answer).includes(query) || normalizeSearchText(item.question).includes(query)
    })
  }, [answerSearch, questionDatabase])
  const currentCategory = useMemo(
    () => CATEGORY_BANK.find((c) => c.id === setup.selectedCatIds[roundIndex]),
    [setup.selectedCatIds, roundIndex],
  )
  const faceoffPlayerNum = roundIndex + 1

  const teamAPlayerNow = setup.teamAPlayers[teamATurn] || `Player ${teamATurn + 1}`
  const teamBPlayerNow = setup.teamBPlayers[teamBTurn] || `Player ${teamBTurn + 1}`

  /* ---------------- Session clock ---------------- */
  useEffect(() => {
    if (screen !== 'game') return
    const id = setInterval(() => {
      setSessionSeconds((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => clearInterval(id)
  }, [screen])

  /* ---------------- Phase clock ---------------- */
  useEffect(() => {
    if (screen !== 'game') return
    if (!['faceoff', 'playOrPass', 'steal'].includes(phase)) return
    if (phaseSeconds <= 0) return
    const id = setInterval(() => {
      setPhaseSeconds((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => clearInterval(id)
  }, [screen, phase, phaseSeconds])

  useEffect(() => {
    if (screen !== 'game' || phase !== 'steal' || phaseSeconds > 0) return
    setPhase('reveal')
  }, [screen, phase, phaseSeconds])

  /* ---------------- Board-play auto transitions ---------------- */
  useEffect(() => {
    if (phase !== 'board') return
    const revealedCount = board.filter((a) => a.revealed).length
    if (strikes >= 3) {
      bankBoardPoints()
      setPhase('steal')
      setPhaseSeconds(STEAL_SECONDS)
      return
    }
    if (board.length > 0 && revealedCount === board.length) {
      endBoardPlaySuccess()
      return
    }
    if (setup.options.capBoard && revealedCount >= 3) {
      endBoardPlaySuccess()
      return
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, strikes, phase])

  const buildBoard = (catId) => {
    const cat = CATEGORY_BANK.find((c) => c.id === catId)
    return cat.answers.map((a) => ({ ...a, revealed: false }))
  }

  const beginRound = (idx) => {
    setRoundIndex(idx)
    setPhase('faceoff')
    setPhaseSeconds(FACEOFF_SECONDS)
    setBoard(buildBoard(setup.selectedCatIds[idx]))
    setStrikes(0)
    setControllingTeam(null)
    setBuzzTeam(null)
    setRoundPoints(0)
    setRoundSummary({ boardTeam: null, boardPoints: 0, stealTeam: null, stealPoints: 0 })
    setBoardCommitted(false)
  }

  const startGame = () => {
    setScores({ A: 0, B: 0 })
    setTeamATurn(0)
    setTeamBTurn(0)
    setSessionSeconds(SESSION_SECONDS)
    setScreen('game')
    beginRound(0)
  }

  const advanceTurn = (team) => {
    if (team === 'A') setTeamATurn((t) => (t + 1) % 8)
    else setTeamBTurn((t) => (t + 1) % 8)
  }

  const handleBuzz = (team) => {
    setBuzzTeam(team)
    setPhase('playOrPass')
    setPhaseSeconds(PLAYORPASS_SECONDS)
  }

  const handlePlayOrPass = (choice) => {
    const winner = buzzTeam
    const opponent = winner === 'A' ? 'B' : 'A'
    const control = choice === 'play' ? winner : opponent
    setControllingTeam(control)
    setPhase('board')
  }

  const handleRevealAnswer = (i) => {
    const answer = board[i]
    if (!answer || answer.revealed) return
    setBoard((prev) => prev.map((a, idx) => (idx === i ? { ...a, revealed: true } : a)))
    setRoundPoints((p) => p + answer.points * multiplier)
    advanceTurn(controllingTeam)
  }

  const handleStrike = () => {
    setStrikes((s) => s + 1)
    advanceTurn(controllingTeam)
    setFlashStrike(true)
    setTimeout(() => setFlashStrike(false), 500)
  }

  const bankBoardPoints = () => {
    if (boardCommitted || !controllingTeam) return
    if (roundPoints > 0) {
      setScores((s) => ({ ...s, [controllingTeam]: s[controllingTeam] + roundPoints }))
    }
    setRoundSummary((summary) => ({
      ...summary,
      boardTeam: controllingTeam,
      boardPoints: roundPoints,
    }))
    setBoardCommitted(true)
  }

  const endBoardPlaySuccess = () => {
    bankBoardPoints()
    setPhase('reveal')
  }

  const handleStealResult = (correct, answerIndex) => {
    const stealTeam = controllingTeam === 'A' ? 'B' : 'A'
    if (correct && answerIndex != null) {
      const answer = board[answerIndex]
      setBoard((prev) => prev.map((a, idx) => (idx === answerIndex ? { ...a, revealed: true } : a)))
      setScores((s) => ({ ...s, [stealTeam]: s[stealTeam] + answer.points * multiplier }))
      setRoundSummary((summary) => ({
        ...summary,
        stealTeam,
        stealPoints: summary.stealPoints + answer.points * multiplier,
      }))
      const remainingHidden = board.filter((a, idx) => idx !== answerIndex && !a.revealed).length
      if (remainingHidden === 0) {
        setPhase('reveal')
      }
      return
    }
    setPhase('reveal')
  }

  const nextRound = () => {
    if (roundIndex + 1 >= TOTAL_ROUNDS) {
      setScreen('final')
    } else {
      beginRound(roundIndex + 1)
    }
  }

  const handleSkip = () => {
    if (phase === 'faceoff') {
      // force a buzz to whichever team hasn't been picked; default to A
      handleBuzz('A')
    } else if (phase === 'playOrPass') {
      handlePlayOrPass('play')
    } else if (phase === 'board') {
      endBoardPlaySuccess()
    } else if (phase === 'steal') {
      handleStealResult(false, null)
    } else if (phase === 'reveal') {
      nextRound()
    }
  }

  const resetGame = () => {
    setSetup(defaultSetup)
    setScreen('setup')
  }

  /* ---------------- Host instruction text ---------------- */
  const hostInstruction = () => {
    if (phase === 'faceoff') {
      return {
        text: setup.options.skipReRead
          ? `Face-off: ${setup.teamAPlayers[faceoffPlayerNum - 1]} vs ${setup.teamBPlayers[faceoffPlayerNum - 1]} — GO`
          : `Read the question aloud, then let ${setup.teamAPlayers[faceoffPlayerNum - 1]} and ${
              setup.teamBPlayers[faceoffPlayerNum - 1]
            } buzz in.`,
        sub: 'First to buzz/raise a hand answers first. Tap the team that buzzed in below.',
      }
    }
    if (phase === 'playOrPass') {
      const teamName = buzzTeam === 'A' ? setup.teamAName : setup.teamBName
      return {
        text: `${teamName} controls the board — Play or Pass?`,
        sub: 'Ask the team captain, then tap their choice below.',
      }
    }
    if (phase === 'board') {
      const teamName = controllingTeam === 'A' ? setup.teamAName : setup.teamBName
      const playerName = controllingTeam === 'A' ? teamAPlayerNow : teamBPlayerNow
      return {
        text: `${teamName} is playing the board — next up: ${playerName}`,
        sub: 'Tap the correct answer to reveal it, or tap Strike for a wrong guess.',
      }
    }
    if (phase === 'steal') {
      const stealTeam = controllingTeam === 'A' ? setup.teamBName : setup.teamAName
      return {
        text: `${stealTeam} can keep stealing correct answers for bonus points`,
        sub: 'Tap any answer they get right, or end the steal if they miss.',
      }
    }
    if (phase === 'reveal') {
      const boardTeamName = roundSummary.boardTeam === 'A' ? setup.teamAName : setup.teamBName
      const stealTeamName = roundSummary.stealTeam === 'A' ? setup.teamAName : setup.teamBName
      return {
        text:
          roundSummary.stealPoints > 0
            ? `Round ${roundIndex + 1} complete — ${boardTeamName} banked ${roundSummary.boardPoints} and ${stealTeamName} stole ${roundSummary.stealPoints}`
            : `Round ${roundIndex + 1} complete — ${boardTeamName} banked ${roundSummary.boardPoints}`,
        sub: roundIndex + 1 >= TOTAL_ROUNDS ? 'Tap "See Final Results" to close the show.' : 'Tap "Next Round" when ready to continue.',
      }
    }
    return { text: '', sub: '' }
  }

  const skipLabelFor = () => {
    if (phase === 'faceoff') return 'Force Buzz (Team A)'
    if (phase === 'playOrPass') return 'Default: Play'
    if (phase === 'board') return 'End Board Play'
    if (phase === 'steal') return 'Mark Incorrect'
    if (phase === 'reveal') return roundIndex + 1 >= TOTAL_ROUNDS ? 'Finish Game' : 'Next Round'
    return 'Skip'
  }

  /* ---------------- Render ---------------- */

  if (screen === 'setup') {
    return <SetupScreen setup={setup} setSetup={setSetup} onStart={startGame} />
  }

  if (screen === 'final') {
    const winner =
      scores.A === scores.B ? null : scores.A > scores.B ? { name: setup.teamAName, color: 'teamA' } : { name: setup.teamBName, color: 'teamB' }
    return (
      <div className="relative min-h-screen overflow-hidden bg-stage-950 px-6 py-16 text-center text-stage-100">
        <Confetti />
        <p className="mb-3 font-sans text-sm uppercase tracking-[0.4em] text-gold">Final Results</p>
        {winner ? (
          <>
            <div className="trophy-glow mb-4 text-7xl">🏆</div>
            <h1 className={`font-display text-6xl ${winner.color === 'teamA' ? 'text-teamA-glow' : 'text-teamB-glow'} sm:text-7xl`}>
              {winner.name} WINS!
            </h1>
          </>
        ) : (
          <h1 className="font-display text-6xl text-gold sm:text-7xl">IT'S A TIE!</h1>
        )}

        <div className="relative z-10 mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-6">
          <div className="rounded-2xl border border-teamA/50 bg-teamA-dim/40 p-8">
            <p className="font-sans text-sm uppercase tracking-widest text-stage-300">{setup.teamAName}</p>
            <p className="font-display text-6xl text-teamA-glow">{scores.A}</p>
          </div>
          <div className="rounded-2xl border border-teamB/50 bg-teamB-dim/40 p-8">
            <p className="font-sans text-sm uppercase tracking-widest text-stage-300">{setup.teamBName}</p>
            <p className="font-display text-6xl text-teamB-glow">{scores.B}</p>
          </div>
        </div>

        <button
          onClick={resetGame}
          className="relative z-10 mt-12 rounded-full bg-gold px-10 py-4 font-display text-xl tracking-wide text-stage-950 hover:scale-105"
        >
          NEW GAME
        </button>
      </div>
    )
  }

  /* ---------------- game screen ---------------- */
  const inst = hostInstruction()

  return (
    <div className="min-h-screen bg-stage-950 pb-16 text-stage-100">
      <TopBar
        teamAName={setup.teamAName}
        teamBName={setup.teamBName}
        scores={scores}
        roundIndex={roundIndex}
        sessionSeconds={sessionSeconds}
        multiplier={multiplier}
      />

      <HostBanner
        text={inst.text}
        sub={inst.sub}
        onSkip={handleSkip}
        skipLabel={skipLabelFor()}
        warn={phase === 'steal' && phaseSeconds <= 10}
      />

      <QuestionSearchPanel
        query={answerSearch}
        onQueryChange={setAnswerSearch}
        results={searchResults}
        totalAnswers={questionDatabase.length}
      />

      <div className="mx-auto mt-8 max-w-4xl px-6 sm:px-10">
        <p className="mb-2 text-center font-sans text-xs uppercase tracking-[0.3em] text-stage-500">
          Category {roundIndex + 1}
        </p>
        <h2 className="mb-8 text-center font-display text-3xl text-white sm:text-4xl">{currentCategory?.title}</h2>

        {/* FACE-OFF */}
        {phase === 'faceoff' && (
          <div className="flex flex-col items-center gap-8 pop-in">
            <CountdownRing seconds={phaseSeconds} total={FACEOFF_SECONDS} size={110} />
            <div className="grid w-full grid-cols-2 gap-6">
              <button
                onClick={() => handleBuzz('A')}
                className="rounded-2xl border-2 border-teamA bg-teamA-dim/50 px-6 py-8 text-center transition-transform hover:scale-105"
              >
                <TeamBadge label={setup.teamAName} color="A" />
                <p className="mt-3 font-display text-2xl text-white">
                  {setup.teamAPlayers[faceoffPlayerNum - 1]}
                </p>
                <p className="mt-2 font-sans text-xs uppercase tracking-widest text-teamA-glow">Tap if buzzed first</p>
              </button>
              <button
                onClick={() => handleBuzz('B')}
                className="rounded-2xl border-2 border-teamB bg-teamB-dim/50 px-6 py-8 text-center transition-transform hover:scale-105"
              >
                <TeamBadge label={setup.teamBName} color="B" />
                <p className="mt-3 font-display text-2xl text-white">
                  {setup.teamBPlayers[faceoffPlayerNum - 1]}
                </p>
                <p className="mt-2 font-sans text-xs uppercase tracking-widest text-teamB-glow">Tap if buzzed first</p>
              </button>
            </div>
          </div>
        )}

        {/* PLAY OR PASS */}
        {phase === 'playOrPass' && (
          <div className="flex flex-col items-center gap-8 pop-in">
            <CountdownRing seconds={phaseSeconds} total={PLAYORPASS_SECONDS} size={90} />
            <div className="grid w-full grid-cols-2 gap-6">
              <button
                onClick={() => handlePlayOrPass('play')}
                className="rounded-2xl border-2 border-gold bg-gold/10 px-6 py-10 font-display text-3xl text-gold transition-transform hover:scale-105"
              >
                PLAY
              </button>
              <button
                onClick={() => handlePlayOrPass('pass')}
                className="rounded-2xl border-2 border-stage-500 bg-stage-800 px-6 py-10 font-display text-3xl text-stage-200 transition-transform hover:scale-105"
              >
                PASS
              </button>
            </div>
          </div>
        )}

        {/* BOARD PLAY */}
        {phase === 'board' && (
          <div className="flex flex-col items-center gap-6 pop-in">
            <div className="flex items-center gap-8">
              <TeamBadge label={controllingTeam === 'A' ? setup.teamAName : setup.teamBName} color={controllingTeam} />
              <StrikeMarks strikes={strikes} flash={flashStrike} />
            </div>
            <AnswerBoard board={board} onReveal={handleRevealAnswer} searchQuery={answerSearch} />
            <div className="flex items-center gap-4">
              <p className="font-sans text-sm text-stage-400">
                Round pot: <span className="font-display text-lg text-gold">{roundPoints}</span> pts
              </p>
              <button
                onClick={handleStrike}
                className="rounded-full border-2 border-bad bg-bad/10 px-6 py-3 font-display text-lg text-bad hover:scale-105"
              >
                STRIKE ✗
              </button>
            </div>
          </div>
        )}

        {/* STEAL */}
        {phase === 'steal' && (
          <div className="flex flex-col items-center gap-8 pop-in">
            <CountdownRing seconds={phaseSeconds} total={STEAL_SECONDS} size={110} />
            <TeamBadge
              label={controllingTeam === 'A' ? setup.teamBName : setup.teamAName}
              color={controllingTeam === 'A' ? 'B' : 'A'}
            />
            <AnswerBoard board={board} onReveal={(i) => handleStealResult(true, i)} searchQuery={answerSearch} />
            <button
              onClick={() => handleStealResult(false, null)}
              className="rounded-2xl border-2 border-bad bg-bad/10 px-8 py-4 font-display text-2xl text-bad hover:scale-105"
            >
              END STEAL
            </button>
          </div>
        )}

        {/* REVEAL */}
        {phase === 'reveal' && (
          <div className="flex flex-col items-center gap-8 pop-in">
            <AnswerBoard board={board} revealAll searchQuery={answerSearch} />
            <div className="rounded-2xl border border-gold bg-gold/10 px-8 py-4 text-center">
              <p className="font-sans text-xs uppercase tracking-widest text-gold">Round Award</p>
              <p className="font-display text-3xl text-white">
                {roundSummary.boardTeam === 'A' ? setup.teamAName : setup.teamBName} + {roundSummary.boardPoints}
              </p>
              <p className="mt-2 font-sans text-sm text-stage-300">
                {roundSummary.stealPoints > 0
                  ? `${roundSummary.stealTeam === 'A' ? setup.teamAName : setup.teamBName} also earned ${roundSummary.stealPoints} from steals.`
                  : 'No bonus steal points were earned this round.'}
              </p>
            </div>
            <button
              onClick={nextRound}
              className="rounded-full bg-gold px-10 py-4 font-display text-xl tracking-wide text-stage-950 hover:scale-105"
            >
              {roundIndex + 1 >= TOTAL_ROUNDS ? 'SEE FINAL RESULTS' : 'NEXT ROUND'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
