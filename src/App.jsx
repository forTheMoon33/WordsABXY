import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ExcelJS from 'exceljs';

// ─── CSS injected globally ───────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:       #0d0f14;
    --surface:  #161a23;
    --surface2: #1e2330;
    --border:   #2a3045;
    --text:     #e8ecf4;
    --muted:    #6b7694;
    --accent:   #7fffb2;
    --accent2:  #5b8fff;
    --danger:   #ff5b7f;
    --warn:     #ffc85b;
    --radius:   14px;
    --mono:     'Space Mono', monospace;
    --sans:     'DM Sans', sans-serif;
  }

  html, body, #root { height: 100%; background: var(--bg); color: var(--text); font-family: var(--sans); }

  /* scrollbar */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }

  /* utility */
  .mono { font-family: var(--mono); }

  /* nav tab bar */
  .nav-bar {
    position: fixed; bottom: 0; left: 0; right: 0;
    display: flex; background: var(--surface);
    border-top: 1px solid var(--border);
    z-index: 100;
  }
  .nav-tab {
    flex: 1; padding: 12px 4px 16px;
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    background: none; border: none; color: var(--muted);
    font-family: var(--mono); font-size: 10px; cursor: pointer;
    transition: color .2s;
  }
  .nav-tab.active { color: var(--accent); }
  .nav-tab svg { width: 20px; height: 20px; stroke: currentColor; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

  /* page shell */
  .page { min-height: 100svh; padding-bottom: 72px; overflow-y: auto; }
  .page-inner { max-width: 800px; margin: 0 auto; padding: 24px 16px; }

  /* page header */
  .page-header { margin-bottom: 28px; }
  .page-title { font-family: var(--mono); font-size: 22px; font-weight: 700; color: var(--text); }
  .page-sub { font-size: 13px; color: var(--muted); margin-top: 4px; }

  /* card */
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); }
  .card-p { padding: 20px; }

  /* button */
  .btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 20px; border-radius: 10px; border: none;
    font-family: var(--mono); font-size: 13px; font-weight: 700;
    cursor: pointer; transition: all .15s; white-space: nowrap;
  }
  .btn-primary { background: var(--accent); color: #0d0f14; }
  .btn-primary:hover { filter: brightness(1.1); }
  .btn-ghost { background: transparent; color: var(--muted); border: 1px solid var(--border); }
  .btn-ghost:hover { border-color: var(--text); color: var(--text); }
  .btn-danger { background: transparent; color: var(--danger); border: 1px solid var(--danger); }
  .btn-danger:hover { background: var(--danger); color: #fff; }
  .btn-sm { padding: 6px 12px; font-size: 11px; }
  .btn:disabled { opacity: .4; cursor: not-allowed; pointer-events: none; }

  /* pill badge */
  .badge { display: inline-block; padding: 2px 10px; border-radius: 99px; font-size: 11px; font-family: var(--mono); }
  .badge-accent { background: #7fffb220; color: var(--accent); }
  .badge-muted  { background: var(--surface2); color: var(--muted); }

  /* input */
  .field { width: 100%; background: var(--surface2); border: 1px solid var(--border);
    border-radius: 8px; padding: 10px 14px; color: var(--text);
    font-family: var(--sans); font-size: 14px; outline: none;
    transition: border-color .2s; }
  .field:focus { border-color: var(--accent2); }
  .field::placeholder { color: var(--muted); }
  textarea.field { resize: vertical; min-height: 80px; }

  /* label above field */
  .field-label { font-size: 11px; font-family: var(--mono); color: var(--muted); margin-bottom: 6px; }

  /* section label */
  .section-label { font-size: 11px; font-family: var(--mono); color: var(--muted); letter-spacing: .08em; text-transform: uppercase; margin-bottom: 12px; }

  /* divider */
  .divider { height: 1px; background: var(--border); margin: 20px 0; }

  /* choice button (daily quiz) */
  .choice-btn {
    width: 100%; padding: 14px 18px; border-radius: 10px; border: 1.5px solid var(--border);
    background: var(--surface2); color: var(--text); text-align: left;
    font-family: var(--sans); font-size: 15px; cursor: pointer; transition: all .15s;
    display: flex; align-items: center; gap: 12px;
  }
  .choice-btn:hover { border-color: var(--accent2); }
  .choice-btn.selected { border-color: var(--accent2); background: #5b8fff18; }
  .choice-btn.correct { border-color: var(--accent); background: #7fffb218; color: var(--accent); }
  .choice-btn.wrong   { border-color: var(--danger); background: #ff5b7f18; color: var(--danger); }
  .choice-key { font-family: var(--mono); font-size: 12px; color: var(--muted); min-width: 20px; }

  /* progress bar */
  .prog-bar { height: 3px; background: var(--border); border-radius: 99px; overflow: hidden; }
  .prog-fill { height: 100%; background: var(--accent); border-radius: 99px; transition: width .4s ease; }

  /* word study card */
  .study-word { font-family: var(--mono); font-size: 38px; font-weight: 700; line-height: 1.1; }
  .study-gender { font-size: 19px; color: var(--muted); font-style: italic; margin-top: 6px; letter-spacing: 0.01em; }
  .study-field-row { display: grid; grid-template-columns: 120px 1fr; gap: 8px 16px; align-items: baseline; }
  .study-field-key { font-size: 11px; font-family: var(--mono); color: var(--muted); text-transform: uppercase; }
  .study-field-val { font-size: 15px; color: var(--text); }

  /* popup overlay */
  .popup-overlay {
    position: fixed; inset: 0; background: #0008;
    display: flex; align-items: center; justify-content: center; z-index: 200;
    animation: fadeIn .15s ease;
  }
  .popup-box {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 20px; padding: 36px 48px; text-align: center;
    animation: popIn .2s cubic-bezier(.34,1.56,.64,1);
  }
  .popup-emoji { font-size: 64px; line-height: 1; margin-bottom: 12px; }
  .popup-label { font-family: var(--mono); font-size: 24px; font-weight: 700; }
  .popup-label.correct { color: var(--accent); }
  .popup-label.wrong   { color: var(--danger); }

  @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
  @keyframes popIn  { from { transform: scale(.8); opacity: 0 } to { transform: scale(1); opacity: 1 } }

  /* mode tab row */
  .mode-tabs { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 20px; }
  .mode-tab { padding: 7px 16px; border-radius: 8px; font-size: 12px; font-family: var(--mono); cursor: pointer; border: 1px solid var(--border); background: transparent; color: var(--muted); transition: all .15s; }
  .mode-tab.active { background: var(--surface2); color: var(--text); border-color: var(--accent2); }

  /* table */
  .wl-table { width: 100%; border-collapse: collapse; }
  .wl-table th, .wl-table td { padding: 10px 12px; border-bottom: 1px solid var(--border); font-size: 13px; text-align: left; vertical-align: middle; }
  .wl-table th { font-family: var(--mono); font-size: 11px; color: var(--muted); font-weight: 400; white-space: nowrap; }
  .wl-table td { color: var(--text); }
  .wl-table tr:hover td { background: var(--surface2); }
  .wl-table td input[type=text] { background: none; border: none; color: var(--text); font-size: 13px; width: 100%; outline: none; }
  .wl-table td input[type=text]:focus { border-bottom: 1px solid var(--accent2); }

  /* checkbox */
  input[type=checkbox] { accent-color: var(--accent2); width: 15px; height: 15px; }

  /* word field chips */
  .field-chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: var(--surface2); border: 1.5px solid var(--border); border-radius: 99px; font-size: 12px; font-family: var(--mono); color: var(--muted); cursor: pointer; user-select: none; transition: all .15s; }
  .field-chip.on { color: var(--text); border-color: var(--accent2); background: #5b8fff18; font-weight: 600; }
  .field-chip .chip-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--muted); }
  .field-chip.on .chip-dot { background: var(--accent2); }

  /* emoji picker row */
  .emoji-row { display: flex; flex-wrap: wrap; gap: 6px; }
  .emoji-btn { background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 6px 10px; font-size: 20px; cursor: pointer; transition: all .15s; }
  .emoji-btn:hover { border-color: var(--accent); }

  /* step wizard */
  .wizard-step { animation: fadeIn .2s ease; }

  /* back link */
  .back-link { display: inline-flex; align-items: center; gap-6px; font-family: var(--mono); font-size: 12px; color: var(--muted); cursor: pointer; border: none; background: none; margin-bottom: 20px; transition: color .15s; }
  .back-link:hover { color: var(--text); }

  /* floating quit btn */
  .quit-btn { position: fixed; top: 16px; right: 16px; z-index: 150; padding: 8px 16px; border-radius: 99px; background: var(--surface); border: 1px solid var(--border); font-family: var(--mono); font-size: 12px; color: var(--muted); cursor: pointer; transition: all .15s; }
  .quit-btn:hover { color: var(--danger); border-color: var(--danger); }

  /* highlight accent line */
  .accent-line { width: 32px; height: 3px; background: var(--accent); border-radius: 99px; margin-bottom: 16px; }

  /* empty state */
  .empty-state { text-align: center; padding: 60px 20px; }
  .empty-state .e-icon { font-size: 48px; margin-bottom: 12px; }
  .empty-state .e-label { font-family: var(--mono); font-size: 14px; color: var(--muted); }
`;

function injectCSS() {
  if (document.getElementById('wabxy-css')) return;
  const s = document.createElement('style');
  s.id = 'wabxy-css';
  s.textContent = GLOBAL_CSS;
  document.head.appendChild(s);
}

// ─── SVG icons ───────────────────────────────────────────────────────────────
const Icon = {
  Daily: () => <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Study: () => <svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  Wordlist: () => <svg viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  Settings: () => <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  Plus: () => <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  Trash: () => <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  Upload: () => <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Download: () => <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Close: () => <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  ChevronRight: () => <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>,
  ArrowLeft: () => <svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  Check: () => <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>,
  Grip: () => <svg viewBox="0 0 24 24"><circle cx="9" cy="7" r="1" fill="currentColor"/><circle cx="15" cy="7" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="17" r="1" fill="currentColor"/><circle cx="15" cy="17" r="1" fill="currentColor"/></svg>,
  Eye: () => <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Edit: () => <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  List: () => <svg viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
};

// ─── Default word fields ──────────────────────────────────────────────────────
const DEFAULT_FIELDS = ['word','gender','meaning','translation_en','translation_cn','example','example_without_word','note'];
const SYSTEM_FIELDS  = ['id','create_date','practice_time'];
const ALL_FIELDS = [...DEFAULT_FIELDS];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function ls(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSave(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function buildQuizOptions(words, current, answerKey) {
  const correct = current[answerKey];
  const pool = shuffle(
    words.filter(w => w.id !== current.id && w[answerKey] && w[answerKey] !== correct)
  ).slice(0, 3).map(w => w[answerKey]);
  const opts = shuffle([correct, ...pool]);
  while (opts.length < 4) opts.push('—');
  return opts;
}

// ─── Spaced Repetition (SM-2 simplified) ─────────────────────────────────────
const SRS_INTERVALS = [0, 1, 3, 24, 72, 168, 504];

function isDueNow(stat) {
  if (!stat || stat.srsLevel === undefined || stat.srsLevel === 0) return true;
  if (!stat.nextReviewAt) return true;
  return Date.now() >= stat.nextReviewAt;
}

function updateSRS(stat = {}, correct) {
  const now = Date.now();
  let level = stat.srsLevel ?? 0;
  if (correct) {
    level = Math.min(level + 1, SRS_INTERVALS.length - 1);
  } else {
    level = Math.max(1, level - 2);
  }
  const hoursUntilNext = SRS_INTERVALS[level] ?? 168;
  return {
    ...stat,
    srsLevel: level,
    nextReviewAt: now + hoursUntilNext * 3600 * 1000,
    lastReviewAt: now,
    attempts:  (stat.attempts  || 0) + 1,
    correct:   (stat.correct   || 0) + (correct ? 1 : 0),
    wrongStreak: correct ? 0 : (stat.wrongStreak || 0) + 1,
    totalWrong:  (stat.totalWrong || 0) + (correct ? 0 : 1),
  };
}

function nextReviewLabel(stat) {
  if (!stat?.nextReviewAt) return 'now';
  const diff = stat.nextReviewAt - Date.now();
  if (diff <= 0) return 'now';
  const h = diff / 3600000;
  if (h < 1) return `${Math.ceil(diff / 60000)}m`;
  if (h < 24) return `${Math.round(h)}h`;
  return `${Math.round(h / 24)}d`;
}

const QUICK_EMOJIS = ['⭐','❤️','🔥','💡','❓','😅','🧠','📌','👀','✅','❌','🎯'];

function extractEmojis(note) {
  if (!note) return '';
  const emojiRegex = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu;
  const matches = note.match(emojiRegex);
  if (!matches) return '';
  return [...new Set(matches)].slice(0, 4).join('');
}

// ─── Demo data ────────────────────────────────────────────────────────────────
const DEMO_WORDS = [
  { id:1, word:'ephemeral', gender:'', meaning:'lasting a very short time', translation_en:'transient', translation_cn:'短暂的', example:'The joy was ephemeral.', example_without_word:'The joy was _____.', note:'', create_date:'2025-01-01', practice_time:0 },
  { id:2, word:'ubiquitous', gender:'', meaning:'present everywhere', translation_en:'omnipresent', translation_cn:'无处不在的', example:'Smartphones are ubiquitous.', example_without_word:'Smartphones are _____.', note:'', create_date:'2025-01-01', practice_time:0 },
  { id:3, word:'resilient', gender:'', meaning:'recovering quickly from difficulty', translation_en:'tough', translation_cn:'有韧性的', example:'She is resilient.', example_without_word:'She is _____.', note:'', create_date:'2025-01-01', practice_time:0 },
];
const DEMO_CARD_TYPES = [{ id:1, questionKey:'word', answerKey:'meaning', name:'word → meaning' }];

// ─── Storage migration ────────────────────────────────────────────────────────
// Old shape: global 'wordlist' + global 'cardTypes' + 'wl_lists' with {id,name,wordIds[]}
// New shape: 'wl_lists' with {id, name, words[], cardTypes[]}
function migrateStorage() {
  const stored = ls('wl_lists', null);
  // Already new format: list items have a .words array
  if (stored && stored.length > 0 && Array.isArray(stored[0]?.words)) return stored;

  const oldWords = ls('wordlist', null);
  const oldCardTypes = ls('cardTypes', null);

  if (oldWords !== null || oldCardTypes !== null) {
    localStorage.removeItem('wordlist');
    localStorage.removeItem('cardTypes');
    const newLists = [{
      id: 1,
      name: 'My Words',
      words: oldWords ?? DEMO_WORDS,
      cardTypes: oldCardTypes ?? DEMO_CARD_TYPES,
    }];
    lsSave('wl_lists', newLists);
    return newLists;
  }

  return null; // fresh start — caller will use demo data
}

// ─── Popup ───────────────────────────────────────────────────────────────────
function ResultPopup({ correct, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 900);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="popup-box">
        <div className="popup-emoji">{correct ? '✅' : '❌'}</div>
        <div className={`popup-label ${correct ? 'correct' : 'wrong'}`}>
          {correct ? 'Correct!' : 'Wrong'}
        </div>
      </div>
    </div>
  );
}

// ─── LIST PILL SELECTOR ───────────────────────────────────────────────────────
function ListPillSelector({ lists, value, onChange }) {
  return (
    <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:20}}>
      {[{ id:'__all__', name:'All Lists' }, ...lists].map(l => {
        const active = value === l.id;
        return (
          <button key={l.id} onClick={() => onChange(l.id)} style={{
            padding:'6px 14px', borderRadius:99, border:'1.5px solid',
            fontFamily:'var(--mono)', fontSize:12, cursor:'pointer', transition:'all .15s',
            borderColor: active ? 'var(--accent)' : 'var(--border)',
            background:  active ? '#7fffb218'     : 'transparent',
            color:       active ? 'var(--accent)'  : 'var(--muted)',
          }}>
            {l.name}
          </button>
        );
      })}
    </div>
  );
}

// ─── DAILY PAGE ──────────────────────────────────────────────────────────────
const CHOICE_LABELS = ['A','B','C','D'];
const SLOT_COLORS = [
  { bg:'#1a2a1a', border:'#4caf50', text:'#7fff7f' },
  { bg:'#1a1a2e', border:'#5b8fff', text:'#8fb4ff' },
  { bg:'#2a1a1a', border:'#ff5b7f', text:'#ff8fa3' },
  { bg:'#2a2a1a', border:'#ffc85b', text:'#ffe08f' },
];

function DailyPage({ lists, stats, onSaveStats }) {
  // ── Persisted list selection ─────────────────────────────────────────────
  const [dailyListSel, setDailyListSelRaw] = useState(() => {
    const stored = ls('dailyListSel', '__all__');
    if (stored === '__all__') return '__all__';
    return lists.find(l => l.id === stored) ? stored : '__all__';
  });
  const setDailyListSel = (v) => { setDailyListSelRaw(v); lsSave('dailyListSel', v); };

  // ── Session state ────────────────────────────────────────────────────────
  const [sessionStarted, setSessionStarted] = useState(false);
  const [questions, setQuestions] = useState(null);
  const [qi, setQi] = useState(0);
  const [selected, setSelected] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [popup, setPopup] = useState(null);
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);
  const [wrongIds, setWrongIds] = useState([]);

  const statsRef = useRef(stats);
  useEffect(() => { statsRef.current = stats; }, [stats]);
  // Each entry: { word, listCardTypes[] } — locked at session start
  const sessionCandidatesRef = useRef([]);

  // ── Derive candidates for selected list(s) ───────────────────────────────
  // For "All Lists": flatten all lists that have cardTypes, tagging each word
  // with its own list's cardTypes.
  // For a specific list: all words in that list with that list's cardTypes.
  const getCandidates = useCallback(() => {
    if (dailyListSel === '__all__') {
      return lists.flatMap(list =>
        list.cardTypes.length > 0
          ? list.words.map(w => ({ word: w, listCardTypes: list.cardTypes }))
          : []
      );
    }
    const list = lists.find(l => l.id === dailyListSel);
    if (!list || !list.cardTypes.length) return [];
    return list.words.map(w => ({ word: w, listCardTypes: list.cardTypes }));
  }, [lists, dailyListSel]);

  // Build one question per candidate using first cardType of the word's list
  const makeQuestions = (pool, allWords) =>
    pool.map(({ word, listCardTypes }) => {
      const ct = listCardTypes[0];
      return { word, ct, options: buildQuizOptions(allWords, word, ct.answerKey), correct: word[ct.answerKey] };
    });

  // ── Session actions ──────────────────────────────────────────────────────
  const startSession = () => {
    const candidates = getCandidates();
    if (!candidates.length) return;
    const allWords = candidates.map(c => c.word);
    const due = candidates.filter(c => isDueNow(statsRef.current[c.word.id]));
    sessionCandidatesRef.current = candidates;
    if (!due.length) {
      setQuestions([]);
    } else {
      const pool = shuffle(due).slice(0, 20);
      setQuestions(makeQuestions(pool, allWords));
    }
    setQi(0); setSelected(null); setConfirmed(false); setDone(false);
    setScore(0); setWrongIds([]);
    setSessionStarted(true);
  };

  // Check Again uses all session candidates × all their cardTypes
  const buildCheckAgain = () => {
    const cands = sessionCandidatesRef.current;
    if (!cands.length) return;
    const allWords = cands.map(c => c.word);
    setQuestions(shuffle(
      cands.flatMap(({ word, listCardTypes }) =>
        listCardTypes.map(ct => ({
          word, ct,
          options: buildQuizOptions(allWords, word, ct.answerKey),
          correct: word[ct.answerKey],
        }))
      )
    ));
    setQi(0); setSelected(null); setConfirmed(false); setDone(false);
    setScore(0); setWrongIds([]);
  };

  const endSession = () => {
    setSessionStarted(false);
    setQuestions(null);
    setDone(false);
    setScore(0);
    setWrongIds([]);
    sessionCandidatesRef.current = [];
  };

  // ── Lobby (pre-session) ──────────────────────────────────────────────────
  if (!sessionStarted) {
    const candidates = getCandidates();
    const dueCount = candidates.filter(c => isDueNow(statsRef.current[c.word.id])).length;
    const canStart = candidates.length > 0;
    return (
      <div className="page"><div className="page-inner">
        <div className="page-header">
          <div className="page-title">Daily Practice</div>
          <div className="page-sub">Choose a list to practice</div>
        </div>

        <ListPillSelector lists={lists} value={dailyListSel} onChange={setDailyListSel} />

        <div className="card card-p" style={{marginBottom:20}}>
          {canStart ? (
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontFamily:'var(--mono)',fontSize:28,color:'var(--accent)'}}>{dueCount}</div>
                <div style={{fontSize:11,color:'var(--muted)',marginTop:2}}>due now</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontFamily:'var(--mono)',fontSize:28,color:'var(--text)'}}>{candidates.length}</div>
                <div style={{fontSize:11,color:'var(--muted)',marginTop:2}}>total words</div>
              </div>
            </div>
          ) : (
            <div style={{color:'var(--warn)',fontSize:13}}>
              {dailyListSel === '__all__'
                ? 'No lists have card types set up. Go to Wordlist → Question Type.'
                : 'This list has no card types set up. Go to Wordlist → Question Type.'}
            </div>
          )}
        </div>

        <button className="btn btn-primary"
          style={{width:'100%',justifyContent:'center',padding:'15px',fontSize:14}}
          onClick={startSession} disabled={!canStart}>
          Start Practice
        </button>
      </div></div>
    );
  }

  // ── All caught up (session running, nothing due) ─────────────────────────
  if (questions && questions.length === 0) {
    const cands = sessionCandidatesRef.current;
    const upcoming = cands
      .map(c => ({ w: c.word, s: stats[c.word.id] }))
      .filter(({ s }) => s?.nextReviewAt && s.nextReviewAt > Date.now())
      .sort((a,b) => a.s.nextReviewAt - b.s.nextReviewAt)[0];
    const firstCt = cands[0]?.listCardTypes?.[0];
    return (
      <div className="page"><div className="page-inner">
        <div className="page-header"><div className="page-title">Daily Practice</div></div>
        <div className="empty-state">
          <div className="e-icon">🎉</div>
          <div className="e-label mono" style={{marginBottom:12}}>All caught up!</div>
          {upcoming && firstCt && (
            <div style={{color:'var(--muted)',fontSize:13,marginBottom:4}}>
              Next review in <b style={{color:'var(--accent)'}}>{nextReviewLabel(upcoming.s)}</b>
              {' '}— <span style={{fontFamily:'var(--mono)'}}>{upcoming.w[firstCt.questionKey]}</span>
            </div>
          )}
          <div style={{display:'flex',gap:10,justifyContent:'center',marginTop:20}}>
            <button className="btn btn-ghost" onClick={endSession}>← Back</button>
            <button className="btn btn-primary" onClick={buildCheckAgain}>Practice Anyway</button>
          </div>
        </div>
      </div></div>
    );
  }

  // ── Done screen ──────────────────────────────────────────────────────────
  if (done) return (
    <div className="page"><div className="page-inner" style={{textAlign:'center',paddingTop:60}}>
      <div style={{fontSize:64,marginBottom:16}}>🏁</div>
      <div className="page-title mono" style={{fontSize:28,marginBottom:8}}>Session Done</div>
      <div style={{color:'var(--muted)',marginBottom:8,fontSize:14}}>
        {score} / {questions.length} correct
      </div>
      {wrongIds.length > 0 && (
        <div style={{color:'var(--danger)',fontSize:13,marginBottom:24}}>
          {wrongIds.length} missed — they'll return sooner
        </div>
      )}
      <div style={{display:'flex',gap:10,justifyContent:'center'}}>
        <button className="btn btn-ghost" onClick={endSession}>← Back</button>
        <button className="btn btn-primary" onClick={buildCheckAgain}>Check Again</button>
      </div>
    </div></div>
  );

  // ── Quiz ─────────────────────────────────────────────────────────────────
  const q = questions[qi];
  const wordStat = stats[q.word.id] || {};
  const isHardWord = (wordStat.totalWrong || 0) >= 3;

  const handleSelect = (opt) => { if (!confirmed) setSelected(opt); };

  const handleConfirm = () => {
    if (!selected || confirmed) return;
    const isCorrect = selected === q.correct;
    setConfirmed(true);
    const newStats = { ...stats };
    newStats[q.word.id] = updateSRS(newStats[q.word.id], isCorrect);
    if (isCorrect) setScore(s => s+1);
    else setWrongIds(ids => [...ids, q.word.id]);
    onSaveStats(newStats);
    setPopup(isCorrect ? 'correct' : 'wrong');
  };

  const handleNext = () => {
    if (qi + 1 >= questions.length) { setDone(true); return; }
    setQi(i => i+1); setSelected(null); setConfirmed(false);
  };

  const pct = (qi / questions.length) * 100;
  const emojiTag = extractEmojis(q.word.note);
  const srsLabel = wordStat.srsLevel !== undefined
    ? `Level ${wordStat.srsLevel} · next ${nextReviewLabel(wordStat)}`
    : 'New word';

  return (
    <div className="page">
      {popup && <ResultPopup correct={popup==='correct'} onClose={() => { setPopup(null); if(confirmed) handleNext(); }} />}
      <div className="page-inner">

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <div className="page-title" style={{fontSize:16}}>Daily Practice</div>
          <div className="badge badge-muted mono">{qi+1} / {questions.length}</div>
        </div>
        <div className="prog-bar" style={{marginBottom:24}}>
          <div className="prog-fill" style={{width:pct+'%'}}/>
        </div>

        <div style={{
          background:'var(--surface)', border:'1px solid var(--border)',
          borderRadius:20, padding:'32px 28px 24px',
          marginBottom:24, textAlign:'center', position:'relative',
        }}>
          <div style={{position:'absolute',top:14,left:16,display:'flex',alignItems:'center',gap:6}}>
            <span style={{fontSize:10,fontFamily:'var(--mono)',color:'var(--muted)'}}>{srsLabel}</span>
            {isHardWord && <span title={`Wrong ${wordStat.totalWrong} times`} style={{fontSize:13}}>🔴</span>}
          </div>

          {emojiTag && (
            <div style={{position:'absolute',top:12,right:14,fontSize:22,lineHeight:1}}>
              {emojiTag}
            </div>
          )}

          <div style={{
            fontFamily:'var(--mono)', fontWeight:700,
            fontSize: q.word[q.ct.questionKey]?.length > 12 ? 28 : 42,
            lineHeight:1.1, wordBreak:'break-word',
            marginTop:emojiTag ? 8 : 0,
          }}>
            {q.word[q.ct.questionKey]}
          </div>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20}}>
          {q.options.map((opt, idx) => {
            const slot = SLOT_COLORS[idx];
            let bg = slot.bg, border = slot.border, color = slot.text;
            let extraStyle = {};
            if (confirmed) {
              if (opt === q.correct) {
                bg = '#0d2e0d'; border = 'var(--accent)'; color = 'var(--accent)';
                extraStyle = { boxShadow: '0 0 12px #7fffb240' };
              } else if (opt === selected && opt !== q.correct) {
                bg = '#2e0d0d'; border = 'var(--danger)'; color = 'var(--danger)';
              } else {
                bg = 'var(--surface2)'; border = 'var(--border)'; color = 'var(--muted)';
              }
            } else if (opt === selected) {
              extraStyle = { boxShadow: `0 0 0 2px ${border}`, transform: 'scale(1.02)' };
            }
            return (
              <button key={idx} onClick={() => handleSelect(opt)}
                style={{
                  background: bg, border: `2px solid ${border}`,
                  borderRadius: 14, padding: '16px 12px',
                  cursor: confirmed ? 'default' : 'pointer',
                  transition: 'all .15s', textAlign:'left',
                  display:'flex', flexDirection:'column', gap:4,
                  ...extraStyle,
                }}>
                <div style={{fontFamily:'var(--mono)', fontSize:11, fontWeight:700, color: border, opacity: confirmed ? 0.7 : 1}}>
                  {CHOICE_LABELS[idx]}
                </div>
                <div style={{color, fontSize:14, fontFamily:'var(--sans)', lineHeight:1.3, wordBreak:'break-word'}}>
                  {opt}
                </div>
                {confirmed && opt === q.correct && (
                  <div style={{color:'var(--accent)',fontSize:11,fontFamily:'var(--mono)',marginTop:2}}>✓ correct</div>
                )}
              </button>
            );
          })}
        </div>

        {!confirmed ? (
          <button className="btn btn-primary"
            style={{width:'100%',justifyContent:'center',padding:'15px',fontSize:14}}
            onClick={handleConfirm} disabled={!selected}>
            Confirm
          </button>
        ) : (
          <button className="btn btn-primary"
            style={{width:'100%',justifyContent:'center',padding:'15px',fontSize:14}}
            onClick={handleNext}>
            {qi+1 >= questions.length ? '🏁 Finish' : 'Next →'}
          </button>
        )}

      </div>
    </div>
  );
}

// ─── STUDY PAGE ───────────────────────────────────────────────────────────────
function StudyPage({ lists, onSaveWord }) {
  // ── Persisted list selection ─────────────────────────────────────────────
  const [studyListSel, setStudyListSelRaw] = useState(() => {
    const stored = ls('studyListSel', '__all__');
    if (stored === '__all__') return '__all__';
    return lists.find(l => l.id === stored) ? stored : '__all__';
  });
  const setStudyListSel = (v) => { setStudyListSelRaw(v); lsSave('studyListSel', v); };

  // ── Session state ────────────────────────────────────────────────────────
  const [sessionStarted, setSessionStarted] = useState(false);
  // Pool ids are locked at session start for stability
  const [poolIds, setPoolIds] = useState([]);

  const [idx, setIdx] = useState(0);
  const [noting, setNoting] = useState(false);
  const [noteVal, setNoteVal] = useState('');
  const [quit, setQuit] = useState(false);
  const [done, setDone] = useState(false);

  const noteRef = useRef('');

  // All words live (across all lists) — used to look up words by id so notes
  // appear immediately after saving without restarting the session.
  const allLiveWords = useMemo(() => lists.flatMap(l => l.words), [lists]);
  const pool = poolIds.map(id => allLiveWords.find(w => w.id === id)).filter(Boolean);

  const getSourceWords = useCallback(() => {
    if (studyListSel === '__all__') return lists.flatMap(l => l.words);
    return lists.find(l => l.id === studyListSel)?.words ?? [];
  }, [lists, studyListSel]);

  const startSession = () => {
    const source = getSourceWords();
    if (!source.length) return;
    const unstudied = source.filter(w => !w.note || w.note.trim() === '');
    const pool = unstudied.length > 0 ? unstudied : source;
    setPoolIds(pool.map(w => w.id));
    setIdx(0); setNoting(false); setDone(false); setQuit(false);
    setSessionStarted(true);
  };

  const endSession = () => {
    setSessionStarted(false);
    setPoolIds([]);
  };

  useEffect(() => {
    if (pool.length > 0 && idx < pool.length) {
      const val = pool[idx].note || '';
      setNoteVal(val);
      noteRef.current = val;
    }
  // Only re-sync when word index changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  // ── Lobby (pre-session) ──────────────────────────────────────────────────
  if (!sessionStarted) {
    const source = getSourceWords();
    const unstudied = source.filter(w => !w.note || w.note.trim() === '');
    return (
      <div className="page"><div className="page-inner">
        <div className="page-header">
          <div className="page-title">Study</div>
          <div className="page-sub">Choose a list to study</div>
        </div>

        <ListPillSelector lists={lists} value={studyListSel} onChange={setStudyListSel} />

        <div className="card card-p" style={{marginBottom:20}}>
          {source.length > 0 ? (
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontFamily:'var(--mono)',fontSize:28,color:'var(--accent)'}}>
                  {unstudied.length > 0 ? unstudied.length : source.length}
                </div>
                <div style={{fontSize:11,color:'var(--muted)',marginTop:2}}>
                  {unstudied.length > 0 ? 'words to study' : 'words (all noted — will restart)'}
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontFamily:'var(--mono)',fontSize:28,color:'var(--text)'}}>{source.length}</div>
                <div style={{fontSize:11,color:'var(--muted)',marginTop:2}}>total words</div>
              </div>
            </div>
          ) : (
            <div style={{color:'var(--muted)',fontSize:13}}>No words in this selection.</div>
          )}
        </div>

        <button className="btn btn-primary"
          style={{width:'100%',justifyContent:'center',padding:'15px',fontSize:14}}
          onClick={startSession} disabled={source.length === 0}>
          Start Studying
        </button>
      </div></div>
    );
  }

  // ── Done / Quit ──────────────────────────────────────────────────────────
  if (quit || done || pool.length === 0) return (
    <div className="page">
      <div className="page-inner" style={{textAlign:'center',paddingTop:60}}>
        <div style={{fontSize:64,marginBottom:16}}>{done ? '✅' : '📚'}</div>
        <div className="page-title mono" style={{fontSize:24,marginBottom:8}}>
          {pool.length === 0 ? 'No words' : done ? 'All done!' : 'Study paused'}
        </div>
        <div style={{color:'var(--muted)',fontSize:14,marginBottom:32}}>
          {pool.length === 0 ? 'No words in this selection.' : 'Come back anytime.'}
        </div>
        <div style={{display:'flex',gap:10,justifyContent:'center'}}>
          <button className="btn btn-ghost" onClick={endSession}>← Back to Lists</button>
          <button className="btn btn-primary" onClick={() => { setIdx(0); setDone(false); setQuit(false); }}>
            Restart
          </button>
        </div>
      </div>
    </div>
  );

  // ── Study card ───────────────────────────────────────────────────────────
  const word = pool[idx];

  const saveNote = () => {
    const finalNote = noteRef.current;
    onSaveWord({ ...word, note: finalNote });
    setNoteVal(finalNote);
    setNoting(false);
  };

  const addEmoji = (emoji) => {
    const next = noteRef.current + emoji;
    noteRef.current = next;
    setNoteVal(next);
  };

  const nextWord = () => {
    if (idx + 1 >= pool.length) { setDone(true); }
    else { setIdx(i => i+1); setNoting(false); }
  };

  const DISPLAY = [
    { key:'meaning',              label:'Meaning' },
    { key:'translation_en',       label:'EN' },
    { key:'translation_cn',       label:'中文' },
    { key:'example',              label:'Example' },
    { key:'example_without_word', label:'Fill-in' },
  ];

  return (
    <div className="page" style={{position:'relative'}}>
      <button className="quit-btn" onClick={() => setQuit(true)}>Quit ✕</button>
      <div className="page-inner" style={{paddingTop:60}}>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
          <span className="badge badge-muted mono">{idx+1} / {pool.length}</span>
          <div className="prog-bar" style={{flex:1,margin:'0 16px'}}>
            <div className="prog-fill" style={{width:((idx+1)/pool.length*100)+'%'}}/>
          </div>
        </div>

        <div className="card card-p" style={{marginBottom:16}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8}}>
            <div style={{flex:1}}>
              <div className="study-word">{word.word}</div>
              {word.gender && <div className="study-gender">{word.gender}</div>}
            </div>
            {extractEmojis(word.note) && (
              <div style={{fontSize:26,lineHeight:1,flexShrink:0,marginTop:2}} title={word.note}>
                {extractEmojis(word.note)}
              </div>
            )}
          </div>
          <div className="divider"/>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {DISPLAY.filter(f => word[f.key]).map(f => (
              <div className="study-field-row" key={f.key}>
                <div className="study-field-key">{f.label}</div>
                <div className="study-field-val">{word[f.key]}</div>
              </div>
            ))}
          </div>
        </div>

        {noting ? (
          <div className="card card-p" style={{marginBottom:16}}>
            <div className="field-label">Your note</div>
            <div className="emoji-row" style={{marginBottom:10}}>
              {QUICK_EMOJIS.map(e => (
                <button key={e} className="emoji-btn" onClick={() => addEmoji(e)}>{e}</button>
              ))}
            </div>
            <textarea className="field" value={noteVal}
              onChange={e => { noteRef.current = e.target.value; setNoteVal(e.target.value); }}
              placeholder="Type your note…" rows={3}/>
            <div style={{display:'flex',gap:8,marginTop:10}}>
              <button className="btn btn-primary" onClick={saveNote}>Save Note</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setNoting(false)}>Cancel</button>
            </div>
          </div>
        ) : word.note ? (
          <div className="card card-p" style={{marginBottom:16,border:'1px solid var(--accent2)30'}}>
            <div style={{fontSize:11,fontFamily:'var(--mono)',color:'var(--muted)',marginBottom:6}}>YOUR NOTE</div>
            <div style={{fontSize:15,whiteSpace:'pre-wrap'}}>{word.note}</div>
            <button className="btn btn-ghost btn-sm" style={{marginTop:10}}
              onClick={() => { setNoteVal(word.note); setNoting(true); }}>
              Edit Note
            </button>
          </div>
        ) : null}

        <div style={{display:'flex',gap:10}}>
          {!noting && (
            <button className="btn btn-ghost" style={{flex:1,justifyContent:'center'}}
              onClick={() => setNoting(true)}>
              📝 Note
            </button>
          )}
          <button className="btn btn-primary" style={{flex:2,justifyContent:'center',padding:'14px'}}
            onClick={nextWord}>
            {idx+1 >= pool.length ? 'Finish' : 'Next →'}
          </button>
        </div>

      </div>
    </div>
  );
}

// ─── IMPORT WIZARD ────────────────────────────────────────────────────────────
const BASIC_FIELDS = ['word','gender','meaning','translation_en','translation_cn',
  'example','example_without_word','note'];

async function readExcel(file) {
  const data = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(data);
  const sheet = wb.worksheets[0];
  let headers = [];
  const rows = [];
  sheet.eachRow({ includeEmpty: false }, (row, ri) => {
    const vals = row.values.slice(1).map(v => String(v ?? '').trim());
    if (ri === 1) { headers = vals; return; }
    if (vals.every(v => v === '')) return;
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
    rows.push(obj);
  });
  return { headers, rows };
}

function ImportWizard({ words, customFields, onSaveWords, onSaveCustomFields, onClose }) {
  const [step, setStep]           = useState('pick');
  const [fileData, setFileData]   = useState(null);
  const [mapping, setMapping]     = useState({});
  const [importMode, setImportMode] = useState('append');
  const [importing, setImporting] = useState(false);

  const pickFile = () => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.xlsx,.xls';
    inp.onchange = async (e) => {
      const file = e.target.files?.[0]; if (!file) return;
      try {
        const data = await readExcel(file);
        if (!data.headers.length) { alert('No columns found in first row.'); return; }
        const defaultMap = {};
        data.headers.forEach(h => {
          const lower = h.toLowerCase().replace(/[\s\-]/g, '_');
          const matched = BASIC_FIELDS.find(f => f === lower || f === h);
          defaultMap[h] = matched
            ? { type: 'basic', key: matched }
            : { type: 'custom', key: h };
        });
        setFileData(data); setMapping(defaultMap); setStep('map');
      } catch(err) { alert('Error reading file: ' + err.message); }
    };
    inp.click();
  };

  const setColType = (col, type) => setMapping(m => ({
    ...m, [col]: { type, key: type === 'basic' ? BASIC_FIELDS[0] : type === 'custom' ? col : '' }
  }));
  const setColKey = (col, key) => setMapping(m => ({ ...m, [col]: { ...m[col], key } }));

  const doImport = () => {
    setImporting(true);
    const newCustomKeys = [];
    const imported = fileData.rows.map((row, i) => {
      const obj = { id: Date.now() + i, create_date: new Date().toLocaleDateString(), practice_time: 0 };
      fileData.headers.forEach(col => {
        const m = mapping[col];
        if (!m || m.type === 'ignore') return;
        const key = m.key || col;
        obj[key] = row[col] ?? '';
        if (m.type === 'custom' && !newCustomKeys.includes(key)) newCustomKeys.push(key);
      });
      return obj;
    });
    onSaveCustomFields([...new Set([...customFields, ...newCustomKeys])]);
    onSaveWords(importMode === 'replace' ? imported : [...words, ...imported]);
    setStep('done'); setImporting(false);
  };

  const previewRows = fileData?.rows.slice(0, 3) ?? [];
  const activeCols  = fileData?.headers.filter(c => mapping[c]?.type !== 'ignore') ?? [];

  const STEPS = ['Pick file','Map columns','Preview','Done'];
  const stepIdx = { pick:0, map:1, preview:2, done:3 };

  const overlay = { position:'fixed',inset:0,background:'#000a',zIndex:300,display:'flex',
    alignItems:'flex-start',justifyContent:'center',overflowY:'auto',padding:'24px 16px' };
  const box = { background:'var(--surface)',border:'1px solid var(--border)',borderRadius:20,
    width:'100%',maxWidth:620,padding:'28px 24px',position:'relative' };

  return (
    <div style={overlay} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={box}>
        <button onClick={onClose} style={{position:'absolute',top:14,right:16,background:'none',
          border:'none',color:'var(--muted)',cursor:'pointer',fontSize:20,lineHeight:1}}>✕</button>

        <div style={{fontFamily:'var(--mono)',fontSize:17,fontWeight:700,marginBottom:16}}>
          Import from Excel
        </div>

        <div style={{display:'flex',gap:0,marginBottom:24,borderRadius:8,overflow:'hidden',
          border:'1px solid var(--border)'}}>
          {STEPS.map((s,i) => {
            const cur = stepIdx[step] ?? 0;
            return (
              <div key={s} style={{flex:1,padding:'7px 4px',textAlign:'center',fontSize:10,
                fontFamily:'var(--mono)',
                background: i===cur ? 'var(--surface2)' : 'transparent',
                color: i===cur ? 'var(--accent)' : i<cur ? 'var(--muted)' : 'var(--border)',
                borderRight: i<STEPS.length-1 ? '1px solid var(--border)' : 'none',
              }}>
                {i < (stepIdx[step]??0) ? '✓ ' : ''}{s}
              </div>
            );
          })}
        </div>

        {step === 'pick' && (
          <div style={{textAlign:'center',padding:'32px 0'}}>
            <div style={{fontSize:48,marginBottom:16}}>📊</div>
            <div style={{color:'var(--muted)',fontSize:13,marginBottom:24,lineHeight:1.7}}>
              First row = column headers.<br/>
              Supported: <b style={{color:'var(--text)'}}>.xlsx / .xls</b>
            </div>
            <button className="btn btn-primary" style={{fontSize:15,padding:'12px 32px'}} onClick={pickFile}>
              Choose File
            </button>
          </div>
        )}

        {step === 'map' && fileData && (
          <div>
            <div style={{color:'var(--muted)',fontSize:12,marginBottom:14}}>
              {fileData.headers.length} columns · {fileData.rows.length} rows.
              Map each column to a basic field, keep as a custom field, or ignore it.
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:20}}>
              {fileData.headers.map(col => {
                const m = mapping[col] || { type:'custom', key:col };
                return (
                  <div key={col} style={{background:'var(--surface2)',border:'1px solid var(--border)',
                    borderRadius:10,padding:'12px 14px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:8}}>
                      <span style={{fontFamily:'var(--mono)',fontSize:13,fontWeight:700}}>{col}</span>
                      {fileData.rows[0]?.[col] && (
                        <span style={{fontSize:11,color:'var(--muted)',maxWidth:180,overflow:'hidden',
                          textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          e.g. "{fileData.rows[0][col]}"
                        </span>
                      )}
                    </div>
                    <div style={{display:'flex',gap:6,marginBottom: m.type!=='ignore' ? 8 : 0}}>
                      {['basic','custom','ignore'].map(t => (
                        <button key={t} onClick={() => setColType(col, t)} style={{
                          padding:'4px 10px',borderRadius:6,fontSize:11,fontFamily:'var(--mono)',
                          cursor:'pointer',border:'1px solid',
                          borderColor: m.type===t ? 'var(--accent2)' : 'var(--border)',
                          background: m.type===t ? '#5b8fff18' : 'transparent',
                          color: m.type===t ? 'var(--accent2)' : 'var(--muted)',
                        }}>
                          {t==='basic' ? '→ Basic field' : t==='custom' ? '→ Custom field' : '✕ Ignore'}
                        </button>
                      ))}
                    </div>
                    {m.type === 'basic' && (
                      <select value={m.key} onChange={e => setColKey(col, e.target.value)}
                        className="field" style={{fontSize:12,padding:'6px 10px'}}>
                        {BASIC_FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    )}
                    {m.type === 'custom' && (
                      <input className="field" style={{fontSize:12,padding:'6px 10px'}}
                        placeholder="Custom field name"
                        value={m.key} onChange={e => setColKey(col, e.target.value)}/>
                    )}
                  </div>
                );
              })}
            </div>
            <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}}
              onClick={() => setStep('preview')}>
              Preview →
            </button>
          </div>
        )}

        {step === 'preview' && fileData && (
          <div>
            <div style={{color:'var(--muted)',fontSize:12,marginBottom:14}}>
              First {previewRows.length} of {fileData.rows.length} rows.
              <span style={{color:'var(--accent2)',marginLeft:6}}>* = custom field</span>
            </div>
            <div style={{overflowX:'auto',marginBottom:20}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
                <thead>
                  <tr>
                    {activeCols.map(col => (
                      <th key={col} style={{padding:'6px 10px',borderBottom:'1px solid var(--border)',
                        fontFamily:'var(--mono)',color:'var(--muted)',textAlign:'left',whiteSpace:'nowrap'}}>
                        {mapping[col]?.key || col}
                        {mapping[col]?.type==='custom' && <span style={{color:'var(--accent2)'}}> *</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row,ri) => (
                    <tr key={ri}>
                      {activeCols.map(col => (
                        <td key={col} style={{padding:'6px 10px',borderBottom:'1px solid var(--border)',
                          color:'var(--text)',maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {row[col] ?? ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{marginBottom:20}}>
              <div className="section-label">Import mode</div>
              <div style={{display:'flex',gap:8}}>
                {['append','replace'].map(m => (
                  <button key={m} onClick={() => setImportMode(m)} style={{
                    flex:1,padding:'10px',borderRadius:10,border:'1px solid',
                    cursor:'pointer',fontFamily:'var(--mono)',fontSize:11,
                    borderColor: importMode===m ? 'var(--accent)' : 'var(--border)',
                    background: importMode===m ? '#7fffb210' : 'var(--surface2)',
                    color: importMode===m ? 'var(--accent)' : 'var(--muted)',
                  }}>
                    {m==='append' ? `Append (keep ${words.length} existing)` : `Replace all`}
                  </button>
                ))}
              </div>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-ghost" style={{flex:1,justifyContent:'center'}}
                onClick={() => setStep('map')}>← Back</button>
              <button className="btn btn-primary" style={{flex:2,justifyContent:'center'}}
                onClick={doImport} disabled={importing}>
                {importing ? 'Importing…' : `Import ${fileData.rows.length} words`}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div style={{textAlign:'center',padding:'32px 0'}}>
            <div style={{fontSize:48,marginBottom:16}}>✅</div>
            <div style={{fontFamily:'var(--mono)',fontSize:20,marginBottom:8}}>Done!</div>
            <div style={{color:'var(--muted)',fontSize:13,marginBottom:24}}>
              {fileData?.rows.length} words imported.
            </div>
            <button className="btn btn-primary" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── WORD EDIT MODAL ─────────────────────────────────────────────────────────
const BASIC_FIELDS_SET = new Set(['word','gender','meaning','translation_en','translation_cn','example','example_without_word','note']);

function WordEditModal({ word, allDisplayFields, onSave, onClose }) {
  const [draft, setDraft] = useState({ ...word });

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="popup-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background:'var(--surface)', border:'1px solid var(--border)',
        borderRadius:20, padding:'28px 24px',
        width:'100%', maxWidth:540,
        maxHeight:'85vh', overflowY:'auto',
        animation:'popIn .2s cubic-bezier(.34,1.56,.64,1)',
      }}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={{fontFamily:'var(--mono)',fontSize:17,fontWeight:700}}>Edit Word</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:20,lineHeight:1}}>✕</button>
        </div>

        {allDisplayFields.map(f => (
          <div key={f} style={{marginBottom:14}}>
            <div className="field-label">
              {f}
              {!BASIC_FIELDS_SET.has(f) && (
                <span style={{color:'var(--accent2)',marginLeft:6,fontSize:9}}>custom</span>
              )}
            </div>
            <input
              className="field"
              value={draft[f] ?? ''}
              onChange={e => setDraft(d => ({...d, [f]: e.target.value}))}
              placeholder={f}
            />
          </div>
        ))}

        <div style={{display:'flex',gap:8,marginTop:8}}>
          <button className="btn btn-primary" onClick={() => { onSave(draft); onClose(); }}>Save</button>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── WORDLIST PAGE ────────────────────────────────────────────────────────────
const WL_MODES = ['View','Modify','Delete','Question Type'];

function WordlistPage({ lists, setLists, activeListId, setActiveListId, allWords, customFields, onSaveCustomFields }) {
  // Local navigation: which list is being viewed (null = list browser)
  const [viewingListId, setViewingListId] = useState(activeListId);

  const [mode, setMode] = useState('View');
  const [visibleFields, setVisibleFields] = useState(() => ls('wl_vis_fields', ['word','meaning','translation_en','note']));
  const [editWord, setEditWord] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRow, setNewRow] = useState({});
  const [filterText, setFilterText] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [qtStep, setQtStep] = useState('list');
  const [qtDraft, setQtDraft] = useState({});
  const [showWizard, setShowWizard] = useState(false);

  const saveVis = (f) => { setVisibleFields(f); lsSave('wl_vis_fields', f); };

  // Resolve the list currently being viewed in this page
  // '__all__' is a virtual read-only view of all words
  const viewingList = viewingListId === '__all__'
    ? { id: '__all__', name: 'All Words', words: allWords, cardTypes: [] }
    : lists.find(l => l.id === viewingListId) ?? null;

  const words = viewingList?.words ?? [];
  const cardTypes = viewingList?.cardTypes ?? [];
  const isReadOnly = viewingListId === '__all__';

  const BASIC_FIELDS_DISPLAY = ['word','gender','meaning','translation_en','translation_cn','example','example_without_word','note'];
  const allDisplayFields = [...BASIC_FIELDS_DISPLAY, ...(customFields||[]).filter(f => !BASIC_FIELDS_DISPLAY.includes(f))];

  const filtered = filterText
    ? words.filter(w => allDisplayFields.some(f => String(w[f]||'').toLowerCase().includes(filterText.toLowerCase())))
    : words;

  // Save words/cardTypes to the viewing list
  const onSaveWords = (newWords) => {
    if (isReadOnly || !viewingListId) return;
    setLists(lists.map(l => l.id === viewingListId ? { ...l, words: newWords } : l));
  };

  const onSaveCardTypes = (newCardTypes) => {
    if (isReadOnly || !viewingListId) return;
    setLists(lists.map(l => l.id === viewingListId ? { ...l, cardTypes: newCardTypes } : l));
  };

  const toggleField = (f) => {
    saveVis(visibleFields.includes(f) ? visibleFields.filter(x=>x!==f) : [...visibleFields, f]);
  };

  const saveEditWord = (updated) => onSaveWords(words.map(w => w.id === updated.id ? updated : w));

  const addWord = () => {
    const w = { id: Date.now(), create_date: new Date().toLocaleDateString(), practice_time: 0, ...newRow };
    onSaveWords([...words, w]);
    setNewRow({}); setShowAddForm(false);
  };

  const deleteSelected = () => {
    if (!selected.size) return;
    if (!window.confirm(`Delete ${selected.size} word(s)?`)) return;
    onSaveWords(words.filter(w => !selected.has(w.id)));
    setSelected(new Set());
  };

  const triggerImport = () => setShowWizard(true);

  // Navigate to a list (sets both local nav and global activeListId)
  const openList = (listId) => {
    setViewingListId(listId);
    // Don't change activeListId for the virtual "All Words" view
    if (listId !== '__all__') setActiveListId(listId);
    setMode('View');
    setSelected(new Set());
    setFilterText('');
  };

  const goBack = () => {
    setViewingListId(null);
    setMode('View');
    setSelected(new Set());
    setFilterText('');
  };

  const confirmCreateList = () => {
    if (!newListName.trim()) return;
    const newList = { id: Date.now(), name: newListName.trim(), words: [], cardTypes: [] };
    setLists([...lists, newList]);
    setNewListName('');
    setShowNewListForm(false);
  };

  const allFields = allDisplayFields;

  // ── Empty state (no lists at all) ──────────────────────────────────────────
  if (!viewingList && lists.length === 0) return (
    <div className="page">
      {showWizard && (
        <ImportWizard words={[]} customFields={customFields}
          onSaveWords={() => {}} onSaveCustomFields={onSaveCustomFields}
          onClose={() => setShowWizard(false)}/>
      )}
      <div className="page-inner">
        <div className="page-header"><div className="page-title">Wordlist</div></div>
        <div className="empty-state">
          <div className="e-icon">📂</div>
          <div className="e-label">No lists yet. Create a list to get started.</div>
          <button className="btn btn-primary" style={{marginTop:20}} onClick={() => setShowNewListForm(true)}>
            <Icon.Plus/> New List
          </button>
        </div>
        {showNewListForm && (
          <div className="card card-p" style={{marginTop:16}}>
            <div style={{fontFamily:'var(--mono)',fontSize:13,marginBottom:10}}>New List</div>
            <input className="field" autoFocus placeholder="List name…"
              value={newListName} onChange={e => setNewListName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') confirmCreateList(); if (e.key === 'Escape') { setShowNewListForm(false); setNewListName(''); } }}
            />
            <div style={{display:'flex',gap:8,marginTop:10}}>
              <button className="btn btn-primary btn-sm" onClick={confirmCreateList} disabled={!newListName.trim()}>Create</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowNewListForm(false); setNewListName(''); }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── List browser ───────────────────────────────────────────────────────────
  if (!viewingList) return (
    <div className="page">
      {showWizard && viewingListId && (
        <ImportWizard words={words} customFields={customFields}
          onSaveWords={onSaveWords} onSaveCustomFields={onSaveCustomFields}
          onClose={() => setShowWizard(false)}/>
      )}
      <div className="page-inner">
        <div className="page-header">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
            <div>
              <div className="page-title">Wordlist</div>
              <div className="page-sub">{allWords.length} words across {lists.length} list{lists.length!==1?'s':''}</div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowNewListForm(true)}><Icon.Plus/> New List</button>
          </div>
        </div>

        {/* All Words shortcut */}
        {allWords.length > 0 && (
          <div className="card card-p" style={{marginBottom:12,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}
            onClick={() => openList('__all__')}>
            <div>
              <div style={{fontFamily:'var(--mono)',fontSize:15}}>All Words</div>
              <div style={{color:'var(--muted)',fontSize:12,marginTop:2}}>{allWords.length} words · read-only</div>
            </div>
            <Icon.ChevronRight/>
          </div>
        )}

        {lists.map(l => (
          <div key={l.id} className="card card-p" style={{marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div style={{cursor:'pointer',flex:1}} onClick={() => openList(l.id)}>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <span style={{fontFamily:'var(--mono)',fontSize:15}}>{l.name}</span>
                {l.id === activeListId && (
                  <span className="badge badge-accent" style={{fontSize:9}}>active</span>
                )}
              </div>
              <div style={{color:'var(--muted)',fontSize:12,marginTop:2}}>
                {l.words.length} word{l.words.length!==1?'s':''} · {l.cardTypes.length} card type{l.cardTypes.length!==1?'s':''}
              </div>
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => {
              if (!window.confirm(`Delete list "${l.name}"? Words inside will also be deleted.`)) return;
              const newLists = lists.filter(x => x.id !== l.id);
              setLists(newLists);
              if (activeListId === l.id) setActiveListId(newLists[0]?.id ?? null);
            }}>
              <Icon.Trash/>
            </button>
          </div>
        ))}

        {showNewListForm && (
          <div className="card card-p" style={{marginTop:8}}>
            <div style={{fontFamily:'var(--mono)',fontSize:13,marginBottom:10}}>New List</div>
            <input className="field" autoFocus placeholder="List name…"
              value={newListName} onChange={e => setNewListName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') confirmCreateList(); if (e.key === 'Escape') { setShowNewListForm(false); setNewListName(''); } }}
            />
            <div style={{display:'flex',gap:8,marginTop:10}}>
              <button className="btn btn-primary btn-sm" onClick={confirmCreateList} disabled={!newListName.trim()}>Create</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowNewListForm(false); setNewListName(''); }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ── List detail view ────────────────────────────────────────────────────────
  return (
    <div className="page">
      {showWizard && (
        <ImportWizard words={words} customFields={customFields}
          onSaveWords={onSaveWords} onSaveCustomFields={onSaveCustomFields}
          onClose={() => setShowWizard(false)}/>
      )}
      {editWord && (
        <WordEditModal
          word={editWord}
          allDisplayFields={allDisplayFields}
          onSave={saveEditWord}
          onClose={() => setEditWord(null)}
        />
      )}
      <div className="page-inner">
        <div className="page-header">
          <button className="back-link" onClick={goBack}>
            ← Back
          </button>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:8}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <div className="page-title">{viewingList.name}</div>
                {!isReadOnly && viewingList.id === activeListId && (
                  <span className="badge badge-accent" style={{fontSize:9}}>active</span>
                )}
                {isReadOnly && (
                  <span className="badge badge-muted" style={{fontSize:9}}>read-only</span>
                )}
              </div>
              <div className="page-sub">{filtered.length} of {words.length} words</div>
            </div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {!isReadOnly && viewingList.id !== activeListId && (
                <button className="btn btn-ghost btn-sm" onClick={() => setActiveListId(viewingList.id)}>
                  Set Active
                </button>
              )}
              {mode === 'View' && <button className="btn btn-ghost btn-sm" onClick={() => {
                const blob = new Blob([JSON.stringify(words,null,2)],{type:'application/json'});
                const a = document.createElement('a'); a.href=URL.createObjectURL(blob);
                a.download='wordlist.json'; a.click();
              }}><Icon.Download/> Export</button>}
              {mode === 'Modify' && !isReadOnly && <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(true)}><Icon.Plus/> Add</button>}
              {mode === 'Modify' && !isReadOnly && <button className="btn btn-ghost btn-sm" onClick={triggerImport}><Icon.Upload/> Import</button>}
              {mode === 'Delete' && !isReadOnly && selected.size > 0 && (
                <button className="btn btn-danger btn-sm" onClick={deleteSelected}><Icon.Trash/> Delete ({selected.size})</button>
              )}
            </div>
          </div>
        </div>

        {/* Mode tabs — hide Question Type for read-only All Words view */}
        <div className="mode-tabs">
          {WL_MODES.filter(m => !isReadOnly || (m === 'View')).map(m => (
            <button key={m} className={`mode-tab ${mode===m?'active':''}`} onClick={() => setMode(m)}>{m}</button>
          ))}
        </div>

        {/* Field visibility chips (View mode) */}
        {mode === 'View' && (
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:16}}>
            {allDisplayFields.map(f => (
              <div key={f} className={`field-chip ${visibleFields.includes(f)?'on':''}`} onClick={() => toggleField(f)}>
                <div className="chip-dot"/>
                {f}
                {!BASIC_FIELDS_DISPLAY.includes(f) && (
                  <span style={{fontSize:9,color:'var(--accent2)',marginLeft:2}}>custom</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        {(mode === 'View' || mode === 'Modify' || mode === 'Delete') && (
          <input className="field" style={{marginBottom:14}} placeholder="Search…"
            value={filterText} onChange={e => setFilterText(e.target.value)}/>
        )}

        {/* Add form */}
        {mode === 'Modify' && !isReadOnly && showAddForm && (
          <div className="card card-p" style={{marginBottom:16}}>
            <div style={{fontFamily:'var(--mono)',fontSize:13,marginBottom:12}}>New Word</div>
            {allDisplayFields.map(f => (
              <div key={f} style={{marginBottom:8}}>
                <div className="field-label">{f}</div>
                <input className="field" value={newRow[f]||''} onChange={e => setNewRow(r=>({...r,[f]:e.target.value}))} placeholder={f}/>
              </div>
            ))}
            <div style={{display:'flex',gap:8,marginTop:8}}>
              <button className="btn btn-primary" onClick={addWord}>Add</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowAddForm(false); setNewRow({}); }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Question Type wizard */}
        {mode === 'Question Type' && !isReadOnly && (
          <div className="wizard-step">
            {qtStep === 'list' && (
              <div>
                <div className="section-label">Existing Card Types</div>
                {cardTypes.length === 0 ? (
                  <div style={{color:'var(--muted)',fontSize:13,marginBottom:16}}>None yet.</div>
                ) : cardTypes.map(ct => (
                  <div key={ct.id} className="card card-p" style={{marginBottom:8,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <div style={{fontFamily:'var(--mono)',fontSize:14}}>{ct.name || `${ct.questionKey} → ${ct.answerKey}`}</div>
                      <div style={{color:'var(--muted)',fontSize:12}}>Q: {ct.questionKey} · A: {ct.answerKey}</div>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={() => onSaveCardTypes(cardTypes.filter(c=>c.id!==ct.id))}>
                      <Icon.Trash/>
                    </button>
                  </div>
                ))}
                <button className="btn btn-primary" style={{marginTop:8}} onClick={() => { setQtDraft({}); setQtStep('selectQ'); }}>
                  <Icon.Plus/> New Card Type
                </button>
              </div>
            )}
            {qtStep === 'selectQ' && (
              <div>
                <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--accent2)',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:4}}>Step 1 of 2</div>
                <div style={{fontSize:17,fontWeight:600,color:'var(--text)',marginBottom:16}}>Select Question Field</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                  {allFields.map(f => (
                    <button key={f}
                      style={{
                        padding:'5px 14px', borderRadius:99, border:'1.5px solid var(--border)',
                        background:'var(--surface2)', color:'var(--muted)',
                        fontFamily:'var(--mono)', fontSize:12, cursor:'pointer',
                        transition:'all .15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent2)'; e.currentTarget.style.color='var(--text)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--muted)'; }}
                      onClick={() => { setQtDraft(d => ({...d, questionKey:f})); setQtStep('selectA'); }}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {qtStep === 'selectA' && (
              <div>
                <div style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--accent2)',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:4}}>Step 2 of 2</div>
                <div style={{fontSize:17,fontWeight:600,color:'var(--text)',marginBottom:4}}>Select Answer Field</div>
                <div style={{fontSize:12,color:'var(--muted)',marginBottom:16}}>
                  Question: <span style={{fontFamily:'var(--mono)',color:'var(--text)'}}>{qtDraft.questionKey}</span>
                </div>
                <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                  {allFields.filter(f=>f!==qtDraft.questionKey).map(f => (
                    <button key={f}
                      style={{
                        padding:'5px 14px', borderRadius:99, border:'1.5px solid var(--border)',
                        background:'var(--surface2)', color:'var(--muted)',
                        fontFamily:'var(--mono)', fontSize:12, cursor:'pointer',
                        transition:'all .15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent2)'; e.currentTarget.style.color='var(--text)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--muted)'; }}
                      onClick={() => {
                        const ct = { id:Date.now(), questionKey:qtDraft.questionKey, answerKey:f, name:`${qtDraft.questionKey} → ${f}` };
                        onSaveCardTypes([...cardTypes, ct]);
                        setQtStep('list');
                      }}>
                      {f}
                    </button>
                  ))}
                </div>
                <button className="btn btn-ghost btn-sm" style={{marginTop:16}} onClick={() => setQtStep('selectQ')}>← Back</button>
              </div>
            )}
          </div>
        )}

        {/* Table */}
        {(mode === 'View' || mode === 'Modify' || mode === 'Delete') && (
          <div style={{overflowX:'auto'}}>
            <table className="wl-table">
              <thead>
                <tr>
                  {mode === 'Delete' && !isReadOnly && <th><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={e => setSelected(e.target.checked ? new Set(filtered.map(w=>w.id)) : new Set())}/></th>}
                  {(mode === 'View' ? visibleFields : allDisplayFields).map(f => (
                    <th key={f}>{f}</th>
                  ))}
                  {mode === 'Modify' && !isReadOnly && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(w => (
                  <tr key={w.id}
                    onClick={mode === 'View' && !isReadOnly ? () => setEditWord(w) : undefined}
                    style={mode === 'View' && !isReadOnly ? {cursor:'pointer'} : undefined}
                  >
                    {mode === 'Delete' && !isReadOnly && (
                      <td onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.has(w.id)}
                          onChange={() => setSelected(s => { const n=new Set(s); n.has(w.id)?n.delete(w.id):n.add(w.id); return n; })}/>
                      </td>
                    )}
                    {(mode === 'View' ? visibleFields : allDisplayFields).map(f => (
                      <td key={f} style={{maxWidth:200}}>
                        <span style={{display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:180}}>
                          {String(w[f]||'')}
                        </span>
                      </td>
                    ))}
                    {mode === 'Modify' && !isReadOnly && (
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditWord(w)}><Icon.Edit/></button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="empty-state"><div className="e-label">No words found.</div></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
function SettingsPage({ lists, setLists, activeListId, setActiveListId, allWords, stats, onSaveStats }) {
  const activeList = lists.find(l => l.id === activeListId) ?? lists[0] ?? null;
  const cardTypes = activeList?.cardTypes ?? [];

  const exportAll = () => {
    const data = { lists, stats };
    const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob);
    a.download='wordsabxy-backup.json'; a.click();
  };

  const clearStats = () => {
    if (!window.confirm('Reset all study progress?')) return;
    onSaveStats({});
  };

  const clearAll = () => {
    if (!window.confirm('Delete ALL words and progress? This cannot be undone.')) return;
    setLists(lists.map(l => ({ ...l, words: [], cardTypes: [] })));
    onSaveStats({});
  };

  return (
    <div className="page">
      <div className="page-inner">
        <div className="page-header">
          <div className="page-title">Settings</div>
          <div className="page-sub">Configure your study setup</div>
        </div>

        <div className="section-label">Progress</div>
        <div className="card card-p" style={{marginBottom:20}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,textAlign:'center'}}>
            {[
              { label:'Words', val: allWords.length },
              { label:'Due Now', val: allWords.filter(w => isDueNow(stats[w.id])).length },
              { label:'Struggling', val: Object.values(stats).filter(s=>(s.totalWrong||0)>=3).length },
              { label:'Card Types', val: cardTypes.length },
            ].map(item => (
              <div key={item.label}>
                <div style={{fontFamily:'var(--mono)',fontSize:28,color:'var(--accent)'}}>{item.val}</div>
                <div style={{fontSize:11,color:'var(--muted)',marginTop:2}}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="section-label">Controller</div>
        <div className="card card-p" style={{marginBottom:20}}>
          <div style={{color:'var(--muted)',fontSize:13,lineHeight:1.8}}>
            <div>🎮 <b style={{color:'var(--text)'}}>D-pad / Left stick</b> — Navigate</div>
            <div>🔵 <b style={{color:'var(--text)'}}>A</b> — Confirm / Next</div>
            <div>🔴 <b style={{color:'var(--text)'}}>B</b> — Back</div>
            <div style={{marginTop:8,fontSize:11}}>⌨️ Arrow keys · Enter · Escape also work</div>
          </div>
        </div>

        <div className="section-label">Data</div>
        <div className="card" style={{marginBottom:20}}>
          {[
            { label:'Export backup (.json)', icon: <Icon.Download/>, action: exportAll, cls:'btn-ghost' },
            { label:'Reset study progress', icon: '🔄', action: clearStats, cls:'btn-ghost' },
            { label:'Delete all data', icon: <Icon.Trash/>, action: clearAll, cls:'btn-danger' },
          ].map((item, i, arr) => (
            <div key={item.label} style={{padding:'16px 20px', borderBottom: i<arr.length-1?'1px solid var(--border)':'none', display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div style={{fontSize:14}}>{item.label}</div>
              <button className={`btn ${item.cls} btn-sm`} onClick={item.action}>{item.icon}</button>
            </div>
          ))}
        </div>

        {Object.entries(stats).filter(([,s]) => (s.totalWrong||0) >= 3).length > 0 && (<>
          <div className="section-label">Struggling Words 🔴</div>
          <div className="card" style={{marginBottom:20}}>
            {Object.entries(stats)
              .filter(([,s]) => (s.totalWrong||0) >= 3)
              .sort((a,b) => (b[1].totalWrong||0) - (a[1].totalWrong||0))
              .slice(0,10)
              .map(([wid, s]) => {
                const w = allWords.find(x => String(x.id) === String(wid));
                if (!w) return null;
                return (
                  <div key={wid} style={{padding:'12px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <span style={{fontFamily:'var(--mono)',fontSize:14}}>{w.word || w[Object.keys(w).find(k=>k!=='id')]}</span>
                    <div style={{display:'flex',gap:8,alignItems:'center'}}>
                      <span style={{color:'var(--danger)',fontSize:12,fontFamily:'var(--mono)'}}>✗ {s.totalWrong}</span>
                      {(s.wrongStreak||0) >= 2 && <span style={{color:'var(--warn)',fontSize:11}}>streak {s.wrongStreak}</span>}
                      <span style={{color:'var(--muted)',fontSize:11}}>next {nextReviewLabel(s)}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </>)}

        <div className="section-label">About SRS</div>
        <div className="card card-p">
          <div style={{color:'var(--muted)',fontSize:13,lineHeight:1.9}}>
            Words ABXY uses spaced repetition. Answer correctly → interval grows (1h → 3h → 24h → 3d → 7d → 21d). Answer wrong → drops back two levels and returns sooner. Words wrong 3+ times are flagged 🔴.
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  injectCSS();

  const [tab, setTab] = useState('daily');

  const [lists, setListsState] = useState(() => {
    const migrated = migrateStorage();
    return migrated ?? [{ id: 1, name: 'My Words', words: DEMO_WORDS, cardTypes: DEMO_CARD_TYPES }];
  });

  const [activeListId, setActiveListIdState] = useState(() => ls('activeListId', null));
  const [stats, setStats] = useState(() => ls('wordstats', {}));
  const [customFields, setCustomFields] = useState(() => ls('customFields', []));

  // Persist-aware setters
  const saveLists = useCallback((newLists) => {
    setListsState(newLists);
    lsSave('wl_lists', newLists);
  }, []);

  const setActiveListId = useCallback((id) => {
    setActiveListIdState(id);
    lsSave('activeListId', id);
  }, []);

  const saveStats = (s) => { setStats(s); lsSave('wordstats', s); };
  const saveCustomFields = (f) => { setCustomFields(f); lsSave('customFields', f); };

  // Derived values
  const allWords = useMemo(() => lists.flatMap(l => l.words), [lists]);
  const activeList = lists.find(l => l.id === activeListId) ?? lists[0] ?? null;

  // Ensure activeListId always points to a valid list
  useEffect(() => {
    if (lists.length > 0 && !lists.find(l => l.id === activeListId)) {
      setActiveListId(lists[0].id);
    }
  }, [lists, activeListId, setActiveListId]);

  // Update a single word across all lists (for StudyPage note saves)
  const saveWordGlobal = useCallback((updatedWord) => {
    saveLists(lists.map(l => ({
      ...l,
      words: l.words.map(w => w.id === updatedWord.id ? updatedWord : w),
    })));
  }, [lists, saveLists]);

  // Keyboard tab switching (Ctrl+1-4)
  useEffect(() => {
    const tabs = ['daily','study','wordlist','settings'];
    const onKey = (e) => {
      if (['1','2','3','4'].includes(e.key) && e.ctrlKey) {
        setTab(tabs[parseInt(e.key)-1]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const NAV = [
    { id:'daily',    label:'Daily',    Icon: Icon.Daily },
    { id:'study',    label:'Study',    Icon: Icon.Study },
    { id:'wordlist', label:'Wordlist', Icon: Icon.Wordlist },
    { id:'settings', label:'Settings', Icon: Icon.Settings },
  ];

  return (
    <>
      {tab === 'daily' && <DailyPage
        lists={lists}
        stats={stats}
        onSaveStats={saveStats}
      />}
      {tab === 'study' && <StudyPage
        lists={lists}
        onSaveWord={saveWordGlobal}
      />}
      {tab === 'wordlist' && <WordlistPage
        lists={lists} setLists={saveLists}
        activeListId={activeListId} setActiveListId={setActiveListId}
        allWords={allWords}
        customFields={customFields} onSaveCustomFields={saveCustomFields}
      />}
      {tab === 'settings' && <SettingsPage
        lists={lists} setLists={saveLists}
        activeListId={activeListId} setActiveListId={setActiveListId}
        allWords={allWords}
        stats={stats} onSaveStats={saveStats}
      />}

      <nav className="nav-bar">
        {NAV.map(n => (
          <button key={n.id} className={`nav-tab ${tab===n.id?'active':''}`} onClick={() => setTab(n.id)}>
            <n.Icon/>
            {n.label}
          </button>
        ))}
      </nav>
    </>
  );
}
