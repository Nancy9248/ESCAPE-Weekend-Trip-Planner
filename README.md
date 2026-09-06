# ESCAPE — Weekend Trip Planner

A mood-first way to pick a short weekend trip — pick a feeling instead of a destination, flip through postcard-style trip ideas, save the ones you like, and suggest your own.

## Problem & Solution

Most trip-discovery tools start by asking "where do you want to go?" — which assumes you already have a destination in mind. Most people don't; they know how they *want to feel* on a short trip (chill, adventurous, romantic, culture-and-food) and how much travel time they're willing to spend. ESCAPE flips the question: pick a mood, set a travel range, and it surfaces destinations that actually match both, presented as postcards you flip to see a ready-made two-day itinerary — with a backend that remembers what you saved and takes suggestions from visitors.

## Features

- **Mood-first discovery** — four mood categories (Chill & Slow, Wild & Outdoors, Romantic Escape, Culture & Food)
- **Travel-range filter** — under 3 hrs / 3–6 hrs / flight-worth-it, filtered server-side
- **Flippable postcard cards** — click or press Enter/Space to reveal a two-day itinerary, best season, and why it matches the chosen mood
- **Save for later** — tap the heart on any postcard to save it; favorites persist across visits via the backend, tied to an anonymous id stored in the browser (no login required)
- **Saved view** — a dedicated screen listing everything you've saved, with the same flip-card interaction
- **Suggest a destination** — a form on the results screen that writes visitor-submitted destinations to the database for review
- **Surprise me / Shuffle** — random mood+range shortcut, and a way to re-shuffle the current results
- **Empty-state recovery** — a mood + range combination with no matches offers a one-click way to widen the range
- **Keyboard and screen-reader friendly** — real buttons/labels throughout, visible focus states
- **Fully responsive** down to mobile widths

## Tech Stack

- **Frontend:** Vanilla HTML, CSS, and JavaScript (no framework, no build step), served as static files by the backend
- **Backend:** Node.js with Express — a small REST API for destinations, favorites, and submissions
- **Database:** SQLite, via `better-sqlite3` — a single file (`escape.db`), created and seeded automatically on first run, no external database server to set up
- **Cloud Hosting:** Any Node-capable host — see Deployment below

## Project Structure

```
escape-fullstack/
├── public/
│   ├── index.html      # markup for all four screens (mood, range, results, saved)
│   ├── styles.css       # all styling
│   └── app.js           # frontend logic — calls the API below
├── server.js            # Express app + all API routes
├── db.js                # SQLite connection, schema, and seeding
├── seed-destinations.json
├── package.json
└── .gitignore
```

## API

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/destinations?mood=&distance=` | List destinations, optionally filtered |
| GET | `/api/favorites/:userId` | List a visitor's saved destinations |
| POST | `/api/favorites` | Save a destination — body: `{ userId, destinationId }` |
| DELETE | `/api/favorites/:userId/:destinationId` | Remove a saved destination |
| POST | `/api/submissions` | Submit a destination suggestion — body: `{ name, mood, distance, tagline, note? }` |
| GET | `/api/submissions` | List the review queue (no auth in this version — add one before exposing this publicly) |

## Installation

```bash
git clone <your-repo-url>
cd escape-fullstack
npm install
```

## Environment Configuration

None required. Optionally set `PORT` to change the port the server listens on (defaults to `3000`).

## Run Commands

```bash
npm start
```

Then open `http://localhost:3000`. The SQLite database file is created and seeded with the starting destinations automatically on first run.

## Deployment

This needs a host that can run a persistent Node process (not a pure static host, since there's now a server and a database file):

- **Render / Railway:** connect the GitHub repo, set the start command to `npm start`, and add a small persistent disk for `escape.db` if you want favorites/submissions to survive redeploys.
- **Fly.io:** works well with SQLite via a mounted volume for the same reason.

Whichever host is used, confirm the resulting URL opens the app directly and is public with no login wall, and that a fresh visit correctly seeds and serves destinations.

## Usage

1. Open the deployed URL.
2. Pick a mood tile, or use "Not sure yet? Let it pick for you" for a random pick.
3. Choose a travel range.
4. Browse the postcard deck — click a card to flip it, tap the heart to save it.
5. Check "Saved" in the top bar any time to see everything you've kept.
6. Use "Suggest a destination" on the results screen to send in your own — it's stored for review, not published automatically.

No accounts or credentials — favorites are tied to an anonymous browser id, not a login.

## Screenshots / Demo

_Add a screenshot or short screen recording of the mood step, a flipped postcard with the heart saved, and the Saved view here before submitting._
