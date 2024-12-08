document.addEventListener('DOMContentLoaded', () => {
    const nyaaContainer = document.getElementById('nyaaContainer');
    const images = [
        '/nyaa/blackh.png',
        '/nyaa/blackup.png',
        '/nyaa/blondeh.png',
        '/nyaa/blondeup.png',
        '/nyaa/orangeh.png',
        '/nyaa/orangeup.png',
        '/nyaa/pinkh.png',
        '/nyaa/pinkup.png',
        '/nyaa/redh.png',
        '/nyaa/redup.png',
        '/nyaa/whiteh.png',
        '/nyaa/whiteup.png',
        '/nyaa/catgirlupset.png',
        '/nyaa/catgirlhappy.png'
    ];

    // Выбираем случайные 4 изображения
    const selectedImages = shuffleArray(images).slice(0, 4);

    selectedImages.forEach(imagePath => {
        const img = document.createElement('img');
        img.src = imagePath;
        img.classList.add('nyaa-image');
        
        // Добавляем случайный наклон от -15 до 15 градусов
        const rotation = Math.random() * 30 - 15;
        img.style.transform = `rotate(${rotation}deg)`;
        
        // Добавляем обработчик ошибок загрузки изображения
        img.onerror = () => {
            console.error(`Ошибка загрузки изображения: ${imagePath}`);
        };
        
        nyaaContainer.appendChild(img);
    });

    // Добавляем код для геометрических фигур
    const geometricBackground = document.getElementById('geometricBackground');
    const shapes = ['circle', 'square', 'triangle', 'hexagon', 'star'];
    
    function createShape() {
        const shape = document.createElement('div');
        const shapeType = shapes[Math.floor(Math.random() * shapes.length)];
        shape.classList.add('shape', shapeType);
        
        // Случайное начальное положение по горизонтали
        const startPosition = Math.random() * window.innerWidth;
        shape.style.left = `${startPosition}px`;
        
        // Случайная длительность анимации
        const duration = 8 + Math.random() * 15;
        shape.style.animationDuration = `${duration}s`;
        
        // Случайный размер
        const scale = 0.3 + Math.random() * 2;
        shape.style.transform = `scale(${scale})`;
        
        geometricBackground.appendChild(shape);
        
        // Удаляем фигуру после завершения анимации
        setTimeout(() => {
            shape.remove();
        }, duration * 1000);
    }
    
    // Создаем новые фигуры чаще
    setInterval(createShape, 1000);
    
    // Создаем больше начальных фигур
    for(let i = 0; i < 20; i++) {
        setTimeout(createShape, Math.random() * 2000);
    }

    let currentGameCode = null;
    let currentNickname = null;

    // Обработчик для кнопки хоста
    const hostButton = document.querySelector('.host-button button');
    hostButton.addEventListener('click', async () => {
        const gameCode = Math.floor(1000 + Math.random() * 9000);
        currentGameCode = gameCode;
        
        // Отправляем код на сервер
        const response = await fetch('/api/create-game', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ gameCode })
        });

        const colors = [
            '#8BB9FF', '#FFB5E8', '#B5FFB9', '#FFE5B5'
        ];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        const mainContainer = document.querySelector('.main-container');
        mainContainer.innerHTML = `
            <div class="host-screen">
                <h2 style="color: ${randomColor}">Код игры: ${gameCode}</h2>
                <div class="players-container"></div>
                <button class="continue-button">Продолжить</button>
            </div>
        `;

        // Запускаем периодическое обновление списка игроков
        startPlayerUpdates(gameCode);

        const continueButton = document.querySelector('.continue-button');
        continueButton.addEventListener('click', () => {
            alert('Скоро здесь начнется игра!');
        });
    });

    // Обработчик для кнопки "Начать игру"
    const playButton = document.querySelector('.play-button');
    playButton.addEventListener('click', async () => {
        const nicknameInput = document.getElementById('nickname-input');
        const gameInput = document.getElementById('game-input');
        
        const nickname = nicknameInput.value.trim();
        const gameCode = gameInput.value.trim();

        if (!nickname || !gameCode) {
            alert('Пожалуйста, введите никнейм и код игры');
            return;
        }

        const response = await fetch('/api/join-game', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nickname, gameCode })
        });

        const data = await response.json();

        if (!data.success) {
            alert(data.error);
            return;
        }

        // Сохраняем данные игрока
        currentGameCode = gameCode;
        currentNickname = nickname;
        
        // Показываем экран ожидания
        const mainContainer = document.querySelector('.main-container');
        mainContainer.innerHTML = `
            <div class="waiting-screen">
                <h2>Ожидание начала игры...</h2>
            </div>
        `;
    });

    function startPlayerUpdates(gameCode) {
        const playersContainer = document.querySelector('.players-container');
        
        setInterval(async () => {
            const response = await fetch(`/api/game-players/${gameCode}`);
            const data = await response.json();
            
            if (data.success) {
                playersContainer.innerHTML = data.players.map(player => `
                    <div class="player-item">
                        <img src="${player.avatar}" alt="${player.nickname}" class="player-avatar">
                        <span>${player.nickname}</span>
                    </div>
                `).join('');
            }
        }, 1000);
    }

    // Обработка выхода игрока
    window.addEventListener('beforeunload', () => {
        if (currentGameCode && currentNickname) {
            navigator.sendBeacon('/api/leave-game', JSON.stringify({
                gameCode: currentGameCode,
                nickname: currentNickname
            }));
        }
    });
});

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
} 