/**
 * Stack & Crack - Основная игровая логика
 * Хакерская головоломка
 */

// Уровни сложности

const DIFFICULTY = {
    easy: {
        name: 'Easy',
        nameRu: 'Лёгкий',
        minWall: 5,
        maxWall: 10,
        dropSpeed: 500,
        overheatTime: 4000,
        description: 'Для новичков'
    },
    normal: {
        name: 'Normal',
        nameRu: 'Нормальный',
        minWall: 5,
        maxWall: 15,
        dropSpeed: 400,
        overheatTime: 3000,
        description: 'Стандартный режим'
    },
    hard: {
        name: 'Hard',
        nameRu: 'Сложный',
        minWall: 10,
        maxWall: 20,
        dropSpeed: 300,
        overheatTime: 2500,
        description: 'Для профи'
    },
    endless: {
        name: 'Endless',
        nameRu: 'Бесконечный',
        minWall: 5,
        maxWall: 10,
        dropSpeed: 450,
        overheatTime: 3500,
        description: 'Сложность растёт',
        progressive: true
    }
};

// Режимы игры

const GAME_MODES = {
    classic: {
        name: 'Classic',
        nameRu: 'Классика',
        icon: '🎮',
        description: 'Стандартный режим',
        hasOverheat: true,
        hasTimer: false
    },
    timeAttack: {
        name: 'Time Attack',
        nameRu: 'На время',
        icon: '⏱️',
        description: '60 секунд на максимум очков',
        hasOverheat: true,
        hasTimer: true,
        timeLimit: 60000 // 60 секунд
    },
    zen: {
        name: 'Zen Mode',
        nameRu: 'Дзен',
        icon: '🧘',
        description: 'Без перегрева, расслабься',
        hasOverheat: false,
        hasTimer: false
    },
    challenge: {
        name: 'Challenge',
        nameRu: 'Испытание',
        icon: '🎯',
        description: 'Ежедневный вызов',
        hasOverheat: true,
        hasTimer: false,
        daily: true
    },
    versus: {
        name: 'Versus AI',
        nameRu: 'Против ИИ',
        icon: '🤖',
        description: 'Победи бота!',
        hasOverheat: true,
        hasTimer: false,
        hasAI: true
    }
};

// Система уровней

const LEVEL_SYSTEM = {
    // Требования взломов для каждого уровня
    levels: [
        { level: 1, cracksRequired: 0 },
        { level: 2, cracksRequired: 10 },
        { level: 3, cracksRequired: 25 },
        { level: 4, cracksRequired: 50 },
        { level: 5, cracksRequired: 100 },
        { level: 6, cracksRequired: 200 },
        { level: 7, cracksRequired: 350 },
        { level: 8, cracksRequired: 500 },
        { level: 9, cracksRequired: 750 },
        { level: 10, cracksRequired: 1000 },
        { level: 11, cracksRequired: 1500 },
        { level: 12, cracksRequired: 2000 },
        { level: 13, cracksRequired: 3000 },
        { level: 14, cracksRequired: 4000 },
        { level: 15, cracksRequired: 5000 }
    ],
    
    getLevel(totalCracks) {
        for (let i = this.levels.length - 1; i >= 0; i--) {
            if (totalCracks >= this.levels[i].cracksRequired) {
                return this.levels[i].level;
            }
        }
        return 1;
    },
    
    getProgress(totalCracks) {
        const currentLevel = this.getLevel(totalCracks);
        const currentLevelData = this.levels.find(l => l.level === currentLevel);
        const nextLevelData = this.levels.find(l => l.level === currentLevel + 1);
        
        if (!nextLevelData) return 100; // Максимальный уровень
        
        const currentReq = currentLevelData.cracksRequired;
        const nextReq = nextLevelData.cracksRequired;
        const progress = ((totalCracks - currentReq) / (nextReq - currentReq)) * 100;
        
        return Math.min(100, Math.max(0, progress));
    },
    
    getCracksForNextLevel(totalCracks) {
        const currentLevel = this.getLevel(totalCracks);
        const nextLevelData = this.levels.find(l => l.level === currentLevel + 1);
        return nextLevelData ? nextLevelData.cracksRequired - totalCracks : 0;
    }
};

// Достижения

const ACHIEVEMENTS = {
    first_hack: {
        id: 'first_hack',
        name: 'Первый взлом',
        icon: '🔓',
        description: 'Взломай свою первую стену',
        condition: (stats) => stats.totalCracks >= 1
    },
    hacker_100: {
        id: 'hacker_100',
        name: 'Хакер',
        icon: '💻',
        description: '100 взломов всего',
        condition: (stats) => stats.totalCracks >= 100,
        unlocks: 'matrix' // Разблокирует тему Matrix
    },
    hacker_500: {
        id: 'hacker_500',
        name: 'Мастер взлома',
        icon: '🔥',
        description: '500 взломов всего',
        condition: (stats) => stats.totalCracks >= 500
    },
    dual_master: {
        id: 'dual_master',
        name: 'Dual Master',
        icon: '⚡',
        description: '10 DUAL HACK всего',
        condition: (stats) => stats.totalDualHacks >= 10,
        unlocks: 'minimal' // Разблокирует тему Minimal
    },
    combo_king: {
        id: 'combo_king',
        name: 'Комбо Король',
        icon: '👑',
        description: 'Комбо 5+',
        condition: (stats) => stats.maxCombo >= 5
    },
    speed_demon: {
        id: 'speed_demon',
        name: 'Скорострел',
        icon: '🏎️',
        description: '10 взломов за 30 секунд',
        condition: (stats) => stats.cracksIn30Sec >= 10
    },
    survivor: {
        id: 'survivor',
        name: 'Выживший',
        icon: '🛡️',
        description: 'Пережить 5 перегревов за игру',
        condition: (stats) => stats.overheatsPerGame >= 5
    },
    score_hunter: {
        id: 'score_hunter',
        name: 'Охотник за очками',
        icon: '🎯',
        description: 'Набери 5000 очков',
        condition: (stats) => stats.highScore >= 5000
    },
    zen_master: {
        id: 'zen_master',
        name: 'Мастер Дзен',
        icon: '🧘',
        description: '50 взломов в Zen режиме',
        condition: (stats) => stats.zenCracks >= 50
    },
    ai_slayer: {
        id: 'ai_slayer',
        name: 'AI Слейер',
        icon: '🤖',
        description: 'Победи AI 5 раз',
        condition: (stats) => stats.aiWins >= 5
    }
};

// Темы оформления

const THEMES = {
    'neon-city': {
        id: 'neon-city',
        name: 'Neon City',
        description: 'Текущая тема',
        unlocked: true, // Всегда доступна
        requirement: null
    },
    'matrix': {
        id: 'matrix',
        name: 'Matrix',
        description: 'Зелёный код',
        unlocked: false,
        requirement: { type: 'achievement', id: 'hacker_100', label: '100 взломов' }
    },
    'synthwave': {
        id: 'synthwave',
        name: 'Synthwave',
        description: 'Розово-фиолетовый ретро',
        unlocked: false,
        requirement: { type: 'level', level: 5, label: 'Уровень 5' }
    },
    'minimal': {
        id: 'minimal',
        name: 'Minimal',
        description: 'Чёрно-белый минимализм',
        unlocked: false,
        requirement: { type: 'achievement', id: 'dual_master', label: '10 DUAL HACK' }
    },
    'terminal': {
        id: 'terminal',
        name: 'Terminal',
        description: 'Зелёный текст на чёрном',
        unlocked: false,
        requirement: { type: 'level', level: 10, label: 'Уровень 10' }
    }
};

// Статистика игрока

let playerStats = {
    totalCracks: 0,
    totalDualHacks: 0,
    highScore: 0,
    maxCombo: 0,
    gamesPlayed: 0,
    zenCracks: 0,
    aiWins: 0,
    unlockedAchievements: [],
    unlockedThemes: ['neon-city'],
    activeTheme: 'neon-city',
    
    // Временные для текущей игры
    cracksThisGame: 0,
    overheatsThisGame: 0,
    gameStartTime: 0
};

// Игровые константы

const CONFIG = {
    // Игровые параметры
    MIN_WALL_VALUE: 5,
    MAX_WALL_VALUE: 15,
    MIN_BLOCK_VALUE: 1,
    MAX_BLOCK_VALUE: 9,
    
    // Спецблоки (шансы)
    WILD_CHANCE: 0.05,      // 5% шанс дикого блока
    BOMB_CHANCE: 0.03,      // 3% шанс бомбы
    LIGHTNING_CHANCE: 0.02, // 2% шанс молнии
    DIVIDER_CHANCE: 0.03,   // 3% шанс делителя
    SWAP_CHANCE: 0.02,      // 2% шанс свапа
    FREEZE_CHANCE: 0.02,    // 2% шанс заморозки
    DOUBLE_CHANCE: 0.02,    // 2% шанс удвоения очков
    RANDOM_CHANCE: 0.01,    // 1% шанс случайного эффекта
    
    // Таймеры
    OVERHEAT_TIME: 3000,    // 3 секунды на исправление
    DROP_SPEED: 400,        // Скорость падения блока (ms)
    SPAWN_DELAY: 500,       // Задержка перед новым блоком
    FREEZE_DURATION: 5000,  // Длительность заморозки
    
    // Очки
    BASE_SCORE: 100,
    DUAL_HACK_BONUS: 2,     // Множитель за двойной взлом
    
    // Вибрация (ms)
    VIBRATE_CRACK: 100,
    VIBRATE_DUAL: [100, 50, 100],
    VIBRATE_OVERHEAT: [50, 50, 50, 50, 50],
    VIBRATE_GAME_OVER: 500,
    VIBRATE_DROP: 30,
    VIBRATE_BUTTON: 15,
    
    // Свайпы
    SWIPE_THRESHOLD: 50,    // Минимальное расстояние для свайпа (px)
    SWIPE_TIMEOUT: 300      // Максимальное время свайпа (ms)
};

// Типы блоков
const BLOCK_TYPES = {
    NORMAL: 'normal',
    WILD: 'wild',           // ? - любое значение 1-9
    BOMB: 'bomb',           // X - удаляет верхние блоки
    LIGHTNING: 'lightning', // Z - обнуляет сумму
    DIVIDER: 'divider',     // ÷ - делит сумму пополам
    SWAP: 'swap',           // ↔ - меняет блоки между колонками
    FREEZE: 'freeze',       // ❄ - замораживает перегрев
    DOUBLE: 'double',       // ×2 - удваивает очки за следующий взлом
    RANDOM: 'random'        // 🎲 - случайный эффект
};

// Игровое состояние

let gameState = {
    score: 0,
    highScore: 0,
    multiplier: 1,
    isPlaying: false,
    isPaused: false,
    
    // Режим и сложность
    gameMode: 'classic',
    difficulty: 'normal',
    level: 1,
    cracksCount: 0,
    
    // Таймер для Time Attack
    timeRemaining: 0,
    gameTimer: null,
    
    // Challenge Mode
    dailySeed: null,
    dailyTarget: 0,
    
    // Versus AI Mode
    ai: {
        score: 0,
        isActive: false,
        timer: null,
        difficulty: 'normal', // easy, normal, hard
        thinkTime: { min: 800, max: 2000 }, // Время "раздумий" в мс
        mistakeChance: 0.15 // Шанс ошибки
    },
    
    // Бонусы от спецблоков
    doublePointsActive: false,  // ×2 активен
    frozenColumns: {            // Заморозка колонок
        left: false,
        right: false
    },
    
    // Колонки
    columns: {
        left: {
            blocks: [],
            sum: 0,
            wallValue: 7,
            isOverheating: false,
            overheatTimer: null,
            freezeTimer: null
        },
        right: {
            blocks: [],
            sum: 0,
            wallValue: 5,
            isOverheating: false,
            overheatTimer: null,
            freezeTimer: null
        }
    },
    
    // Текущий и следующий блоки
    currentBlock: null,
    nextBlock: null,
    blockQueue: [], // Очередь из 3 блоков для превью
    
    // Комбо система
    combo: 0,
    maxCombo: 0,
    lastCrackTime: 0,
    
    // Флаги анимации
    isAnimating: false,
    
    // Настройки
    settings: {
        swipeEnabled: true,
        hapticEnabled: true,
        soundEnabled: true,
        musicEnabled: false,
        notificationsEnabled: false,
        // Доступность
        colorblindMode: false,
        largeControls: false,
        reducedMotion: false
    }
};

// DOM элементы

const DOM = {};

function cacheDOMElements() {
    // Контейнеры
    DOM.gameContainer = document.getElementById('game-container');
    DOM.gameField = document.getElementById('game-field');
    
    // Верхняя панель
    DOM.score = document.getElementById('score');
    DOM.multiplier = document.getElementById('multiplier');
    DOM.multiplierContainer = document.getElementById('multiplier-container');
    DOM.pauseBtn = document.getElementById('pause-btn');
    
    // Колонки
    DOM.columnLeft = document.getElementById('column-left');
    DOM.columnRight = document.getElementById('column-right');
    DOM.blocksLeft = document.getElementById('blocks-left');
    DOM.blocksRight = document.getElementById('blocks-right');
    DOM.sumLeft = document.getElementById('sum-left');
    DOM.sumRight = document.getElementById('sum-right');
    DOM.wallLeft = document.getElementById('wall-left');
    DOM.wallRight = document.getElementById('wall-right');
    DOM.timerLeft = document.getElementById('timer-left');
    DOM.timerRight = document.getElementById('timer-right');
    
    // Падающий блок
    DOM.fallingBlock = document.getElementById('falling-block');
    
    // Управление
    DOM.btnLeft = document.getElementById('btn-left');
    DOM.btnRight = document.getElementById('btn-right');
    DOM.nextBlock = document.getElementById('next-block');
    
    // Эффекты
    DOM.screenFlash = document.getElementById('screen-flash');
    DOM.dualHackNotification = document.getElementById('dual-hack-notification');
    
    // Оверлеи
    DOM.startScreen = document.getElementById('start-screen');
    DOM.pauseScreen = document.getElementById('pause-screen');
    DOM.gameOverScreen = document.getElementById('game-over-screen');
    DOM.modeScreen = document.getElementById('mode-screen');
    DOM.difficultyScreen = document.getElementById('difficulty-screen');
    
    // Кнопки меню
    DOM.startBtn = document.getElementById('start-btn');
    DOM.resumeBtn = document.getElementById('resume-btn');
    DOM.restartBtn = document.getElementById('restart-btn');
    DOM.mainMenuBtn = document.getElementById('main-menu-btn');
    DOM.playAgainBtn = document.getElementById('play-again-btn');
    DOM.modeBackBtn = document.getElementById('mode-back-btn');
    DOM.difficultyBackBtn = document.getElementById('difficulty-back-btn');
    
    // Уровень и таймер
    DOM.levelDisplay = document.getElementById('level-display');
    DOM.timerContainer = document.getElementById('timer-container');
    DOM.gameTimer = document.getElementById('game-timer');
    DOM.targetContainer = document.getElementById('target-container');
    DOM.targetScore = document.getElementById('target-score');
    DOM.challengeDesc = document.getElementById('challenge-desc');
    
    // AI панель
    DOM.aiPanel = document.getElementById('ai-panel');
    DOM.aiScore = document.getElementById('ai-score');
    DOM.aiStatus = document.getElementById('ai-status');
    DOM.aiAvatar = document.getElementById('ai-avatar');
    
    // Versus результат
    DOM.versusResult = document.getElementById('versus-result');
    DOM.versusScoreContainer = document.getElementById('versus-score-container');
    DOM.versusAiScore = document.getElementById('versus-ai-score');
    
    // Превью блоков
    DOM.previewBlock1 = document.getElementById('preview-block-1');
    DOM.previewBlock2 = document.getElementById('preview-block-2');
    
    // Комбо индикатор
    DOM.comboIndicator = document.getElementById('combo-indicator');
    DOM.comboCount = DOM.comboIndicator?.querySelector('.combo-count');
    
    // Floating text контейнер
    DOM.floatingTextContainer = document.getElementById('floating-text-container');
    
    // Progress bar
    DOM.levelProgressBar = document.getElementById('level-progress-bar');
    
    // Очки в меню
    DOM.startHighScore = document.getElementById('start-high-score');
    DOM.highScore = document.getElementById('high-score');
    DOM.finalScore = document.getElementById('final-score');
    DOM.finalHighScore = document.getElementById('final-high-score');
    DOM.newRecord = document.getElementById('new-record');
    
    // Кнопки
    DOM.shareBtn = document.getElementById('share-btn');
    DOM.startSettingsBtn = document.getElementById('start-settings-btn');
    DOM.pauseSettingsBtn = document.getElementById('pause-settings-btn');
    DOM.settingsCloseBtn = document.getElementById('settings-close-btn');
    DOM.settingsSaveBtn = document.getElementById('settings-save-btn');
    
    // Модальное окно настроек
    DOM.settingsModal = document.getElementById('settings-modal');
    
    // Настройки toggles
    DOM.swipeToggle = document.getElementById('swipe-toggle');
    DOM.hapticToggle = document.getElementById('haptic-toggle');
    DOM.soundToggle = document.getElementById('sound-toggle');
    DOM.musicToggle = document.getElementById('music-toggle');
    DOM.notificationsToggle = document.getElementById('notifications-toggle');
    DOM.colorblindToggle = document.getElementById('colorblind-toggle');
    DOM.largeControlsToggle = document.getElementById('large-controls-toggle');
    DOM.reducedMotionToggle = document.getElementById('reduced-motion-toggle');
    
    // Магазин
    DOM.shopModal = document.getElementById('shop-modal');
    DOM.startShopBtn = document.getElementById('start-shop-btn');
    DOM.shopCloseBtn = document.getElementById('shop-close-btn');
    DOM.shopCloseFooterBtn = document.getElementById('shop-close-footer-btn');
    DOM.themeCards = document.querySelectorAll('.theme-card');
    
    // Профиль в магазине
    DOM.shopLevel = document.getElementById('shop-level');
    DOM.shopTotalCracks = document.getElementById('shop-total-cracks');
    
    // Достижения
    DOM.achievementsModal = document.getElementById('achievements-modal');
    DOM.startAchievementsBtn = document.getElementById('start-achievements-btn');
    DOM.achievementsCloseBtn = document.getElementById('achievements-close-btn');
    DOM.achievementsCloseFooterBtn = document.getElementById('achievements-close-footer-btn');
    DOM.achievementsGrid = document.getElementById('achievements-grid');
    DOM.achievementsUnlocked = document.getElementById('achievements-unlocked');
    DOM.achievementsTotal = document.getElementById('achievements-total');
    DOM.playerLevelDisplay = document.getElementById('player-level-display');
    DOM.nextLevel = document.getElementById('next-level');
    DOM.cracksToNext = document.getElementById('cracks-to-next');
    DOM.levelProgressFill = document.getElementById('level-progress-fill');
}

// Звуковые эффекты

const SoundManager = {
    context: null,
    musicGain: null,
    musicOscillators: [],
    isMusicPlaying: false,
    tickInterval: null,
    
    init() {
        // Создаём аудио контекст при первом взаимодействии
        if (!this.context) {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            this.musicGain = this.context.createGain();
            this.musicGain.connect(this.context.destination);
            this.musicGain.gain.value = 0.15;
        }
    },
    
    // Уникальные звуки для каждой цифры (1-9)
    playDigit(digit) {
        if (!gameState.settings.soundEnabled) return;
        this.init();
        
        // Базовая частота увеличивается с цифрой
        const baseFreq = 200 + (digit * 50);
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.frequency.setValueAtTime(baseFreq, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.2, this.context.currentTime + 0.05);
        osc.frequency.exponentialRampToValueAtTime(baseFreq, this.context.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.15, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.15);
        
        osc.start();
        osc.stop(this.context.currentTime + 0.15);
    },
    
    // Нарастающий звук при приближении к цели
    playApproaching(progress) {
        if (!gameState.settings.soundEnabled) return;
        this.init();
        
        // progress от 0 до 1 (насколько близко к взлому)
        if (progress < 0.5) return; // Начинаем только с 50%
        
        const freq = 300 + (progress * 400);
        const volume = 0.05 + (progress * 0.1);
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'triangle';
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.frequency.setValueAtTime(freq, this.context.currentTime);
        
        gain.gain.setValueAtTime(volume, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.08);
        
        osc.start();
        osc.stop(this.context.currentTime + 0.08);
    },
    
    // Звук тикания при перегреве
    startOverheatTick() {
        if (!gameState.settings.soundEnabled) return;
        this.init();
        
        // Останавливаем предыдущий, если был
        this.stopOverheatTick();
        
        console.log('🔊 Overheat tick started');
        
        let tickCount = 0;
        this.tickInterval = setInterval(() => {
            tickCount++;
            const freq = 600 + (tickCount * 50); // Частота растёт
            
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            
            osc.type = 'square';
            osc.connect(gain);
            gain.connect(this.context.destination);
            
            osc.frequency.setValueAtTime(freq, this.context.currentTime);
            
            gain.gain.setValueAtTime(0.15, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.05);
            
            osc.start();
            osc.stop(this.context.currentTime + 0.05);
        }, 300);
    },
    
    stopOverheatTick() {
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
            console.log('🔇 Overheat tick stopped');
        }
    },
    
    // Победная мелодия при DUAL HACK
    playDualHackMelody() {
        if (!gameState.settings.soundEnabled) return;
        this.init();
        
        // Мажорный аккорд с арпеджио
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        const duration = 0.12;
        
        notes.forEach((freq, i) => {
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            
            osc.type = 'sine';
            osc.connect(gain);
            gain.connect(this.context.destination);
            
            const startTime = this.context.currentTime + (i * duration);
            
            osc.frequency.setValueAtTime(freq, startTime);
            
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration * 2);
            
            osc.start(startTime);
            osc.stop(startTime + duration * 2);
        });
    },
    
    // Генерация звука взлома
    playCrack() {
        if (!gameState.settings.soundEnabled) return;
        this.init();
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.frequency.setValueAtTime(800, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, this.context.currentTime + 0.2);
        
        gain.gain.setValueAtTime(0.3, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.2);
        
        osc.start();
        osc.stop(this.context.currentTime + 0.2);
    },
    
    // Звук двойного взлома
    playDualHack() {
        if (!gameState.settings.soundEnabled) return;
        this.init();
        
        // Вызываем мелодию вместо простого звука
        this.playDualHackMelody();
    },
    
    // Звук размещения блока
    playPlace() {
        if (!gameState.settings.soundEnabled) return;
        this.init();
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.frequency.setValueAtTime(300, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, this.context.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.2, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);
        
        osc.start();
        osc.stop(this.context.currentTime + 0.1);
    },
    
    // Звук перегрева
    playOverheat() {
        if (!gameState.settings.soundEnabled) return;
        this.init();
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'square';
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.frequency.setValueAtTime(440, this.context.currentTime);
        
        gain.gain.setValueAtTime(0.2, this.context.currentTime);
        gain.gain.setValueAtTime(0, this.context.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, this.context.currentTime + 0.2);
        gain.gain.setValueAtTime(0, this.context.currentTime + 0.3);
        
        osc.start();
        osc.stop(this.context.currentTime + 0.3);
        
        // Запускаем тикание
        this.startOverheatTick();
    },
    
    // Звук конца игры
    playGameOver() {
        if (!gameState.settings.soundEnabled) return;
        this.init();
        this.stopOverheatTick();
        this.stopMusic();
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sawtooth';
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.frequency.setValueAtTime(400, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.context.currentTime + 0.5);
        
        gain.gain.setValueAtTime(0.3, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.5);
        
        osc.start();
        osc.stop(this.context.currentTime + 0.5);
    },
    
    // Звук спецблока
    playSpecial() {
        if (!gameState.settings.soundEnabled) return;
        this.init();
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sine';
        osc.connect(gain);
        gain.connect(this.context.destination);
        
        osc.frequency.setValueAtTime(523, this.context.currentTime);
        osc.frequency.setValueAtTime(659, this.context.currentTime + 0.1);
        osc.frequency.setValueAtTime(784, this.context.currentTime + 0.2);
        
        gain.gain.setValueAtTime(0.2, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);
        
        osc.start();
        osc.stop(this.context.currentTime + 0.3);
    },
    
    
    // Фоновая музыка (Synthwave ambient)
    
    startMusic() {
        if (!gameState.settings.musicEnabled || this.isMusicPlaying) return;
        this.init();
        
        this.isMusicPlaying = true;
        this.playMusicLoop();
    },
    
    playMusicLoop() {
        if (!this.isMusicPlaying) return;
        
        const now = this.context.currentTime;
        const barDuration = 2; // 2 секунды на такт
        
        // Бас (низкие ноты)
        const bassNotes = [65.41, 82.41, 73.42, 87.31]; // C2, E2, D2, F2
        bassNotes.forEach((freq, i) => {
            this.playMusicNote(freq, now + i * barDuration, barDuration * 0.9, 'sine', 0.12);
        });
        
        // Пад (аккорды)
        const padChords = [
            [130.81, 164.81, 196.00], // C3, E3, G3
            [164.81, 207.65, 246.94], // E3, G#3, B3
            [146.83, 185.00, 220.00], // D3, F#3, A3
            [174.61, 220.00, 261.63]  // F3, A3, C4
        ];
        
        padChords.forEach((chord, i) => {
            chord.forEach(freq => {
                this.playMusicNote(freq, now + i * barDuration, barDuration * 0.95, 'triangle', 0.04);
            });
        });
        
        // Арпеджио
        const arpNotes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63]; // C4, E4, G4, C5, G4, E4
        const arpDuration = barDuration / 3;
        
        for (let bar = 0; bar < 4; bar++) {
            arpNotes.forEach((freq, i) => {
                const noteTime = now + bar * barDuration + (i * arpDuration / 2);
                this.playMusicNote(freq, noteTime, arpDuration * 0.4, 'sine', 0.03);
            });
        }
        
        // Следующий цикл
        const loopDuration = barDuration * 4;
        setTimeout(() => {
            if (this.isMusicPlaying) {
                this.playMusicLoop();
            }
        }, loopDuration * 1000);
    },
    
    playMusicNote(freq, startTime, duration, type, volume) {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = type;
        osc.connect(gain);
        gain.connect(this.musicGain);
        
        osc.frequency.setValueAtTime(freq, startTime);
        
        // ADSR envelope
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(volume, startTime + 0.05);
        gain.gain.linearRampToValueAtTime(volume * 0.7, startTime + duration * 0.3);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);
        
        osc.start(startTime);
        osc.stop(startTime + duration + 0.1);
        
        this.musicOscillators.push(osc);
    },
    
    stopMusic() {
        this.isMusicPlaying = false;
        this.musicOscillators.forEach(osc => {
            try { osc.stop(); } catch(e) {}
        });
        this.musicOscillators = [];
    },
    
    // Ускорение музыки при высоком множителе
    setMusicSpeed(multiplier) {
        // Влияет на громкость и "интенсивность"
        if (this.musicGain) {
            const intensity = 0.15 + (multiplier - 1) * 0.05;
            this.musicGain.gain.setValueAtTime(Math.min(intensity, 0.35), this.context.currentTime);
        }
    }
};

// Вибрация (улучшенный Haptic Feedback)

const HapticManager = {
    isSupported: 'vibrate' in navigator,
    
    // Лёгкая вибрация (кнопки, UI)
    light() {
        if (this.isSupported && gameState.settings.hapticEnabled) {
            navigator.vibrate(CONFIG.VIBRATE_BUTTON);
        }
    },
    
    // Средняя вибрация (размещение блока)
    medium() {
        if (this.isSupported && gameState.settings.hapticEnabled) {
            navigator.vibrate(CONFIG.VIBRATE_DROP);
        }
    },
    
    // Сильная вибрация (взлом стены)
    strong() {
        if (this.isSupported && gameState.settings.hapticEnabled) {
            navigator.vibrate(CONFIG.VIBRATE_CRACK);
        }
    },
    
    // Паттерн (двойной взлом)
    pattern(pattern) {
        if (this.isSupported && gameState.settings.hapticEnabled) {
            navigator.vibrate(pattern);
        }
    },
    
    // Ошибка/опасность
    error() {
        if (this.isSupported && gameState.settings.hapticEnabled) {
            navigator.vibrate(CONFIG.VIBRATE_OVERHEAT);
        }
    },
    
    // Game Over
    gameOver() {
        if (this.isSupported && gameState.settings.hapticEnabled) {
            navigator.vibrate(CONFIG.VIBRATE_GAME_OVER);
        }
    }
};

function vibrate(pattern) {
    if ('vibrate' in navigator && gameState.settings.hapticEnabled) {
        navigator.vibrate(pattern);
    }
}

// Менеджер уведомлений

const NotificationManager = {
    isSupported: 'Notification' in window,
    reminderTimeout: null,
    
    async requestPermission() {
        if (!this.isSupported) return false;
        
        if (Notification.permission === 'granted') {
            return true;
        }
        
        if (Notification.permission === 'denied') {
            return false;
        }
        
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    },
    
    async show(title, options = {}) {
        if (!this.isSupported || !gameState.settings.notificationsEnabled) return;
        if (Notification.permission !== 'granted') return;
        
        const defaultOptions = {
            icon: './assets/icon-192.png',
            badge: './assets/icon-96.png',
            vibrate: [200, 100, 200],
            tag: 'stack-crack',
            renotify: true
        };
        
        new Notification(title, { ...defaultOptions, ...options });
    },
    
    scheduleReminder() {
        if (!this.isSupported || !gameState.settings.notificationsEnabled) return;
        if (Notification.permission !== 'granted') return;
        
        // Отменяем предыдущий таймер
        this.cancelReminder();
        
        // Уведомление через 2 часа неактивности
        this.reminderTimeout = setTimeout(() => {
            this.show('Вернись побить рекорд! 🎮', {
                body: `Твой текущий рекорд: ${gameState.highScore} очков`,
                tag: 'stack-crack-reminder'
            });
        }, 2 * 60 * 60 * 1000); // 2 часа
    },
    
    cancelReminder() {
        if (this.reminderTimeout) {
            clearTimeout(this.reminderTimeout);
            this.reminderTimeout = null;
        }
    }
};

// Утилиты

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateBlockValue() {
    return randomInt(CONFIG.MIN_BLOCK_VALUE, CONFIG.MAX_BLOCK_VALUE);
}

function generateWallValue() {
    return randomInt(CONFIG.MIN_WALL_VALUE, CONFIG.MAX_WALL_VALUE);
}

function generateBlockType() {
    const rand = Math.random();
    let threshold = 0;
    
    threshold += CONFIG.WILD_CHANCE;
    if (rand < threshold) return BLOCK_TYPES.WILD;
    
    threshold += CONFIG.BOMB_CHANCE;
    if (rand < threshold) return BLOCK_TYPES.BOMB;
    
    threshold += CONFIG.LIGHTNING_CHANCE;
    if (rand < threshold) return BLOCK_TYPES.LIGHTNING;
    
    threshold += CONFIG.DIVIDER_CHANCE;
    if (rand < threshold) return BLOCK_TYPES.DIVIDER;
    
    threshold += CONFIG.SWAP_CHANCE;
    if (rand < threshold) return BLOCK_TYPES.SWAP;
    
    threshold += CONFIG.FREEZE_CHANCE;
    if (rand < threshold) return BLOCK_TYPES.FREEZE;
    
    threshold += CONFIG.DOUBLE_CHANCE;
    if (rand < threshold) return BLOCK_TYPES.DOUBLE;
    
    threshold += CONFIG.RANDOM_CHANCE;
    if (rand < threshold) return BLOCK_TYPES.RANDOM;
    
    return BLOCK_TYPES.NORMAL;
}

function createBlock() {
    const type = generateBlockType();
    let value = generateBlockValue();
    let displayValue = value.toString();
    
    switch (type) {
        case BLOCK_TYPES.WILD:
            displayValue = '?';
            value = 0;
            break;
        case BLOCK_TYPES.BOMB:
            displayValue = 'X';
            value = 0;
            break;
        case BLOCK_TYPES.LIGHTNING:
            displayValue = 'Z';
            value = 0;
            break;
        case BLOCK_TYPES.DIVIDER:
            displayValue = '÷';
            value = 0;
            break;
        case BLOCK_TYPES.SWAP:
            displayValue = '↔';
            value = 0;
            break;
        case BLOCK_TYPES.FREEZE:
            displayValue = '❄';
            value = 0;
            break;
        case BLOCK_TYPES.DOUBLE:
            displayValue = '×2';
            value = 0;
            break;
        case BLOCK_TYPES.RANDOM:
            displayValue = '🎲';
            value = 0;
            break;
    }
    
    return { type, value, displayValue };
}

// Отрисовка

function renderBlock(block, container, index = null) {
    const blockEl = document.createElement('div');
    blockEl.className = 'block';
    blockEl.dataset.value = block.value;
    
    if (block.type !== BLOCK_TYPES.NORMAL) {
        blockEl.classList.add(block.type);
    }
    
    const valueEl = document.createElement('span');
    valueEl.className = 'block-value';
    valueEl.textContent = block.displayValue;
    
    blockEl.appendChild(valueEl);
    
    if (container) {
        container.appendChild(blockEl);
    }
    
    return blockEl;
}

function updateBlockDisplay(block, element) {
    element.dataset.value = block.value;
    element.querySelector('.block-value').textContent = block.displayValue;
    
    // Удаляем старые классы типов
    element.classList.remove('wild', 'bomb', 'lightning', 'divider', 'swap', 'freeze', 'double', 'random');
    
    if (block.type !== BLOCK_TYPES.NORMAL) {
        element.classList.add(block.type);
    }
}

function renderNextBlock() {
    if (!gameState.nextBlock) return;
    
    DOM.nextBlock.dataset.value = gameState.nextBlock.value;
    DOM.nextBlock.className = 'next-block';
    
    if (gameState.nextBlock.type !== BLOCK_TYPES.NORMAL) {
        DOM.nextBlock.classList.add(gameState.nextBlock.type);
    }
    
    DOM.nextBlock.innerHTML = `<span class="block-value">${gameState.nextBlock.displayValue}</span>`;
}

function renderFallingBlock() {
    if (!gameState.currentBlock) {
        DOM.fallingBlock.classList.add('hidden');
        return;
    }
    
    DOM.fallingBlock.classList.remove('hidden');
    DOM.fallingBlock.dataset.value = gameState.currentBlock.value;
    DOM.fallingBlock.className = 'block';
    
    if (gameState.currentBlock.type !== BLOCK_TYPES.NORMAL) {
        DOM.fallingBlock.classList.add(gameState.currentBlock.type);
    }
    
    DOM.fallingBlock.querySelector('.block-value').textContent = gameState.currentBlock.displayValue;
    
    // Позиционируем блок по центру сверху
    const fieldRect = DOM.gameField.getBoundingClientRect();
    DOM.fallingBlock.style.left = `${fieldRect.left + fieldRect.width / 2 - 25}px`;
    DOM.fallingBlock.style.top = `${fieldRect.top}px`;
}

// Превью блоков (очередь)

function initBlockQueue() {
    gameState.blockQueue = [];
    for (let i = 0; i < 3; i++) {
        gameState.blockQueue.push(createBlock());
    }
    renderBlockQueue();
}

function getNextFromQueue() {
    const block = gameState.blockQueue.shift();
    gameState.blockQueue.push(createBlock());
    renderBlockQueue();
    return block;
}

function renderBlockQueue() {
    // Первый блок в очереди - nextBlock
    if (gameState.blockQueue[0]) {
        renderQueueBlock(gameState.blockQueue[0], DOM.nextBlock);
    }
    // Второй блок - preview 1
    if (gameState.blockQueue[1] && DOM.previewBlock1) {
        renderQueueBlock(gameState.blockQueue[1], DOM.previewBlock1);
    }
    // Третий блок - preview 2
    if (gameState.blockQueue[2] && DOM.previewBlock2) {
        renderQueueBlock(gameState.blockQueue[2], DOM.previewBlock2);
    }
}

function renderQueueBlock(block, element) {
    if (!element) return;
    
    element.dataset.value = block.value;
    element.className = element.id === 'next-block' ? 'next-block' : 'preview-block';
    
    if (block.type !== BLOCK_TYPES.NORMAL) {
        element.classList.add(block.type);
    }
    
    element.innerHTML = `<span class="block-value">${block.displayValue}</span>`;
}

// Комбо система

const COMBO_TIMEOUT = 3000; // 3 секунды на следующий взлом

function updateCombo() {
    const now = Date.now();
    
    if (now - gameState.lastCrackTime < COMBO_TIMEOUT) {
        gameState.combo++;
        if (gameState.combo > gameState.maxCombo) {
            gameState.maxCombo = gameState.combo;
        }
    } else {
        gameState.combo = 1;
    }
    
    gameState.lastCrackTime = now;
    renderCombo();
}

function resetCombo() {
    gameState.combo = 0;
    hideCombo();
}

function renderCombo() {
    if (!DOM.comboIndicator || !DOM.comboCount) return;
    
    if (gameState.combo >= 2) {
        DOM.comboCount.textContent = `x${gameState.combo}`;
        DOM.comboIndicator.classList.remove('hidden');
        DOM.comboIndicator.classList.add('combo-pulse');
        
        setTimeout(() => {
            DOM.comboIndicator.classList.remove('combo-pulse');
        }, 300);
    }
}

function hideCombo() {
    if (DOM.comboIndicator) {
        DOM.comboIndicator.classList.add('hidden');
    }
}

// Floating Text (очки)

function showFloatingText(text, x, y, color = '#00F3FF') {
    if (!DOM.floatingTextContainer) return;
    
    const floatEl = document.createElement('div');
    floatEl.className = 'floating-text';
    floatEl.textContent = text;
    floatEl.style.left = `${x}px`;
    floatEl.style.top = `${y}px`;
    floatEl.style.color = color;
    
    DOM.floatingTextContainer.appendChild(floatEl);
    
    // Удаляем после анимации
    setTimeout(() => {
        floatEl.remove();
    }, 1000);
}

function showScoreFloat(points, side) {
    const column = side === 'left' ? DOM.columnLeft : DOM.columnRight;
    if (!column) return;
    
    const rect = column.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    let color = '#00F3FF';
    if (points >= 200) color = '#FF00E6';
    if (points >= 400) color = '#FFD700';
    
    showFloatingText(`+${points}`, x, y, color);
}

// Progress Bar (уровень)

const CRACKS_PER_LEVEL = 5; // Взломов для следующего уровня

function updateLevelProgress() {
    if (!DOM.levelProgressBar) return;
    
    const cracksInLevel = gameState.cracksCount % CRACKS_PER_LEVEL;
    const progress = (cracksInLevel / CRACKS_PER_LEVEL) * 100;
    
    DOM.levelProgressBar.style.width = `${progress}%`;
}

// Анимация появления блока

function animateBlockDrop(side) {
    const blocksContainer = side === 'left' ? DOM.blocksLeft : DOM.blocksRight;
    const blocks = blocksContainer.querySelectorAll('.block');
    const lastBlock = blocks[blocks.length - 1];
    
    if (lastBlock) {
        lastBlock.classList.add('block-drop');
        setTimeout(() => {
            lastBlock.classList.remove('block-drop');
        }, 300);
    }
}

function renderColumn(side) {
    const column = gameState.columns[side];
    const blocksContainer = side === 'left' ? DOM.blocksLeft : DOM.blocksRight;
    const sumDisplay = side === 'left' ? DOM.sumLeft : DOM.sumRight;
    const wall = side === 'left' ? DOM.wallLeft : DOM.wallRight;
    
    // Очищаем контейнер
    blocksContainer.innerHTML = '';
    
    // Рендерим блоки
    column.blocks.forEach((block, index) => {
        const blockEl = renderBlock(block, blocksContainer, index);
        if (column.isOverheating) {
            blockEl.classList.add('overheated');
        }
    });
    
    // Обновляем сумму
    sumDisplay.textContent = column.sum;
    
    if (column.isOverheating) {
        sumDisplay.classList.add('overheat');
    } else {
        sumDisplay.classList.remove('overheat');
    }
    
    // Обновляем стену
    wall.querySelector('.wall-value').textContent = column.wallValue;
}

function updateScore() {
    DOM.score.textContent = gameState.score;
    
    if (gameState.multiplier > 1) {
        DOM.multiplier.textContent = `x${gameState.multiplier}`;
        DOM.multiplierContainer.classList.remove('hidden');
    } else {
        DOM.multiplierContainer.classList.add('hidden');
    }
}

function updateHighScoreDisplays() {
    DOM.startHighScore.textContent = gameState.highScore;
    DOM.highScore.textContent = gameState.highScore;
    DOM.finalHighScore.textContent = gameState.highScore;
}

// Логика игры

function calculateSum(side) {
    const column = gameState.columns[side];
    column.sum = column.blocks.reduce((sum, block) => sum + block.value, 0);
    return column.sum;
}

function checkWallCrack(side) {
    const column = gameState.columns[side];
    
    if (column.sum === column.wallValue) {
        return true;
    }
    
    return false;
}

function checkOverheat(side) {
    // В Zen режиме нет перегрева
    if (!GAME_MODES[gameState.gameMode].hasOverheat) {
        return false;
    }
    
    const column = gameState.columns[side];
    
    // Если колонка заморожена — нет перегрева
    if (gameState.frozenColumns[side]) {
        return false;
    }
    
    if (column.sum > column.wallValue) {
        return true;
    }
    
    return false;
}

function crackWall(side) {
    const column = gameState.columns[side];
    const wall = side === 'left' ? DOM.wallLeft : DOM.wallRight;
    
    // Увеличиваем счётчик взломов
    gameState.cracksCount++;
    
    // Обновляем статистику игрока
    updatePlayerStatsOnCrack(false);
    
    // Увеличиваем сложность в endless режиме
    increaseDifficulty();
    
    // Анимация взлома
    wall.classList.add('cracking');
    
    // Эффект вспышки
    DOM.screenFlash.classList.add('flash');
    
    // Частицы
    const wallRect = wall.getBoundingClientRect();
    if (window.ParticleEffects) {
        ParticleEffects.explode(
            wallRect.left + wallRect.width / 2,
            wallRect.top + wallRect.height / 2,
            '#00F3FF'
        );
    }
    
    // Звук и вибрация
    SoundManager.playCrack();
    SoundManager.stopOverheatTick();
    vibrate(CONFIG.VIBRATE_CRACK);
    
    // Очки (с учётом ×2 бонуса и комбо)
    let points = CONFIG.BASE_SCORE * gameState.multiplier;
    
    // Обновляем комбо
    updateCombo();
    
    // Бонус за комбо
    if (gameState.combo >= 2) {
        points = Math.floor(points * (1 + (gameState.combo - 1) * 0.1)); // +10% за каждый комбо
    }
    
    if (gameState.doublePointsActive) {
        points *= 2;
        gameState.doublePointsActive = false;
        DOM.score.classList.remove('double-active');
        showSpecialNotification('×2', `+${points}!`);
    }
    gameState.score += points;
    updateScore();
    
    // Показываем floating text с очками
    showScoreFloat(points, side);
    
    // Обновляем progress bar
    updateLevelProgress();
    
    // Проверяем выполнение испытания
    checkChallengeComplete();
    
    // Сброс колонки
    setTimeout(() => {
        wall.classList.remove('cracking');
        DOM.screenFlash.classList.remove('flash');
        
        // Генерируем новую стену
        column.wallValue = generateWallValue();
        column.blocks = [];
        column.sum = 0;
        column.isOverheating = false;
        
        if (column.overheatTimer) {
            clearInterval(column.overheatTimer);
            column.overheatTimer = null;
        }
        
        const timer = side === 'left' ? DOM.timerLeft : DOM.timerRight;
        timer.classList.add('hidden');
        
        renderColumn(side);
    }, 500);
}

function handleDualHack() {
    gameState.multiplier++;
    
    // Обновляем статистику DUAL HACK
    updatePlayerStatsOnCrack(true);
    
    // Показываем уведомление
    const notification = DOM.dualHackNotification;
    notification.querySelector('.dual-multiplier').textContent = `x${gameState.multiplier}`;
    notification.classList.remove('hidden');
    notification.classList.add('show');
    
    // Тряска экрана
    DOM.gameContainer.classList.add('screen-shake');
    
    // Пульсация фона
    if (window.BackgroundPulse) {
        BackgroundPulse.dualHack();
    }
    
    // Звук и вибрация
    SoundManager.playDualHack();
    SoundManager.playDualHackMelody();
    SoundManager.setMusicSpeed(gameState.multiplier);
    vibrate(CONFIG.VIBRATE_DUAL);
    
    setTimeout(() => {
        notification.classList.remove('show');
        notification.classList.add('hidden');
        DOM.gameContainer.classList.remove('screen-shake');
    }, 1000);
}

function startOverheat(side) {
    const column = gameState.columns[side];
    const timer = side === 'left' ? DOM.timerLeft : DOM.timerRight;
    
    if (column.isOverheating) return;
    
    column.isOverheating = true;
    let countdown = 3;
    
    timer.textContent = countdown;
    timer.classList.remove('hidden');
    
    // Звук и вибрация
    SoundManager.playOverheat();
    SoundManager.startOverheatTick();
    vibrate(CONFIG.VIBRATE_OVERHEAT);
    
    // Запускаем glitch эффект
    if (window.GlitchEffect) {
        GlitchEffect.start();
    }
    
    renderColumn(side);
    
    column.overheatTimer = setInterval(() => {
        countdown--;
        timer.textContent = countdown;
        
        if (countdown <= 0) {
            clearInterval(column.overheatTimer);
            column.overheatTimer = null;
            
            // Останавливаем glitch
            if (window.GlitchEffect) {
                GlitchEffect.stop();
            }
            
            // Останавливаем звук тикания
            SoundManager.stopOverheatTick();
            
            // Проверяем, исправлено ли
            if (column.sum > column.wallValue) {
                gameOver();
            }
        }
    }, 1000);
}

function stopOverheat(side) {
    const column = gameState.columns[side];
    const timer = side === 'left' ? DOM.timerLeft : DOM.timerRight;
    
    if (!column.isOverheating) return;
    
    column.isOverheating = false;
    
    if (column.overheatTimer) {
        clearInterval(column.overheatTimer);
        column.overheatTimer = null;
    }
    
    // Останавливаем glitch
    if (window.GlitchEffect) {
        GlitchEffect.stop();
    }
    
    timer.classList.add('hidden');
    renderColumn(side);
}

function handleWildBlock(block, side) {
    const column = gameState.columns[side];
    const needed = column.wallValue - column.sum;
    
    // Выбираем оптимальное значение
    if (needed >= 1 && needed <= 9) {
        block.value = needed;
    } else if (needed > 9) {
        block.value = 9;
    } else {
        block.value = 1;
    }
    
    block.displayValue = block.value.toString();
    block.type = BLOCK_TYPES.NORMAL;
    
    SoundManager.playSpecial();
}

function handleBombBlock(side) {
    const column = gameState.columns[side];
    
    // Удаляем до 3 верхних блоков
    const toRemove = Math.min(3, column.blocks.length);
    column.blocks.splice(column.blocks.length - toRemove, toRemove);
    
    calculateSum(side);
    
    // Проверяем, решился ли перегрев
    if (column.sum <= column.wallValue) {
        stopOverheat(side);
    }
    
    // Эффект взрыва
    const blocksContainer = side === 'left' ? DOM.blocksLeft : DOM.blocksRight;
    const rect = blocksContainer.getBoundingClientRect();
    
    if (window.ParticleEffects) {
        ParticleEffects.explode(
            rect.left + rect.width / 2,
            rect.top + 50,
            '#FF005C'
        );
    }
    
    SoundManager.playSpecial();
    vibrate(CONFIG.VIBRATE_CRACK);
    
    renderColumn(side);
}

function handleLightningBlock(side) {
    const column = gameState.columns[side];
    
    // Обнуляем все блоки
    column.blocks = [];
    column.sum = 0;
    
    stopOverheat(side);
    
    // Эффект молнии
    const blocksContainer = side === 'left' ? DOM.blocksLeft : DOM.blocksRight;
    const rect = blocksContainer.getBoundingClientRect();
    
    if (window.ParticleEffects) {
        ParticleEffects.lightning(
            rect.left + rect.width / 2,
            rect.top,
            rect.left + rect.width / 2,
            rect.bottom
        );
    }
    
    SoundManager.playSpecial();
    vibrate(CONFIG.VIBRATE_DUAL);
    
    renderColumn(side);
}

// ÷ Делитель — делит сумму пополам
function handleDividerBlock(side) {
    const column = gameState.columns[side];
    
    // Делим сумму пополам (округляем вниз)
    const newSum = Math.floor(column.sum / 2);
    
    // Пересчитываем блоки (удаляем сверху пока сумма не станет <= newSum)
    while (column.sum > newSum && column.blocks.length > 0) {
        const removedBlock = column.blocks.pop();
        column.sum -= removedBlock.value;
    }
    
    // Визуальный эффект
    const blocksContainer = side === 'left' ? DOM.blocksLeft : DOM.blocksRight;
    blocksContainer.classList.add('divider-effect');
    setTimeout(() => blocksContainer.classList.remove('divider-effect'), 500);
    
    SoundManager.playSpecial();
    vibrate(CONFIG.VIBRATE_CRACK);
    
    showSpecialNotification('÷2', 'СУММА РАЗДЕЛЕНА!');
    renderColumn(side);
}

// ↔ Swap — меняет блоки между колонками
function handleSwapBlock() {
    // Меняем блоки местами
    const tempBlocks = [...gameState.columns.left.blocks];
    const tempSum = gameState.columns.left.sum;
    
    gameState.columns.left.blocks = [...gameState.columns.right.blocks];
    gameState.columns.left.sum = gameState.columns.right.sum;
    
    gameState.columns.right.blocks = tempBlocks;
    gameState.columns.right.sum = tempSum;
    
    // Анимация
    DOM.blocksLeft.classList.add('swap-effect');
    DOM.blocksRight.classList.add('swap-effect');
    setTimeout(() => {
        DOM.blocksLeft.classList.remove('swap-effect');
        DOM.blocksRight.classList.remove('swap-effect');
    }, 500);
    
    SoundManager.playSpecial();
    vibrate(CONFIG.VIBRATE_DUAL);
    
    showSpecialNotification('↔', 'SWAP!');
    renderColumn('left');
    renderColumn('right');
}

// ❄ Freeze — замораживает перегрев на 5 сек
function handleFreezeBlock(side) {
    const column = gameState.columns[side];
    
    // Останавливаем текущий перегрев если есть
    stopOverheat(side);
    
    // Замораживаем колонку
    gameState.frozenColumns[side] = true;
    
    // Визуальный эффект
    const columnEl = side === 'left' ? DOM.columnLeft : DOM.columnRight;
    columnEl.classList.add('frozen');
    
    // Отменяем предыдущий таймер если есть
    if (column.freezeTimer) {
        clearTimeout(column.freezeTimer);
    }
    
    // Размораживаем через 5 секунд
    column.freezeTimer = setTimeout(() => {
        gameState.frozenColumns[side] = false;
        columnEl.classList.remove('frozen');
        column.freezeTimer = null;
    }, CONFIG.FREEZE_DURATION);
    
    SoundManager.playSpecial();
    vibrate(CONFIG.VIBRATE_CRACK);
    
    showSpecialNotification('❄', 'ЗАМОРОЗКА!');
}

// ×2 Удваивает очки за следующий взлом
function handleDoubleBlock() {
    gameState.doublePointsActive = true;
    
    // Визуальный эффект на счёте
    DOM.score.classList.add('double-active');
    
    SoundManager.playSpecial();
    vibrate(CONFIG.VIBRATE_CRACK);
    
    showSpecialNotification('×2', 'ДВОЙНЫЕ ОЧКИ!');
}

// 🎲 Random — случайный эффект
function handleRandomBlock(side) {
    const effects = [
        () => handleDividerBlock(side),
        () => handleSwapBlock(),
        () => handleFreezeBlock(side),
        () => handleDoubleBlock(),
        () => handleLightningBlock(side),
        () => handleBombBlock(side),
        () => { // Бонусные очки
            const bonus = randomInt(50, 200);
            gameState.score += bonus;
            updateScore();
            showSpecialNotification(`+${bonus}`, 'БОНУС!');
        },
        () => { // Дикий блок в обе колонки
            const wildValue = randomInt(1, 9);
            gameState.columns.left.blocks.push({ type: BLOCK_TYPES.WILD, value: wildValue, displayValue: wildValue.toString() });
            gameState.columns.right.blocks.push({ type: BLOCK_TYPES.WILD, value: wildValue, displayValue: wildValue.toString() });
            calculateSum('left');
            calculateSum('right');
            renderColumn('left');
            renderColumn('right');
            showSpecialNotification('?+?', 'ДВОЙНОЙ ВАЙЛД!');
        }
    ];
    
    // Случайный эффект
    const randomEffect = effects[randomInt(0, effects.length - 1)];
    
    SoundManager.playSpecial();
    vibrate(CONFIG.VIBRATE_DUAL);
    
    randomEffect();
}

// Получить цвет блока для эффекта следа
function getBlockColor(block) {
    if (block.isSpecial) {
        switch(block.type) {
            case 'divide': return '#e74c3c';
            case 'swap': return '#9b59b6';
            case 'freeze': return '#3498db';
            case 'double': return '#f39c12';
            case 'random': return '#1abc9c';
            default: return '#00ffff';
        }
    }
    // Цвет зависит от значения
    const value = block.value;
    if (value <= 3) return '#3498db';
    if (value <= 6) return '#2ecc71';
    if (value <= 9) return '#f39c12';
    return '#e74c3c';
}

// Показать уведомление о спецблоке
function showSpecialNotification(icon, text) {
    const notification = document.createElement('div');
    notification.className = 'special-notification';
    notification.innerHTML = `
        <span class="special-icon">${icon}</span>
        <span class="special-text">${text}</span>
    `;
    DOM.gameContainer.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 1500);
}

function dropBlock(side) {
    if (!gameState.isPlaying || gameState.isPaused || gameState.isAnimating) return;
    if (!gameState.currentBlock) return;
    
    gameState.isAnimating = true;
    
    const column = gameState.columns[side];
    const block = { ...gameState.currentBlock };
    
    // Позиционируем падающий блок над колонкой
    const columnEl = side === 'left' ? DOM.columnLeft : DOM.columnRight;
    const blocksContainer = side === 'left' ? DOM.blocksLeft : DOM.blocksRight;
    const columnRect = columnEl.getBoundingClientRect();
    const containerRect = blocksContainer.getBoundingClientRect();
    
    DOM.fallingBlock.style.left = `${columnRect.left + columnRect.width / 2 - 25}px`;
    DOM.fallingBlock.classList.add('falling');
    
    // Запускаем след за блоком
    if (window.BlockTrail) {
        const blockColor = getBlockColor(block);
        BlockTrail.start(DOM.fallingBlock, () => blockColor);
    }
    
    // Рассчитываем конечную позицию
    const blockHeight = 55; // block size + gap
    const targetY = containerRect.bottom - (column.blocks.length + 1) * blockHeight;
    
    DOM.fallingBlock.style.top = `${Math.max(targetY, containerRect.top)}px`;
    
    // После анимации падения
    setTimeout(() => {
        DOM.fallingBlock.classList.remove('falling');
        DOM.fallingBlock.classList.add('landing');
        
        // Останавливаем след за блоком
        if (window.BlockTrail) {
            BlockTrail.stop();
        }
        
        setTimeout(() => {
            DOM.fallingBlock.classList.remove('landing');
            DOM.fallingBlock.classList.add('hidden');
            
            // Обрабатываем спецблоки
            if (block.type === BLOCK_TYPES.WILD) {
                handleWildBlock(block, side);
                column.blocks.push(block);
                calculateSum(side);
            } else if (block.type === BLOCK_TYPES.BOMB) {
                handleBombBlock(side);
            } else if (block.type === BLOCK_TYPES.LIGHTNING) {
                handleLightningBlock(side);
            } else if (block.type === BLOCK_TYPES.DIVIDER) {
                handleDividerBlock(side);
            } else if (block.type === BLOCK_TYPES.SWAP) {
                handleSwapBlock();
            } else if (block.type === BLOCK_TYPES.FREEZE) {
                handleFreezeBlock(side);
            } else if (block.type === BLOCK_TYPES.DOUBLE) {
                handleDoubleBlock();
            } else if (block.type === BLOCK_TYPES.RANDOM) {
                handleRandomBlock(side);
            } else {
                // Обычный блок
                column.blocks.push(block);
                calculateSum(side);
                SoundManager.playPlace();
                
                // Уникальный звук для цифры
                SoundManager.playDigit(block.value);
                
                // Проверяем приближение к цели
                const progress = column.sum / column.wallValue;
                if (progress > 0.5 && progress < 1) {
                    SoundManager.playApproaching(progress);
                }
            }
            
            renderColumn(side);
            
            // Проверяем взлом
            const leftCracked = checkWallCrack('left');
            const rightCracked = checkWallCrack('right');
            
            if (leftCracked && rightCracked) {
                handleDualHack();
                crackWall('left');
                crackWall('right');
            } else if (leftCracked) {
                crackWall('left');
            } else if (rightCracked) {
                crackWall('right');
            }
            
            // Проверяем перегрев
            if (checkOverheat('left') && !gameState.columns.left.isOverheating) {
                startOverheat('left');
            }
            if (checkOverheat('right') && !gameState.columns.right.isOverheating) {
                startOverheat('right');
            }
            
            // Следующий блок из очереди
            gameState.currentBlock = getNextFromQueue();
            
            // Анимация появления блока
            animateBlockDrop(side);
            
            setTimeout(() => {
                gameState.isAnimating = false;
                renderFallingBlock();
            }, CONFIG.SPAWN_DELAY);
            
        }, 100);
    }, CONFIG.DROP_SPEED);
}

// Управление игрой

function startGame(difficulty = null, mode = null) {
    // Устанавливаем режим и сложность
    if (mode) {
        gameState.gameMode = mode;
    }
    if (difficulty) {
        gameState.difficulty = difficulty;
    }
    
    // Применяем настройки сложности
    applyDifficultySettings();
    
    // Применяем настройки режима
    applyModeSettings();
    
    // Сброс состояния
    gameState.score = 0;
    gameState.multiplier = 1;
    gameState.level = 1;
    gameState.cracksCount = 0;
    gameState.doublePointsActive = false;
    gameState.frozenColumns = { left: false, right: false };
    gameState.isPlaying = true;
    gameState.isPaused = false;
    gameState.isAnimating = false;
    
    // Сброс комбо
    gameState.combo = 0;
    gameState.maxCombo = 0;
    gameState.lastCrackTime = 0;
    hideCombo();
    
    // Сброс колонок
    gameState.columns.left = {
        blocks: [],
        sum: 0,
        wallValue: generateWallValue(),
        isOverheating: false,
        overheatTimer: null,
        freezeTimer: null
    };
    
    gameState.columns.right = {
        blocks: [],
        sum: 0,
        wallValue: generateWallValue(),
        isOverheating: false,
        overheatTimer: null,
        freezeTimer: null
    };
    
    // Генерируем блоки с использованием очереди
    initBlockQueue();
    gameState.currentBlock = getNextFromQueue();
    
    // Скрываем оверлеи
    DOM.startScreen.classList.add('hidden');
    DOM.pauseScreen.classList.add('hidden');
    DOM.gameOverScreen.classList.add('hidden');
    DOM.modeScreen?.classList.add('hidden');
    DOM.difficultyScreen?.classList.add('hidden');
    
    // Рендерим
    renderColumn('left');
    renderColumn('right');
    renderNextBlock();
    renderFallingBlock();
    updateScore();
    updateLevelDisplay();
    
    // Сначала скрываем все элементы режимов
    hideTimerDisplay();
    hideTargetScore();
    stopAI();
    
    // Запускаем таймер если нужно
    if (GAME_MODES[gameState.gameMode].hasTimer) {
        startGameTimer();
    }
    
    // Показываем цель для Challenge
    if (gameState.gameMode === 'challenge') {
        showTargetScore();
    }
    
    // Запускаем AI для Versus режима
    if (GAME_MODES[gameState.gameMode].hasAI) {
        initAI();
    }
    
    // Запускаем музыку если включена
    if (gameState.settings.musicEnabled) {
        SoundManager.startMusic();
    }
}

function applyModeSettings() {
    const mode = GAME_MODES[gameState.gameMode];
    if (!mode) return;
    
    // Для Challenge генерируем ежедневное испытание
    if (mode.daily) {
        generateDailyChallenge();
    }
}

function applyDifficultySettings() {
    const diff = DIFFICULTY[gameState.difficulty];
    if (!diff) return;
    
    CONFIG.MIN_WALL_VALUE = diff.minWall;
    CONFIG.MAX_WALL_VALUE = diff.maxWall;
    CONFIG.DROP_SPEED = diff.dropSpeed;
    CONFIG.OVERHEAT_TIME = diff.overheatTime;
}

function increaseDifficulty() {
    // Только для режима Endless
    if (gameState.difficulty !== 'endless') return;
    
    const diff = DIFFICULTY.endless;
    
    // Каждые 5 взломов увеличиваем сложность
    if (gameState.cracksCount % 5 === 0) {
        gameState.level++;
        
        // Увеличиваем значения стен (макс 25)
        CONFIG.MAX_WALL_VALUE = Math.min(25, diff.maxWall + gameState.level * 2);
        CONFIG.MIN_WALL_VALUE = Math.min(15, diff.minWall + Math.floor(gameState.level / 2));
        
        // Ускоряем падение (мин 200ms)
        CONFIG.DROP_SPEED = Math.max(200, diff.dropSpeed - gameState.level * 20);
        
        // Уменьшаем время на перегрев (мин 1500ms)
        CONFIG.OVERHEAT_TIME = Math.max(1500, diff.overheatTime - gameState.level * 150);
        
        updateLevelDisplay();
        
        // Показываем уведомление о новом уровне
        showLevelUpNotification();
    }
}

function showModeScreen() {
    DOM.startScreen.classList.add('hidden');
    DOM.modeScreen.classList.remove('hidden');
    updateChallengeInfo();
    HapticManager.light();
}

function showDifficultyScreen() {
    DOM.modeScreen.classList.add('hidden');
    DOM.difficultyScreen.classList.remove('hidden');
    HapticManager.light();
}

// Таймер для Time Attack

function startGameTimer() {
    const mode = GAME_MODES[gameState.gameMode];
    if (!mode.hasTimer) return;
    
    gameState.timeRemaining = mode.timeLimit;
    updateTimerDisplay();
    
    DOM.timerContainer.classList.remove('hidden');
    
    gameState.gameTimer = setInterval(() => {
        if (gameState.isPaused) return;
        
        gameState.timeRemaining -= 100;
        updateTimerDisplay();
        
        // Предупреждение когда мало времени
        if (gameState.timeRemaining <= 10000 && gameState.timeRemaining > 0) {
            DOM.gameTimer.classList.add('warning');
        }
        
        if (gameState.timeRemaining <= 0) {
            clearInterval(gameState.gameTimer);
            gameState.gameTimer = null;
            timeUp();
        }
    }, 100);
}

function stopGameTimer() {
    if (gameState.gameTimer) {
        clearInterval(gameState.gameTimer);
        gameState.gameTimer = null;
    }
    DOM.timerContainer?.classList.add('hidden');
    DOM.gameTimer?.classList.remove('warning');
}

function hideTimerDisplay() {
    DOM.timerContainer?.classList.add('hidden');
    DOM.gameTimer?.classList.remove('warning', 'danger');
}

function hideTargetScore() {
    DOM.targetContainer?.classList.add('hidden');
}

function updateTimerDisplay() {
    if (!DOM.gameTimer) return;
    const seconds = Math.ceil(gameState.timeRemaining / 1000);
    DOM.gameTimer.textContent = seconds;
}

function timeUp() {
    // Время вышло - конец игры
    showSpecialNotification('⏱️', 'ВРЕМЯ ВЫШЛО!');
    setTimeout(() => gameOver(), 1000);
}

// Challenge Mode (Ежедневное испытание)

function getDailySeed() {
    const today = new Date();
    return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
}

function seededRandom(seed) {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

function generateDailyChallenge() {
    const seed = getDailySeed();
    gameState.dailySeed = seed;
    
    // Генерируем целевой счёт на основе сида
    const baseTarget = 500 + Math.floor(seededRandom(seed) * 1000);
    gameState.dailyTarget = Math.round(baseTarget / 100) * 100;
    
    // Устанавливаем фиксированные значения стен
    const wallSeed = seededRandom(seed + 1);
    CONFIG.MIN_WALL_VALUE = 5 + Math.floor(wallSeed * 5);
    CONFIG.MAX_WALL_VALUE = CONFIG.MIN_WALL_VALUE + 5 + Math.floor(seededRandom(seed + 2) * 5);
}

function updateChallengeInfo() {
    if (!DOM.challengeDesc) return;
    
    const seed = getDailySeed();
    const baseTarget = 500 + Math.floor(seededRandom(seed) * 1000);
    const target = Math.round(baseTarget / 100) * 100;
    
    DOM.challengeDesc.textContent = `Цель: ${target} очков`;
}

function showTargetScore() {
    if (gameState.gameMode !== 'challenge') return;
    
    DOM.targetContainer?.classList.remove('hidden');
    if (DOM.targetScore) {
        DOM.targetScore.textContent = gameState.dailyTarget;
    }
}

function hideTargetScore() {
    DOM.targetContainer?.classList.add('hidden');
}

function checkChallengeComplete() {
    if (gameState.gameMode !== 'challenge') return false;
    
    if (gameState.score >= gameState.dailyTarget) {
        showSpecialNotification('🎯', 'ИСПЫТАНИЕ ПРОЙДЕНО!');
        HapticManager.pattern([100, 50, 100, 50, 200]);
        return true;
    }
    return false;
}

// Versus AI Mode

function initAI() {
    const difficulty = gameState.difficulty;
    
    // Настройки AI в зависимости от сложности
    const aiSettings = {
        easy: { thinkTime: { min: 1500, max: 3000 }, mistakeChance: 0.3, scoreMultiplier: 0.7 },
        normal: { thinkTime: { min: 800, max: 2000 }, mistakeChance: 0.15, scoreMultiplier: 1.0 },
        hard: { thinkTime: { min: 400, max: 1000 }, mistakeChance: 0.05, scoreMultiplier: 1.3 },
        endless: { thinkTime: { min: 600, max: 1500 }, mistakeChance: 0.1, scoreMultiplier: 1.1 }
    };
    
    const settings = aiSettings[difficulty] || aiSettings.normal;
    gameState.ai = {
        score: 0,
        isActive: true,
        timer: null,
        thinkTime: settings.thinkTime,
        mistakeChance: settings.mistakeChance,
        scoreMultiplier: settings.scoreMultiplier,
        status: 'thinking'
    };
    
    // Показываем AI панель
    if (DOM.aiPanel) {
        DOM.aiPanel.classList.remove('hidden');
        updateAIDisplay();
    }
    
    // Запускаем AI
    startAILoop();
}

function startAILoop() {
    if (!gameState.ai.isActive) return;
    
    const thinkTime = Math.random() * 
        (gameState.ai.thinkTime.max - gameState.ai.thinkTime.min) + 
        gameState.ai.thinkTime.min;
    
    updateAIStatus('thinking');
    
    gameState.ai.timer = setTimeout(() => {
        if (!gameState.isPlaying || gameState.isPaused || !gameState.ai.isActive) return;
        
        // AI делает ход
        aiMakeMove();
        
        // Следующий ход
        startAILoop();
    }, thinkTime);
}

function aiMakeMove() {
    // AI "взламывает" стену и получает очки
    const makesMistake = Math.random() < gameState.ai.mistakeChance;
    
    if (makesMistake) {
        // Ошибка - AI теряет время
        updateAIStatus('error');
        setTimeout(() => updateAIStatus('thinking'), 500);
        return;
    }
    
    // Успешный взлом
    updateAIStatus('hacking');
    
    // Начисляем очки AI с небольшой вариацией
    const basePoints = CONFIG.BASE_SCORE * gameState.ai.scoreMultiplier;
    const variation = 0.8 + Math.random() * 0.4; // 0.8 - 1.2
    const points = Math.floor(basePoints * variation);
    
    gameState.ai.score += points;
    updateAIDisplay();
    
    // Анимация хакинга
    if (DOM.aiAvatar) {
        DOM.aiAvatar.classList.add('ai-hacking');
        setTimeout(() => DOM.aiAvatar.classList.remove('ai-hacking'), 300);
    }
    
    // Проверяем, не проиграл ли игрок
    checkVersusResult();
    
    setTimeout(() => updateAIStatus('thinking'), 300);
}

function updateAIStatus(status) {
    gameState.ai.status = status;
    if (!DOM.aiStatus) return;
    
    const statusText = {
        thinking: '🤔 Думает...',
        hacking: '💻 Взлом!',
        error: '❌ Ошибка!',
        winning: '😎 Лидирует!',
        losing: '😰 Отстаёт!'
    };
    
    DOM.aiStatus.textContent = statusText[status] || statusText.thinking;
    DOM.aiStatus.className = 'ai-status ' + status;
}

function updateAIDisplay() {
    if (DOM.aiScore) {
        DOM.aiScore.textContent = gameState.ai.score;
    }
    
    // Обновляем статус лидерства
    if (gameState.ai.score > gameState.score + 200) {
        updateAIStatus('winning');
    } else if (gameState.score > gameState.ai.score + 200) {
        updateAIStatus('losing');
    }
}

function stopAI() {
    if (gameState.ai.timer) {
        clearTimeout(gameState.ai.timer);
        gameState.ai.timer = null;
    }
    gameState.ai.isActive = false;
    
    if (DOM.aiPanel) {
        DOM.aiPanel.classList.add('hidden');
    }
}

function checkVersusResult() {
    // Проверяем победу AI (если AI набрал намного больше очков)
    // Игра заканчивается когда игрок проигрывает (game over через перегрев)
    // или достигает определённого преимущества
    
    if (gameState.score >= 1000 && gameState.score > gameState.ai.score * 1.5) {
        // Игрок победил!
        showVersusWin();
    }
}

function showVersusWin() {
    stopAI();
    showSpecialNotification('🏆', 'ПОБЕДА!');
    HapticManager.pattern([100, 50, 100, 50, 100, 50, 200]);
    
    setTimeout(() => {
        gameOver();
    }, 1500);
}

function showVersusLose() {
    stopAI();
    showSpecialNotification('😵', 'AI ПОБЕДИЛ!');
}

function showLevelUpNotification() {
    const notification = document.createElement('div');
    notification.className = 'level-up-notification';
    notification.innerHTML = `<span>УРОВЕНЬ ${gameState.level}</span>`;
    DOM.gameContainer.appendChild(notification);
    
    HapticManager.pattern([50, 30, 50, 30, 100]);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 1500);
}

function updateLevelDisplay() {
    if (DOM.levelDisplay) {
        DOM.levelDisplay.textContent = gameState.level;
        
        // Показываем только в endless режиме
        const levelContainer = DOM.levelDisplay.closest('.level-info');
        if (levelContainer) {
            levelContainer.style.display = gameState.difficulty === 'endless' ? 'flex' : 'none';
        }
    }
}

function pauseGame() {
    if (!gameState.isPlaying) return;
    
    gameState.isPaused = true;
    DOM.pauseScreen.classList.remove('hidden');
    updateHighScoreDisplays();
}

function resumeGame() {
    gameState.isPaused = false;
    DOM.pauseScreen.classList.add('hidden');
}

function goToMainMenu() {
    // Останавливаем игру
    gameState.isPlaying = false;
    gameState.isPaused = false;
    
    // Останавливаем таймеры перегрева
    if (gameState.columns.left.overheatTimer) {
        clearInterval(gameState.columns.left.overheatTimer);
    }
    if (gameState.columns.right.overheatTimer) {
        clearInterval(gameState.columns.right.overheatTimer);
    }
    
    // Скрываем экран паузы и показываем главный экран
    DOM.pauseScreen.classList.add('hidden');
    DOM.startScreen.classList.remove('hidden');
    
    // Обновляем рекорд на главном экране
    updateHighScoreDisplays();
}

function gameOver() {
    gameState.isPlaying = false;
    
    // Останавливаем игровой таймер
    stopGameTimer();
    hideTimerDisplay();
    hideTargetScore();
    
    // Останавливаем AI
    stopAI();
    
    // Останавливаем таймеры перегрева
    if (gameState.columns.left.overheatTimer) {
        clearInterval(gameState.columns.left.overheatTimer);
    }
    if (gameState.columns.right.overheatTimer) {
        clearInterval(gameState.columns.right.overheatTimer);
    }
    
    // Скрываем таймеры перегрева
    if (DOM.timerLeft) DOM.timerLeft.classList.add('hidden');
    if (DOM.timerRight) DOM.timerRight.classList.add('hidden');
    
    // Звук и вибрация
    SoundManager.playGameOver();
    SoundManager.stopOverheatTick();
    SoundManager.stopMusic();
    vibrate(CONFIG.VIBRATE_GAME_OVER);
    
    // Проверяем рекорд
    const isNewRecord = gameState.score > gameState.highScore;
    if (isNewRecord) {
        gameState.highScore = gameState.score;
        saveHighScore();
    }
    
    // Для Versus режима показываем результат
    let versusResult = '';
    if (gameState.gameMode === 'versus') {
        if (gameState.score > gameState.ai.score) {
            versusResult = '🏆 ТЫ ПОБЕДИЛ!';
        } else if (gameState.score < gameState.ai.score) {
            versusResult = '🤖 AI ПОБЕДИЛ!';
        } else {
            versusResult = '🤝 НИЧЬЯ!';
        }
    }
    
    // Показываем экран
    DOM.finalScore.textContent = gameState.score;
    DOM.finalHighScore.textContent = gameState.highScore;
    
    // Добавляем результат versus если есть
    if (versusResult && DOM.versusResult) {
        DOM.versusResult.textContent = versusResult;
        DOM.versusResult.classList.remove('hidden');
        DOM.versusAiScore.textContent = gameState.ai.score;
        DOM.versusScoreContainer?.classList.remove('hidden');
    } else if (DOM.versusResult) {
        DOM.versusResult.classList.add('hidden');
        DOM.versusScoreContainer?.classList.add('hidden');
    }
    
    if (isNewRecord) {
        DOM.newRecord.classList.remove('hidden');
        DOM.shareBtn.classList.remove('hidden');
        
        // Конфетти при новом рекорде!
        if (window.ParticleEffects) {
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 3;
            ParticleEffects.confetti(centerX, centerY, 100);
            
            // Вторая волна конфетти
            setTimeout(() => {
                ParticleEffects.confetti(centerX - 100, centerY, 50);
                ParticleEffects.confetti(centerX + 100, centerY, 50);
            }, 300);
        }
    } else {
        DOM.newRecord.classList.add('hidden');
        DOM.shareBtn.classList.add('hidden');
    }
    
    DOM.gameOverScreen.classList.remove('hidden');
    
    // Обновляем статистику игрока
    const playerWon = gameState.gameMode === 'versus' && gameState.score > gameState.ai.score;
    updatePlayerStatsOnGameOver(playerWon);
}

// Сохранение данных

function loadHighScore() {
    const saved = localStorage.getItem('stackcrack_highscore');
    if (saved) {
        gameState.highScore = parseInt(saved, 10);
    }
    updateHighScoreDisplays();
}

function saveHighScore() {
    localStorage.setItem('stackcrack_highscore', gameState.highScore.toString());
    updateHighScoreDisplays();
}

// Обработчики событий

function setupEventListeners() {
    // Управление
    DOM.btnLeft.addEventListener('click', () => dropBlock('left'));
    DOM.btnRight.addEventListener('click', () => dropBlock('right'));
    
    // Touch события для мобильных
    DOM.btnLeft.addEventListener('touchstart', (e) => {
        if (e.cancelable) e.preventDefault();
        dropBlock('left');
    }, { passive: false });
    
    DOM.btnRight.addEventListener('touchstart', (e) => {
        if (e.cancelable) e.preventDefault();
        dropBlock('right');
    }, { passive: false });
    
    // Тапы по половинам экрана
    DOM.gameField.addEventListener('click', (e) => {
        if (gameState.isAnimating) return;
        
        const rect = DOM.gameField.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const side = x < rect.width / 2 ? 'left' : 'right';
        
        dropBlock(side);
    });
    
    // Свайпы и тапы по игровому полю
    setupSwipeControls();
    
    // Клавиатура
    document.addEventListener('keydown', (e) => {
        if (!gameState.isPlaying || gameState.isPaused) return;
        
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            dropBlock('left');
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            dropBlock('right');
        } else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
            pauseGame();
        }
    });
    
    // Меню
    DOM.pauseBtn.addEventListener('click', pauseGame);
    DOM.startBtn.addEventListener('click', showModeScreen);
    DOM.resumeBtn.addEventListener('click', resumeGame);
    DOM.restartBtn.addEventListener('click', () => startGame(gameState.difficulty, gameState.gameMode));
    DOM.mainMenuBtn.addEventListener('click', goToMainMenu);
    DOM.playAgainBtn.addEventListener('click', () => startGame(gameState.difficulty, gameState.gameMode));
    
    // Выбор режима игры
    if (DOM.modeScreen) {
        DOM.modeScreen.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.dataset.mode;
                gameState.gameMode = mode;
                HapticManager.medium();
                
                // Показываем экран выбора сложности
                DOM.modeScreen.classList.add('hidden');
                showDifficultyScreen();
            });
        });
        
        // Кнопка назад из экрана режимов
        const modeBackBtn = DOM.modeScreen.querySelector('#mode-back-btn');
        if (modeBackBtn) {
            modeBackBtn.addEventListener('click', () => {
                DOM.modeScreen.classList.add('hidden');
                DOM.startScreen.classList.remove('hidden');
                HapticManager.light();
            });
        }
    }
    
    // Выбор сложности
    if (DOM.difficultyScreen) {
        DOM.difficultyScreen.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const difficulty = btn.dataset.difficulty;
                HapticManager.medium();
                startGame(difficulty, gameState.gameMode);
            });
        });
    }
    
    if (DOM.difficultyBackBtn) {
        DOM.difficultyBackBtn.addEventListener('click', () => {
            DOM.difficultyScreen.classList.add('hidden');
            DOM.modeScreen.classList.remove('hidden');
            HapticManager.light();
        });
    }
    
    // Предотвращаем зум на мобильных
    document.addEventListener('gesturestart', (e) => {
        if (e.cancelable) e.preventDefault();
    }, { passive: false });
    document.addEventListener('gesturechange', (e) => {
        if (e.cancelable) e.preventDefault();
    }, { passive: false });
    
    // Обработка потери фокуса
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && gameState.isPlaying && !gameState.isPaused) {
            pauseGame();
        }
    });
    
    // Share кнопка
    if (DOM.shareBtn) {
        DOM.shareBtn.addEventListener('click', shareScore);
    }
    
    // Модальное окно настроек
    setupSettingsModal();
}

// Свайп-управление

function setupSwipeControls() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    
    DOM.gameField.addEventListener('touchstart', (e) => {
        if (gameState.isAnimating || !gameState.isPlaying || gameState.isPaused) return;
        
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchStartTime = Date.now();
    }, { passive: true });
    
    DOM.gameField.addEventListener('touchend', (e) => {
        if (gameState.isAnimating || !gameState.isPlaying || gameState.isPaused) return;
        
        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        const deltaTime = Date.now() - touchStartTime;
        
        // Проверяем, это свайп или тап
        if (gameState.settings.swipeEnabled && 
            deltaTime < CONFIG.SWIPE_TIMEOUT && 
            Math.abs(deltaX) > CONFIG.SWIPE_THRESHOLD &&
            Math.abs(deltaX) > Math.abs(deltaY)) {
            
            // Это свайп
            const side = deltaX < 0 ? 'left' : 'right';
            HapticManager.light();
            dropBlock(side);
        } else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
            // Это тап - определяем сторону по позиции
            const rect = DOM.gameField.getBoundingClientRect();
            const x = touchStartX - rect.left;
            const side = x < rect.width / 2 ? 'left' : 'right';
            dropBlock(side);
        }
    }, { passive: true });
}

// Share API

async function shareScore() {
    HapticManager.light();
    
    const shareData = {
        title: 'Stack & Crack',
        text: `🎮 Мой счёт в Stack & Crack: ${gameState.score} очков!\n🏆 Рекорд: ${gameState.highScore}\nПопробуй побить!`,
        url: window.location.href
    };
    
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        try {
            await navigator.share(shareData);
            console.log('Shared successfully');
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.log('Share failed:', err);
                fallbackShare();
            }
        }
    } else {
        fallbackShare();
    }
}

function fallbackShare() {
    // Копируем текст в буфер обмена
    const text = `🎮 Мой счёт в Stack & Crack: ${gameState.score} очков! 🏆 Рекорд: ${gameState.highScore}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text + '\n' + window.location.href)
            .then(() => {
                showToast('Скопировано в буфер обмена!');
            })
            .catch(() => {
                showToast('Не удалось скопировать');
            });
    } else {
        // Fallback для старых браузеров
        const textarea = document.createElement('textarea');
        textarea.value = text + '\n' + window.location.href;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Скопировано в буфер обмена!');
    }
}

function showToast(message) {
    // Создаём toast-уведомление
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Анимация появления
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    
    // Удаляем через 2 секунды
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// Настройки

function loadSettings() {
    const saved = localStorage.getItem('stackcrack_settings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            gameState.settings = { ...gameState.settings, ...settings };
        } catch (e) {
            console.log('Failed to load settings');
        }
    }
    updateSettingsUI();
    applyAccessibilitySettings();
}

function saveSettings() {
    localStorage.setItem('stackcrack_settings', JSON.stringify(gameState.settings));
}

// Настройки доступности

function applyAccessibilitySettings() {
    const body = document.body;
    
    // Режим для дальтоников - высококонтрастные цвета
    if (gameState.settings.colorblindMode) {
        body.classList.add('colorblind-mode');
    } else {
        body.classList.remove('colorblind-mode');
    }
    
    // Увеличенные элементы управления
    if (gameState.settings.largeControls) {
        body.classList.add('large-controls');
    } else {
        body.classList.remove('large-controls');
    }
    
    // Отключение анимаций
    if (gameState.settings.reducedMotion) {
        body.classList.add('reduced-motion');
    } else {
        body.classList.remove('reduced-motion');
    }
}

function updateSettingsUI() {
    if (DOM.swipeToggle) {
        DOM.swipeToggle.checked = gameState.settings.swipeEnabled;
    }
    if (DOM.hapticToggle) {
        DOM.hapticToggle.checked = gameState.settings.hapticEnabled;
    }
    if (DOM.soundToggle) {
        DOM.soundToggle.checked = gameState.settings.soundEnabled;
    }
    if (DOM.notificationsToggle) {
        DOM.notificationsToggle.checked = gameState.settings.notificationsEnabled;
    }
    if (DOM.musicToggle) {
        DOM.musicToggle.checked = gameState.settings.musicEnabled;
    }
    if (DOM.colorblindToggle) {
        DOM.colorblindToggle.checked = gameState.settings.colorblindMode;
    }
    if (DOM.largeControlsToggle) {
        DOM.largeControlsToggle.checked = gameState.settings.largeControls;
    }
    if (DOM.reducedMotionToggle) {
        DOM.reducedMotionToggle.checked = gameState.settings.reducedMotion;
    }
}

function openSettingsModal() {
    if (DOM.settingsModal) {
        updateSettingsUI();
        DOM.settingsModal.classList.remove('hidden');
        HapticManager.light();
    }
}

function closeSettingsModal() {
    if (DOM.settingsModal) {
        DOM.settingsModal.classList.add('hidden');
        HapticManager.light();
    }
}

function setupSettingsModal() {
    // Открыть настройки с главного экрана
    if (DOM.startSettingsBtn) {
        DOM.startSettingsBtn.addEventListener('click', openSettingsModal);
    }
    
    // Открыть настройки из паузы
    if (DOM.pauseSettingsBtn) {
        DOM.pauseSettingsBtn.addEventListener('click', openSettingsModal);
    }
    
    // Закрыть настройки
    if (DOM.settingsCloseBtn) {
        DOM.settingsCloseBtn.addEventListener('click', closeSettingsModal);
    }
    
    // Сохранить и закрыть
    if (DOM.settingsSaveBtn) {
        DOM.settingsSaveBtn.addEventListener('click', closeSettingsModal);
    }
    
    // Закрыть по клику на backdrop
    if (DOM.settingsModal) {
        DOM.settingsModal.querySelector('.modal-backdrop')?.addEventListener('click', closeSettingsModal);
    }
    
    // Слушатели изменений настроек
    if (DOM.swipeToggle) {
        DOM.swipeToggle.addEventListener('change', (e) => {
            gameState.settings.swipeEnabled = e.target.checked;
            saveSettings();
            HapticManager.light();
        });
    }
    
    if (DOM.hapticToggle) {
        DOM.hapticToggle.addEventListener('change', (e) => {
            gameState.settings.hapticEnabled = e.target.checked;
            saveSettings();
            if (e.target.checked) HapticManager.light();
        });
    }
    
    if (DOM.soundToggle) {
        DOM.soundToggle.addEventListener('change', (e) => {
            gameState.settings.soundEnabled = e.target.checked;
            saveSettings();
            HapticManager.light();
        });
    }
    
    if (DOM.musicToggle) {
        DOM.musicToggle.addEventListener('change', (e) => {
            gameState.settings.musicEnabled = e.target.checked;
            if (e.target.checked && gameState.isPlaying) {
                SoundManager.startMusic();
            } else {
                SoundManager.stopMusic();
            }
            saveSettings();
            HapticManager.light();
        });
    }
    
    if (DOM.notificationsToggle) {
        DOM.notificationsToggle.addEventListener('change', async (e) => {
            if (e.target.checked) {
                // Запрашиваем разрешение
                const granted = await NotificationManager.requestPermission();
                if (granted) {
                    gameState.settings.notificationsEnabled = true;
                    NotificationManager.show('Уведомления включены! 🔔', {
                        body: 'Мы напомним тебе побить рекорд!'
                    });
                } else {
                    e.target.checked = false;
                    gameState.settings.notificationsEnabled = false;
                }
            } else {
                gameState.settings.notificationsEnabled = false;
                NotificationManager.cancelReminder();
            }
            saveSettings();
            HapticManager.light();
        });
    }
    
    // Настройки доступности
    if (DOM.colorblindToggle) {
        DOM.colorblindToggle.addEventListener('change', (e) => {
            gameState.settings.colorblindMode = e.target.checked;
            console.log(`🎨 Режим для дальтоников: ${e.target.checked ? 'ВКЛ' : 'ВЫКЛ'}`);
            applyAccessibilitySettings();
            saveSettings();
            HapticManager.light();
        });
    }
    
    if (DOM.largeControlsToggle) {
        DOM.largeControlsToggle.addEventListener('change', (e) => {
            gameState.settings.largeControls = e.target.checked;
            console.log(`🔍 Крупные кнопки: ${e.target.checked ? 'ВКЛ' : 'ВЫКЛ'}`);
            applyAccessibilitySettings();
            saveSettings();
            HapticManager.light();
        });
    }
    
    if (DOM.reducedMotionToggle) {
        DOM.reducedMotionToggle.addEventListener('change', (e) => {
            gameState.settings.reducedMotion = e.target.checked;
            console.log(`⚡ Без анимаций: ${e.target.checked ? 'ВКЛ' : 'ВЫКЛ'}`);
            applyAccessibilitySettings();
            saveSettings();
            HapticManager.light();
        });
    }
}

// Система магазина, уровней и достижений

function loadPlayerStats() {
    const saved = localStorage.getItem('stackcrack_stats');
    if (saved) {
        const parsed = JSON.parse(saved);
        playerStats = { ...playerStats, ...parsed };
    }
    
    // Применяем сохранённую тему
    applyTheme(playerStats.activeTheme);
}

function savePlayerStats() {
    localStorage.setItem('stackcrack_stats', JSON.stringify({
        totalCracks: playerStats.totalCracks,
        totalDualHacks: playerStats.totalDualHacks,
        highScore: playerStats.highScore,
        maxCombo: playerStats.maxCombo,
        gamesPlayed: playerStats.gamesPlayed,
        zenCracks: playerStats.zenCracks,
        aiWins: playerStats.aiWins,
        unlockedAchievements: playerStats.unlockedAchievements,
        unlockedThemes: playerStats.unlockedThemes,
        activeTheme: playerStats.activeTheme
    }));
}

function getPlayerLevel() {
    return LEVEL_SYSTEM.getLevel(playerStats.totalCracks);
}

function checkAchievements() {
    const stats = {
        totalCracks: playerStats.totalCracks,
        totalDualHacks: playerStats.totalDualHacks,
        highScore: playerStats.highScore,
        maxCombo: playerStats.maxCombo,
        zenCracks: playerStats.zenCracks,
        aiWins: playerStats.aiWins,
        overheatsPerGame: playerStats.overheatsThisGame,
        cracksIn30Sec: playerStats.cracksThisGame // Упрощённая проверка
    };
    
    let newUnlocks = [];
    
    for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
        if (!playerStats.unlockedAchievements.includes(id)) {
            if (achievement.condition(stats)) {
                playerStats.unlockedAchievements.push(id);
                newUnlocks.push(achievement);
                
                // Если достижение разблокирует тему
                if (achievement.unlocks && !playerStats.unlockedThemes.includes(achievement.unlocks)) {
                    playerStats.unlockedThemes.push(achievement.unlocks);
                    showAchievementNotification(achievement, `🎨 Тема ${THEMES[achievement.unlocks].name} разблокирована!`);
                } else {
                    showAchievementNotification(achievement);
                }
            }
        }
    }
    
    // Проверяем разблокировку тем по уровню
    checkThemeUnlocks();
    
    if (newUnlocks.length > 0) {
        savePlayerStats();
    }
}

function checkThemeUnlocks() {
    const currentLevel = getPlayerLevel();
    
    for (const [themeId, theme] of Object.entries(THEMES)) {
        if (theme.requirement && theme.requirement.type === 'level') {
            if (currentLevel >= theme.requirement.level && !playerStats.unlockedThemes.includes(themeId)) {
                playerStats.unlockedThemes.push(themeId);
                showSpecialNotification('🎨', `Тема ${theme.name} разблокирована!`);
            }
        }
    }
}

function showAchievementNotification(achievement, extraText = '') {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-popup">
            <span class="achievement-popup-icon">${achievement.icon}</span>
            <div class="achievement-popup-text">
                <span class="achievement-popup-title">🏆 ДОСТИЖЕНИЕ!</span>
                <span class="achievement-popup-name">${achievement.name}</span>
                ${extraText ? `<span class="achievement-popup-extra">${extraText}</span>` : ''}
            </div>
        </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

function applyTheme(themeId) {
    if (!playerStats.unlockedThemes.includes(themeId)) {
        themeId = 'neon-city';
    }
    
    document.documentElement.setAttribute('data-theme', themeId === 'neon-city' ? '' : themeId);
    playerStats.activeTheme = themeId;
    savePlayerStats();
}

function updateShopUI() {
    // Обновляем профиль
    if (DOM.shopLevel) DOM.shopLevel.textContent = getPlayerLevel();
    if (DOM.shopTotalCracks) DOM.shopTotalCracks.textContent = playerStats.totalCracks;
    
    // Обновляем темы
    document.querySelectorAll('.theme-card').forEach(card => {
        const themeId = card.dataset.theme;
        const theme = THEMES[themeId];
        const isUnlocked = playerStats.unlockedThemes.includes(themeId);
        const isActive = playerStats.activeTheme === themeId;
        
        card.classList.toggle('locked', !isUnlocked);
        card.classList.toggle('unlocked', isUnlocked);
        card.classList.toggle('active', isActive);
        
        const statusEl = card.querySelector('.theme-status, .theme-unlock');
        if (statusEl) {
            if (isActive) {
                statusEl.textContent = '✓ Активна';
                statusEl.className = 'theme-status';
            } else if (isUnlocked) {
                statusEl.textContent = 'Выбрать';
                statusEl.className = 'theme-status';
            } else {
                statusEl.textContent = `🔒 ${theme.requirement?.label || 'Недоступно'}`;
                statusEl.className = 'theme-unlock';
            }
        }
    });
}

function updateAchievementsUI() {
    const currentLevel = getPlayerLevel();
    const progress = LEVEL_SYSTEM.getProgress(playerStats.totalCracks);
    const cracksToNext = LEVEL_SYSTEM.getCracksForNextLevel(playerStats.totalCracks);
    
    // Обновляем статистику
    if (DOM.achievementsUnlocked) DOM.achievementsUnlocked.textContent = playerStats.unlockedAchievements.length;
    if (DOM.achievementsTotal) DOM.achievementsTotal.textContent = Object.keys(ACHIEVEMENTS).length;
    if (DOM.playerLevelDisplay) DOM.playerLevelDisplay.textContent = currentLevel;
    if (DOM.nextLevel) DOM.nextLevel.textContent = currentLevel + 1;
    if (DOM.cracksToNext) DOM.cracksToNext.textContent = cracksToNext > 0 ? `${cracksToNext} взломов` : 'Максимум!';
    if (DOM.levelProgressFill) DOM.levelProgressFill.style.width = `${progress}%`;
    
    // Рендерим достижения
    renderAchievements();
}

function renderAchievements() {
    if (!DOM.achievementsGrid) return;
    
    DOM.achievementsGrid.innerHTML = '';
    
    for (const [id, achievement] of Object.entries(ACHIEVEMENTS)) {
        const isUnlocked = playerStats.unlockedAchievements.includes(id);
        const card = document.createElement('div');
        card.className = `achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`;
        card.innerHTML = `
            <span class="achievement-icon">${achievement.icon}</span>
            <span class="achievement-name">${achievement.name}</span>
            <span class="achievement-desc">${achievement.description}</span>
        `;
        DOM.achievementsGrid.appendChild(card);
    }
}

function openShop() {
    updateShopUI();
    DOM.shopModal?.classList.remove('hidden');
    HapticManager.light();
}

function closeShop() {
    DOM.shopModal?.classList.add('hidden');
    HapticManager.light();
}

function openAchievements() {
    updateAchievementsUI();
    DOM.achievementsModal?.classList.remove('hidden');
    HapticManager.light();
}

function closeAchievements() {
    DOM.achievementsModal?.classList.add('hidden');
    HapticManager.light();
}

function setupShopEventListeners() {
    // Открытие магазина
    DOM.startShopBtn?.addEventListener('click', openShop);
    
    // Закрытие магазина
    DOM.shopCloseBtn?.addEventListener('click', closeShop);
    DOM.shopCloseFooterBtn?.addEventListener('click', closeShop);
    DOM.shopModal?.querySelector('.modal-backdrop')?.addEventListener('click', closeShop);
    
    // Открытие достижений
    DOM.startAchievementsBtn?.addEventListener('click', openAchievements);
    
    // Закрытие достижений
    DOM.achievementsCloseBtn?.addEventListener('click', closeAchievements);
    DOM.achievementsCloseFooterBtn?.addEventListener('click', closeAchievements);
    DOM.achievementsModal?.querySelector('.modal-backdrop')?.addEventListener('click', closeAchievements);
    
    // Клики по темам
    document.querySelectorAll('.theme-card').forEach(card => {
        card.addEventListener('click', () => {
            const themeId = card.dataset.theme;
            
            if (playerStats.unlockedThemes.includes(themeId)) {
                applyTheme(themeId);
                updateShopUI();
                HapticManager.medium();
            } else {
                // Тема заблокирована - показываем уведомление
                const theme = THEMES[themeId];
                showSpecialNotification('🔒', theme.requirement?.label || 'Недоступно');
                HapticManager.error();
            }
        });
    });
}

// Обновляем статистику при взломе
function updatePlayerStatsOnCrack(isDualHack = false) {
    playerStats.totalCracks++;
    playerStats.cracksThisGame++;
    
    if (isDualHack) {
        playerStats.totalDualHacks++;
    }
    
    if (gameState.gameMode === 'zen') {
        playerStats.zenCracks++;
    }
    
    // Проверяем достижения
    checkAchievements();
    
    // Сохраняем
    savePlayerStats();
}

function updatePlayerStatsOnGameOver(won = false) {
    playerStats.gamesPlayed++;
    
    if (gameState.score > playerStats.highScore) {
        playerStats.highScore = gameState.score;
    }
    
    if (gameState.combo > playerStats.maxCombo) {
        playerStats.maxCombo = gameState.combo;
    }
    
    if (won && gameState.gameMode === 'versus') {
        playerStats.aiWins++;
    }
    
    // Проверяем достижения
    checkAchievements();
    
    // Сбрасываем временную статистику
    playerStats.cracksThisGame = 0;
    playerStats.overheatsThisGame = 0;
    
    savePlayerStats();
}

// Инициализация

function init() {
    cacheDOMElements();
    loadHighScore();
    loadSettings();
    loadPlayerStats();
    setupEventListeners();
    setupShopEventListeners();
    setupUpdateSystem();
    setupNotifications();
    
    // Инициализация canvas для эффектов
    if (window.ParticleEffects) {
        ParticleEffects.init();
    }
    
    // Инициализация визуальных эффектов
    if (window.GlitchEffect) {
        GlitchEffect.init();
    }
    if (window.BackgroundPulse) {
        BackgroundPulse.init();
    }
    
    // Показываем версию
    updateVersionDisplay();
    
    // Скрываем заставку через 2 секунды
    hideSplashScreen();
    
    console.log(`🎮 Stack & Crack ${getVersionString()} initialized!`);
}

// Заставка студии (Splash Screen)

function hideSplashScreen() {
    const splashScreen = document.getElementById('splash-screen');
    const gameContainer = document.getElementById('game-container');
    
    if (!splashScreen) {
        // Нет заставки, сразу показываем игру
        if (gameContainer) gameContainer.classList.remove('hidden');
        return;
    }
    
    // Ждём окончания анимации загрузки (2 сек) + небольшая пауза
    setTimeout(() => {
        splashScreen.classList.add('fade-out');
        
        // После fade-out показываем игру
        setTimeout(() => {
            splashScreen.style.display = 'none';
            if (gameContainer) gameContainer.classList.remove('hidden');
        }, 500);
    }, 2200);
}

// Система версионирования и обновлений

function getVersionString() {
    if (typeof APP_VERSION !== 'undefined') {
        return APP_VERSION.display || `v${APP_VERSION.full}`;
    }
    return 'v1.1.0';
}

function updateVersionDisplay() {
    const versionEl = document.getElementById('version-display');
    if (versionEl) {
        versionEl.textContent = getVersionString();
    }
}

function setupUpdateSystem() {
    // Элементы UI
    const updateNotification = document.getElementById('update-notification');
    const updateBtn = document.getElementById('update-btn');
    const updateClose = document.getElementById('update-close');
    
    if (!updateNotification) return;
    
    // Обработчик нажатия на "Обновить"
    if (updateBtn) {
        updateBtn.addEventListener('click', () => {
            // Перезагружаем страницу для применения обновления
            window.location.reload(true);
        });
    }
    
    // Закрыть уведомление
    if (updateClose) {
        updateClose.addEventListener('click', () => {
            updateNotification.classList.add('hidden');
        });
    }
    
    // Слушаем сообщения от Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'SW_UPDATED') {
                console.log(`[Update] New version available: ${event.data.version}`);
                showUpdateNotification();
            }
        });
        
        // Слушаем события контроллера
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('[Update] Controller changed, reloading...');
            // Автоматически перезагружаем при смене контроллера
            // (опционально - можно убрать если хотите только уведомление)
            // window.location.reload();
        });
    }
}

function showUpdateNotification() {
    const updateNotification = document.getElementById('update-notification');
    if (updateNotification) {
        updateNotification.classList.remove('hidden');
        HapticManager.pattern([50, 100, 50]);
    }
}

// Функция для принудительной проверки обновлений
function checkForUpdates() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CHECK_UPDATE' });
    }
}

// Настройка уведомлений

function setupNotifications() {
    // Планируем напоминание при закрытии/сворачивании
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            NotificationManager.scheduleReminder();
        } else {
            NotificationManager.cancelReminder();
        }
    });
    
    // При закрытии страницы
    window.addEventListener('beforeunload', () => {
        if (gameState.settings.notificationsEnabled && Notification.permission === 'granted') {
            // Для beforeunload нельзя показать уведомление напрямую,
            // но можно запланировать через SW
            if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'SCHEDULE_NOTIFICATION',
                    highScore: gameState.highScore
                });
            }
        }
    });
}

// Запуск при загрузке DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Регистрация Service Worker

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('[SW] Registered:', registration.scope);
                
                // Проверяем обновления при старте
                registration.update();
                
                // Слушаем установку нового SW
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('[SW] Update found, installing...');
                    
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // Новый SW установлен, но старый всё ещё контролирует
                            console.log('[SW] New version installed, ready to activate');
                            showUpdateNotification();
                        }
                    });
                });
                
                // Периодически проверяем обновления (каждые 5 минут)
                setInterval(() => {
                    registration.update();
                }, 5 * 60 * 1000);
            })
            .catch(error => {
                console.log('[SW] Registration failed:', error);
            });
    });
}

// Режим отладки (Debug Mode)

// Разблокировать все достижения
function debugUnlockAllAchievements() {
    for (const id of Object.keys(ACHIEVEMENTS)) {
        if (!playerStats.unlockedAchievements.includes(id)) {
            playerStats.unlockedAchievements.push(id);
        }
    }
    savePlayerStats();
    console.log('🏆 Все достижения разблокированы!');
    return playerStats.unlockedAchievements;
}

// Разблокировать все темы
function debugUnlockAllThemes() {
    for (const id of Object.keys(THEMES)) {
        if (!playerStats.unlockedThemes.includes(id)) {
            playerStats.unlockedThemes.push(id);
        }
    }
    savePlayerStats();
    console.log('🎨 Все темы разблокированы!');
    return playerStats.unlockedThemes;
}

// Разблокировать всё
function debugUnlockAll() {
    debugUnlockAllAchievements();
    debugUnlockAllThemes();
    console.log('✅ Всё разблокировано! Обновите страницу для применения.');
    return { achievements: playerStats.unlockedAchievements, themes: playerStats.unlockedThemes };
}

// Сбросить все разблокировки
function debugResetAll() {
    playerStats.unlockedAchievements = [];
    playerStats.unlockedThemes = ['neon-city'];
    playerStats.activeTheme = 'neon-city';
    applyTheme('neon-city');
    savePlayerStats();
    console.log('🔄 Все разблокировки сброшены!');
}

// Установить уровень игрока
function debugSetLevel(level) {
    const cracksNeeded = level * 20; // 20 взломов на уровень
    playerStats.totalCracks = cracksNeeded;
    savePlayerStats();
    checkLevelUnlocks();
    console.log(`📊 Уровень установлен на ${level} (${cracksNeeded} взломов)`);
}

// Показать статистику
function debugShowStats() {
    console.table({
        'Всего взломов': playerStats.totalCracks,
        'DUAL HACK': playerStats.totalDualHacks,
        'Рекорд': playerStats.highScore,
        'Макс комбо': playerStats.maxCombo,
        'Игр сыграно': playerStats.gamesPlayed,
        'Побед над AI': playerStats.aiWins,
        'Достижений': playerStats.unlockedAchievements.length,
        'Тем': playerStats.unlockedThemes.length,
        'Активная тема': playerStats.activeTheme
    });
    return playerStats;
}

// Экспортируем в глобальную область для консоли
window.DEBUG = {
    unlockAll: debugUnlockAll,
    unlockAchievements: debugUnlockAllAchievements,
    unlockThemes: debugUnlockAllThemes,
    reset: debugResetAll,
    setLevel: debugSetLevel,
    stats: debugShowStats
};

console.log('%c🔧 Debug Mode Available', 'color: #00F3FF; font-size: 14px; font-weight: bold;');
console.log('%c┌─────────────────────────────────────────────┐', 'color: #666;');
console.log('%c│  DEBUG.unlockAll()        - Разблокировать всё   │', 'color: #888;');
console.log('%c│  DEBUG.unlockAchievements() - Все достижения     │', 'color: #888;');
console.log('%c│  DEBUG.unlockThemes()     - Все темы             │', 'color: #888;');
console.log('%c│  DEBUG.reset()            - Сбросить прогресс    │', 'color: #888;');
console.log('%c│  DEBUG.setLevel(n)        - Установить уровень   │', 'color: #888;');
console.log('%c│  DEBUG.stats()            - Показать статистику  │', 'color: #888;');
console.log('%c└─────────────────────────────────────────────┘', 'color: #666;');

