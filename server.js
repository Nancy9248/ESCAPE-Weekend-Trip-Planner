const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const MOODS = ['chill', 'wild', 'romantic', 'culture'];
const DISTANCES = ['near', 'mid', 'far'];

function rowToDestination(row) {
  return {
    id: row.id,
    mood: row.mood,
    distance: row.distance,
    name: row.name,
    tagline: row.tagline,
    stamp: row.stamp,
    days: JSON.parse(row.days_json),
    season: row.season,
    palette: JSON.parse(row.palette_json),
  };
}

/**
 * GET /api/destinations?mood=chill&distance=near
 * Both params optional. Returns destinations matching whichever are given.
 */
app.get('/api/destinations', (req, res) => {
  const { mood, distance } = req.query;

  if (mood && !MOODS.includes(mood)) {
    return res.status(400).json({ error: `Unknown mood "${mood}".` });
  }
  if (distance && !DISTANCES.includes(distance)) {
    return res.status(400).json({ error: `Unknown distance "${distance}".` });
  }

  let sql = 'SELECT * FROM destinations WHERE 1=1';
  const params = [];
  if (mood) { sql += ' AND mood = ?'; params.push(mood); }
  if (distance) { sql += ' AND distance = ?'; params.push(distance); }

  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(rowToDestination));
});

/**
 * GET /api/favorites/:userId
 * Returns the full destination objects a given (anonymous, client-generated) user has saved.
 */
app.get('/api/favorites/:userId', (req, res) => {
  const rows = db.prepare(`
    SELECT d.* FROM favorites f
    JOIN destinations d ON d.id = f.destination_id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
  `).all(req.params.userId);
  res.json(rows.map(rowToDestination));
});

/**
 * POST /api/favorites  { userId, destinationId }
 * Saves a favorite. Idempotent — saving twice is a no-op, not an error.
 */
app.post('/api/favorites', (req, res) => {
  const { userId, destinationId } = req.body || {};
  if (!userId || !destinationId) {
    return res.status(400).json({ error: 'userId and destinationId are required.' });
  }
  const dest = db.prepare('SELECT id FROM destinations WHERE id = ?').get(destinationId);
  if (!dest) return res.status(404).json({ error: 'Unknown destination.' });

  db.prepare(`
    INSERT OR IGNORE INTO favorites (user_id, destination_id) VALUES (?, ?)
  `).run(userId, destinationId);

  res.status(201).json({ saved: true });
});

/**
 * DELETE /api/favorites/:userId/:destinationId
 */
app.delete('/api/favorites/:userId/:destinationId', (req, res) => {
  const { userId, destinationId } = req.params;
  db.prepare(`
    DELETE FROM favorites WHERE user_id = ? AND destination_id = ?
  `).run(userId, destinationId);
  res.json({ saved: false });
});

/**
 * POST /api/submissions  { name, mood, distance, tagline, note, submittedBy }
 * A visitor-suggested destination. Stored for review — not shown in
 * /api/destinations results until manually promoted, same as most
 * community-submission features.
 */
app.post('/api/submissions', (req, res) => {
  const { name, mood, distance, tagline, note, submittedBy } = req.body || {};

  if (!name || !mood || !distance || !tagline) {
    return res.status(400).json({ error: 'name, mood, distance, and tagline are required.' });
  }
  if (!MOODS.includes(mood)) return res.status(400).json({ error: `Unknown mood "${mood}".` });
  if (!DISTANCES.includes(distance)) return res.status(400).json({ error: `Unknown distance "${distance}".` });

  db.prepare(`
    INSERT INTO submissions (name, mood, distance, tagline, note, submitted_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(name, mood, distance, tagline, note || null, submittedBy || null);

  res.status(201).json({ received: true });
});

/**
 * GET /api/submissions
 * Lets a maintainer see the review queue. No auth in this version —
 * add one before exposing this publicly beyond a hackathon demo.
 */
app.get('/api/submissions', (req, res) => {
  const rows = db.prepare('SELECT * FROM submissions ORDER BY created_at DESC').all();
  res.json(rows);
});

app.listen(PORT, () => {
  console.log(`ESCAPE server running at http://localhost:${PORT}`);
});
