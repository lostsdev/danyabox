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
});

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
} 