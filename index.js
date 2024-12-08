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
    { base: 'pink', happy: '/nyaa/pinkh.png', upset: '/nyaa/pinkup.png' },
    { base: 'white', happy: '/nyaa/whiteh.png', upset: '/nyaa/whiteup.png' }
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
        availableAvatars: shuffleArray([...avatarPairs]) // Перемешиваем аватары при создании игры
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
        joinTime: Date.now()
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
    const gameCode = req.body.gameCode.toString();
    const nickname = req.body.nickname;
    const game = activeGames.get(gameCode);
    
    if (game && nickname) { // Добавляем проверку на nickname
        const playerIndex = game.players.findIndex(p => p.nickname === nickname);
        if (playerIndex !== -1) {
            // Возвращаем аватар в пул доступных
            game.availableAvatars.push(game.players[playerIndex].avatar);
            game.players.splice(playerIndex, 1);
        }
    }
    
    res.json({ success: true });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});
