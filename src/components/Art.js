import React, { useMemo } from 'react'

/* ---------------- Stroke icons (24px grid, 2px stroke) ---------------- */

const ICONS = {
  undo: <><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  sound: <><path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M19 5a10 10 0 0 1 0 14" /></>,
  mute: <><path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="m22 9-6 6M16 9l6 6" /></>,
  expand: <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  close: <path d="M18 6 6 18M6 6l12 12" />,
  trash: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /></>,
  download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>,
  upload: <><path d="M12 21V9" /><path d="m7 14 5-5 5 5" /><path d="M5 3h14" /></>,
  arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  sort: <><path d="M7 4v16" /><path d="m3 16 4 4 4-4" /><path d="M14 6h7M14 12h5M14 18h3" /></>,
  play: <path d="M7 4v16l13-8z" />,
  pause: <path d="M7 4h3v16H7zM14 4h3v16h-3z" />,
  keyboard: <><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" /></>,
  reset: <><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></>,
}

export function Icon({ name, size = 20, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  )
}

/* ---------------- Halloween art ---------------- */

export function Bat({ className = '', style }) {
  return (
    <svg viewBox="0 0 100 40" className={className} style={style} aria-hidden="true">
      <path
        fill="currentColor"
        d="M50 31c-2.6 0-4.6-2.4-4.8-5.2l-2.4-8.6 3.6 3.8c1.1-.9 2.3-1.2 3.6-1.2s2.5.3 3.6 1.2l3.6-3.8-2.4 8.6C54.6 28.6 52.6 31 50 31zM45.4 24.5C38 14 22 9.5 3 13.5c6.5 3.6 9 9.6 7 16.5 5.8-4 12.2-2.4 14.6 4 3.5-5.8 9.4-6.2 13.4-.6 1.6-5.6 4.6-7.4 8.2-6.6zM54.6 24.5C62 14 78 9.5 97 13.5c-6.5 3.6-9 9.6-7 16.5-5.8-4-12.2-2.4-14.6 4-3.5-5.8-9.4-6.2-13.4-.6-1.6-5.6-4.6-7.4-8.2-6.6z"
      />
    </svg>
  )
}

export function Pumpkin({ className = '', lit = true }) {
  return (
    <svg viewBox="0 0 100 92" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="pk-body" cx="45%" cy="40%" r="65%">
          <stop offset="0" stopColor="#ffb347" />
          <stop offset="0.55" stopColor="#f2721c" />
          <stop offset="1" stopColor="#9c3a06" />
        </radialGradient>
        <radialGradient id="pk-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff6b0" />
          <stop offset="1" stopColor="#ffb21f" />
        </radialGradient>
      </defs>
      <path d="M48 20c-1-7 2-13 9-16l3 4c-5 2-6 6-5 12z" fill="#3f5a1e" />
      <ellipse cx="30" cy="56" rx="24" ry="32" fill="url(#pk-body)" />
      <ellipse cx="70" cy="56" rx="24" ry="32" fill="url(#pk-body)" />
      <ellipse cx="50" cy="56" rx="26" ry="34" fill="url(#pk-body)" stroke="#9c3a06" strokeOpacity="0.45" />
      <g fill={lit ? 'url(#pk-glow)' : '#2a0d00'}>
        <path d="M27 46l12-2-5 12z" />
        <path d="M73 46l-12-2 5 12z" />
        <path d="M46 58h8l-4 7z" />
        <path d="M22 66c8 10 48 10 56 0-2 9-10 16-28 16S24 75 22 66zm12 4 4 6 4-5zm14 2 4 6 4-6zm14-2 4 5 4-6z" fillRule="evenodd" />
      </g>
    </svg>
  )
}

export function Moon({ className = '' }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="moon-face" cx="40%" cy="38%" r="62%">
          <stop offset="0" stopColor="#fff8dc" />
          <stop offset="0.7" stopColor="#f3dc9c" />
          <stop offset="1" stopColor="#c9a65a" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="46" fill="url(#moon-face)" />
      <circle cx="36" cy="38" r="7" fill="#d9bd78" opacity="0.55" />
      <circle cx="62" cy="58" r="10" fill="#d9bd78" opacity="0.45" />
      <circle cx="58" cy="28" r="4" fill="#d9bd78" opacity="0.5" />
    </svg>
  )
}

export function CobwebCorner({ className = '' }) {
  const rays = [0, 18, 36, 54, 72, 90]
  return (
    <svg viewBox="0 0 120 120" className={className} fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
      {rays.map((deg) => {
        const r = (deg * Math.PI) / 180
        return <line key={deg} x1="0" y1="0" x2={Math.cos(r) * 120} y2={Math.sin(r) * 120} />
      })}
      {[28, 52, 78, 104].map((d) => (
        <path
          key={d}
          d={rays
            .map((deg, i) => {
              const r = (deg * Math.PI) / 180
              const x = Math.cos(r) * d
              const y = Math.sin(r) * d
              return `${i === 0 ? 'M' : 'Q'}${i === 0 ? '' : `${Math.cos(r - 0.16) * d * 0.86} ${Math.sin(r - 0.16) * d * 0.86} `}${x} ${y}`
            })
            .join(' ')}
        />
      ))}
    </svg>
  )
}

/** The show's chunky red strike X, outlined in white. */
export function StrikeX({ className = '' }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <g strokeLinecap="round">
        <path d="M18 18 82 82M82 18 18 82" stroke="#2b0505" strokeWidth="30" transform="translate(3 4)" opacity="0.6" />
        <path d="M18 18 82 82M82 18 18 82" stroke="#f4f1ea" strokeWidth="28" />
        <path d="M18 18 82 82M82 18 18 82" stroke="#d3121b" strokeWidth="19" />
        <path d="M20 16 80 76M80 16 20 76" stroke="#ff5a4f" strokeWidth="5" opacity="0.65" />
      </g>
    </svg>
  )
}

/* ---------------- Stage backdrop ---------------- */

export function StageBackdrop({ calm = false }) {
  const bats = useMemo(
    () =>
      Array.from({ length: calm ? 4 : 7 }, (_, i) => ({
        id: i,
        top: 6 + ((i * 37) % 48),
        size: 28 + ((i * 13) % 34),
        duration: 22 + ((i * 7) % 16),
        delay: -((i * 5.3) % 20),
      })),
    [calm],
  )
  return (
    <div className="stage-backdrop" aria-hidden="true">
      <div className="stage-rays" />
      {!calm && <Moon className="stage-moon" />}
      <CobwebCorner className="stage-web stage-web-left" />
      <CobwebCorner className="stage-web stage-web-right" />
      {bats.map((b) => (
        <Bat
          key={b.id}
          className="stage-bat"
          style={{ top: `${b.top}%`, width: b.size, '--fly-dur': `${b.duration}s`, '--fly-delay': `${b.delay}s` }}
        />
      ))}
      <div className="stage-fog" />
    </div>
  )
}

/* ---------------- Logo: the show's oval, Halloween edition ---------------- */

export function FeudLogo({ className = '', subtitle = 'Halloween Night' }) {
  return (
    <div className={`feud-logo ${className}`}>
      <svg viewBox="0 0 520 260" role="img" aria-label="Family Feud">
        <defs>
          <linearGradient id="logo-rim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffe9a6" />
            <stop offset="0.45" stopColor="#ffa62b" />
            <stop offset="1" stopColor="#a8420b" />
          </linearGradient>
          <radialGradient id="logo-fill" cx="50%" cy="35%" r="70%">
            <stop offset="0" stopColor="#4a2a8f" />
            <stop offset="1" stopColor="#170a33" />
          </radialGradient>
          <path id="logo-arc" d="M95 128 Q260 30 425 128" />
        </defs>
        <ellipse cx="260" cy="130" rx="250" ry="122" fill="url(#logo-rim)" />
        <ellipse cx="260" cy="130" rx="232" ry="105" fill="url(#logo-fill)" />
        <ellipse cx="260" cy="130" rx="222" ry="96" fill="none" stroke="#ffb547" strokeOpacity="0.5" strokeWidth="2" />
        <text className="logo-family" fontSize="58" textAnchor="middle">
          <textPath href="#logo-arc" startOffset="50%">FAMILY</textPath>
        </text>
        <text className="logo-feud" x="260" y="198" fontSize="118" textAnchor="middle">FEUD</text>
      </svg>
      {subtitle && <p className="feud-logo-sub">{subtitle}</p>}
    </div>
  )
}

/* ---------------- Falling candy and bats for wins ---------------- */

export function SpookyConfetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        id: i,
        left: (i * 53) % 100,
        delay: ((i * 0.37) % 3).toFixed(2),
        duration: (4 + ((i * 0.61) % 3)).toFixed(2),
        kind: i % 5 === 0 ? 'bat' : i % 3 === 0 ? 'dot' : 'corn',
        size: 14 + ((i * 7) % 16),
      })),
    [],
  )
  return (
    <div className="confetti-layer" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{ left: `${p.left}%`, animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`, width: p.size }}
        >
          {p.kind === 'bat' ? (
            <Bat className="confetti-bat" />
          ) : p.kind === 'dot' ? (
            <svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="#9b5cff" /></svg>
          ) : (
            <svg viewBox="0 0 20 24">
              <path d="M10 0 20 24H0z" fill="#fff4dc" />
              <path d="M3.3 16 16.7 16 20 24H0z" fill="#ffb21f" />
              <path d="M6.7 8 13.3 8 16.7 16H3.3z" fill="#f2721c" />
            </svg>
          )}
        </span>
      ))}
    </div>
  )
}
