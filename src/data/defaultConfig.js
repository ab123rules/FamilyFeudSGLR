/* Halloween sample survey — every question and answer is editable in Host Setup. */

const a = (text, points) => ({ text, points })

export const blankQuestion = () => ({ question: '', answers: [a('', ''), a('', ''), a('', ''), a('', '')] })

export const halloweenConfig = () => ({
  targetScore: 300,
  fastMoneyEnabled: true,
  teams: [
    { name: 'The Ghouls', players: ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5'] },
    { name: 'The Goblins', players: ['Player 1', 'Player 2', 'Player 3', 'Player 4', 'Player 5'] },
  ],
  rounds: [
    {
      question: 'Name something people dress up as for Halloween',
      answers: [
        a('Witch', 30), a('Ghost', 18), a('Vampire', 14), a('Zombie', 11),
        a('Superhero', 9), a('Pirate', 7), a('Princess', 5), a('Skeleton', 4),
      ],
    },
    {
      question: 'Name something you would find in a haunted house',
      answers: [
        a('Ghosts', 34), a('Cobwebs/Spiderwebs', 20), a('Skeletons', 14), a('Bats', 10),
        a('Creaky stairs', 8), a('Coffin', 6), a('Rats', 4),
      ],
    },
    {
      question: 'Name a popular Halloween candy',
      answers: [
        a('Candy corn', 28), a("Reese's cups", 24), a('Snickers', 15), a('KitKat', 12),
        a("M&M's", 9), a('Skittles', 6),
      ],
    },
    {
      question: "Name something a witch might keep in her cauldron",
      answers: [
        a('Potion/Brew', 31), a('Frogs/Toads', 22), a('Eyeballs', 16), a('Bat wings', 11),
        a('Spiders', 8), a('Snakes', 6),
      ],
    },
  ],
  suddenDeath: {
    question: 'Name a scary movie villain',
    answers: [
      a('Freddy Krueger', 33), a('Michael Myers', 25), a('Jason', 20), a('Chucky', 12),
      a('Pennywise', 6), a('Ghostface', 4),
    ],
  },
  fastMoney: [
    {
      question: 'Name a color you see a lot at Halloween',
      answers: [a('Orange', 52), a('Black', 35), a('Purple', 7), a('Green', 4), a('Red', 2)],
    },
    {
      question: 'Name something people carve',
      answers: [a('Pumpkin/Jack-o-lantern', 71), a('Turkey', 14), a('Wood', 8), a('Ice', 4), a('Soap', 3)],
    },
    {
      question: 'Name a place a vampire might sleep',
      answers: [a('Coffin', 68), a('Crypt/Tomb', 12), a('Castle', 9), a('Cave', 6), a('Basement', 5)],
    },
    {
      question: 'Name an animal associated with Halloween',
      answers: [a('Black cat/Cat', 49), a('Bat', 31), a('Spider', 10), a('Owl', 6), a('Wolf/Werewolf', 4)],
    },
    {
      question: 'Name something that goes bump in the night',
      answers: [a('Ghost', 38), a('Monster', 19), a('Burglar', 15), a('Pet/Cat/Dog', 12), a('House settling', 9)],
    },
  ],
})

export const emptyConfig = () => ({
  ...halloweenConfig(),
  rounds: Array.from({ length: 4 }, blankQuestion),
  suddenDeath: blankQuestion(),
  fastMoney: Array.from({ length: 5 }, blankQuestion),
})

/** Coerces anything loaded from a file or storage into a valid setup shape. */
export function sanitizeConfig(raw) {
  const base = halloweenConfig()
  if (!raw || typeof raw !== 'object') return base
  const str = (v) => (typeof v === 'string' ? v : v == null ? '' : String(v))
  const question = (q) => ({
    question: str(q?.question),
    answers: (Array.isArray(q?.answers) ? q.answers : []).slice(0, 8).map((x) => ({
      text: str(x?.text),
      points: x?.points === '' || x?.points == null || Number.isNaN(Number(x.points)) ? '' : Number(x.points),
    })),
  })
  const teams = [0, 1].map((i) => {
    const t = Array.isArray(raw.teams) ? raw.teams[i] : null
    const players = (Array.isArray(t?.players) ? t.players : base.teams[i].players).map(str).slice(0, 10)
    return { name: str(t?.name) || base.teams[i].name, players: players.length ? players : ['Player 1'] }
  })
  const rounds = Array.isArray(raw.rounds) && raw.rounds.length ? raw.rounds.map(question) : base.rounds
  const fastMoney = Array.isArray(raw.fastMoney)
    ? Array.from({ length: 5 }, (_, i) => question(raw.fastMoney[i]))
    : base.fastMoney
  return {
    targetScore: Number(raw.targetScore) > 0 ? Number(raw.targetScore) : 300,
    fastMoneyEnabled: raw.fastMoneyEnabled !== false,
    teams,
    rounds,
    suddenDeath: raw.suddenDeath && typeof raw.suddenDeath === 'object' ? question(raw.suddenDeath) : base.suddenDeath,
    fastMoney,
  }
}

/** Lists what still needs filling in before the game can start. */
export function validateConfig(config) {
  const issues = []
  const checkQuestion = (q, label) => {
    if (!q.question.trim()) issues.push(`${label}: type the survey question`)
    const valid = q.answers.filter((x) => String(x.text).trim() && Number(x.points) > 0)
    if (valid.length === 0) issues.push(`${label}: add at least one answer with points`)
  }
  config.teams.forEach((t, i) => {
    if (!t.name.trim()) issues.push(`Team ${i + 1}: needs a name`)
  })
  if (config.rounds.length === 0) issues.push('Add at least one round')
  config.rounds.forEach((r, i) => checkQuestion(r, `Round ${i + 1}`))
  checkQuestion(config.suddenDeath, 'Sudden Death')
  if (config.fastMoneyEnabled) config.fastMoney.forEach((q, i) => checkQuestion(q, `Fast Money ${i + 1}`))
  return issues
}
