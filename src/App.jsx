import React, { useState, useEffect } from 'react';
import { BookOpen, Upload, List, ArrowLeft, Check, X } from 'lucide-react';

import ExcelJS from 'exceljs';

// For desktop app: import XLSX and JSZip
// import * as XLSX from 'xlsx';
import JSZip from 'jszip';

const WordMemorizerApp = () => {
  const [screen, setScreen] = useState('menu');
  const [words, setWords] = useState([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(0);
  const [sessionWords, setSessionWords] = useState([]);
  const [showResult, setShowResult] = useState(null);
  const [stats, setStats] = useState({});
  const [buttonPressed, setButtonPressed] = useState({});
  const [axisPressed, setAxisPressed] = useState({});
  const [menuSelection, setMenuSelection] = useState(0);

  useEffect(() => {
    loadWords();
    loadStats();
  }, []);

  useEffect(() => {
    let animationFrameId;

    const pollGamepad = () => {
      try {
        const gamepads = navigator.getGamepads();
        
        for (let i = 0; i < gamepads.length; i++) {
          const gp = gamepads[i];
          if (!gp) continue;

          if (gp.buttons[12]?.pressed && !buttonPressed[12]) {
            setButtonPressed(prev => ({ ...prev, 12: true }));
            handleNavigation('up');
          } else if (!gp.buttons[12]?.pressed && buttonPressed[12]) {
            setButtonPressed(prev => ({ ...prev, 12: false }));
          }

          if (gp.buttons[13]?.pressed && !buttonPressed[13]) {
            setButtonPressed(prev => ({ ...prev, 13: true }));
            handleNavigation('down');
          } else if (!gp.buttons[13]?.pressed && buttonPressed[13]) {
            setButtonPressed(prev => ({ ...prev, 13: false }));
          }

          if (gp.axes[1] < -0.5 && !axisPressed.up) {
            setAxisPressed(prev => ({ ...prev, up: true }));
            handleNavigation('up');
          } else if (gp.axes[1] > -0.3) {
            setAxisPressed(prev => ({ ...prev, up: false }));
          }

          if (gp.axes[1] > 0.5 && !axisPressed.down) {
            setAxisPressed(prev => ({ ...prev, down: true }));
            handleNavigation('down');
          } else if (gp.axes[1] < 0.3) {
            setAxisPressed(prev => ({ ...prev, down: false }));
          }

          if (gp.buttons[0]?.pressed && !buttonPressed[0]) {
            setButtonPressed(prev => ({ ...prev, 0: true }));
            handleConfirm();
          } else if (!gp.buttons[0]?.pressed && buttonPressed[0]) {
            setButtonPressed(prev => ({ ...prev, 0: false }));
          }

          if (gp.buttons[1]?.pressed && !buttonPressed[1]) {
            setButtonPressed(prev => ({ ...prev, 1: true }));
            if (screen === 'session' || screen === 'wordlist' || screen === 'complete' || screen === 'import') {
              setScreen('menu');
            }
          } else if (!gp.buttons[1]?.pressed && buttonPressed[1]) {
            setButtonPressed(prev => ({ ...prev, 1: false }));
          }
        }
      } catch (error) {
        console.log('Gamepad API not available:', error.message);
      }

      animationFrameId = requestAnimationFrame(pollGamepad);
    };

    pollGamepad();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [screen, selectedOption, currentWordIndex, showResult, sessionWords, buttonPressed, axisPressed, menuSelection]);

  useEffect(() => {
    const handleKeyboard = (e) => {
      if (e.key === 'ArrowUp') handleNavigation('up');
      if (e.key === 'ArrowDown') handleNavigation('down');
      
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleConfirm();
      }
      
      if (screen === 'session' && e.key >= '1' && e.key <= '4') {
        setSelectedOption(parseInt(e.key) - 1);
      }
      
      if (e.key === 'Escape' && screen !== 'menu') {
        setScreen('menu');
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [screen, selectedOption, currentWordIndex, showResult, sessionWords, menuSelection]);

  const handleNavigation = (direction) => {
    if (screen === 'menu') {
      setMenuSelection(prev => {
        if (direction === 'up') return prev > 0 ? prev - 1 : 2;
        if (direction === 'down') return prev < 2 ? prev + 1 : 0;
        return prev;
      });
    } else if (screen === 'session' && !showResult) {
      setSelectedOption(prev => {
        if (direction === 'up') return prev > 0 ? prev - 1 : 3;
        if (direction === 'down') return prev < 3 ? prev + 1 : 0;
        return prev;
      });
    }
  };

  const handleConfirm = () => {
    if (screen === 'menu') {
      if (menuSelection === 0 && words.length > 0) startSession();
      else if (menuSelection === 1) setScreen('import');
      else if (menuSelection === 2) setScreen('wordlist');
    } else if (screen === 'session' && !showResult) {
      checkAnswer();
    } else if (showResult) {
      nextWord();
    } else if (screen === 'complete') {
      setScreen('menu');
    }
  };

  const loadWords = () => {
    try {
      const stored = localStorage.getItem('wordlist');
      if (stored) {
        setWords(JSON.parse(stored));
      } else {
        const defaultWords = [
          { id: 1, word: 'ephemeral', definition: 'lasting for a very short time', options: ['temporary', 'permanent', 'eternal', 'infinite'] },
          { id: 2, word: 'ubiquitous', definition: 'present everywhere', options: ['common', 'rare', 'absent', 'scarce'] },
          { id: 3, word: 'eloquent', definition: 'fluent and persuasive in speaking', options: ['articulate', 'silent', 'clumsy', 'awkward'] },
          { id: 4, word: 'meticulous', definition: 'showing great attention to detail', options: ['careful', 'careless', 'sloppy', 'hasty'] },
          { id: 5, word: 'resilient', definition: 'able to recover quickly from difficulties', options: ['tough', 'fragile', 'weak', 'brittle'] },
        ];
        setWords(defaultWords);
        localStorage.setItem('wordlist', JSON.stringify(defaultWords));
      }
    } catch (error) {
      console.error('Error loading words:', error);
    }
  };

  const loadStats = () => {
    try {
      const stored = localStorage.getItem('wordstats');
      if (stored) {
        setStats(JSON.parse(stored));
      }
    } catch (error) {
      setStats({});
    }
  };

  const saveStats = (newStats) => {
    localStorage.setItem('wordstats', JSON.stringify(newStats));
    setStats(newStats);
  };

  const saveWords = (newWords) => {
    setWords(newWords);
    localStorage.setItem('wordlist', JSON.stringify(newWords));
  };

  const addEmojiToWord = (wordId, emoji) => {
    const newStats = { ...stats };
    if (!newStats[wordId]) newStats[wordId] = {};
    newStats[wordId].emoji = emoji;
    saveStats(newStats);
  };

  const parseText = (text) => {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const words = [];
    let currentId = Date.now();
    
    console.log('Parsing text file, found lines:', lines.length);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('|')) {
        const parts = line.split('|').map(p => p.trim()).filter(p => p.length > 0);
        
        if (parts.length >= 3) {
          words.push({
            id: currentId++,
            word: parts[0],
            definition: parts[1],
            options: [
              parts[2] || 'correct answer',
              parts[3] || 'option 2',
              parts[4] || 'option 3',
              parts[5] || 'option 4',
            ]
          });
        }
      }
      else if (line.includes(':')) {
        const colonIndex = line.indexOf(':');
        const word = line.substring(0, colonIndex).trim();
        const definition = line.substring(colonIndex + 1).trim();
        
        if (word && definition) {
          words.push({
            id: currentId++,
            word,
            definition,
            options: [definition, 'incorrect 1', 'incorrect 2', 'incorrect 3']
          });
        }
      }
      // Tab-separated format (from Anki text export)
      else if (line.includes('\t')) {
        const parts = line.split('\t').map(p => p.trim()).filter(p => p.length > 0);
        if (parts.length >= 2) {
          words.push({
            id: currentId++,
            word: parts[0],
            definition: parts[1],
            options: [parts[1], 'incorrect 1', 'incorrect 2', 'incorrect 3']
          });
        }
      }
    }
    
    console.log('Total words parsed:', words.length);
    return words;
  };

  const parseExcel = async (file) => {
    const data = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(data);

    const sheet = workbook.worksheets[0];
    const words = [];
    let currentId = Date.now();

    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return; // skip header
        const values = row.values.slice(1); // ExcelJS row.values starts from 1

        if (values.length >= 3) {
        words.push({
            id: currentId++,
            word: String(values[0] || '').trim(),
            definition: String(values[1] || '').trim(),
            options: [
            String(values[2] || '').trim(),
            String(values[3] || 'option 2').trim(),
            String(values[4] || 'option 3').trim(),
            String(values[5] || 'option 4').trim(),
            ]
        });
        }
    });

    return words.filter(w => w.word && w.definition);
    };

  const parseAnki = async (file) => {
    // This will work in desktop app where JSZip is imported
    if (typeof JSZip === 'undefined') {
      alert('Anki .apkg support requires JSZip library. Please ensure it is installed:\n\nnpm install jszip\n\nOR export your Anki deck as a text file (.txt) instead:\nFile > Export > Notes in Plain Text (.txt)');
      return [];
    }
    
    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      
      // Anki packages contain a SQLite database which is complex to parse in browser
      // For now, extract collection.anki2 and look for the media file
      const collectionFile = contents.files['collection.anki2'];
      if (!collectionFile) {
        alert('Could not find Anki database in package.\n\nPlease export your deck from Anki as:\nFile > Export > Notes in Plain Text (.txt)\n\nThen import the .txt file here.');
        return [];
      }
      
      alert('APKG parsing is complex. Please export from Anki as:\n\nFile > Export > Notes in Plain Text (.txt)\n\nFormat: Tab-separated\n\nThen import the .txt file here instead.');
      return [];
    } catch (error) {
      console.error('Anki parse error:', error);
      alert('Error reading Anki package. Please export as .txt instead:\n\nIn Anki: File > Export > Notes in Plain Text (.txt)');
      return [];
    }
  };

  const handleFileImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      let imported = [];
      const fileName = file.name.toLowerCase();
      
      console.log('Importing file:', fileName);
      
      const isJson = fileName.endsWith('.json');
      const isTxt = fileName.endsWith('.txt');
      const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
      const isAnki = fileName.endsWith('.apkg');
      
      if (isJson) {
        console.log('Detected JSON file');
        const text = await file.text();
        try {
          imported = JSON.parse(text);
        } catch (jsonError) {
          alert('Invalid JSON format. Please check your file.\n\nError: ' + jsonError.message);
          return;
        }
      } else if (isTxt) {
        console.log('Detected TXT file');
        const text = await file.text();
        imported = parseText(text);
      } else if (isExcel) {
        console.log('Detected Excel file');
        imported = await parseExcel(file);
      } else if (isAnki) {
        console.log('Detected Anki package');
        imported = await parseAnki(file);
      } else {
        alert('Unsupported file format: ' + fileName + '\n\nSupported: .json, .txt, .xlsx, .xls, .apkg');
        return;
      }

      console.log('Imported words:', imported.length);

      if (imported.length > 0) {
        saveWords(imported);
        alert(`Successfully imported ${imported.length} words!`);
        setScreen('menu');
      } else {
        alert('No valid words found in file.');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Error importing file: ' + error.message);
    }
  };

  const triggerFileImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.txt,.xlsx,.xls,.apkg';
    input.onchange = handleFileImport;
    input.click();
  };

  const startSession = () => {
    const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, Math.min(10, words.length));
    setSessionWords(shuffled);
    setCurrentWordIndex(0);
    setSelectedOption(0);
    setShowResult(null);
    setScreen('session');
  };

  const checkAnswer = () => {
    const current = sessionWords[currentWordIndex];
    const correct = selectedOption === 0;
    setShowResult(correct);

    const newStats = { ...stats };
    if (!newStats[current.id]) newStats[current.id] = { correct: 0, attempts: 0 };
    newStats[current.id].attempts += 1;
    if (correct) newStats[current.id].correct += 1;
    saveStats(newStats);
  };

  const nextWord = () => {
    if (currentWordIndex < sessionWords.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      setSelectedOption(0);
      setShowResult(null);
    } else {
      setScreen('complete');
    }
  };

  const exportWordlist = () => {
    const blob = new Blob([JSON.stringify(words, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wordlist.json';
    a.click();
  };

  if (screen === 'import') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center p-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 max-w-3xl w-full shadow-2xl">
          <button
            onClick={() => setScreen('menu')}
            className="text-white/80 hover:text-white flex items-center gap-2 mb-6"
          >
            <ArrowLeft size={24} />
            Back
          </button>

          <h1 className="text-5xl font-bold text-white mb-4 text-center">Import Wordlist</h1>
          <p className="text-white/80 text-center mb-8">Choose a file to import</p>

          <div className="space-y-4 mb-8">
            <button
              onClick={triggerFileImport}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white py-6 rounded-xl flex items-center justify-center gap-3 text-xl font-semibold transition-all transform hover:scale-105"
            >
              <Upload size={28} />
              Import File (.json, .txt, .xlsx, .apkg)
            </button>
          </div>

          <div className="bg-white/5 rounded-xl p-6 text-white/80 text-sm space-y-4">
            <h3 className="text-lg font-semibold text-white mb-3">📋 Supported Formats:</h3>
            
            <div>
              <strong className="text-white">JSON (.json):</strong>
              <pre className="mt-2 bg-black/30 p-3 rounded text-xs overflow-x-auto">
{`[{"id": 1, "word": "example", "definition": "...",
  "options": ["correct", "wrong1", "wrong2", "wrong3"]}]`}
              </pre>
            </div>

            <div>
              <strong className="text-white">Excel (.xlsx, .xls):</strong>
              <p className="mt-2">Columns: word | definition | correct | wrong1 | wrong2 | wrong3</p>
            </div>

            <div>
              <strong className="text-white">Text (.txt):</strong>
              <p className="mt-2">Format 1: <code>word | definition | correct | wrong1 | wrong2 | wrong3</code></p>
              <p className="mt-1">Format 2: <code>word: definition</code></p>
              <p className="mt-1">Format 3 (Anki export): <code>word[TAB]definition</code></p>
            </div>

            <div>
              <strong className="text-white">Anki (.apkg):</strong>
              <p className="mt-2 text-yellow-200">⚠️ For best results, export from Anki as .txt:</p>
              <p className="mt-1 text-xs">File → Export → Notes in Plain Text (.txt)</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'menu') {
    const menuButtons = [
      { label: 'Start Today\'s Session', icon: BookOpen, action: startSession, disabled: words.length === 0, gradient: 'from-green-500 to-emerald-600' },
      { label: 'Import Wordlist', icon: Upload, action: () => setScreen('import'), disabled: false, gradient: 'from-blue-500 to-cyan-600' },
      { label: `Check Current Wordlist (${words.length} words)`, icon: List, action: () => setScreen('wordlist'), disabled: false, gradient: 'from-purple-500 to-pink-600' }
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 max-w-2xl w-full shadow-2xl">
          <h1 className="text-6xl font-bold text-white mb-4 text-center">Words ABXY</h1>
          <p className="text-white/80 text-center mb-12 text-lg">Learn vocabulary with controller support</p>
          
          <div className="space-y-4">
            {menuButtons.map((btn, idx) => {
              const Icon = btn.icon;
              const isSelected = menuSelection === idx;
              return (
                <button
                  key={idx}
                  onClick={btn.action}
                  disabled={btn.disabled}
                  className={`w-full bg-gradient-to-r ${btn.gradient} text-white py-6 rounded-xl flex items-center justify-center gap-3 text-xl font-semibold transition-all transform hover:scale-105 disabled:opacity-50 ${
                    isSelected ? 'ring-4 ring-white scale-105' : ''
                  }`}
                >
                  <Icon size={28} />
                  {btn.label}
                </button>
              );
            })}
          </div>

          <div className="mt-8 text-center text-white/60 text-sm">
            <p>🎮 Controller: D-pad/Stick to navigate, A to confirm, B to back</p>
            <p>⌨️ Keyboard: Arrow keys, Enter, Escape</p>
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'session') {
    if (!sessionWords[currentWordIndex]) {
      return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
    }
    
    const current = sessionWords[currentWordIndex];
    const wordStats = stats[current?.id] || {};
    const emoji = wordStats.emoji;

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 max-w-4xl w-full shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => setScreen('menu')}
              className="text-white/80 hover:text-white flex items-center gap-2"
            >
              <ArrowLeft size={24} />
              Back
            </button>
            <div className="text-white text-xl font-semibold">
              {currentWordIndex + 1} / {sessionWords.length}
            </div>
          </div>

          <div className="relative">
            <h2 className="text-7xl font-bold text-white text-center mb-6">{current.word}</h2>
            {emoji && (
              <div className="absolute top-0 right-0 text-6xl">{emoji}</div>
            )}
          </div>

          <p className="text-white/80 text-center text-2xl mb-12 italic">"{current.definition}"</p>

          {!showResult ? (
            <div className="space-y-4">
              {current.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedOption(idx)}
                  className={`w-full py-6 px-8 rounded-xl text-left text-xl font-medium transition-all transform hover:scale-102 ${
                    selectedOption === idx
                      ? 'bg-white text-purple-900 shadow-lg scale-102'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <span className="font-bold mr-4">{idx + 1}.</span>
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <div className={`p-8 rounded-xl ${showResult ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              <div className="flex items-center gap-4 mb-6">
                {showResult ? (
                  <Check size={48} className="text-green-400" />
                ) : (
                  <X size={48} className="text-red-400" />
                )}
                <h3 className="text-3xl font-bold text-white">
                  {showResult ? 'Correct!' : 'Incorrect'}
                </h3>
              </div>
              <p className="text-white text-xl mb-6">
                The correct answer is: <span className="font-bold">{current.options[0]}</span>
              </p>

              <div className="mb-6">
                <p className="text-white/80 mb-3">Add an emoji note:</p>
                <div className="flex gap-2 flex-wrap">
                  {['⭐', '❤️', '🔥', '👍', '💯', '😊', '🎯', '💪', '🧠', '✨'].map(e => (
                    <button
                      key={e}
                      onClick={() => addEmojiToWord(current.id, e)}
                      className="text-4xl hover:scale-125 transition-transform"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={nextWord}
                className="w-full bg-white text-purple-900 py-4 rounded-xl text-xl font-semibold hover:bg-white/90 transition-all"
              >
                {currentWordIndex < sessionWords.length - 1 ? 'Next Word' : 'Finish Session'}
              </button>
            </div>
          )}

          {!showResult && (
            <button
              onClick={checkAnswer}
              className="w-full mt-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl text-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all"
            >
              Submit Answer
            </button>
          )}
        </div>
      </div>
    );
  }

  if (screen === 'wordlist') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => setScreen('menu')}
              className="text-white/80 hover:text-white flex items-center gap-2 text-lg"
            >
              <ArrowLeft size={24} />
              Back to Menu
            </button>
            <button
              onClick={exportWordlist}
              className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg"
            >
              Export Wordlist
            </button>
          </div>

          <h2 className="text-5xl font-bold text-white mb-8">Current Wordlist</h2>

          <div className="grid gap-4">
            {words.map(word => {
              const wordStats = stats[word.id] || {};
              const accuracy = wordStats.attempts > 0
                ? Math.round((wordStats.correct / wordStats.attempts) * 100)
                : 0;

              return (
                <div key={word.id} className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-3xl font-bold text-white">{word.word}</h3>
                        {wordStats.emoji && (
                          <span className="text-3xl">{wordStats.emoji}</span>
                        )}
                      </div>
                      <p className="text-white/80 text-lg mb-3 italic">"{word.definition}"</p>
                      <div className="flex gap-2 flex-wrap">
                        {word.options.map((opt, idx) => (
                          <span
                            key={idx}
                            className={`px-3 py-1 rounded-lg text-sm ${
                              idx === 0
                                ? 'bg-green-500/30 text-green-200'
                                : 'bg-white/20 text-white/80'
                            }`}
                          >
                            {opt}
                          </span>
                        ))}
                      </div>
                    </div>
                    {wordStats.attempts > 0 && (
                      <div className="text-right">
                        <div className="text-white font-bold text-2xl">{accuracy}%</div>
                        <div className="text-white/60 text-sm">
                          {wordStats.correct}/{wordStats.attempts}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (screen === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 flex items-center justify-center p-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 max-w-2xl w-full shadow-2xl text-center">
          <div className="text-8xl mb-6">🎉</div>
          <h2 className="text-5xl font-bold text-white mb-4">Session Complete!</h2>
          <p className="text-white/80 text-2xl mb-8">
            You studied {sessionWords.length} words
          </p>
          <button
            onClick={() => setScreen('menu')}
            className="bg-white text-green-900 px-12 py-4 rounded-xl text-xl font-semibold hover:bg-white/90 transition-all"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }
};

export default WordMemorizerApp;