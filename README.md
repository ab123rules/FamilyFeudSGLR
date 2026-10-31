# Family Feud: Halloween Night

A Family Feud game for a party with friends, played on one screen (a laptop
plugged into the TV). It copies the TV show's look and rules: the blue 2 × 4
survey board with numbered ovals, flipping answer tiles, the bank, team score
podiums, big red X's, Fast Money. It's dressed for Halloween with a moonlit
stage, bats, cobwebs, jack-o'-lanterns, marquee bulbs and candy-corn confetti.

Built with Create React App (react-scripts) and Tailwind/CSS.

## Run locally

```bash
npm install
npm start
```

Opens at http://localhost:3000. Run the rules tests with `npm test`.

## Host setup

- **Teams:** name both teams and list their players. Face-offs rotate down each list.
- **Questions:** write your own surveys for each round, the Sudden Death
  tiebreaker and the five Fast Money questions. Each answer gets a points value.
  Answers always show on the board from highest to lowest. Use a slash for
  alternate answers you'll accept (`Frogs/Toads`). Only the first appears on the board.
- **Add rounds** with the + tab. Rounds 1–2 are single points, round 3 double, round 4 and later triple.
- **Export / Import** saves your questions to a JSON file. Setup also saves in the browser as you type.
- A Halloween sample set is loaded to start with.

## Rules (same as the show)

1. **Face-off:** the first player to buzz answers. The #1 answer wins control
   outright. Otherwise the other player answers, and the higher answer wins.
   If both miss, it keeps passing back and forth until someone hits the board.
2. The winner chooses **Play or Pass**.
3. The controlling team answers one player at a time. **Three strikes** and the
   other team huddles for **one** answer. If it's on the board they steal the
   entire bank, and if not the bank goes to the controlling team.
4. The first team to **300** (changeable) at the end of a round wins. If nobody
   gets there, a triple-points **Sudden Death** face-off decides it.
5. The winners play **Fast Money**: two players and the same five questions, with
   20 and 25 seconds. If player two repeats player one's answer (same words or the
   same survey answer), the app buzzes it automatically and they answer again.
   200 points wins.

## Running the game

The bar at the bottom always tells the host what to say and do next.

- **Answers:** type what the contestant said into the answer field and press
  Enter. If it's on the board, the tile flips. If it isn't, or it's already on
  the board, it's a strike. For a close call, click the tile to accept it anyway.
- **Buzzers:** players can buzz on the keyboard: `A` (left team) and `L` (right team).
- `Space` continues, `H` (hold) peeks at the answer key, `U` undoes, `M` mutes, `F` goes full screen.
- The ☰ host menu adjusts scores, ends the game early, or goes back to setup.
- Refreshed by accident? Setup offers **Resume game in progress**.

## Deploy to Netlify

`netlify.toml` already runs `npm run build` and publishes `build/`. Connect the
GitHub repo in Netlify, or drag the `build/` folder into Netlify's manual deploy.
