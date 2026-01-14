// Main Application Controller
class WebGenApp {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.userData = {
            businessType: '',
            features: [],
            goal: '',
            style: ''
        };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.updateProgress();
    }
    
    bindEvents() {
        // Start button
        document.getElementById('start-btn').addEventListener('click', () => {
            this.showSection('questionnaire-section');
            this.hideSection('hero');
            this.scrollToTop();
        });
        
        // Navigation buttons
        document.getElementById('next-btn').addEventListener('click', () => this.nextQuestion());
        document.getElementById('prev-btn').addEventListener('click', () => this.prevQuestion());
        
        // Form submission
        document.getElementById('questionnaire-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.generateDemo();
        });
        
        // CTA buttons
        document.getElementById('whatsapp-cta').addEventListener('click', () => this.openWhatsApp());
        document.getElementById('email-cta').addEventListener('click', () => this.showEmailForm());
    }
    
    showSection(sectionId) {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.add('hidden');
        });
        document.getElementById(sectionId).classList.remove('hidden');
    }
    
    hideSection(sectionId) {
        document.getElementById(sectionId).classList.add('hidden');
    }
    
    scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    nextQuestion() {
        if (this.validateCurrentQuestion()) {
            if (this.currentStep < this.totalSteps) {
                this.currentStep++;
                this.updateQuestionDisplay();
                this.updateProgress();
                this.scrollToTop();
            }
        }
    }
    
    prevQuestion() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateQuestionDisplay();
            this.updateProgress();
            this.scrollToTop();
        }
    }
    
    validateCurrentQuestion() {
        const currentQuestion = document.querySelector(`[data-question="${this.currentStep}"]`);
        const requiredInputs = currentQuestion.querySelectorAll('[required]');
        const checkboxes = currentQuestion.querySelectorAll('input[type="checkbox"]:checked');
        
        if (requiredInputs.length > 0) {
            let isValid = true;
            requiredInputs.forEach(input => {
                if (!input.value && !input.checked) {
                    isValid = false;
                    this.highlightError(input);
                }
            });
            return isValid;
        }
        
        // For multi-select questions
        if (this.currentStep === 2 && checkboxes.length === 0) {
            alert('Por favor, selecciona al menos una característica');
            return false;
        }
        
        return true;
    }
    
    highlightError(input) {
        input.closest('.option-card').style.animation = 'shake 0.5s';
        input.closest('.option-card').style.borderColor = 'var(--warning)';
        
        setTimeout(() => {
            input.closest('.option-card').style.animation = '';
        }, 500);
    }
    
    updateQuestionDisplay() {
        // Hide all questions
        document.querySelectorAll('.question').forEach(q => {
            q.classList.remove('active');
        });
        
        // Show current question
        const currentQuestion = document.querySelector(`[data-question="${this.currentStep}"]`);
        currentQuestion.classList.add('active');
        
        // Update navigation buttons
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const generateBtn = document.getElementById('generate-btn');
        
        prevBtn.classList.toggle('hidden', this.currentStep === 1);
        nextBtn.classList.toggle('hidden', this.currentStep === this.totalSteps);
        generateBtn.classList.toggle('hidden', this.currentStep !== this.totalSteps);
    }
    
    updateProgress() {
        const progressPercentage = (this.currentStep / this.totalSteps) * 100;
        document.getElementById('progress').style.width = `${progressPercentage}%`;
        
        // Update step indicators
        document.querySelectorAll('.step').forEach((step, index) => {
            const stepNumber = parseInt(step.dataset.step);
            step.classList.toggle('active', stepNumber <= this.currentStep);
        });
    }
    
    collectUserData() {
        // Business type
        const businessType = document.querySelector('input[name="businessType"]:checked');
        if (businessType) this.userData.businessType = businessType.value;
        
        // Features
        this.userData.features = [];
        document.querySelectorAll('input[name="features"]:checked').forEach(cb => {
            this.userData.features.push(cb.value);
        });
        
        // Goal
        const goal = document.querySelector('input[name="goal"]:checked');
        if (goal) this.userData.goal = goal.value;
        
        // Style
        const style = document.querySelector('input[name="style"]:checked');
        if (style) this.userData.style = style.value;
    }
    
    async generateDemo() {
        if (!this.validateCurrentQuestion()) return;
        
        this.collectUserData();
        
        // Show preview section
        this.showSection('preview-section');
        
        try {
            // Send data to backend
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.userData)
            });
            
            if (!response.ok) {
                throw new Error('Error en la generación');
            }
            
            const demoCode = await response.json();
            
            // Display the generated demo
            this.displayDemo(demoCode);
            
        } catch (error) {
            console.error('Error:', error);
            this.showError('Hubo un error generando tu demo. Por favor, intenta nuevamente.');
        }
    }
    
    displayDemo(demoCode) {
        const frameContent = document.getElementById('frame-content');
        
        // Create a sandboxed iframe for safe execution
        frameContent.innerHTML = '';
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        
        // Create HTML document with the generated code
        const htmlDoc = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>${demoCode.css}</style>
            </head>
            <body>
                ${demoCode.html}
                <script>${demoCode.js}</script>
            </body>
            </html>
        `;
        
        frameContent.appendChild(iframe);
        iframe.srcdoc = htmlDoc;
    }
    
    showError(message) {
        const frameContent = document.getElementById('frame-content');
        frameContent.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error en la generación</h3>
                <p>${message}</p>
                <button onclick="location.reload()" class="btn-secondary">
                    <i class="fas fa-redo"></i> Intentar de nuevo
                </button>
            </div>
        `;
    }
    
    openWhatsApp() {
        const phoneNumber = '+1234567890'; // Replace with actual number
        const message = encodeURIComponent(
            `Hola, acabo de crear el demo de mi página web y quiero la versión completa.\n\n` +
            `Tipo de negocio: ${this.userData.businessType}\n` +
            `Características: ${this.userData.features.join(', ')}\n` +
            `Objetivo: ${this.userData.goal}\n` +
            `Estilo: ${this.userData.style}`
        );
        
        window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    }
    
    showEmailForm() {
        // Simple email form modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3><i class="fas fa-envelope"></i> Recibir Presupuesto</h3>
                <p>Déjanos tu email y te contactaremos con el presupuesto:</p>
                <input type="email" id="email-input" placeholder="tu@email.com" required>
                <div class="modal-buttons">
                    <button id="cancel-email" class="btn-secondary">Cancelar</button>
                    <button id="submit-email" class="btn-primary">Enviar</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add modal styles
        const style = document.createElement('style');
        style.textContent = `
            .modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }
            .modal-content {
                background: white;
                padding: 2rem;
                border-radius: var(--radius);
                max-width: 400px;
                width: 90%;
            }
            #email-input {
                width: 100%;
                padding: 12px;
                margin: 1rem 0;
                border: 2px solid var(--light-gray);
                border-radius: var(--radius);
                font-size: 1rem;
            }
            .modal-buttons {
                display: flex;
                gap: 1rem;
                justify-content: flex-end;
            }
        `;
        document.head.appendChild(style);
        
        // Event listeners
        document.getElementById('cancel-email').addEventListener('click', () => {
            document.body.removeChild(modal);
            document.head.removeChild(style);
        });
        
        document.getElementById('submit-email').addEventListener('click', () => {
            const email = document.getElementById('email-input').value;
            if (this.validateEmail(email)) {
                this.sendEmailLead(email);
                document.body.removeChild(modal);
                document.head.removeChild(style);
                alert('¡Gracias! Te contactaremos pronto.');
            }
        });
    }
    
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    sendEmailLead(email) {
        // Send lead data to backend
        fetch('/api/lead', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                ...this.userData,
                timestamp: new Date().toISOString()
            })
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new WebGenApp();
});