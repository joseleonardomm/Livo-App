// questionnaire.js
// Manejo del cuestionario interactivo

class QuestionnaireManager {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = CONFIG.QUESTIONNAIRE.TOTAL_QUESTIONS;
        this.userData = {
            businessType: null,
            features: [],
            goal: null,
            style: null
        };
        
        // Mapeo de valores legibles
        this.valueLabels = {
            businessType: {
                'product-sales': 'Venta de productos',
                'services': 'Servicios',
                'appointments': 'Negocio por citas',
                'restaurant': 'Restaurante',
                'hardware-store': 'Ferretería',
                'digital': 'Emprendimiento digital',
                'other': 'Otro'
            },
            goal: {
                'sell': 'Vender',
                'messages': 'Recibir mensajes',
                'appointments-goal': 'Agendar citas',
                'information': 'Mostrar información'
            },
            style: {
                'modern': 'Moderno',
                'minimalist': 'Minimalista',
                'classic': 'Clásico',
                'colorful': 'Colorido'
            },
            features: {
                'show-products': 'Mostrar productos',
                'catalog': 'Catálogo simple',
                'whatsapp': 'Botón de WhatsApp',
                'appointments': 'Agenda de citas',
                'contact-form': 'Formulario de contacto',
                'hours': 'Horarios',
                'location': 'Ubicación (Google Maps)'
            }
        };
        
        this.init();
    }
    
    init() {
        console.log('📋 Inicializando cuestionario...');
        this.bindEvents();
        this.updateProgress();
        this.showCurrentQuestion();
    }
    
    bindEvents() {
        // Botón de inicio
        const startBtn = document.getElementById('start-btn');
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startQuestionnaire());
        }
        
        // Botones de navegación
        const nextBtn = document.getElementById('next-btn');
        const prevBtn = document.getElementById('prev-btn');
        const generateBtn = document.getElementById('generate-btn');
        
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextStep());
        if (prevBtn) prevBtn.addEventListener('click', () => this.prevStep());
        if (generateBtn) generateBtn.addEventListener('click', (e) => this.submitQuestionnaire(e));
        
        // Eventos para opciones
        this.bindOptionEvents();
    }
    
    bindOptionEvents() {
        // Opciones de radio (selección única)
        document.querySelectorAll('.question input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.handleRadioChange(e));
        });
        
        // Opciones de checkbox (selección múltiple)
        document.querySelectorAll('.question input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => this.handleCheckboxChange(e));
        });
        
        // Efectos hover en tarjetas
        document.querySelectorAll('.option-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px)';
                card.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = '';
            });
        });
    }
    
    startQuestionnaire() {
        console.log('▶️ Iniciando cuestionario');
        
        // Ocultar hero section
        const heroSection = document.querySelector('.hero');
        if (heroSection) {
            heroSection.style.display = 'none';
        }
        
        // Mostrar sección del cuestionario
        const questionnaireSection = document.getElementById('questionnaire-section');
        if (questionnaireSection) {
            questionnaireSection.classList.remove('hidden');
            questionnaireSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Actualizar UI
        this.updateProgress();
        this.showCurrentQuestion();
        
        // Trackear inicio
        this.trackEvent('questionnaire_started');
    }
    
    showCurrentQuestion() {
        // Ocultar todas las preguntas
        document.querySelectorAll('.question').forEach(question => {
            question.classList.remove('active');
            question.style.display = 'none';
        });
        
        // Mostrar pregunta actual
        const currentQuestion = document.querySelector(`[data-question="${this.currentStep}"]`);
        if (currentQuestion) {
            currentQuestion.classList.add('active');
            currentQuestion.style.display = 'block';
            
            // Animación de entrada
            currentQuestion.style.animation = 'fadeIn 0.5s ease';
        }
        
        // Actualizar botones de navegación
        this.updateNavigationButtons();
        
        // Actualizar indicador de pasos
        this.updateStepIndicator();
        
        // Scroll a la pregunta
        window.scrollTo({
            top: currentQuestion?.offsetTop - 100 || 0,
            behavior: 'smooth'
        });
    }
    
    updateProgress() {
        const progressBar = document.getElementById('progress');
        if (progressBar) {
            const percentage = (this.currentStep / this.totalSteps) * 100;
            progressBar.style.width = `${percentage}%`;
            progressBar.setAttribute('aria-valuenow', percentage);
        }
    }
    
    updateStepIndicator() {
        document.querySelectorAll('.step').forEach((step, index) => {
            const stepNumber = parseInt(step.dataset.step);
            
            if (stepNumber < this.currentStep) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (stepNumber === this.currentStep) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
    }
    
    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const generateBtn = document.getElementById('generate-btn');
        
        if (prevBtn) {
            prevBtn.classList.toggle('hidden', this.currentStep === 1);
        }
        
        if (nextBtn) {
            nextBtn.classList.toggle('hidden', this.currentStep === this.totalSteps);
        }
        
        if (generateBtn) {
            generateBtn.classList.toggle('hidden', this.currentStep !== this.totalSteps);
        }
    }
    
    validateCurrentStep() {
        const currentQuestion = document.querySelector(`[data-question="${this.currentStep}"]`);
        
        switch (this.currentStep) {
            case 1: // Tipo de negocio
                const businessTypeSelected = currentQuestion.querySelector('input[name="businessType"]:checked');
                if (!businessTypeSelected) {
                    this.showValidationError('Por favor, selecciona un tipo de negocio');
                    return false;
                }
                break;
                
            case 2: // Características
                const featuresSelected = currentQuestion.querySelectorAll('input[name="features"]:checked');
                if (featuresSelected.length < CONFIG.VALIDATION.MIN_FEATURES) {
                    this.showValidationError(`Selecciona al menos ${CONFIG.VALIDATION.MIN_FEATURES} característica`);
                    return false;
                }
                break;
                
            case 3: // Objetivo
                const goalSelected = currentQuestion.querySelector('input[name="goal"]:checked');
                if (!goalSelected) {
                    this.showValidationError('Por favor, selecciona un objetivo principal');
                    return false;
                }
                break;
                
            case 4: // Estilo
                const styleSelected = currentQuestion.querySelector('input[name="style"]:checked');
                if (!styleSelected) {
                    this.showValidationError('Por favor, selecciona un estilo visual');
                    return false;
                }
                break;
        }
        
        return true;
    }
    
    showValidationError(message) {
        // Crear o mostrar mensaje de error
        let errorEl = document.querySelector('.validation-error');
        
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'validation-error';
            errorEl.style.cssText = `
                background: ${CONFIG.STYLES.COLORS.DANGER};
                color: white;
                padding: 10px 15px;
                border-radius: 5px;
                margin: 10px 0;
                animation: shake 0.5s;
            `;
            
            const currentQuestion = document.querySelector(`[data-question="${this.currentStep}"]`);
            currentQuestion.insertBefore(errorEl, currentQuestion.firstChild);
        }
        
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        
        // Auto-ocultar después de 5 segundos
        setTimeout(() => {
            errorEl.style.display = 'none';
        }, 5000);
    }
    
    handleRadioChange(event) {
        const input = event.target;
        const questionType = input.getAttribute('name');
        const value = input.value;
        
        // Actualizar datos del usuario
        this.userData[questionType] = value;
        
        // Actualizar UI de la opción seleccionada
        document.querySelectorAll(`input[name="${questionType}"]`).forEach(radio => {
            const card = radio.closest('.option-card');
            if (card) {
                card.classList.toggle('selected', radio.checked);
            }
        });
        
        console.log(`✅ ${questionType}: ${value}`);
        
        // Trackear selección
        this.trackEvent('option_selected', {
            question: questionType,
            value: value
        });
    }
    
    handleCheckboxChange(event) {
        const input = event.target;
        const value = input.value;
        
        // Actualizar array de features
        if (input.checked) {
            if (!this.userData.features.includes(value)) {
                this.userData.features.push(value);
            }
        } else {
            this.userData.features = this.userData.features.filter(f => f !== value);
        }
        
        // Actualizar UI
        const card = input.closest('.option-card');
        if (card) {
            card.classList.toggle('selected', input.checked);
        }
        
        console.log(`✅ Features: ${this.userData.features.join(', ')}`);
        
        // Trackear selección
        this.trackEvent('feature_selected', {
            feature: value,
            selected: input.checked,
            totalFeatures: this.userData.features.length
        });
    }
    
    nextStep() {
        if (!this.validateCurrentStep()) {
            return;
        }
        
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.updateProgress();
            this.showCurrentQuestion();
            
            // Trackear navegación
            this.trackEvent('next_step', {
                fromStep: this.currentStep - 1,
                toStep: this.currentStep
            });
        }
    }
    
    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateProgress();
            this.showCurrentQuestion();
            
            // Trackear navegación
            this.trackEvent('prev_step', {
                fromStep: this.currentStep + 1,
                toStep: this.currentStep
            });
        }
    }
    
    async submitQuestionnaire(event) {
        if (event) event.preventDefault();
        
        if (!this.validateCurrentStep()) {
            return;
        }
        
        // Validar datos completos
        for (const field of CONFIG.VALIDATION.REQUIRED_FIELDS) {
            if (!this.userData[field]) {
                this.showValidationError(`Falta completar: ${field}`);
                return;
            }
        }
        
        console.log('📦 Datos completos del usuario:', this.userData);
        
        // Trackear finalización
        this.trackEvent('questionnaire_completed', {
            businessType: this.userData.businessType,
            featuresCount: this.userData.features.length,
            goal: this.userData.goal,
            style: this.userData.style
        });
        
        // Enviar datos al controlador principal
        if (window.app && typeof window.app.generateDemo === 'function') {
            await window.app.generateDemo(this.userData);
        } else {
            console.error('App controller no encontrado');
        }
    }
    
    getUserData() {
        return { ...this.userData };
    }
    
    reset() {
        this.currentStep = 1;
        this.userData = {
            businessType: null,
            features: [],
            goal: null,
            style: null
        };
        
        // Resetear UI
        document.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
            input.checked = false;
            const card = input.closest('.option-card');
            if (card) card.classList.remove('selected');
        });
        
        this.updateProgress();
        this.showCurrentQuestion();
        
        console.log('🔄 Cuestionario reiniciado');
    }
    
    trackEvent(eventName, data = {}) {
        // Simplemente loguear por ahora
        console.log(`📊 Evento: ${eventName}`, data);
        
        // Aquí podrías integrar Google Analytics, Mixpanel, etc.
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, data);
        }
    }
    
    getReadableData() {
        const readable = { ...this.userData };
        
        // Convertir valores a texto legible
        if (readable.businessType) {
            readable.businessTypeText = this.valueLabels.businessType[readable.businessType] || readable.businessType;
        }
        
        if (readable.goal) {
            readable.goalText = this.valueLabels.goal[readable.goal] || readable.goal;
        }
        
        if (readable.style) {
            readable.styleText = this.valueLabels.style[readable.style] || readable.style;
        }
        
        if (readable.features && Array.isArray(readable.features)) {
            readable.featuresText = readable.features.map(f => 
                this.valueLabels.features[f] || f
            );
        }
        
        return readable;
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.QuestionnaireManager = new QuestionnaireManager();
});