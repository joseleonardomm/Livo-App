// config.js
// Configuración global de la aplicación Livo-App

const CONFIG = {
    // URLs de la API - CAMBIA ESTA URL POR LA TUYA
    API_BASE_URL: 'https://livo-app-backend.onrender.com',
    
    // Rutas de la API
    API_ENDPOINTS: {
        HEALTH: '/api/health',
        GENERATE: '/api/generate',
        LEAD: '/api/lead'
    },
    
    // Configuración de la aplicación
    APP: {
        NAME: 'Livo-App',
        VERSION: '1.0.0',
        ENV: window.location.hostname === 'localhost' ? 'development' : 'production'
    },
    
    // Configuración del cuestionario
    QUESTIONNAIRE: {
        TOTAL_QUESTIONS: 4,
        DEFAULT_BUSINESS_TYPE: 'product-sales',
        DEFAULT_STYLE: 'modern'
    },
    
    // Configuración de WhatsApp
    WHATSAPP: {
        PHONE_NUMBER: '+1234567890', // Cambia por tu número real
        DEFAULT_MESSAGE: 'Hola, acabo de crear el demo de mi página web y quiero la versión completa.',
        AUTO_OPEN: true
    },
    
    // Configuración de la vista previa
    PREVIEW: {
        IFRAME_HEIGHT: '600px',
        LOADING_TIMEOUT: 30000, // 30 segundos
        SANDBOX_ATTRIBUTES: 'allow-same-origin allow-scripts allow-popups allow-forms'
    },
    
    // Configuración de estilos
    STYLES: {
        COLORS: {
            PRIMARY: '#4361ee',
            SECONDARY: '#7209b7',
            SUCCESS: '#4cc9f0',
            DANGER: '#f72585',
            WARNING: '#ff9e00'
        },
        ANIMATIONS: {
            DURATION: '300ms',
            EASING: 'ease-in-out'
        }
    },
    
    // Configuración de validación
    VALIDATION: {
        MIN_FEATURES: 1,
        REQUIRED_FIELDS: ['businessType', 'goal', 'style']
    }
};

// Exportar configuración para usar en otros archivos
window.CONFIG = CONFIG;

// Inicializar configuración
(function initConfig() {
    console.log(`${CONFIG.APP.NAME} v${CONFIG.APP.VERSION}`);
    console.log(`Entorno: ${CONFIG.APP.ENV}`);
    console.log(`API Base URL: ${CONFIG.API_BASE_URL}`);
    
    // Agregar clase al body según entorno
    document.body.classList.add(`env-${CONFIG.APP.ENV}`);
    
    // Mostrar alerta si estamos en desarrollo
    if (CONFIG.APP.ENV === 'development') {
        console.warn('⚠️ Modo desarrollo activado');
    }
})();

// Función para obtener URL completa del endpoint
CONFIG.getApiUrl = function(endpointKey) {
    if (!this.API_ENDPOINTS[endpointKey]) {
        throw new Error(`Endpoint ${endpointKey} no existe en la configuración`);
    }
    return `${this.API_BASE_URL}${this.API_ENDPOINTS[endpointKey]}`;
};

// Función para validar email
CONFIG.validateEmail = function(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// Función para formatear mensaje de WhatsApp
CONFIG.formatWhatsAppMessage = function(userData) {
    const message = `Hola, acabo de crear el demo de mi página web y quiero la versión completa.

Datos de mi negocio:
• Tipo: ${userData.businessType || 'No especificado'}
• Características: ${(userData.features || []).join(', ') || 'Ninguna'}
• Objetivo: ${userData.goal || 'No especificado'}
• Estilo: ${userData.style || 'No especificado'}

Me gustaría obtener más información.`;

    return encodeURIComponent(message);
};

// Función para obtener URL de WhatsApp
CONFIG.getWhatsAppUrl = function(userData = {}) {
    const message = this.formatWhatsAppMessage(userData);
    return `https://wa.me/${this.WHATSAPP.PHONE_NUMBER}?text=${message}`;
};