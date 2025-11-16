/* gamification.js - Quiz interactivo sobre Fuerteventura */

const quizData = [
    {
        question: '¿Cuál es la playa más larga de Fuerteventura?',
        options: ['Cofete', 'Sotavento', 'Corralejo', 'El Cotillo'],
        correct: 0,
        reward: '🏖️'
    },
    {
        question: '¿Qué viento predomina en Fuerteventura?',
        options: ['Levante', 'Alisio', 'Poniente', 'Tramontana'],
        correct: 1,
        reward: '💨'
    },
    {
        question: '¿Cuál es el producto gastronómico más famoso de la isla?',
        options: ['Gofio', 'Queso Majorero', 'Papas arrugadas', 'Mojo picón'],
        correct: 1,
        reward: '🧀'
    },
    {
        question: '¿En qué año fue declarada Reserva de la Biosfera?',
        options: ['2000', '2005', '2009', '2015'],
        correct: 2,
        reward: '🌍'
    },
    {
        question: '¿Qué deporte es más popular en Fuerteventura?',
        options: ['Surf', 'Windsurf', 'Buceo', 'Senderismo'],
        correct: 1,
        reward: '🏄'
    }
];

let currentQuestion = 0;
let score = 0;
let rewards = [];

function initQuiz() {
    const quizContainer = document.getElementById('quiz-container');
    if (!quizContainer) return;
    
    showQuestion();
}

function showQuestion() {
    const quizContainer = document.getElementById('quiz-container');
    const data = quizData[currentQuestion];
    
    const progClass = 'prog-' + currentQuestion;
    quizContainer.innerHTML = `
        <div class="quiz-card">
            <div class="quiz-progress">
                <div class="quiz-progress-head">
                    <span class="quiz-progress-meta">Pregunta ${currentQuestion + 1} de ${quizData.length}</span>
                    <span class="quiz-progress-score">Puntos: ${score}</span>
                </div>
                <div class="quiz-progress-track">
                    <div class="quiz-progress-bar ${progClass}"></div>
                </div>
            </div>
            <h3 class="quiz-title">${data.question}</h3>
            <div class="quiz-options">
                ${data.options.map((option, index) => `
                    <button class="quiz-option" data-index="${index}">${option}</button>
                `).join('')}
            </div>
            <div class="quiz-rewards">${rewards.join(' ')}</div>
        </div>`;
    
    // Añadir event listeners a las opciones
    document.querySelectorAll('.quiz-option').forEach(btn => {
        btn.addEventListener('click', handleAnswer);
        // hover handled by CSS; no inline styles needed
    });
}

function handleAnswer(e) {
    const selectedIndex = parseInt(e.target.dataset.index);
    const data = quizData[currentQuestion];
    const isCorrect = selectedIndex === data.correct;
    
    // Deshabilitar todos los botones
    document.querySelectorAll('.quiz-option').forEach(btn => {
        btn.disabled = true;
        btn.classList.add('is-disabled');
    });
    
    // Marcar respuesta
    e.target.classList.add('selected');
    if (isCorrect) {
        e.target.classList.add('is-correct');
        score += 10;
        rewards.push(data.reward);
    } else {
        e.target.classList.add('is-wrong');
        // Mostrar la correcta
        const correctBtn = document.querySelectorAll('.quiz-option')[data.correct];
        if (correctBtn) correctBtn.classList.add('is-correct-answer');
    }
    
    // Siguiente pregunta o finalizar
    setTimeout(() => {
        currentQuestion++;
        if (currentQuestion < quizData.length) {
            showQuestion();
        } else {
            showResults();
        }
    }, 1500);
}

function showResults() {
    const quizContainer = document.getElementById('quiz-container');
    const percentage = (score / (quizData.length * 10)) * 100;
    
    let message = '';
    if (percentage >= 80) {
        message = '¡Excelente! Eres un experto en Fuerteventura';
    } else if (percentage >= 60) {
        message = '¡Bien hecho! Conoces bastante la isla';
    } else if (percentage >= 40) {
        message = 'No está mal, pero hay mucho por descubrir';
    } else {
        message = 'Tienes que visitar más Fuerteventura';
    }
    
    quizContainer.innerHTML = `
        <div class="quiz-results">
            <div class="quiz-rewards-big">${rewards.join(' ')}</div>
            <h2 class="quiz-done-title">¡Quiz Completado!</h2>
            <div class="quiz-score">${score} / ${quizData.length * 10}</div>
            <p class="quiz-message">${message}</p>
            <button id="reset-quiz-btn" class="btn">Volver a intentar</button>
        </div>`;
    const resetBtn = document.getElementById('reset-quiz-btn');
    if (resetBtn) resetBtn.addEventListener('click', resetQuiz);
}

function resetQuiz() {
    currentQuestion = 0;
    score = 0;
    rewards = [];
    showQuestion();
}

// Inicializar si existe el contenedor
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('quiz-container')) {
        initQuiz();
    }
});

// Exponer función reset globalmente
window.resetQuiz = resetQuiz;
