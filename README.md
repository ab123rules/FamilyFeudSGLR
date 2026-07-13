# Feud Night — Host Screen

A single-file React "Family Feud" party game host screen for 2 teams of 8 players,
built with Create React App (react-scripts) + Tailwind CSS. Designed to run a
full 6-round game in about 30 minutes, with an on-screen host prompt that
always says exactly what to do next.

The whole game lives in `src/App.js`.

## Run locally

```bash
npm install
npm start
```

This opens the app at http://localhost:3000.

## Build for production

```bash
npm install
npm run build
```

This is a plain `npm run build` — no extra bundler config needed. It outputs
a static site to the `build/` folder, ready to host anywhere.

## Deploy to Netlify (via GitHub)

1. Push this folder to a new GitHub repository.
2. In Netlify: **Add new site → Import an existing project → GitHub** and pick the repo.
3. Netlify will read `netlify.toml` automatically:
   - Build command: `npm run build`
   - Publish directory: `build`
4. Click **Deploy site**. Every push to your main branch will redeploy automatically.

You can also drag-and-drop the built `build/` folder into Netlify's manual
deploy area if you'd rather skip GitHub.

## Using it at the event

1. Open the site on the laptop/computer connected to the TV or projector.
2. On the **Host Setup** screen, name both teams, optionally type in all 16
   player names, pick 6 of the 10 categories (tap in the order you want them
   played), and set any speed-control options.
3. Tap **Start Game**. From here, the gold banner at the top always tells you
   exactly what to say or tap next — face-off, play/pass, board play, steals,
   and round reveals all flow automatically.
4. Use the **Skip / Next Phase** button any time you need to move faster than
   a timer.
5. After Round 6, the Final Results screen shows the winning team with a
   confetti celebration. Tap **New Game** to reset everything for the next round of guests.
