const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'escape.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS destinations (
    id TEXT PRIMARY KEY,
    mood TEXT NOT NULL,
    distance TEXT NOT NULL,
    name TEXT NOT NULL,
    tagline TEXT NOT NULL,
    stamp TEXT NOT NULL,
    days_json TEXT NOT NULL,
    season TEXT NOT NULL,
    palette_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    destination_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, destination_id),
    FOREIGN KEY(destination_id) REFERENCES destinations(id)
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    mood TEXT NOT NULL,
    distance TEXT NOT NULL,
    tagline TEXT NOT NULL,
    note TEXT,
    submitted_by TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed destinations only if the table is empty, so re-starting the
// server never wipes favorites/submissions or duplicates rows.
const seedData = require('./seed-destinations.json');
const count = db.prepare('SELECT COUNT(*) AS n FROM destinations').get().n;

if (count === 0) {
  const insert = db.prepare(`
    INSERT INTO destinations (id, mood, distance, name, tagline, stamp, days_json, season, palette_json)
    VALUES (@id, @mood, @distance, @name, @tagline, @stamp, @days_json, @season, @palette_json)
  `);
  const insertMany = db.transaction((rows) => {
    for (const row of rows) insert.run(row);
  });
  insertMany(seedData.map(d => ({
    ...d,
    days_json: JSON.stringify(d.days),
    palette_json: JSON.stringify(d.palette),
  })));
  console.log(`Seeded ${seedData.length} destinations.`);
}

module.exports = db;
