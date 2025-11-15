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
    
    quizContainer.innerHTML = `
        <div class="quiz-card" style="background:white;padding:2rem;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.1);max-width:600px;margin:0 auto;">
            <div class="quiz-progress" style="margin-bottom:1.5rem;">
                <div style="display:flex;justify-content:space-between;margin-bottom:0.5rem;">
                    <span style="font-size:0.9rem;color:#666;">Pregunta ${currentQuestion + 1} de ${quizData.length}</span>
                    <span style="font-size:0.9rem;color:var(--color-mar);">Puntos: ${score}</span>
                </div>
                <div style="height:8px;background:#e0e0e0;border-radius:4px;overflow:hidden;">
                    <div style="height:100%;background:var(--gradient-ocean);width:${((currentQuestion) / quizData.length) * 100}%;transition:width 0.3s;"></div>
                </div>
            </div>
            
            <h3 style="font-family:var(--font-display);color:var(--color-volcan);margin-bottom:1.5rem;font-size:1.3rem;">${data.question}</h3>
            
            <div class="quiz-options" style="display:grid;gap:1rem;">
                ${data.options.map((option, index) => `
                    <button class="quiz-option" data-index="${index}" 
                            style="padding:1rem;border:2px solid #e0e0e0;border-radius:12px;background:white;text-align:left;cursor:pointer;transition:all 0.3s;font-size:1rem;">
                        ${option}
                    </button>
                `).join('')}
            </div>
            
            <div class="quiz-rewards" style="margin-top:1.5rem;text-align:center;font-size:2rem;">
                ${rewards.join(' ')}
            </div>
        </div>
    `;
    
    // Añadir event listeners a las opciones
    document.querySelectorAll('.quiz-option').forEach(btn => {
        btn.addEventListener('click', handleAnswer);
        btn.addEventListener('mouseenter', function() {
            this.style.borderColor = 'var(--color-mar)';
            this.style.transform = 'translateX(8px)';
        });
        btn.addEventListener('mouseleave', function() {
            if (!this.classList.contains('selected')) {
                this.style.borderColor = '#e0e0e0';
                this.style.transform = 'translateX(0)';
            }
        });
    });
}

function handleAnswer(e) {
    const selectedIndex = parseInt(e.target.dataset.index);
    const data = quizData[currentQuestion];
    const isCorrect = selectedIndex === data.correct;
    
    // Deshabilitar todos los botones
    document.querySelectorAll('.quiz-option').forEach(btn => {
        btn.disabled = true;
        btn.style.cursor = 'not-allowed';
    });
    
    // Marcar respuesta
    e.target.classList.add('selected');
    if (isCorrect) {
        e.target.style.borderColor = '#28a745';
        e.target.style.background = '#d4edda';
        score += 10;
        rewards.push(data.reward);
    } else {
        e.target.style.borderColor = '#dc3545';
        e.target.style.background = '#f8d7da';
        // Mostrar la correcta
        document.querySelectorAll('.quiz-option')[data.correct].style.borderColor = '#28a745';
        document.querySelectorAll('.quiz-option')[data.correct].style.background = '#d4edda';
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
        <div class="quiz-results" style="background:white;padding:3rem 2rem;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.1);max-width:600px;margin:0 auto;text-align:center;">
            <div style="font-size:4rem;margin-bottom:1rem;">${rewards.join(' ')}</div>
            <h2 style="font-family:var(--font-display);color:var(--color-cielo);margin-bottom:1rem;">¡Quiz Completado!</h2>
            <div style="font-size:3rem;font-weight:bold;color:var(--color-mar);margin:1rem 0;">${score} / ${quizData.length * 10}</div>
            <p style="font-size:1.2rem;color:#666;margin-bottom:2rem;">${message}</p>
            <button onclick="resetQuiz()" class="btn" style="padding:1rem 2rem;background:var(--gradient-ocean);color:white;border:none;border-radius:12px;cursor:pointer;font-size:1rem;">
                Volver a intentar
            </button>
        </div>
    `;
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
