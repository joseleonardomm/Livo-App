// app.js
// Controlador principal de la aplicación Livo-App

class LivoApp {
    constructor() {
        this.state = {
            isLoading: false,
            currentSection: 'home',
            userData: null,
            generatedDemo: null,
            apiStatus: null
        };
        
        this.components = {};
        this.init();
    }
    
    async init() {
        console.log('🚀 Iniciando Livo-App...');
        
        // Inicializar componentes
        await this.initializeComponents();
        
        // Verificar estado de la API
        await this.checkApiStatus();
        
        // Configurar eventos globales
        this.setupGlobalEvents();
        
        // Inicializar UI
        this.initializeUI();
        
        console.log('✅ Livo-App inicializada correctamente');
    }
    
    async initializeComponents() {
        // Asegurarse de que los componentes están cargados
        this.components = {
            config: window.CONFIG,
            api: window.ApiService,
            questionnaire: window.QuestionnaireManager,
            preview: window.PreviewManager
        };
        
        // Si algún componente no está disponible, cargarlo dinámicamente
        if (!this.components.api) {
            console.warn('ApiService no encontrado, cargando...');
            // En una app real, podrías cargar dinámicamente aquí
        }
    }
    
    async checkApiStatus() {
        console.log('🔍 Verificando estado de la API...');
        
        try {
            const healthCheck = await ApiService.checkHealth();
            this.state.apiStatus = healthCheck;
            
            if (healthCheck.success) {
                console.log('✅ API conectada correctamente');
                this.showApiStatus(true);
            } else {
                console.warn('⚠️ API no disponible:', healthCheck.error);
                this.showApiStatus(false, healthCheck.error);
            }
            
        } catch (error) {
            console.error('❌ Error verificando API:', error);
            this.state.apiStatus = { success: false, error: error.message };
            this.showApiStatus(false, error.message);
        }
    }
    
    showApiStatus(isHealthy, error = null) {
        // Crear o actualizar indicador de estado
        let statusIndicator = document.getElementById('api-status-indicator');
        
        if (!statusIndicator) {
            statusIndicator = document.createElement('div');
            statusIndicator.id = 'api-status-indicator';
            statusIndicator.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                padding: 5px 10px;
                border-radius: 3px;
                font-size: 12px;
                z-index: 9999;
                display: flex;
                align-items: center;
                gap: 5px;
            `;
            document.body.appendChild(statusIndicator);
        }
        
        if (isHealthy) {
            statusIndicator.innerHTML = '<i class="fas fa-check-circle"></i> API Conectada';
            statusIndicator.style.background = CONFIG.STYLES.COLORS.SUCCESS;
            statusIndicator.style.color = 'white';
            
            // Auto-ocultar después de 5 segundos
            setTimeout(() => {
                statusIndicator.style.opacity = '0';
                setTimeout(() => {
                    if (statusIndicator.parentNode) {
                        statusIndicator.style.display = 'none';
                    }
                }, 500);
            }, 5000);
            
        } else {
            statusIndicator.innerHTML = `<i class="fas fa-exclamation-triangle"></i> API Offline`;
            statusIndicator.style.background = CONFIG.STYLES.COLORS.DANGER;
            statusIndicator.style.color = 'white';
            statusIndicator.title = error || 'Error de conexión';
        }
    }
    
    setupGlobalEvents() {
        // Manejar errores globales
        window.addEventListener('error', (event) => {
            console.error('⚠️ Error global capturado:', event.error);
            this.trackError(event.error);
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            console.error('⚠️ Promesa rechazada no manejada:', event.reason);
            this.trackError(event.reason);
        });
        
        // Manejar cambios de visibilidad de la página
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.trackEvent('page_visible');
            } else {
                this.trackEvent('page_hidden');
            }
        });
        
        // Manejar antes de que la página se cierre
        window.addEventListener('beforeunload', (event) => {
            // Guardar datos localmente si es necesario
            this.saveSessionData();
            
            // Trackear salida
            this.trackEvent('page_unload', {
                timeSpent: this.getSessionDuration(),
                currentSection: this.state.currentSection
            });
        });
    }
    
    initializeUI() {
        // Configurar elementos de la interfaz
        this.setupHeader();
        this.setupFooter();
        this.setupModals();
        
        // Mostrar sección inicial
        this.showSection('home');
        
        // Inicializar tooltips si existen
        this.initTooltips();
    }
    
    setupHeader() {
        const header = document.querySelector('header');
        if (!header) return;
        
        // Agregar logo dinámico
        const logo = header.querySelector('.logo');
        if (logo) {
            logo.innerHTML = `
                <i class="fas fa-robot"></i>
                <span>${CONFIG.APP.NAME}</span>
                <small>v${CONFIG.APP.VERSION}</small>
            `;
        }
        
        // Agregar botón de reinicio
        const restartBtn = document.createElement('button');
        restartBtn.id = 'restart-btn';
        restartBtn.className = 'btn-secondary';
        restartBtn.innerHTML = '<i class="fas fa-redo"></i> Reiniciar';
        restartBtn.addEventListener('click', () => this.restartApp());
        
        header.appendChild(restartBtn);
    }
    
    setupFooter() {
        const footer = document.querySelector('footer');
        if (!footer) return;
        
        // Agregar información dinámica al footer
        const copyright = footer.querySelector('.copyright');
        if (copyright) {
            const year = new Date().getFullYear();
            copyright.innerHTML = `
                © ${year} ${CONFIG.APP.NAME}. 
                <span id="demo-count">Demos generados: Cargando...</span>
            `;
            
            // Actualizar contador (simulado por ahora)
            setTimeout(() => {
                document.getElementById('demo-count').textContent = 
                    `Demos generados: ${Math.floor(Math.random() * 1000) + 1}`;
            }, 2000);
        }
    }
    
    setupModals() {
        // Crear contenedor para modales dinámicos
        const modalContainer = document.createElement('div');
        modalContainer.id = 'modal-container';
        modalContainer.style.display = 'none';
        document.body.appendChild(modalContainer);
    }
    
    initTooltips() {
        // Inicializar tooltips si se usan
        const tooltips = document.querySelectorAll('[data-tooltip]');
        tooltips.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                const tooltipText = e.target.dataset.tooltip;
                this.showTooltip(e, tooltipText);
            });
            
            element.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });
    }
    
    showTooltip(event, text) {
        let tooltip = document.getElementById('global-tooltip');
        
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'global-tooltip';
            tooltip.style.cssText = `
                position: absolute;
                background: #333;
                color: white;
                padding: 5px 10px;
                border-radius: 3px;
                font-size: 12px;
                z-index: 10000;
                pointer-events: none;
                white-space: nowrap;
            `;
            document.body.appendChild(tooltip);
        }
        
        tooltip.textContent = text;
        tooltip.style.left = `${event.pageX + 10}px`;
        tooltip.style.top = `${event.pageY + 10}px`;
        tooltip.style.display = 'block';
    }
    
    hideTooltip() {
        const tooltip = document.getElementById('global-tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }
    
    showSection(sectionId) {
        // Ocultar todas las secciones
        document.querySelectorAll('.section').forEach(section => {
            section.classList.add('hidden');
        });
        
        // Mostrar sección solicitada
        const targetSection = document.getElementById(`${sectionId}-section`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            
            // Scroll a la sección
            setTimeout(() => {
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
        
        // Actualizar estado
        this.state.currentSection = sectionId;
        
        // Trackear cambio de sección
        this.trackEvent('section_changed', { section: sectionId });
    }
    
    async generateDemo(userData) {
        if (this.state.isLoading) {
            console.warn('Ya hay una generación en proceso');
            return;
        }
        
        this.state.isLoading = true;
        this.state.userData = userData;
        
        // Mostrar loading en el preview manager
        if (this.components.preview) {
            this.components.preview.showLoading();
        }
        
        try {
            console.log('🚀 Generando demo con datos:', userData);
            
            // Trackear inicio de generación
            this.trackEvent('demo_generation_started', {
                businessType: userData.businessType,
                featuresCount: userData.features.length
            });
            
            // Llamar a la API
            const result = await ApiService.generateDemo(userData);
            
            // Actualizar estado
            this.state.generatedDemo = result;
            this.state.isLoading = false;
            
            // Trackear resultado
            this.trackEvent('demo_generation_completed', {
                success: result.success,
                hasFallback: !!result.fallback,
                htmlLength: result.data?.html?.length || 0
            });
            
            // Mostrar resultado
            if (this.components.preview) {
                await this.components.preview.displayDemo(result.data || result.fallback);
            }
            
            // Mostrar sección de preview
            this.showSection('preview');
            
        } catch (error) {
            console.error('❌ Error en generateDemo:', error);
            
            this.state.isLoading = false;
            
            // Trackear error
            this.trackEvent('demo_generation_failed', {
                error: error.message,
                businessType: userData.businessType
            });
            
            // Mostrar error en preview
            if (this.components.preview) {
                this.components.preview.showError(error.message || 'Error generando el demo');
            }
        }
    }
    
    restartApp() {
        if (confirm('¿Estás seguro de que quieres reiniciar? Perderás el progreso actual.')) {
            // Resetear cuestionario
            if (this.components.questionnaire) {
                this.components.questionnaire.reset();
            }
            
            // Limpiar estado
            this.state = {
                isLoading: false,
                currentSection: 'home',
                userData: null,
                generatedDemo: null,
                apiStatus: this.state.apiStatus // Mantener estado de API
            };
            
            // Mostrar sección inicial
            this.showSection('home');
            
            // Mostrar hero section
            const heroSection = document.querySelector('.hero');
            if (heroSection) {
                heroSection.style.display = 'block';
            }
            
            // Trackear reinicio
            this.trackEvent('app_restarted');
            
            console.log('🔄 Aplicación reiniciada');
        }
    }
    
    saveSessionData() {
        // Guardar datos en localStorage
        try {
            const sessionData = {
                userData: this.state.userData,
                generatedDemo: this.state.generatedDemo,
                timestamp: new Date().toISOString(),
                sessionId: this.getSessionId()
            };
            
            localStorage.setItem('livo_app_session', JSON.stringify(sessionData));
        } catch (error) {
            console.warn('No se pudo guardar la sesión:', error);
        }
    }
    
    loadSessionData() {
        // Cargar datos desde localStorage
        try {
            const saved = localStorage.getItem('livo_app_session');
            if (saved) {
                const sessionData = JSON.parse(saved);
                
                // Verificar si la sesión es reciente (menos de 1 hora)
                const savedTime = new Date(sessionData.timestamp);
                const now = new Date();
                const hoursDiff = (now - savedTime) / (1000 * 60 * 60);
                
                if (hoursDiff < 1) {
                    this.state.userData = sessionData.userData;
                    this.state.generatedDemo = sessionData.generatedDemo;
                    
                    console.log('📂 Sesión recuperada');
                    return true;
                } else {
                    // Sesión expirada, limpiar
                    localStorage.removeItem('livo_app_session');
                }
            }
        } catch (error) {
            console.warn('Error al cargar sesión:', error);
        }
        
        return false;
    }
    
    getSessionId() {
        let sessionId = localStorage.getItem('livo_app_session_id');
        
        if (!sessionId) {
            sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('livo_app_session_id', sessionId);
        }
        
        return sessionId;
    }
    
    getSessionDuration() {
        const startTime = parseInt(localStorage.getItem('livo_app_session_start')) || Date.now();
        localStorage.setItem('livo_app_session_start', startTime);
        
        return Date.now() - startTime;
    }
    
    trackEvent(eventName, data = {}) {
        // Agregar datos de sesión
        const eventData = {
            ...data,
            sessionId: this.getSessionId(),
            appVersion: CONFIG.APP.VERSION,
            environment: CONFIG.APP.ENV,
            timestamp: new Date().toISOString()
        };
        
        console.log(`📊 App Event: ${eventName}`, eventData);
        
        // Integración con Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, eventData);
        }
        
        // Integración con Facebook Pixel
        if (typeof fbq !== 'undefined') {
            fbq('trackCustom', eventName, eventData);
        }
    }
    
    trackError(error) {
        const errorData = {
            message: error.message,
            stack: error.stack,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };
        
        console.error('🐛 Error tracked:', errorData);
        
        // Enviar error a tu backend para monitoreo
        if (this.components.api) {
            // No usar await para no bloquear
            this.components.api.request('/api/error-log', 'POST', errorData)
                .catch(() => { /* Ignorar errores en el logging */ });
        }
    }
    
    // Métodos de utilidad
    showNotification(message, type = 'info') {
        if (this.components.preview) {
            this.components.preview.showToast(message, type);
        } else {
            alert(message);
        }
    }
    
    openWhatsApp() {
        if (this.components.preview) {
            this.components.preview.openWhatsApp(this.state.userData);
        }
    }
    
    getAppStats() {
        return {
            sessionId: this.getSessionId(),
            sessionDuration: this.getSessionDuration(),
            currentSection: this.state.currentSection,
            hasUserData: !!this.state.userData,
            hasGeneratedDemo: !!this.state.generatedDemo,
            apiStatus: this.state.apiStatus?.success || false
        };
    }
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    // Asegurarse de que los archivos de configuración estén cargados
    if (!window.CONFIG || !window.ApiService) {
        console.error('Faltan archivos de configuración. Cargando...');
        
        // Esperar un momento para que se carguen los scripts
        setTimeout(async () => {
            window.app = new LivoApp();
        }, 500);
    } else {
        window.app = new LivoApp();
    }
});

// Hacer disponible globalmente
window.LivoApp = LivoApp;