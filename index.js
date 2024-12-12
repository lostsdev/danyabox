const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.json());

// Хранилище активных игр
const activeGames = new Map();
// Хранилище пар аватаров
const avatarPairs = [
    { base: 'catgirl', happy: '/nyaa/catgirlhappy.png', upset: '/nyaa/catgirlupset.png' },
    { base: 'red', happy: '/nyaa/redh.png', upset: '/nyaa/redup.png' },
    { base: 'black', happy: '/nyaa/blackh.png', upset: '/nyaa/blackup.png' },
    { base: 'blonde', happy: '/nyaa/blondeh.png', upset: '/nyaa/blondeup.png' },
    { base: 'orange', happy: '/nyaa/orangeh.png', upset: '/nyaa/orangeup.png' },
    { base: 'orange2', happy: '/nyaa/orangeh2.png', upset: '/nyaa/orangeup2.png' },
    { base: 'pink', happy: '/nyaa/pinkh.png', upset: '/nyaa/pinkup.png' },
    { base: 'white', happy: '/nyaa/whiteh.png', upset: '/nyaa/whiteup.png' },
    { base: 'dark', happy: '/nyaa/darkh.png', upset: '/nyaa/darkup.png' }
];

// Хранилище вопросов
const questions = [
    "Что делать, если вы встретили медведя в лесу?",
    "Как объяснить бабушке, что такое биткоин?",
    "Что бы вы сделали, если бы могли становиться невидимым на 5 минут каждый день?",
    "Как избавиться от надоедливого соседа сверху, который постоянно делает ремонт?",
    "Почему программисты не любят ходить в спортзал?",
    "Как объяснить коту, что он не человек?",
    "Что делать, если ваш начальник оказался инопланетянином?",
    "Как пережить понедельник, если вы случайно проспали и опоздали на работу на 2 часа?"
];

// Добавим функцию перемешивания массива
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Создание новой игры
app.post('/api/create-game', (req, res) => {
    const gameCode = req.body.gameCode.toString();
    
    activeGames.set(gameCode, {
        host: true,
        players: [],
        availableAvatars: shuffleArray([...avatarPairs]),
        gameState: 'waiting', // waiting, round1, round2
        currentQuestions: [], // Здесь будем хранить текущие пары
        questionPairs: [] // Здесь будем хранить все пары для обоих раундов
    });
    
    res.json({ success: true });
});

// Присоединение к игре
app.post('/api/join-game', (req, res) => {
    const nickname = req.body.nickname;
    const gameCode = req.body.gameCode.toString();
    
    if (!gameCode || !nickname) {
        return res.json({ 
            success: false, 
            error: 'Необходимо ввести код игры и никнейм' 
        });
    }

    const game = activeGames.get(gameCode);
    
    if (!game) {
        return res.json({ 
            success: false, 
            error: 'Игра с таким кодом не найдена' 
        });
    }

    // Проверяем, не занят ли никнейм
    if (game.players.some(player => player.nickname === nickname)) {
        return res.json({ 
            success: false, 
            error: 'Этот никнейм уже занят' 
        });
    }

    let avatarPair;
    
    // Если это первый игрок, даем ему catgirl
    if (game.players.length === 0) {
        avatarPair = game.availableAvatars.find(avatar => avatar.base === 'catgirl');
        // Удаляем catgirl из доступных аватаров
        game.availableAvatars = game.availableAvatars.filter(avatar => avatar.base !== 'catgirl');
    } else {
        // Для остальных игроков берем первый доступный аватар
        avatarPair = game.availableAvatars[0];
        // Удаляем использованный аватар из доступных
        game.availableAvatars.shift();
    }

    if (!avatarPair) {
        return res.json({ 
            success: false, 
            error: 'В игре уже максимальное количество игроков' 
        });
    }

    // Добавляем игрока
    const player = {
        nickname,
        avatar: avatarPair,
        joinTime: Date.now(),
        lastPing: Date.now()
    };
    
    game.players.push(player);

    res.json({ 
        success: true, 
        avatar: avatarPair.happy
    });
});

// Получение списка игроков для хоста
app.get('/api/game-players/:gameCode', (req, res) => {
    const gameCode = req.params.gameCode.toString();
    const game = activeGames.get(gameCode);
    
    if (!game) {
        return res.json({ 
            success: false, 
            error: 'Игра не найдена' 
        });
    }

    res.json({ 
        success: true, 
        players: game.players.map(p => ({
            nickname: p.nickname,
            avatar: p.avatar.happy
        }))
    });
});

// Удаление игрока (при отключении)
app.post('/api/leave-game', (req, res) => {
    const gameCode = req.body?.gameCode;
    const nickname = req.body?.nickname;
    
    if (!gameCode || !nickname) {
        return res.json({ success: false, error: 'Отсутствует код игры или никнейм' });
    }
    
    const game = activeGames.get(gameCode.toString());
    
    if (game) {
        const playerIndex = game.players.findIndex(p => p.nickname === nickname);
        if (playerIndex !== -1) {
            // Возвращаем аватар в пул доступных
            game.availableAvatars.push(game.players[playerIndex].avatar);
            game.players.splice(playerIndex, 1);
        }
    }
    
    res.json({ success: true });
});

// Добавим новый эндпоинт для пинга
app.post('/api/ping', (req, res) => {
    const { gameCode, nickname } = req.body;
    const game = activeGames.get(gameCode?.toString());
    
    if (game) {
        const player = game.players.find(p => p.nickname === nickname);
        if (player) {
            player.lastPing = Date.now();
        }
    }
    
    res.json({ success: true });
});

// Обновляем эндпоинт для начала игры
app.post('/api/start-game', (req, res) => {
    const gameCode = req.body.gameCode.toString();
    const game = activeGames.get(gameCode);
    
    if (!game) {
        return res.json({ success: false, error: 'Игра не найдена' });
    }

    // Проверяем минимальное количество игроков
    if (game.players.length < 2) {
        return res.json({ 
            success: false, 
            error: 'Для начала игры нужно минимум 2 игрока' 
        });
    }

    const shuffledPlayers = shuffleArray([...game.players]);
    const shuffledQuestions = shuffleArray([...questions]);
    
    // Создаем пары для первого раунда
    const round1Pairs = [];
    const hasExtraPlayer = shuffledPlayers.length % 2 === 1;
    
    // Создаем обычные пары
    for (let i = 0; i < (hasExtraPlayer ? shuffledPlayers.length - 3 : shuffledPlayers.length); i += 2) {
        round1Pairs.push({
            players: [shuffledPlayers[i], shuffledPlayers[i + 1]],
            question: shuffledQuestions[i / 2]
        });
    }

    // Если есть лишний игрок, создаем тройку для последнего вопроса
    if (hasExtraPlayer) {
        round1Pairs.push({
            players: [
                shuffledPlayers[shuffledPlayers.length - 3],
                shuffledPlayers[shuffledPlayers.length - 2],
                shuffledPlayers[shuffledPlayers.length - 1]
            ],
            question: shuffledQuestions[Math.floor(shuffledPlayers.length / 2)]
        });
    }

    // Перемешиваем игроков для второго раунда
    let round2Players = shuffleArray([...shuffledPlayers]);
    
    // Создаем пары для второго раунда
    const round2Pairs = [];
    for (let i = 0; i < (hasExtraPlayer ? round2Players.length - 3 : round2Players.length); i += 2) {
        round2Pairs.push({
            players: [round2Players[i], round2Players[i + 1]],
            question: shuffledQuestions[shuffledQuestions.length/2 + i/2]
        });
    }

    // Добавляем тройку для второго раунда, если нужно
    if (hasExtraPlayer) {
        round2Pairs.push({
            players: [
                round2Players[round2Players.length - 3],
                round2Players[round2Players.length - 2],
                round2Players[round2Players.length - 1]
            ],
            question: shuffledQuestions[shuffledQuestions.length - 1]
        });
    }

    game.questionPairs = {
        round1: round1Pairs,
        round2: round2Pairs
    };
    game.gameState = 'round1';
    game.currentQuestions = round1Pairs;
    game.playerAnswers = new Map(); // Добавляем хранилище для ответов

    res.json({ success: true });
});

// Обновляем эндпоинт для получения вопроса
app.get('/api/get-question/:gameCode/:nickname', (req, res) => {
    const { gameCode, nickname } = req.params;
    const game = activeGames.get(gameCode);

    if (!game) {
        return res.json({ success: false, error: 'Игра не найдена' });
    }

    // Проверяем, началась ли игра
    if (game.gameState === 'waiting' || !game.questionPairs) {
        return res.json({ 
            success: false, 
            error: 'Игра еще не началась' 
        });
    }

    // Находим все пары/тройки с участием игрока
    const playerQuestions = [];
    
    // Проверяем первый раунд
    const round1Question = game.questionPairs.round1?.find(pair => 
        pair.players.some(player => player.nickname === nickname)
    );
    if (round1Question) {
        playerQuestions.push({
            question: round1Question.question,
            partners: round1Question.players
                .filter(player => player.nickname !== nickname)
                .map(player => player.nickname),
            round: 1
        });
    }

    // Проверяем второй раунд
    const round2Question = game.questionPairs.round2?.find(pair => 
        pair.players.some(player => player.nickname === nickname)
    );
    if (round2Question) {
        playerQuestions.push({
            question: round2Question.question,
            partners: round2Question.players
                .filter(player => player.nickname !== nickname)
                .map(player => player.nickname),
            round: 2
        });
    }

    res.json({ 
        success: true,
        questions: playerQuestions
    });
});

// Добавляем эндпоинт для перехода ко второму раунду
app.post('/api/next-round', (req, res) => {
    const { gameCode } = req.body;
    const game = activeGames.get(gameCode);

    if (!game) {
        return res.json({ success: false, error: 'Игра не найдена' });
    }

    if (game.gameState === 'round1') {
        game.gameState = 'round2';
        game.currentQuestions = game.questionPairs.round2;
        res.json({ success: true });
    } else {
        res.json({ success: false, error: 'Неверное состояние игры' });
    }
});

// Добавим функцию очистки неактивных игроков
function cleanupInactivePlayers() {
    const inactiveTimeout = 15000; // 15 секунд (даем небольшой запас)
    
    activeGames.forEach((game, gameCode) => {
        const now = Date.now();
        const inactivePlayers = game.players.filter(
            player => now - player.lastPing > inactiveTimeout
        );
        
        inactivePlayers.forEach(player => {
            const playerIndex = game.players.findIndex(p => p.nickname === player.nickname);
            if (playerIndex !== -1) {
                // Возвращаем аватар в пул доступных
                game.availableAvatars.push(game.players[playerIndex].avatar);
                game.players.splice(playerIndex, 1);
            }
        });
    });
}

// Запускаем очистку каждые 5 секунд
setInterval(cleanupInactivePlayers, 5000);

// Обновляем эндпоинт для отметки завершивших игроков
app.post('/api/player-finished', (req, res) => {
    const { gameCode, nickname } = req.body;
    const game = activeGames.get(gameCode);

    if (!game) {
        return res.json({ success: false, error: 'Игра не найдена' });
    }

    // Если у игры еще нет списка завершивших, создаем его
    if (!game.finishedPlayers) {
        game.finishedPlayers = [];
    }

    // Проверяем, не добавлен ли уже игрок в список завершивших
    const isAlreadyFinished = game.finishedPlayers.some(p => p.nickname === nickname);
    
    if (!isAlreadyFinished) {
        const player = game.players.find(p => p.nickname === nickname);
        if (player) {
            game.finishedPlayers.push({
                nickname: player.nickname,
                avatar: player.avatar.happy
            });
        }
    }

    res.json({ success: true });
});

// Добавим эндпоинт для получения списка завершивших игроков
app.get('/api/finished-players/:gameCode', (req, res) => {
    const { gameCode } = req.params;
    const game = activeGames.get(gameCode);

    if (!game) {
        return res.json({ success: false, error: 'Игра не найдена' });
    }

    res.json({ 
        success: true, 
        players: game.finishedPlayers || []
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});
