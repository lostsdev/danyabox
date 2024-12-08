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
        '/nyaa/whiteup.png'
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
});

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
} 