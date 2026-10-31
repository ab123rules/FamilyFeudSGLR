import React, { useEffect, useReducer, useRef, useState } from 'react'
import Setup from './components/Setup'
import FastMoney from './components/FastMoney'
import { GameOver, HostMenu, HostTools, RoundIntro, RoundScreen, TitleScreen } from './components/Show'
import { gameReducer, initialGameState, undoable } from './game/engine'
import { halloweenConfig } from './data/defaultConfig'
import { loadGame, loadSetup, saveGame, saveSetup } from './game/storage'
import { playEvent, setMuted } from './game/sound'

const reducer = undoable(gameReducer)

const isTyping = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)

export default function App() {
  const [config, setConfig] = useState(() => loadSetup() || halloweenConfig())
  const [savedGame, setSavedGame] = useState(() => loadGame())
  const [game, dispatch] = useReducer(reducer, { ...initialGameState, past: [] })
  const [muted, setMutedState] = useState(false)
  const [peeking, setPeeking] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const gameRef = useRef(game)
  gameRef.current = game
  const menuRef = useRef(menuOpen)
  menuRef.current = menuOpen

  useEffect(() => saveSetup(config), [config])
  useEffect(() => {
    if (game.screen !== 'setup') saveGame(game)
  }, [game])
  useEffect(() => playEvent(game.event), [game.event])
  useEffect(() => setMuted(muted), [muted])

  // Round title card moves on by itself.
  useEffect(() => {
    if (game.screen !== 'roundIntro') return
    const id = setTimeout(() => dispatch({ type: 'START_ROUND' }), 2600)
    return () => clearTimeout(id)
  }, [game.screen, game.roundIndex])

  // Fast Money clock.
  const fmRunning = game.screen === 'fastMoney' && game.fm?.running
  useEffect(() => {
    if (!fmRunning) return
    const id = setInterval(() => dispatch({ type: 'TICK' }), 1000)
    return () => clearInterval(id)
  }, [fmRunning])

  const startGame = () => {
    saveGame(null)
    setSavedGame(null)
    dispatch({ type: 'NEW_GAME', config })
  }
  const resumeGame = () => {
    dispatch({ type: 'RESTORE', state: savedGame })
    setSavedGame(null)
  }
  // Leaving a game for setup discards it (but a saved game survives a page reload).
  const prevScreen = useRef(game.screen)
  useEffect(() => {
    if (game.screen === 'setup' && prevScreen.current !== 'setup') saveGame(null)
    prevScreen.current = game.screen
  }, [game.screen])

  /* ---------------- Keyboard: host shortcuts and team buzzers ---------------- */
  useEffect(() => {
    const onKeyDown = (e) => {
      // Autofill and some IMEs send key events without a key.
      if (typeof e.key !== 'string') return
      const key = e.key.toLowerCase()
      if (e.repeat && key !== 'h') return
      const g = gameRef.current
      if ((e.ctrlKey || e.metaKey) && key === 'z' && g.screen !== 'setup') {
        e.preventDefault()
        dispatch({ type: 'UNDO' })
        return
      }
      if (isTyping(document.activeElement) || e.ctrlKey || e.metaKey || e.altKey) return
      if (g.screen === 'setup') return
      if (menuRef.current) {
        if (key === 'escape') setMenuOpen(false)
        return
      }

      if (key === 'h') return setPeeking(true)
      if (key === 'm') return setMutedState((m) => !m)
      if (key === 'u') return dispatch({ type: 'UNDO' })
      if (key === 'f') {
        if (document.fullscreenElement) document.exitFullscreen()
        else document.documentElement.requestFullscreen?.()
        return
      }
      if (key === 'escape') return setMenuOpen(false)

      const go = key === ' ' || key === 'enter'
      // A focused button already handles Space/Enter itself; don't fire twice.
      if (go && document.activeElement?.tagName === 'BUTTON') return
      if (go) e.preventDefault()

      switch (g.screen) {
        case 'title':
          if (go) dispatch({ type: 'START_GAME' })
          break
        case 'roundIntro':
          if (go) dispatch({ type: 'START_ROUND' })
          break
        case 'round':
          if (key === 'a') dispatch({ type: 'BUZZ', team: 0 })
          else if (key === 'l') dispatch({ type: 'BUZZ', team: 1 })
          else if (key === 'x') dispatch({ type: 'STRIKE' })
          else if (/^[1-8]$/.test(key)) dispatch({ type: 'REVEAL', index: Number(key) - 1 })
          else if (go && g.round.phase === 'roundEnd') dispatch({ type: 'NEXT_ROUND' })
          break
        case 'gameOver':
          if (go && g.winner !== null && g.config.fastMoneyEnabled) dispatch({ type: 'FM_START' })
          break
        case 'fastMoney':
          if (go && g.fm.phase === 'reveal') dispatch({ type: 'FM_REVEAL_NEXT' })
          break
        default:
      }
    }
    const onKeyUp = (e) => {
      if (typeof e.key === 'string' && e.key.toLowerCase() === 'h') setPeeking(false)
    }
    // Releasing H outside the window never fires keyup, so stop peeking on blur.
    const onBlur = () => setPeeking(false)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  if (game.screen === 'setup') {
    return <Setup config={config} setConfig={setConfig} onStart={startGame} savedGame={savedGame} onResume={resumeGame} />
  }

  const canPeek = game.screen === 'round' || (game.screen === 'fastMoney' && game.fm?.phase !== 'done')
  const tools = (
    <HostTools
      muted={muted}
      onToggleMute={() => setMutedState((m) => !m)}
      onUndo={() => dispatch({ type: 'UNDO' })}
      canUndo={game.past.length > 0}
      onPeek={canPeek ? setPeeking : undefined}
      onMenu={() => setMenuOpen(true)}
    />
  )
  const props = { game, dispatch, tools, peeking }

  return (
    <>
      {game.screen === 'title' && <TitleScreen {...props} />}
      {game.screen === 'roundIntro' && <RoundIntro {...props} />}
      {game.screen === 'round' && <RoundScreen {...props} />}
      {game.screen === 'gameOver' && <GameOver {...props} />}
      {game.screen === 'fastMoney' && <FastMoney {...props} />}
      {menuOpen && <HostMenu game={game} dispatch={dispatch} onClose={() => setMenuOpen(false)} />}
    </>
  )
}
