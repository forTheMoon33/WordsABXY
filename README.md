# Words ABXY

A desktop vocabulary memorization app with spaced repetition, emoji notes, and Excel import. Built for language learners who want to manage multiple word lists independently.

---

## Tech Stack

| Layer | Library / Tool |
|---|---|
| UI | React 18 + Vite 5 |
| Desktop shell | Electron 28 |
| Excel I/O | ExcelJS 4 |
| CSV fallback | PapaParse |
| Icons | Lucide React |

---

## Running the App

```bash
# Full Electron desktop app (recommended)
npm run start

# Browser only (no file system access)
npm run dev

# Package for distribution
npm run dist
```

> **Windows note:** if `npm run start` fails with "running scripts is disabled", run `Set-ExecutionPolicy RemoteSigned` in PowerShell as administrator.

---

## Pages

### Daily
The main study session. Picks words that are due based on their SRS interval and builds a queue of flash-card questions. Each question uses the first card type defined for that word's list.

- Pill selector at the top lets you choose which list to study (or all lists at once). The selection is locked once a session starts.
- Results popup shows correct/incorrect with a color animation.
- A "Check Again" mode re-runs all session words against every card type in their list.
- Words answered wrong 3+ times are flagged 🔴 in their note.

### Study
Free-form browsing and note-taking for words in a selected list.

- Search and filter words by text or emoji tag.
- Click any word to open a detail panel with an editable note field.
- An emoji picker (6 categories, pinned row for recently used) lets you embed emoji directly into notes.
- Notes are saved per-word and surface as visual tags on the Daily card.

### Wordlist
Full CRUD management for lists, words, and card types.

- Sidebar lists all word lists; selecting one scopes all edits to that list.
- Words and card types belong to their list independently — two lists can define the same word with different card types.
- Card types can be **basic** (front/back flip) or **custom** (arbitrary prompt built from word fields).
- Excel import wizard (see below) is accessible from this page.

### Settings
App-wide configuration and data management.

- Stats overview: total words, due today, card types, lists.
- SRS explanation panel.
- Export all data as JSON.
- Full data reset (clears all lists, words, stats).

---

## Data Model

All data is stored in `localStorage`.

### `wl_lists` (array)
Each list owns its words and card types independently:

```json
{
  "id": 1234567890,
  "name": "My Words",
  "words": [
    {
      "id": 1234567891,
      "word": "ephemeral",
      "definition": "lasting a very short time",
      "note": "📌 like morning dew",
      "customFields": {}
    }
  ],
  "cardTypes": [
    { "id": 1, "label": "Word → Definition", "type": "basic" }
  ]
}
```

### `wl_stats` (object keyed by word id)
SRS progress is global across all lists, keyed by word id:

```json
{
  "1234567891": { "level": 3, "nextAt": 1715000000000, "wrongCount": 0 }
}
```

### SRS Intervals

| Level | Interval |
|---|---|
| 0 | due immediately |
| 1 | 1 hour |
| 2 | 3 hours |
| 3 | 24 hours |
| 4 | 3 days |
| 5 | 7 days |
| 6 | 21 days |

Correct answer → level +1. Wrong answer → level −2 (minimum 0). Wrong 3+ times → 🔴 flag appended to note.

---

## Excel Import (4-step wizard)

1. **Pick file** — drag or browse for a `.xlsx` file.
2. **Map columns** — assign each spreadsheet column to a word field. Supported targets: `word`, `definition`, `note`, plus any custom fields already defined for the list.
3. **Preview** — review the first few rows and choose append vs. replace.
4. **Done** — confirmation with import count.

Custom fields not yet in the list are created automatically during import.

---

## Controller Support

Xbox / gamepad input is scaffolded (Gamepad API listener wired up) but not yet fully connected to navigation or answer submission. Binding A/B/X/Y buttons to flash-card actions is planned.

---

## Project Structure

```
src/
  App.jsx       # entire app — all pages, components, and styles in one file
  main.jsx      # React entry point
electron/
  main.js       # Electron main process
```
