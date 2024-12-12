document.addEventListener('DOMContentLoaded', () => {
    const nyaaContainer = document.getElementById('nyaaContainer');
    const images = [
        '/nyaa/blackh.png',
        '/nyaa/blackup.png',
        '/nyaa/blondeh.png',
        '/nyaa/blondeup.png',
        '/nyaa/orangeh.png',
        '/nyaa/orangeup.png',
        '/nyaa/orangeh2.png',
        '/nyaa/orangeup2.png',
        '/nyaa/pinkh.png',
        '/nyaa/pinkup.png',
        '/nyaa/redh.png',
        '/nyaa/redup.png',
        '/nyaa/whiteh.png',
        '/nyaa/whiteup.png',
        '/nyaa/darkh.png',
        '/nyaa/darkup.png',
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
        continueButton.addEventListener('click', async () => {
            const response = await fetch('/api/start-game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ gameCode: currentGameCode })
            });

            const data = await response.json();

            if (!data.success) {
                alert(data.error);
                return;
            }

            const hostScreen = document.querySelector('.host-screen');
            const TIMER_DURATION = 300; // 5 минут
            let timeLeft = TIMER_DURATION;

            hostScreen.innerHTML = `
                <div class="timer">Осталось времени: ${Math.floor(timeLeft/60)}:${(timeLeft%60).toString().padStart(2, '0')}</div>
                <h2 style="color: #8BB9FF; font-size: 42px; margin-top: 40px;">
                    Посмотрите на ваши устройства
                </h2>
                <div class="finished-players-container">
                    <h3>Ответившие игроки:</h3>
                    <div class="players-list"></div>
                </div>
            `;

            // Запускаем таймер
            const timerInterval = setInterval(() => {
                timeLeft--;
                const timerElement = hostScreen.querySelector('.timer');
                
                if (timeLeft >= 0) {
                    const minutes = Math.floor(timeLeft / 60);
                    const seconds = timeLeft % 60;
                    timerElement.textContent = `Осталось времени: ${minutes}:${seconds.toString().padStart(2, '0')}`;
                    timerElement.style.color = timeLeft < 30 ? '#ff4444' : '#007bff';
                } else {
                    clearInterval(timerInterval);
                    timerElement.textContent = 'Время вышло!';
                    timerElement.style.color = '#ff4444';
                }
            }, 1000);

            // Запускаем обновление списка ответивших игроков
            const updateInterval = setInterval(async () => {
                const response = await fetch(`/api/finished-players/${currentGameCode}`);
                const data = await response.json();
                
                if (data.success) {
                    const playersList = hostScreen.querySelector('.players-list');
                    playersList.innerHTML = data.players.map(player => `
                        <div class="player-item">
                            <img src="${player.avatar}" alt="${player.nickname}" class="player-avatar">
                            <span>${player.nickname}</span>
                        </div>
                    `).join('');
                }
            }, 1000);

            // Очищаем интервалы при уходе со страницы
            window.addEventListener('beforeunload', () => {
                clearInterval(timerInterval);
                clearInterval(updateInterval);
            });
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

        // Запускаем пинги и проверку состояния игры
        startPinging(gameCode, nickname);
        startGameStateCheck(gameCode, nickname);
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

    function startPinging(gameCode, nickname) {
        // Отправляем пинг каждые 10 секунд
        const pingInterval = setInterval(async () => {
            try {
                await fetch('/api/ping', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ gameCode, nickname })
                });
            } catch (error) {
                console.error('Ошибка пинга:', error);
            }
        }, 10000);

        // Сохраняем ID интервала, чтобы можно было остановить пинги при необходимости
        window.addEventListener('beforeunload', () => {
            clearInterval(pingInterval);
        });
    }

    // Добавляем новую функцию для получения вопроса
    async function getQuestion(gameCode, nickname) {
        const response = await fetch(`/api/get-question/${gameCode}/${nickname}`);
        const data = await response.json();
        
        if (!data.success) {
            console.error('Ошибка получения вопроса:', data.error);
            return null;
        }
        
        return data;
    }

    // Обновляем функцию показа вопросов
    function showQuestions(questions) {
        const mainContainer = document.querySelector('.main-container');
        const TIMER_DURATION = 300; // 5 минут в секундах
        let timeLeft = TIMER_DURATION;
        let timerInterval;
        
        // Показываем только первый вопрос изначально
        mainContainer.innerHTML = `
            <div class="questions-screen">
                <div class="timer">Осталось времени: ${Math.floor(timeLeft/60)}:${(timeLeft%60).toString().padStart(2, '0')}</div>
                <div class="question-section" id="current-question">
                    <div class="question-box">
                        <h2>${questions[0].question}</h2>
                    </div>
                    <textarea class="answer-input" placeholder="Введи свой ответ здесь..." rows="4"></textarea>
                    <button class="submit-answer">Отправить ответ</button>
                </div>
            </div>
        `;

        let currentQuestionIndex = 0;

        // Запускаем таймер
        function startTimer() {
            const timerElement = document.querySelector('.timer');
            
            timerInterval = setInterval(() => {
                timeLeft--;
                
                if (timeLeft >= 0) {
                    const minutes = Math.floor(timeLeft / 60);
                    const seconds = timeLeft % 60;
                    timerElement.textContent = `Осталось времени: ${minutes}:${seconds.toString().padStart(2, '0')}`;
                    timerElement.style.color = timeLeft < 30 ? '#ff4444' : '#007bff';
                } else {
                    clearInterval(timerInterval);
                    // Время вышло, показываем экран ожидания
                    mainContainer.innerHTML = `
                        <div class="waiting-screen">
                            <h2>Время вышло!</h2>
                            <p>Ожидайте ответы других игроков...</p>
                        </div>
                    `;
                }
            }, 1000);
        }

        startTimer();

        // Добавляем обработчик для кнопки отправки
        const submitButton = document.querySelector('.submit-answer');
        submitButton.addEventListener('click', () => {
            if (timeLeft <= 0) {
                alert('Время вышло!');
                return;
            }

            const section = document.getElementById('current-question');
            const answerInput = section.querySelector('.answer-input');
            const answer = answerInput.value.trim();
            
            if (!answer) {
                alert('Пожалуйста, введите ответ!');
                return;
            }

            currentQuestionIndex++;

            // Отправляем информацию о завершении после каждого ответа
            fetch('/api/player-finished', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    gameCode: currentGameCode, 
                    nickname: currentNickname 
                })
            });

            // Если есть второй вопрос, показываем его
            if (currentQuestionIndex < questions.length) {
                const questionSection = document.querySelector('.question-section');
                questionSection.innerHTML = `
                    <div class="question-box">
                        <h2>${questions[currentQuestionIndex].question}</h2>
                    </div>
                    <textarea class="answer-input" placeholder="Введи свой ответ здесь..." rows="4"></textarea>
                    <button class="submit-answer">Отправить ответ</button>
                `;

                // Добавляем обработчик для нового вопроса
                const newSubmitButton = questionSection.querySelector('.submit-answer');
                newSubmitButton.addEventListener('click', () => {
                    if (timeLeft <= 0) {
                        alert('Время вышло!');
                        return;
                    }

                    const newAnswerInput = questionSection.querySelector('.answer-input');
                    const newAnswer = newAnswerInput.value.trim();
                    
                    if (!newAnswer) {
                        alert('Пожалуйста, введите отве��!');
                        return;
                    }

                    clearInterval(timerInterval); // Останавливаем таймер

                    // Отправляем информацию о завершении после второго ответа
                    fetch('/api/player-finished', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ 
                            gameCode: currentGameCode, 
                            nickname: currentNickname 
                        })
                    });

                    // Показываем экран ожидания
                    mainContainer.innerHTML = `
                        <div class="waiting-screen">
                            <h2>Ожидайте ответы других игроков...</h2>
                        </div>
                    `;
                });
            } else {
                clearInterval(timerInterval); // Останавливаем таймер
                
                // Показываем экран ожидания
                mainContainer.innerHTML = `
                    <div class="waiting-screen">
                        <h2>Ожидайте ответы других игроков...</h2>
                    </div>
                `;
            }
        });
    }

    // Обновляем функцию проверки состояния игры
    function startGameStateCheck(gameCode, nickname) {
        const checkInterval = setInterval(async () => {
            const data = await getQuestion(gameCode, nickname);
            
            if (data?.questions?.length > 0) {
                showQuestions(data.questions);
                clearInterval(checkInterval);
            }
        }, 1000);

        // Сохраняем ID интервала
        window.addEventListener('beforeunload', () => {
            clearInterval(checkInterval);
        });
    }
});

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
} 