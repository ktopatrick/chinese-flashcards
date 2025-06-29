class ChineseFlashcardApp {
    constructor() {
        this.charactersData = {};
        this.allPinyinOptions = [];
        this.pool = [];
        this.currentPool = [];
        this.currentRound = [];
        this.currentRoundCounted = false;
        this.currentCharacter = null;
        this.correctPinyin = '';
        this.audioButton = document.querySelector('#audioEnabled');
        this.phrasesButton = document.querySelector('#phrasesEnabled');
        this.speechSynthesis = window.speechSynthesis;
        this.currentSpeechTimeout = null;
        this.hanziWriters = [];
        this.isShowingPhrases = false;

        this.init();
    }

    async init() {
        try {
            await this.loadCharacters();
            await this.processCharacters();
            this.setupEventListeners();
            this.setupSpeechOptions();
            this.start();
            this.hideLoading();
        } catch (error) {
            console.error('Initialization failed:', error);
            this.showError();
        }
    }

    async loadCharacters() {
        // Try to load from JSON file first, but use fallback data for demo
        try {
            const response = await fetch('characters.json');
            if (response.ok) {
                this.charactersData = await response.json();
                console.log('Loaded characters from characters.json');
                return;
            }
        } catch (error) {
            console.log(error);
            console.log('characters.json not found, using demo data');
        }

        // Use built-in demo data
        this.charactersData = {
            "你": [
                {"simplified": "你好", "english": "hello"},
                {"simplified": "你们", "english": "you (plural)"}
            ],
            "好": [
                {"simplified": "你好", "english": "hello"},
                {"simplified": "很好", "english": "very good"}
            ],
            "我": [
                {"simplified": "我是", "english": "I am"},
                {"simplified": "我们", "english": "we"}
            ],
            "是": [
                {"simplified": "我是", "english": "I am"},
                {"simplified": "是的", "english": "yes"}
            ],
            "的": [
                {"simplified": "我的", "english": "my/mine"},
                {"simplified": "是的", "english": "yes"}
            ],
            "有": [
                {"simplified": "有人", "english": "someone"},
                {"simplified": "没有", "english": "don't have"}
            ],
            "人": [
                {"simplified": "有人", "english": "someone"},
                {"simplified": "中国人", "english": "Chinese person"}
            ],
            "中": [
                {"simplified": "中国", "english": "China"},
                {"simplified": "中国人", "english": "Chinese person"}
            ],
            "国": [
                {"simplified": "中国", "english": "China"},
                {"simplified": "美国", "english": "America"}
            ],
            "很": [
                {"simplified": "很好", "english": "very good"},
                {"simplified": "很多", "english": "very many"}
            ],
            "来": [
                {"simplified": "来了", "english": "came/coming"},
                {"simplified": "过来", "english": "come over"}
            ],
            "去": [
                {"simplified": "去了", "english": "went/going"},
                {"simplified": "回去", "english": "go back"}
            ],
            "在": [
                {"simplified": "在家", "english": "at home"},
                {"simplified": "现在", "english": "now"}
            ],
            "了": [
                {"simplified": "好了", "english": "finished/done"},
                {"simplified": "来了", "english": "came/coming"}
            ],
            "不": [
                {"simplified": "不好", "english": "not good"},
                {"simplified": "不是", "english": "is not"}
            ]
        };
        console.log('Using built-in demo data');
    }

    async processCharacters() {
        // Initialize OpenCC converter (if available)
        let opencc = null;
        try {
            if (typeof OpenCC !== 'undefined') {
                opencc = OpenCC.Converter({ from: 'cn', to: 'tw' });
            }
        } catch (error) {
            console.log('OpenCC not available, using fallback traditional characters');
        }

        for (const [char, data] of Object.entries(this.charactersData)) {
            try {
                // Convert to traditional using OpenCC or fallback
                if (opencc) {
                    data.traditional = await opencc(char);
                } else {
                    // Fallback traditional characters mapping
                    const traditionalMap = {
                        '你': '你', '好': '好', '我': '我', '是': '是',
                        '的': '的', '有': '有', '人': '人', '中': '中',
                        '国': '國', '很': '很'
                    };
                    data.traditional = traditionalMap[char] || char;
                }

                var { pinyin } = pinyinPro;

                // Convert to pinyin using PinyinPro or fallback
                if (typeof pinyinPro !== 'undefined') {
                    data.pinyin = pinyin(char, { toneType: 'symbol', type: 'array' })[0];
                } else {
                    // Fallback pinyin for demo
                    const pinyinMap = {
                        '你': 'nǐ', '好': 'hǎo', '我': 'wǒ', '是': 'shì',
                        '的': 'de', '有': 'yǒu', '人': 'rén', '中': 'zhōng',
                        '国': 'guó', '很': 'hěn', '来': 'lái', '去': 'qù',
                        '在': 'zài', '了': 'le', '不': 'bù'
                    };
                    data.pinyin = pinyinMap[char] || 'unknown';
                }

                // Process phrases
                for (const phrase of data) {
                    if (opencc) {
                        phrase.traditional = await opencc(phrase.simplified);
                    } else {
                        // Fallback for demo phrases
                        const phraseTradMap = {
                            '你好': '你好', '你们': '你們', '很好': '很好',
                            '我是': '我是', '我们': '我們', '是的': '是的',
                            '我的': '我的', '有人': '有人', '没有': '沒有',
                            '中国人': '中國人', '中国': '中國', '美国': '美國',
                            '很多': '很多', '来了': '來了', '过来': '過來',
                            '去了': '去了', '回去': '回去', '在家': '在家',
                            '现在': '現在', '好了': '好了', '不好': '不好',
                            '不是': '不是'
                        };
                        phrase.traditional = phraseTradMap[phrase.simplified] || phrase.simplified;
                    }

                    if (typeof pinyinPro !== 'undefined') {
                        phrase.pinyin = pinyin(phrase.simplified, { toneType: 'symbol' });
                    } else {
                        // Fallback for demo
                        const phrasePinyinMap = {
                            '你好': 'nǐ hǎo', '你们': 'nǐ men', '很好': 'hěn hǎo',
                            '我是': 'wǒ shì', '我们': 'wǒ men', '是的': 'shì de',
                            '我的': 'wǒ de', '有人': 'yǒu rén', '没有': 'méi yǒu',
                            '中国人': 'zhōng guó rén', '中国': 'zhōng guó',
                            '美国': 'měi guó', '很多': 'hěn duō', '来了': 'lái le',
                            '过来': 'guò lái', '去了': 'qù le', '回去': 'huí qù',
                            '在家': 'zài jiā', '现在': 'xiàn zài', '好了': 'hǎo le',
                            '不好': 'bù hǎo', '不是': 'bú shì'
                        };
                        phrase.pinyin = phrasePinyinMap[phrase.simplified] || 'unknown';
                    }
                }

                this.allPinyinOptions.push(data.pinyin);
            } catch (error) {
                console.error(`Error processing character ${char}:`, error);
            }
        }
    }

    start() {
        this.roundCount = 1;
        this.correctCount = 0;
        this.incorrectCount = 0;
        this.currentPool = [];
        document.querySelector('#correctCount').textContent = this.correctCount;
        document.querySelector('#incorrectCount').textContent = this.incorrectCount;
        this.updatePoolSize();
        this.startNewRound();
    }

    updatePoolSize() {
        const currentDate = new Date();
        const daysDiff = Math.floor((currentDate - new Date(document.querySelector('#startDate').value)) / (1000 * 60 * 60 * 24));
        const poolSize = Math.min(5 + (daysDiff * 2), Object.keys(this.charactersData).length);

        this.pool = Object.keys(this.charactersData).slice(0, poolSize);

        document.getElementById('currentDay').textContent = daysDiff + 1;
        document.getElementById('poolSize').textContent = poolSize;

        const select = document.querySelector('#charactersInPool');
        this.pool.forEach(character => {
            const option = document.createElement('option');
            option.textContent = character;
            option.disabled = true;
            select.appendChild(option);
        });
    }

    setupEventListeners() {
        this.speechSynthesis.addEventListener("voiceschanged", () => { console.log('TODO: voiceschanged') });

        const startDate = document.querySelector('#startDate');
        startDate.addEventListener('change', () => this.start())

        const audio = document.querySelector('#audioEnabled');
        audio.addEventListener('click', () => {
            if (audio.checked) {
                this.startAudioLoop();
            } else {
                this.stopSpeech();
            }
        });

        const options = document.querySelectorAll('.option-button');
        options.forEach((option, index) => {
            option.addEventListener('click', () => this.handleOptionClick(index));
        });

        document.getElementById('phrasesSection').addEventListener('click', () => {
            if (this.isShowingPhrases) {
                this.startNewRound();
            }
        });
    }

    startNewRound() {
        this.isShowingPhrases = false;
        this.currentRoundCounted = false;
        this.stopSpeech();
        this.clearHanziWriters();

        // Hide phrases section and show options
        document.getElementById('phrasesSection').classList.add('hidden');
        document.getElementById('optionsSection').classList.remove('hidden');

        document.querySelector('#totalCount').textContent = this.roundCount;

        if (this.currentPool.length == 0) {
            this.currentPool = [...this.pool];
        }
        document.querySelector('#characterCount').textContent = this.pool.length - this.currentPool.length + 1;

        // Select random character from current pool
        const randomIndex = Math.floor(Math.random() * this.currentPool.length);
        this.currentCharacter = this.currentPool[randomIndex];
        const charData = this.charactersData[this.currentCharacter];
        this.currentPool.splice(randomIndex, 1);

        this.correctPinyin = charData.pinyin;

        // Display characters in 2x2 grid
        this.displayStaticCharacter(this.currentCharacter, 'simplifiedStatic');
        this.displayStaticCharacter(charData.traditional, 'traditionalStatic');
        this.displayCharacterWithStrokes(this.currentCharacter, 'simplifiedStrokes');
        this.displayCharacterWithStrokes(charData.traditional, 'traditionalStrokes');

        // Generate pinyin options
        this.generatePinyinOptions();

        // Reset option buttons
        const options = document.querySelectorAll('.option-button');
        options.forEach(option => {
            option.classList.remove('correct', 'incorrect');
            option.disabled = false;
        });

        this.roundCount++;
    }

    displayStaticCharacter(char, containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = `<div style="font-size: 48px; color: #333; font-weight: 500;">${char}</div>`;
    }

    displayCharacterWithStrokes(char, containerId) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        try {
            const writer = HanziWriter.create(container, char, {
                width: 70,
                height: 70,
                padding: 5,
                strokeAnimationSpeed: 2,
                delayBetweenStrokes: 100,
                showCharacter: false
            });

            this.hanziWriters.push(writer);

            // Animate stroke order on repeat
            const animateRepeat = () => {
                writer.animateCharacter({
                    onComplete: () => {
                        setTimeout(animateRepeat, 2000);
                    }
                });
            };

            animateRepeat();
        } catch (error) {
            // Fallback if HanziWriter fails
            container.innerHTML = `<div style="font-size: 48px; color: #333;">${char}</div>`;
        }
    }

    clearHanziWriters() {
        this.hanziWriters.forEach(writer => {
            try {
                if (writer && writer.cancelAnimation) {
                    writer.cancelAnimation();
                }
            } catch (error) {
                console.error('Error clearing hanzi writer:', error);
            }
        });
        this.hanziWriters = [];
    }

    generatePinyinOptions() {
        const options = [this.correctPinyin];
        const availablePinyin = this.allPinyinOptions.filter(p => p !== this.correctPinyin);

        // Add 3 random incorrect options
        while (options.length < 5 && availablePinyin.length > 0) {
            const randomIndex = Math.floor(Math.random() * availablePinyin.length);
            const selectedPinyin = availablePinyin[randomIndex];
            if (!options.includes(selectedPinyin)) {
                options.push(selectedPinyin);
            }
            availablePinyin.splice(randomIndex, 1);
        }

        // Shuffle options
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }

        // Display options
        options.forEach((option, index) => {
            document.getElementById(`option${index + 1}`).textContent = option;
        });
    }

    handleOptionClick(optionIndex) {
        const selectedOption = document.getElementById(`option${optionIndex + 1}`);
        const selectedPinyin = selectedOption.textContent;

        if (selectedPinyin === this.correctPinyin) {
            this.handleCorrectAnswer(selectedOption);
        } else {
            this.handleIncorrectAnswer(selectedOption);
        }
    }

    handleCorrectAnswer(button) {
        if (!this.currentRoundCounted) {
            this.currentRoundCounted = true;
            this.correctCount++;
            document.querySelector('#correctCount').textContent = this.correctCount;
        }

        button.classList.add('correct');

        // Disable all buttons
        const options = document.querySelectorAll('.option-button');
        options.forEach(option => option.disabled = true);

        this.showPhrases();

        // Start audio pronunciation
        this.startAudioLoop();
    }

    handleIncorrectAnswer(button) {
        if (!this.currentRoundCounted) {
            this.currentRoundCounted = true;
            this.incorrectCount++;
            document.querySelector('#incorrectCount').textContent = this.incorrectCount;
        }

        button.classList.add('incorrect');
        button.disabled = true;
    }

    showPhrases() {
        this.isShowingPhrases = true;
        const charData = this.charactersData[this.currentCharacter];
        const phrasesList = document.getElementById('phrasesList');

        phrasesList.innerHTML = '';

        charData.forEach(phrase => {
            const phraseDiv = document.createElement('div');
            phraseDiv.className = 'phrase-item';
            phraseDiv.innerHTML = `
                <div><strong>${phrase.simplified}</strong> | <strong>${phrase.traditional}</strong></div>  <div>
                ${phrase.pinyin} </div> <div> ${phrase.english} </div>
            `;
            phrasesList.appendChild(phraseDiv);
        });

        //document.getElementById('optionsSection').classList.add('hidden');
        document.getElementById('phrasesSection').classList.remove('hidden');

        phrasesList.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    setupSpeechOptions() {
        const voiceSelector = document.querySelector('#voiceSelector');
        voiceSelector.replaceChildren();
        const rotateOption = document.createElement('option');
        rotateOption.textContent = 'Rotate';
        rotateOption.value = 'rotate';  // Not currently used.
        voiceSelector.appendChild(rotateOption);
        voiceSelector.value = rotateOption.textContent;

        if (this.speechSynthesis) {
            const voices = this.speechSynthesis.getVoices();
            // Use zh for taiwanese as well. zh-CN is only China.
            //this.voices = voices.filter(voice => v.lang.startsWith("zh") || v.name.toLowerCase().includes("chinese"));
            this.voices = voices.filter(voice => voice.lang.startsWith('zh-CN'));
            this.voices.forEach(voice => {
                const option = document.createElement('option');
                option.textContent = voice.name;
                //option.textContent = voice.name + '(' + voice.lang + ')';
                // if (voice.default) {
                //     option.textContent += " — DEFAULT";
                // }

                voiceSelector.appendChild(option);
                // Tingting is the best one that I've heard so far, and it's on both Chrome on MacOS and Safari on iOS.
                // Yu-Shu is on Chrome and that is better than the Tingting actually. Note, this doesn't work correctly
                // because we can't break out of a forEach loop. It works only because Y comes after T so that will be
                // set last.
                if (voice.name.includes('Yu-shu')) {
                    voiceSelector.value = option.textContent;
                }
                if (voice.name.includes('Tingting')) {
                    voiceSelector.value = option.textContent;
                }

            });
        } else {
            // Add "No speech synthesis" option, disabled.
        }
    }

    startAudioLoop() {
        if (this.audioButton.checked) {
            this.stopSpeech();
            this.audioIteration = 0;

            let speak = () => {
                if ('speechSynthesis' in window) {
                    window.speechSynthesis.cancel();

                    const charData = this.charactersData[this.currentCharacter];
                    const phrase = charData[this.audioIteration % charData.length].simplified;

                    const selectedVoice = document.querySelector('#voiceSelector').value;
                    let voice = this.voices[this.audioIteration%this.voices.length]
                    if (selectedVoice != 'Rotate') {
                        // TODO: use the onchange event of the select to only loop through voices when changed.
                        for (let v of this.voices) {
                            if (selectedVoice == v.name) {
                                voice = v;
                                break;
                            }
                        }
                    }

                    let utterance;
                    if (this.phrasesButton.checked) {
                        const phrasesList = document.getElementById('phrasesList').querySelectorAll('div.phrase-item');
                        phrasesList.forEach(e => e.classList.remove('current-audio'));
                        phrasesList[this.audioIteration%phrasesList.length].classList.add('current-audio');

                        utterance = new SpeechSynthesisUtterance(phrase);
                    } else {
                        utterance = new SpeechSynthesisUtterance(this.currentCharacter);
                    }

                    utterance.voice = voice;
                    utterance.lang = 'zh-CN';
                    utterance.rate = 0.5;
                    this.speechSynthesis.speak(utterance);
                    this.currentSpeechTimeout = setTimeout(speak, 2000);
                    this.audioIteration++;
                }
            };

            speak();
        }
    }

    stopSpeech() {
        if (this.currentSpeechTimeout) {
            clearTimeout(this.currentSpeechTimeout);
            this.currentSpeechTimeout = null;
        }

        if (this.speechSynthesis) {
            this.speechSynthesis.cancel();
        }
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
    }

    showError() {
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('error').classList.remove('hidden');
    }
}

// Initialize the app when the page loads
window.addEventListener('load', () => {
    new ChineseFlashcardApp();
});
