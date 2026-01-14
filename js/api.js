// api.js
// Manejo de todas las comunicaciones con la API del backend

class ApiService {
    constructor() {
        this.baseUrl = CONFIG.API_BASE_URL;
        this.timeout = 30000; // 30 segundos
        this.requestCount = 0;
        
        // Headers por defecto
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        };
        
        // Cache de solicitudes para evitar duplicados
        this.cache = new Map();
        this.cacheDuration = 5 * 60 * 1000; // 5 minutos
        
        console.log('✅ ApiService inicializado con URL:', this.baseUrl);
    }
    
    /**
     * Método genérico para hacer requests
     */
    async request(endpoint, method = 'GET', data = null, options = {}) {
        const requestId = `${method}_${endpoint}_${JSON.stringify(data)}`;
        this.requestCount++;
        
        // Verificar cache para GET requests
        if (method === 'GET' && this.cache.has(requestId)) {
            const cached = this.cache.get(requestId);
            if (Date.now() - cached.timestamp < this.cacheDuration) {
                console.log(`📦 [Cache] ${endpoint}`);
                return cached.data;
            }
        }
        
        const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        const requestOptions = {
            method,
            headers: { ...this.defaultHeaders, ...options.headers },
            signal: controller.signal,
            mode: 'cors',
            credentials: 'omit'
        };
        
        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            requestOptions.body = JSON.stringify(data);
        }
        
        try {
            console.log(`📤 [${method}] ${url}`, data || '');
            
            const response = await fetch(url, requestOptions);
            clearTimeout(timeoutId);
            
            // Manejar respuestas no OK
            if (!response.ok) {
                throw await this.handleError(response);
            }
            
            const result = await response.json();
            
            // Cachear respuestas GET exitosas
            if (method === 'GET') {
                this.cache.set(requestId, {
                    data: result,
                    timestamp: Date.now()
                });
            }
            
            console.log(`✅ [${method}] ${endpoint} - OK`);
            return result;
            
        } catch (error) {
            clearTimeout(timeoutId);
            console.error(`❌ [${method}] ${endpoint} - Error:`, error);
            throw this.normalizeError(error);
        }
    }
    
    /**
     * Manejo de errores HTTP
     */
    async handleError(response) {
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        
        try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
            // Si no se puede parsear como JSON, usar texto
            try {
                const text = await response.text();
                if (text) errorMessage = text;
            } catch {
                // Mantener el mensaje original
            }
        }
        
        const error = new Error(errorMessage);
        error.status = response.status;
        error.statusText = response.statusText;
        return error;
    }
    
    /**
     * Normalizar errores
     */
    normalizeError(error) {
        if (error.name === 'AbortError') {
            return new Error('La solicitud ha tardado demasiado tiempo. Por favor, intenta de nuevo.');
        }
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            return new Error('Error de conexión. Verifica tu internet e intenta de nuevo.');
        }
        
        if (error.message.includes('CORS')) {
            return new Error('Error de configuración del servidor. Contacta al administrador.');
        }
        
        return error;
    }
    
    /**
     * HEALTH CHECK - Verificar que el backend está funcionando
     */
    async checkHealth() {
        try {
            const data = await this.request(CONFIG.getApiUrl('HEALTH'));
            return {
                success: true,
                data,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
    
    /**
     * GENERAR DEMO - Enviar respuestas del cuestionario y obtener código
     */
    async generateDemo(userData) {
        // Validar datos mínimos
        if (!userData || !userData.businessType) {
            throw new Error('Datos incompletos para generar el demo');
        }
        
        // Asegurar que features es un array
        if (!Array.isArray(userData.features)) {
            userData.features = [];
        }
        
        // Limitar número de features para evitar problemas
        if (userData.features.length > 5) {
            userData.features = userData.features.slice(0, 5);
        }
        
        console.log('🚀 Generando demo con datos:', userData);
        
        try {
            const response = await this.request(
                CONFIG.getApiUrl('GENERATE'),
                'POST',
                userData
            );
            
            return {
                success: true,
                data: response,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Error en generación:', error);
            
            // Retornar demo de respaldo
            return {
                success: false,
                error: error.message,
                fallback: this.getFallbackDemo(userData),
                timestamp: new Date().toISOString()
            };
        }
    }
    
    /**
     * ENVIAR LEAD - Capturar información de contacto
     */
    async sendLead(leadData) {
        // Validar email
        if (leadData.email && !CONFIG.validateEmail(leadData.email)) {
            throw new Error('Email inválido');
        }
        
        const dataToSend = {
            ...leadData,
            source: 'livo-app-frontend',
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            url: window.location.href
        };
        
        try {
            const response = await this.request(
                CONFIG.getApiUrl('LEAD'),
                'POST',
                dataToSend
            );
            
            return {
                success: true,
                data: response,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            // No lanzar error para leads, solo loguear
            console.warn('Lead no enviado:', error.message);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
    
    /**
     * DEMO DE RESPALDO - Por si la API falla
     */
    getFallbackDemo(userData) {
        const businessName = userData.businessType || 'Mi Negocio';
        const features = userData.features || [];
        
        const hasWhatsApp = features.includes('whatsapp');
        const hasContactForm = features.includes('contact-form');
        const hasLocation = features.includes('location');
        const hasHours = features.includes('hours');
        
        return {
            html: `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${businessName} - Demo</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        header { background: ${CONFIG.STYLES.COLORS.PRIMARY}; color: white; padding: 1rem 0; }
        nav { display: flex; justify-content: space-between; align-items: center; }
        .logo { font-size: 1.5rem; font-weight: bold; }
        .hero { text-align: center; padding: 4rem 2rem; background: #f8f9fa; }
        .cta-button { background: ${CONFIG.STYLES.COLORS.SUCCESS}; color: white; border: none; padding: 1rem 2rem; border-radius: 5px; cursor: pointer; margin-top: 1rem; }
        footer { text-align: center; padding: 2rem; background: #333; color: white; margin-top: 2rem; }
    </style>
</head>
<body>
    <header>
        <nav class="container">
            <div class="logo">${businessName}</div>
            <ul>
                <li><a href="#inicio" style="color:white; text-decoration:none;">Inicio</a></li>
                <li><a href="#servicios" style="color:white; text-decoration:none;">Servicios</a></li>
                <li><a href="#contacto" style="color:white; text-decoration:none;">Contacto</a></li>
            </ul>
        </nav>
    </header>
    
    <main>
        <section class="hero">
            <h1>Bienvenido a ${businessName}</h1>
            <p>Este es un demo generado automáticamente por Livo-App</p>
            <button class="cta-button" onclick="alert('¡Gracias por tu interés!')">Contáctanos</button>
        </section>
        
        ${hasWhatsApp ? '<div style="position:fixed; bottom:20px; right:20px; background:#25D366; color:white; padding:15px; border-radius:50%;"><i class="fab fa-whatsapp"></i></div>' : ''}
    </main>
    
    <footer>
        <p>Demo generado por Livo-App • Contacta para la versión completa</p>
    </footer>
</body>
</html>`,
            css: `/* Estilos base */
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }

/* Header */
header { background: linear-gradient(135deg, ${CONFIG.STYLES.COLORS.PRIMARY} 0%, ${CONFIG.STYLES.COLORS.SECONDARY} 100%); color: white; padding: 1rem 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }

nav { display: flex; justify-content: space-between; align-items: center; }

.logo { font-size: 1.5rem; font-weight: bold; display: flex; align-items: center; gap: 10px; }

nav ul { display: flex; list-style: none; gap: 2rem; }

nav a { color: white; text-decoration: none; transition: opacity 0.3s; }

nav a:hover { opacity: 0.8; }

/* Hero */
.hero { text-align: center; padding: 5rem 2rem; background: linear-gradient(rgba(67, 97, 238, 0.1), rgba(114, 9, 183, 0.1)); }

.hero h1 { font-size: 3rem; margin-bottom: 1rem; color: #333; }

.hero p { font-size: 1.2rem; color: #666; margin-bottom: 2rem; max-width: 600px; margin: 0 auto 2rem; }

.cta-button { background: linear-gradient(135deg, ${CONFIG.STYLES.COLORS.PRIMARY}, ${CONFIG.STYLES.COLORS.SECONDARY}); color: white; border: none; padding: 1rem 2.5rem; border-radius: 50px; font-size: 1.1rem; cursor: pointer; transition: transform 0.3s, box-shadow 0.3s; }

.cta-button:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }

/* Footer */
footer { text-align: center; padding: 3rem 2rem; background: #333; color: white; margin-top: 3rem; }

/* Responsive */
@media (max-width: 768px) {
    nav { flex-direction: column; gap: 1rem; }
    nav ul { flex-direction: column; text-align: center; gap: 1rem; }
    .hero h1 { font-size: 2rem; }
    .hero { padding: 3rem 1rem; }
}`,
            js: `// JavaScript del demo
console.log('Demo generado por Livo-App');

// Función de contacto
function contactar() {
    const nombre = prompt('¿Cuál es tu nombre?');
    if (nombre) {
        alert('¡Hola ' + nombre + '! Pronto nos pondremos en contacto contigo.');
    }
}

// Botón de WhatsApp si está habilitado
const whatsappButtons = document.querySelectorAll('.whatsapp-button');
whatsappButtons.forEach(button => {
    button.addEventListener('click', () => {
        const mensaje = encodeURIComponent('Hola, me interesa obtener más información sobre sus servicios');
        window.open('https://wa.me/1234567890?text=' + mensaje, '_blank');
    });
});

// Navegación suave
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    console.log('Demo cargado correctamente');
    
    // Agregar año actual al footer
    const footer = document.querySelector('footer p');
    if (footer) {
        const year = new Date().getFullYear();
        footer.innerHTML = footer.innerHTML.replace('2024', year);
    }
});`
        };
    }
    
    /**
     * Limpiar cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🧹 Cache limpiado');
    }
    
    /**
     * Obtener estadísticas de uso
     */
    getStats() {
        return {
            totalRequests: this.requestCount,
            cacheSize: this.cache.size,
            cacheHits: 0, // Se puede implementar contador de hits
            lastCleared: new Date().toISOString()
        };
    }
}

// Verificar que CONFIG esté disponible antes de crear la instancia
if (typeof CONFIG === 'undefined') {
    console.error('❌ ERROR: CONFIG no está definido. Asegúrate de cargar config.js antes de api.js');
    // Crear un CONFIG básico para evitar errores
    window.CONFIG = {
        API_BASE_URL: 'https://livo-app-backend.onrender.com',
        getApiUrl: function(endpoint) {
            const endpoints = {
                HEALTH: '/api/health',
                GENERATE: '/api/generate',
                LEAD: '/api/lead'
            };
            return this.API_BASE_URL + (endpoints[endpoint] || endpoint);
        },
        validateEmail: function(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },
        STYLES: {
            COLORS: {
                PRIMARY: '#4361ee',
                SECONDARY: '#7209b7',
                SUCCESS: '#4cc9f0'
            }
        }
    };
    console.warn('⚠️ CONFIG creado automáticamente. Asegúrate de cargar config.js');
}

// Crear instancia global SOLO si no existe
if (!window.ApiService) {
    window.ApiService = new ApiService();
    console.log('✅ ApiService creado e inicializado');
} else {
    console.warn('⚠️ ApiService ya estaba definido, usando la instancia existente');
}