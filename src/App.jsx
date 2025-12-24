import React, { useState, useEffect } from 'react';
import { BookOpen, Upload, List, ArrowLeft, Check, X, RotateCcw } from 'lucide-react';
import ExcelJS from 'exceljs';
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
    const [wordKeys, setWordKeys] = useState([]);
    const [cardTypes, setCardTypes] = useState([]);
    const [cardTypeDraft, setCardTypeDraft] = useState(null);
    const [cardTypeStep, setCardTypeStep] = useState(null);
    const [currentCardType, setCurrentCardType] = useState(null);
    const [cardFlipped, setCardFlipped] = useState(false);
    const [selectedCardTypeIdx, setSelectedCardTypeIdx] = useState(0);
    const [cachedQnAOptions, setCachedQnAOptions] = useState({});

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
                        if (screen === 'session' || screen === 'wordlist' || screen === 'complete' || screen === 'import' || screen === 'pairQA') {
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
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [screen, selectedOption, currentWordIndex, showResult, sessionWords, buttonPressed, axisPressed, menuSelection, cardTypeStep]);

    useEffect(() => {
        const handleKeyboard = (e) => {
            if (e.key === 'ArrowUp') handleNavigation('up');
            if (e.key === 'ArrowDown') handleNavigation('down');
            
            if ((e.key === 'Enter' || e.key === ' ') && screen !== 'pairQA') {
                e.preventDefault();
                handleConfirm();
            }
            
            if (screen === 'session' && currentCardType?.type === 'QnA' && !showResult && e.key >= '1' && e.key <= '4') {
                setSelectedOption(parseInt(e.key) - 1);
            }
            
            if (e.key === 'Escape' && screen !== 'menu') {
                setScreen('menu');
            }
        };
        window.addEventListener('keydown', handleKeyboard);
        return () => window.removeEventListener('keydown', handleKeyboard);
    }, [screen, selectedOption, currentWordIndex, showResult, sessionWords, menuSelection, currentCardType, cardTypeStep]);

    useEffect(() => {
        const storedKeys = localStorage.getItem('wordKeys');
        if (storedKeys) setWordKeys(JSON.parse(storedKeys));
    }, []);

    useEffect(() => {
        const stored = localStorage.getItem('cardTypes');
        if (stored) setCardTypes(JSON.parse(stored));
    }, []);

    const handleNavigation = (direction) => {
        if (screen === 'menu') {
            setMenuSelection(prev => {
                if (direction === 'up') return prev > 0 ? prev - 1 : 2;
                if (direction === 'down') return prev < 2 ? prev + 1 : 0;
                return prev;
            });
        } else if (screen === 'session' && !showResult && currentCardType?.type === 'QnA') {
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
        } else if (screen === 'session') {
            if (currentCardType?.type === 'plainText') {
                if (!cardFlipped) {
                    setCardFlipped(true);
                } else {
                    nextWord();
                }
            } else if (currentCardType?.type === 'QnA') {
                if (showResult === null) {
                    checkAnswer();
                } else {
                    nextWord();
                }
            }
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

    const saveCardTypes = (newCardTypes) => {
        setCardTypes(newCardTypes);
        localStorage.setItem('cardTypes', JSON.stringify(newCardTypes));
    };

    const startAddCardType = () => {
        setCardTypeDraft({
            id: Date.now(),
            questionKey: null,
            answerKey: null,
            commentKey: null,
            type: null,
            optionsSetup: null,
            manualOptions: ['', '', ''],
            optionKeys: [null, null, null]
        });
        setCardTypeStep('selectType');
    };

    const deleteCardType = (id) => {
        saveCardTypes(cardTypes.filter(ct => ct.id !== id));
    };

    const getWordsForToday = () => {
        const today = new Date().toDateString();
        return words.filter(word => {
            const wordStats = stats[word.id] || {};
            if (!wordStats.lastReviewDate) return true;
            return wordStats.lastReviewDate !== today;
        });
    };

    const renewWord = (wordId) => {
        const newStats = { ...stats };
        if (!newStats[wordId]) newStats[wordId] = {};
        newStats[wordId].lastReviewDate = null;
        newStats[wordId].studyProgress = 0;
        saveStats(newStats);
    };

    const parseText = (text) => {
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        const words = [];
        let currentId = Date.now();
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.includes('|')) {
                const parts = line.split('|').map(p => p.trim()).filter(p => p.length > 0);
                if (parts.length >= 3) {
                    words.push({
                        id: currentId++,
                        word: parts[0],
                        definition: parts[1],
                        options: [parts[2] || 'correct answer', parts[3] || 'option 2', parts[4] || 'option 3', parts[5] || 'option 4']
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
        return words;
    };

    const parseExcel = async (file) => {
        const data = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(data);

        const sheet = workbook.worksheets[0];
        const words = [];
        let currentId = Date.now();
        let headers = [];

        sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            const values = row.values.slice(1);

            if (rowNumber === 1) {
                headers = values.map(v => String(v || '').trim());
                return;
            }

            if (values.length === 0) return;

            const wordObj = { id: currentId++ };
            headers.forEach((key, idx) => {
                wordObj[key] = String(values[idx] || '').trim();
            });

            words.push(wordObj);
        });

        setWordKeys(headers);
        localStorage.setItem('wordKeys', JSON.stringify(headers));

        return words.filter(w => 
            Object.keys(w).some(key => key !== 'id' && w[key].trim() !== '')
        );
    };

    const parseAnki = async (file) => {
        if (typeof JSZip === 'undefined') {
            alert('Anki .apkg support requires JSZip library. Please export as .txt instead');
            return [];
        }
        
        try {
            const zip = new JSZip();
            const contents = await zip.loadAsync(file);
            const collectionFile = contents.files['collection.anki2'];
            if (!collectionFile) {
                alert('Could not find Anki database. Please export as .txt instead');
                return [];
            }
            alert('APKG parsing is complex. Please export as .txt instead');
            return [];
        } catch (error) {
            console.error('Anki parse error:', error);
            alert('Error reading Anki package. Export as .txt instead');
            return [];
        }
    };

    const handleFileImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            let imported = [];
            const fileName = file.name.toLowerCase();
            
            const isJson = fileName.endsWith('.json');
            const isTxt = fileName.endsWith('.txt');
            const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
            const isAnki = fileName.endsWith('.apkg');
            
            if (isJson) {
                const text = await file.text();
                try {
                    imported = JSON.parse(text);
                } catch (jsonError) {
                    alert('Invalid JSON format. Error: ' + jsonError.message);
                    return;
                }
            } else if (isTxt) {
                const text = await file.text();
                imported = parseText(text);
            } else if (isExcel) {
                imported = await parseExcel(file);
            } else if (isAnki) {
                imported = await parseAnki(file);
            } else {
                alert('Unsupported file format: ' + fileName);
                return;
            }

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
        if (cardTypes.length === 0) {
            alert('Please create a card type first.');
            return;
        }
        
        const todayWords = getWordsForToday();
        if (todayWords.length === 0) {
            alert('No words to study today.');
            return;
        }

        const shuffled = todayWords.sort(() => Math.random() - 0.5).slice(0, Math.min(10, todayWords.length));
        setSessionWords(shuffled);
        setCurrentWordIndex(0);
        setSelectedOption(0);
        setShowResult(null);
        setCardFlipped(false);
        setSelectedCardTypeIdx(0);
        setCurrentCardType(cardTypes[0]);
        setCachedQnAOptions({}); 
        setScreen('session');
    };

    const KeySelector = ({ title, allowNone = false, onSelect }) => {
        return (
            <div className="space-y-6">
                <h3 className="text-3xl font-bold text-white text-center">{title}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {allowNone && (
                        <button
                            onClick={() => onSelect(null)}
                            className="bg-white/20 hover:bg-white/30 text-white py-4 rounded-xl text-lg font-semibold"
                        >
                            None
                        </button>
                    )}
                    {wordKeys.map(key => (
                        <button
                            key={key}
                            onClick={() => onSelect(key)}
                            className="bg-white/20 hover:bg-white/30 text-white py-4 rounded-xl text-lg font-semibold"
                        >
                            {key}
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    const checkAnswer = () => {
        if (showResult !== null) return;

        const current = sessionWords[currentWordIndex];
        const selectedText = getQnAOptions(current)[selectedOption];
        const correctText = current[currentCardType.answerKey];
        const correct = selectedText === correctText;
        setShowResult(correct);

        const newStats = { ...stats };
        if (!newStats[current.id]) newStats[current.id] = { correct: 0, attempts: 0, studyProgress: 0, lastReviewDate: null };
        newStats[current.id].attempts += 1;
        if (correct) newStats[current.id].correct += 1;
        newStats[current.id].studyProgress = (newStats[current.id].studyProgress || 0) + 1;
        newStats[current.id].lastReviewDate = new Date().toDateString();
        saveStats(newStats);
    };

    const nextWord = () => {
        if (currentWordIndex < sessionWords.length - 1) {
            setCurrentWordIndex(prev => prev + 1);
            setSelectedOption(0);
            setShowResult(null);
            setCardFlipped(false);
            setCachedQnAOptions({});  // Add this
        } else {
            setScreen('complete');
        }
    };

    const generateQnAOptions = (word, answerValue) => {
        const otherWords = words.filter(w => w.id !== word.id);
        const options = [answerValue];
        const answerKey = currentCardType.answerKey;
        
        while (options.length < 4 && otherWords.length > 0) {
            const randomIdx = Math.floor(Math.random() * otherWords.length);
            const option = otherWords[randomIdx][answerKey];
            if (option && !options.includes(option)) {
                options.push(option);
            }
            otherWords.splice(randomIdx, 1);
        }
        
        while (options.length < 4) {
            options.push('Option ' + (options.length));
        }
        
        return options.sort(() => Math.random() - 0.5);
    };

    const getQnAOptions = (word) => {
        const cacheKey = `${word.id}-${currentCardType.id}`;
        if (cachedQnAOptions[cacheKey]) {
            return cachedQnAOptions[cacheKey];
        }
        
        let options = [];
        if (currentCardType.optionsSetup === 'manual') {
            options = currentCardType.manualOptions.sort(() => Math.random() - 0.5);
        } else if (currentCardType.optionsSetup === 'keys') {
            options = [
                word[currentCardType.answerKey],
                word[currentCardType.optionKeys[0]],
                word[currentCardType.optionKeys[1]],
                word[currentCardType.optionKeys[2]]
            ].filter(o => o);
            options = options.sort(() => Math.random() - 0.5);
        } else if (currentCardType.optionsSetup === 'auto') {
            options = generateQnAOptions(word, word[currentCardType.answerKey]);
        }
        
        setCachedQnAOptions(prev => ({ ...prev, [cacheKey]: options }));
        return options;
    };

    const exportWordlist = () => {
        const blob = new Blob([JSON.stringify(words, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wordlist.json';
        a.click();
    };

    // SCREENS

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
                </div>
            </div>
        );
    }

    if (screen === 'menu') {
        const todayCount = getWordsForToday().length;
        const menuButtons = [
            { label: `Start Today's Session (${todayCount} words)`, icon: BookOpen, action: startSession, disabled: todayCount === 0, gradient: 'from-green-500 to-emerald-600' },
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
        if (!sessionWords[currentWordIndex] || !currentCardType) {
            return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
        }
        
        const current = sessionWords[currentWordIndex];

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

                    {currentCardType.type === 'plainText' && (
                        <div className="space-y-8">
                            <h2 className="text-7xl font-bold text-white text-center">{current[currentCardType.questionKey]}</h2>
                            
                            {cardFlipped && (
                                <div className="space-y-6">
                                    <div className="bg-white/20 p-8 rounded-xl">
                                        <p className="text-white/60 text-lg mb-2">Answer:</p>
                                        <p className="text-white text-3xl font-semibold">{current[currentCardType.answerKey]}</p>
                                    </div>
                                    
                                    {currentCardType.commentKey && (
                                        <div className="bg-white/20 p-8 rounded-xl">
                                            <p className="text-white/60 text-lg mb-2">Comment:</p>
                                            <p className="text-white text-2xl">{current[currentCardType.commentKey]}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="text-center text-white/60">
                                {!cardFlipped ? '(Press A to reveal)' : '(Press A to continue)'}
                            </div>
                        </div>
                    )}

                    {currentCardType.type === 'QnA' && (
                        <div>
                            <h2 className="text-7xl font-bold text-white text-center mb-12">{current[currentCardType.questionKey]}</h2>

                            {showResult === null ? (
                                <div className="space-y-4">
                                    {getQnAOptions(current).map((option, idx) => (
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
                                        The correct answer is: <span className="font-bold">{current[currentCardType.answerKey]}</span>
                                    </p>

                                    {currentCardType.commentKey && (
                                        <p className="text-white/80 mb-6 text-lg">{current[currentCardType.commentKey]}</p>
                                    )}

                                    <button
                                        onClick={nextWord}
                                        className="w-full bg-white text-purple-900 py-4 rounded-xl text-xl font-semibold hover:bg-white/90 transition-all"
                                    >
                                        {currentWordIndex < sessionWords.length - 1 ? 'Next Word' : 'Finish Session'}
                                    </button>
                                </div>
                            )}

                            {showResult === null && (
                                <button
                                    onClick={checkAnswer}
                                    className="w-full mt-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl text-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all"
                                >
                                    Submit Answer
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (screen === 'wordlist') {
        const tableHeaders = words.length > 0
        ? Object.keys(words[0]).filter(k => k !== 'id')
        : [];

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
                        <div className="flex gap-3">
                            <button
                                onClick={() => setScreen('pairQA')}
                                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold"
                            >
                                Manage Card Types
                            </button>
                            <button
                                onClick={exportWordlist}
                                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg"
                            >
                                Export Wordlist
                            </button>
                        </div>
                    </div>

                    <h2 className="text-5xl font-bold text-white mb-8">Current Wordlist</h2>

                    {words.length === 0 ? (
                        <p className="text-white">No words imported yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full border border-white/20 text-white text-sm">
                                <thead className="bg-white/10">
                                    <tr>
                                        {tableHeaders.map((header, idx) => (
                                            <th
                                                key={idx}
                                                className="px-4 py-2 text-left border-b border-white/20"
                                            >
                                                {header}
                                            </th>
                                        ))}
                                        <th className="px-4 py-2 text-left border-b border-white/20">Progress</th>
                                        <th className="px-4 py-2 text-left border-b border-white/20">Last Review</th>
                                        <th className="px-4 py-2 text-left border-b border-white/20">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {words.map(word => {
                                        const wordStats = stats[word.id] || {};
                                        const accuracy = wordStats.attempts > 0
                                            ? Math.round((wordStats.correct / wordStats.attempts) * 100)
                                            : 0;

                                        return (
                                            <tr key={word.id} className="hover:bg-white/10">
                                                {tableHeaders.map((header, idx) => (
                                                    <td key={idx} className="px-4 py-2 border-b border-white/20">
                                                        {String(word[header]).substring(0, 30)}
                                                    </td>
                                                ))}
                                                <td className="px-4 py-2 border-b border-white/20">
                                                    <div className="text-xs">
                                                        <p>Progress: {wordStats.studyProgress || 0}</p>
                                                        {wordStats.attempts > 0 && <p>Accuracy: {accuracy}%</p>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 border-b border-white/20 text-xs">
                                                    {wordStats.lastReviewDate || 'Never'}
                                                </td>
                                                <td className="px-4 py-2 border-b border-white/20">
                                                    <button
                                                        onClick={() => renewWord(word.id)}
                                                        className="bg-blue-500/30 hover:bg-blue-500/50 text-blue-200 px-3 py-1 rounded flex items-center gap-1 text-xs"
                                                    >
                                                        <RotateCcw size={14} />
                                                        Renew
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (screen === 'pairQA') {
        const isAdding = Boolean(cardTypeStep);
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8">
                <div className="max-w-4xl mx-auto">

                    <button
                        onClick={() => {
                            setCardTypeDraft(null);
                            setCardTypeStep(null);
                            setScreen('wordlist');
                        }}
                        className="text-white/80 hover:text-white flex items-center gap-2 mb-8"
                    >
                        <ArrowLeft size={24} />
                        Back
                    </button>

                    {!isAdding && (
                        <div className="space-y-8">
                            <h2 className="text-5xl font-bold text-white">
                                Manage Card Types
                            </h2>

                            {cardTypes.length === 0 ? (
                                <p className="text-white/70 text-xl">
                                    No card types yet.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {cardTypes.map(ct => (
                                        <div
                                            key={ct.id}
                                            className="bg-white/10 rounded-xl p-6 flex justify-between items-center"
                                        >
                                            <div className="text-white flex-1">
                                                <p className="text-2xl font-semibold">{ct.name}</p>
                                                <p className="text-white/70 text-sm">
                                                    Type: {ct.type} | Q: {ct.questionKey} | A: {ct.answerKey}
                                                    {ct.commentKey && ` | Comment: ${ct.commentKey}`}
                                                </p>
                                                {ct.type === 'QnA' && (
                                                    <p className="text-white/70 text-sm">Options: {ct.optionsSetup}</p>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => deleteCardType(ct.id)}
                                                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-lg ml-4"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={startAddCardType}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-6 rounded-xl text-xl font-semibold"
                            >
                                Add Card Type
                            </button>

                        </div>
                    )}

                    {cardTypeStep === 'selectType' && (
                        <div className="space-y-6">
                            <h3 className="text-3xl font-bold text-white text-center">Select Card Type</h3>
                            <div className="space-y-4">
                                <button
                                    onClick={() => {
                                        setCardTypeDraft(d => ({ ...d, type: 'plainText' }));
                                        setCardTypeStep('question');
                                    }}
                                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-6 rounded-xl text-xl font-semibold"
                                >
                                    Plain Text (Flip Card)
                                </button>
                                <button
                                    onClick={() => {
                                        setCardTypeDraft(d => ({ ...d, type: 'QnA' }));
                                        setCardTypeStep('question');
                                    }}
                                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-6 rounded-xl text-xl font-semibold"
                                >
                                    Q&A (Multiple Choice)
                                </button>
                            </div>
                        </div>
                    )}

                    {cardTypeStep === 'question' && (
                        <KeySelector
                            title="Select Question Column"
                            onSelect={(key) => {
                                setCardTypeDraft(d => ({ ...d, questionKey: key }));
                                setCardTypeStep('answer');
                            }}
                        />
                    )}

                    {cardTypeStep === 'answer' && (
                        <KeySelector
                            title="Select Answer Column"
                            onSelect={(key) => {
                                setCardTypeDraft(d => ({ ...d, answerKey: key }));
                                if (cardTypeDraft.type === 'plainText') {
                                    setCardTypeStep('comment');
                                } else if (cardTypeDraft.type === 'QnA') {
                                    setCardTypeStep('optionsSetup');
                                }
                            }}
                        />
                    )}

                    {cardTypeStep === 'optionsSetup' && (
                        <div className="space-y-6">
                            <h3 className="text-3xl font-bold text-white text-center">Select Options Setup</h3>
                            <div className="space-y-4">
                                <button
                                    onClick={() => {
                                        setCardTypeStep('optionsManual');
                                    }}
                                    className="w-full bg-white/20 hover:bg-white/30 text-white py-6 rounded-xl text-xl font-semibold"
                                >
                                    Manual (Enter 3+ Options)
                                </button>
                                <button
                                    onClick={() => {
                                        setCardTypeDraft(d => ({ ...d, optionsSetup: 'keys' }));
                                        setCardTypeStep('optionsKey1');
                                    }}
                                    className="w-full bg-white/20 hover:bg-white/30 text-white py-6 rounded-xl text-xl font-semibold"
                                >
                                    Select Columns
                                </button>
                                <button
                                    onClick={() => {
                                        setCardTypeDraft(d => ({ ...d, optionsSetup: 'auto' }));
                                        setCardTypeStep('comment');
                                    }}
                                    className="w-full bg-white/20 hover:bg-white/30 text-white py-6 rounded-xl text-xl font-semibold"
                                >
                                    Auto-Generate
                                </button>
                            </div>
                        </div>
                    )}

                    {cardTypeStep === 'optionsManual' && (
                        <div className="space-y-6">
                            <h3 className="text-3xl font-bold text-white text-center">Enter 3+ Options</h3>
                            <div className="space-y-3">
                                {[0, 1, 2].map((idx) => (
                                    <input
                                        key={idx}
                                        type="text"
                                        placeholder={`Option ${idx + 1}`}
                                        defaultValue={cardTypeDraft.manualOptions[idx] || ''}
                                        onChange={(e) => {
                                            const newOpts = [...cardTypeDraft.manualOptions];
                                            newOpts[idx] = e.target.value;
                                            setCardTypeDraft(d => ({ ...d, manualOptions: newOpts }));
                                        }}
                                        className="w-full bg-white/20 text-white px-4 py-3 rounded-lg placeholder-white/50"
                                    />
                                ))}
                            </div>
                            <button
                                onClick={() => {
                                    if (cardTypeDraft.manualOptions.filter(o => o.trim()).length >= 3) {
                                        setCardTypeDraft(d => ({ ...d, optionsSetup: 'manual' }));
                                        setCardTypeStep('comment');
                                    } else {
                                        alert('Please enter at least 3 options');
                                    }
                                }}
                                className="w-full bg-green-500/30 hover:bg-green-500/50 text-white py-3 rounded-lg font-semibold"
                            >
                                Continue
                            </button>
                        </div>
                    )}

                    {cardTypeStep === 'optionsKey1' && (
                        <KeySelector
                            title="Select Column for Option 1"
                            onSelect={(key) => {
                                const newKeys = [...cardTypeDraft.optionKeys];
                                newKeys[0] = key;
                                setCardTypeDraft(d => ({ ...d, optionKeys: newKeys }));
                                setCardTypeStep('optionsKey2');
                            }}
                        />
                    )}

                    {cardTypeStep === 'optionsKey2' && (
                        <KeySelector
                            title="Select Column for Option 2"
                            onSelect={(key) => {
                                const newKeys = [...cardTypeDraft.optionKeys];
                                newKeys[1] = key;
                                setCardTypeDraft(d => ({ ...d, optionKeys: newKeys }));
                                setCardTypeStep('optionsKey3');
                            }}
                        />
                    )}

                    {cardTypeStep === 'optionsKey3' && (
                        <KeySelector
                            title="Select Column for Option 3"
                            onSelect={(key) => {
                                const newKeys = [...cardTypeDraft.optionKeys];
                                newKeys[2] = key;
                                setCardTypeDraft(d => ({ ...d, optionKeys: newKeys }));
                                setCardTypeStep('comment');
                            }}
                        />
                    )}

                    {cardTypeStep === 'comment' && (
                        <KeySelector
                            title="Select Comment Column (Optional)"
                            allowNone
                            onSelect={(key) => {
                                setCardTypeDraft(d => ({ ...d, commentKey: key }));
                                setCardTypeStep('confirm');
                            }}
                        />
                    )}

                    {cardTypeStep === 'confirm' && (
                        <div className="space-y-6 text-white">
                            <h3 className="text-4xl font-bold text-center">Confirm Card Type</h3>

                            <div className="bg-white/10 p-6 rounded-xl space-y-3 text-lg">
                                <p><strong>Type:</strong> {cardTypeDraft.type}</p>
                                <p><strong>Question:</strong> {cardTypeDraft.questionKey}</p>
                                <p><strong>Answer:</strong> {cardTypeDraft.answerKey}</p>
                                {cardTypeDraft.type === 'QnA' && (
                                    <p><strong>Options:</strong> {cardTypeDraft.optionsSetup}
                                    {cardTypeDraft.optionsSetup === 'keys' && ` (${cardTypeDraft.optionKeys.join(', ')})`}
                                    {cardTypeDraft.optionsSetup === 'manual' && ` (${cardTypeDraft.manualOptions.filter(o => o).join(', ')})`}
                                    </p>
                                )}
                                <p><strong>Comment:</strong> {cardTypeDraft.commentKey || 'None'}</p>
                            </div>

                            <button
                                onClick={() => {
                                    saveCardTypes([...cardTypes, {
                                        ...cardTypeDraft,
                                        name: `${cardTypeDraft.questionKey} → ${cardTypeDraft.answerKey}`
                                    }]);
                                    setCardTypeDraft(null);
                                    setCardTypeStep(null);
                                }}
                                className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-6 rounded-xl text-xl font-semibold"
                            >
                                Create Card Type
                            </button>
                        </div>
                    )}

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

    return null;
};
export default WordMemorizerApp;