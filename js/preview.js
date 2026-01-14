// preview.js
// Manejo de la vista previa y conversión a cliente

class PreviewManager {
    constructor() {
        this.generatedDemo = null;
        this.isLoading = false;
        this.previewContainer = null;
        this.init();
    }
    
    init() {
        console.log('👁️ Inicializando vista previa...');
        this.bindEvents();
        this.setupPreviewContainer();
    }
    
    bindEvents() {
        // Botones de CTA
        const whatsappBtn = document.getElementById('whatsapp-cta');
        const emailBtn = document.getElementById('email-cta');
        
        if (whatsappBtn) {
            whatsappBtn.addEventListener('click', () => this.openWhatsApp());
        }
        
        if (emailBtn) {
            emailBtn.addEventListener('click', () => this.showEmailForm());
        }
        
        // Botón de regenerar demo
        const regenerateBtn = document.getElementById('regenerate-btn');
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => this.regenerateDemo());
        }
    }
    
    setupPreviewContainer() {
        this.previewContainer = document.getElementById('frame-content');
        if (!this.previewContainer) {
            console.warn('No se encontró el contenedor de vista previa');
            return;
        }
    }
    
    showLoading() {
        this.isLoading = true;
        
        if (this.previewContainer) {
            this.previewContainer.innerHTML = `
                <div class="loading-demo">
                    <div class="spinner"></div>
                    <h3>Generando tu demo con IA...</h3>
                    <p>Esto puede tardar unos segundos</p>
                    <div class="loading-progress">
                        <div class="progress-bar">
                            <div class="progress"></div>
                        </div>
                        <p class="loading-text">Preparando la magia ✨</p>
                    </div>
                </div>
            `;
        }
        
        // Ocultar botones de CTA temporalmente
        this.toggleCTAButtons(false);
    }
    
    hideLoading() {
        this.isLoading = false;
        
        // Mostrar botones de CTA
        this.toggleCTAButtons(true);
    }
    
    toggleCTAButtons(show) {
        const ctaButtons = document.querySelector('.cta-buttons');
        if (ctaButtons) {
            ctaButtons.style.display = show ? 'flex' : 'none';
        }
    }
    
    async displayDemo(demoData) {
        if (!demoData || (!demoData.html && !demoData.fallback)) {
            this.showError('No se recibieron datos para mostrar el demo');
            return;
        }
        
        this.generatedDemo = demoData;
        
        // Usar fallback si la generación falló
        const html = demoData.html || (demoData.fallback ? demoData.fallback.html : '');
        const css = demoData.css || (demoData.fallback ? demoData.fallback.css : '');
        const js = demoData.js || (demoData.fallback ? demoData.fallback.js : '');
        
        if (!html) {
            this.showError('No se pudo generar el contenido del demo');
            return;
        }
        
        // Limpiar contenedor
        this.previewContainer.innerHTML = '';
        
        // Crear iframe para sandboxing
        const iframe = document.createElement('iframe');
        iframe.id = 'demo-iframe';
        iframe.style.cssText = `
            width: 100%;
            height: 100%;
            border: none;
            background: white;
        `;
        
        // Configurar sandbox para seguridad
        iframe.setAttribute('sandbox', CONFIG.PREVIEW.SANDBOX_ATTRIBUTES);
        iframe.setAttribute('loading', 'lazy');
        
        // Crear documento HTML completo
        const doc = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    ${css}
                    
                    /* Estilos adicionales para el demo */
                    .demo-watermark {
                        position: fixed;
                        bottom: 10px;
                        right: 10px;
                        background: rgba(0,0,0,0.7);
                        color: white;
                        padding: 5px 10px;
                        border-radius: 3px;
                        font-size: 12px;
                        z-index: 9999;
                    }
                    
                    .demo-notice {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        background: ${CONFIG.STYLES.COLORS.PRIMARY};
                        color: white;
                        text-align: center;
                        padding: 10px;
                        font-size: 14px;
                        z-index: 9998;
                    }
                </style>
            </head>
            <body>
                <div class="demo-notice">
                    ⚠️ DEMO GENERADO POR IA - Esta es una vista previa
                </div>
                
                ${html}
                
                <div class="demo-watermark">
                    Demo generado por Livo-App
                </div>
                
                <script>
                    ${js}
                    
                    // Script adicional para el demo
                    document.addEventListener('DOMContentLoaded', function() {
                        // Añadir mensaje a todos los botones de CTA
                        document.querySelectorAll('button, a[href*="#"]').forEach(element => {
                            element.addEventListener('click', function(e) {
                                if (!this.hasAttribute('data-demo-handled')) {
                                    e.preventDefault();
                                    alert('¡Este es un demo! Contacta con nosotros para obtener la versión completa.');
                                    this.setAttribute('data-demo-handled', 'true');
                                }
                            });
                        });
                        
                        // Prevenir envío de formularios
                        const forms = document.querySelectorAll('form');
                        forms.forEach(form => {
                            form.addEventListener('submit', function(e) {
                                e.preventDefault();
                                alert('¡Este es un demo! Los formularios no funcionan en la vista previa.');
                                return false;
                            });
                        });
                    });
                </script>
            </body>
            </html>
        `;
        
        // Agregar iframe al contenedor
        this.previewContainer.appendChild(iframe);
        
        // Escribir el documento en el iframe
        iframe.onload = () => {
            try {
                iframe.contentDocument.open();
                iframe.contentDocument.write(doc);
                iframe.contentDocument.close();
                
                // Ajustar altura del iframe al contenido
                this.adjustIframeHeight(iframe);
                
                // Trackear vista previa cargada
                this.trackEvent('preview_loaded', {
                    htmlLength: html.length,
                    cssLength: css.length,
                    jsLength: js.length,
                    hasFallback: !!demoData.fallback
                });
                
            } catch (error) {
                console.error('Error al cargar el demo:', error);
                this.showError('Error al mostrar la vista previa');
            }
        };
        
        // Manejar errores del iframe
        iframe.onerror = () => {
            this.showError('Error al cargar la vista previa');
        };
        
        // Mostrar sección de preview
        this.showPreviewSection();
    }
    
    adjustIframeHeight(iframe) {
        try {
            // Esperar a que el contenido cargue
            setTimeout(() => {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                const height = Math.max(
                    doc.body.scrollHeight,
                    doc.body.offsetHeight,
                    doc.documentElement.scrollHeight,
                    doc.documentElement.offsetHeight,
                    doc.documentElement.clientHeight
                );
                
                iframe.style.height = Math.min(height, 800) + 'px';
            }, 500);
        } catch (error) {
            console.warn('No se pudo ajustar la altura del iframe:', error);
        }
    }
    
    showPreviewSection() {
        // Ocultar cuestionario
        const questionnaireSection = document.getElementById('questionnaire-section');
        if (questionnaireSection) {
            questionnaireSection.classList.add('hidden');
        }
        
        // Mostrar vista previa
        const previewSection = document.getElementById('preview-section');
        if (previewSection) {
            previewSection.classList.remove('hidden');
            previewSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Actualizar título de la página
        document.title = 'Vista Previa - ' + CONFIG.APP.NAME;
    }
    
    showError(message) {
        if (this.previewContainer) {
            this.previewContainer.innerHTML = `
                <div class="error-message">
                    <div class="error-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3>Error en la generación</h3>
                    <p>${message}</p>
                    <div class="error-actions">
                        <button onclick="window.location.reload()" class="btn-primary">
                            <i class="fas fa-redo"></i> Intentar de nuevo
                        </button>
                        <button onclick="window.QuestionnaireManager.reset()" class="btn-secondary">
                            <i class="fas fa-edit"></i> Volver al cuestionario
                        </button>
                    </div>
                </div>
            `;
        }
        
        this.trackEvent('preview_error', { message });
    }
    
    openWhatsApp(userData = null) {
        if (!userData && window.QuestionnaireManager) {
            userData = window.QuestionnaireManager.getUserData();
        }
        
        const whatsappUrl = CONFIG.getWhatsAppUrl(userData);
        
        // Trackear clic en WhatsApp
        this.trackEvent('whatsapp_cta_clicked', {
            businessType: userData?.businessType,
            featuresCount: userData?.features?.length || 0
        });
        
        // Abrir en nueva pestaña
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        
        // Mostrar confirmación
        this.showToast('Redirigiendo a WhatsApp...', 'success');
    }
    
    showEmailForm() {
        // Crear modal para capturar email
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        modal.innerHTML = `
            <div class="modal-content" style="
                background: white;
                padding: 2rem;
                border-radius: 10px;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            ">
                <h3 style="margin-bottom: 1rem; color: #333;">
                    <i class="fas fa-envelope"></i> Recibir Presupuesto
                </h3>
                <p style="margin-bottom: 1.5rem; color: #666;">
                    Déjanos tu email y te contactaremos con el presupuesto:
                </p>
                
                <form id="email-form">
                    <div class="form-group" style="margin-bottom: 1.5rem;">
                        <input type="email" 
                               id="lead-email" 
                               placeholder="tu@email.com" 
                               required
                               style="
                                    width: 100%;
                                    padding: 12px;
                                    border: 2px solid #e0e0e0;
                                    border-radius: 5px;
                                    font-size: 16px;
                               ">
                        <div class="error-message" style="color: ${CONFIG.STYLES.COLORS.DANGER}; font-size: 14px; margin-top: 5px; display: none;"></div>
                    </div>
                    
                    <div class="form-group" style="margin-bottom: 1.5rem;">
                        <textarea id="lead-message" 
                                  placeholder="Comentarios adicionales (opcional)"
                                  rows="3"
                                  style="
                                    width: 100%;
                                    padding: 12px;
                                    border: 2px solid #e0e0e0;
                                    border-radius: 5px;
                                    font-size: 16px;
                                    resize: vertical;
                                  "></textarea>
                    </div>
                    
                    <div class="modal-buttons" style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button type="button" id="cancel-email" class="btn-secondary" style="padding: 10px 20px;">
                            Cancelar
                        </button>
                        <button type="submit" id="submit-email" class="btn-primary" style="padding: 10px 20px;">
                            <i class="fas fa-paper-plane"></i> Enviar
                        </button>
                    </div>
                </form>
                
                <p style="margin-top: 1rem; font-size: 12px; color: #999; text-align: center;">
                    <i class="fas fa-shield-alt"></i> Tu información está segura. No spam.
                </p>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Eventos del modal
        const cancelBtn = modal.querySelector('#cancel-email');
        const submitBtn = modal.querySelector('#submit-email');
        const emailInput = modal.querySelector('#lead-email');
        const errorMessage = modal.querySelector('.error-message');
        const form = modal.querySelector('#email-form');
        
        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
            this.trackEvent('email_modal_closed');
        });
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = emailInput.value.trim();
            const message = modal.querySelector('#lead-message').value.trim();
            
            // Validar email
            if (!CONFIG.validateEmail(email)) {
                errorMessage.textContent = 'Por favor, ingresa un email válido';
                errorMessage.style.display = 'block';
                emailInput.focus();
                return;
            }
            
            // Obtener datos del usuario
            let userData = {};
            if (window.QuestionnaireManager) {
                userData = window.QuestionnaireManager.getUserData();
            }
            
            // Mostrar loading en el botón
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            submitBtn.disabled = true;
            
            try {
                // Enviar lead a la API
                const result = await ApiService.sendLead({
                    email,
                    message,
                    ...userData
                });
                
                if (result.success) {
                    // Mostrar confirmación
                    this.showToast('¡Gracias! Te contactaremos pronto.', 'success');
                    
                    // Trackear lead enviado
                    this.trackEvent('lead_submitted', {
                        email: email.substring(0, 3) + '...', // Solo parte del email por privacidad
                        hasMessage: !!message,
                        businessType: userData.businessType
                    });
                    
                    // Cerrar modal
                    document.body.removeChild(modal);
                    
                } else {
                    throw new Error(result.error || 'Error al enviar');
                }
                
            } catch (error) {
                console.error('Error al enviar lead:', error);
                errorMessage.textContent = 'Error al enviar. Por favor, intenta de nuevo.';
                errorMessage.style.display = 'block';
                
                // Restaurar botón
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
        
        // Cerrar modal al hacer clic fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
                this.trackEvent('email_modal_closed_outside');
            }
        });
        
        // Trackear apertura del modal
        this.trackEvent('email_modal_opened');
    }
    
    showToast(message, type = 'info') {
        // Crear toast
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        
        const bgColor = type === 'success' ? CONFIG.STYLES.COLORS.SUCCESS : 
                       type === 'error' ? CONFIG.STYLES.COLORS.DANGER : 
                       CONFIG.STYLES.COLORS.PRIMARY;
        
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 10001;
            animation: slideIn 0.3s ease;
            max-width: 300px;
        `;
        
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (toast.parentNode) {
                        document.body.removeChild(toast);
                    }
                }, 300);
            }
        }, 5000);
    }
    
    async regenerateDemo() {
        if (!window.QuestionnaireManager) {
            console.error('No se puede regenerar: QuestionnaireManager no encontrado');
            return;
        }
        
        const userData = window.QuestionnaireManager.getUserData();
        
        // Trackear regeneración
        this.trackEvent('demo_regenerated', {
            businessType: userData.businessType,
            featuresCount: userData.features.length
        });
        
        // Mostrar loading
        this.showLoading();
        
        // Regenerar demo
        if (window.app && typeof window.app.generateDemo === 'function') {
            await window.app.generateDemo(userData);
        }
    }
    
    trackEvent(eventName, data = {}) {
        console.log(`📊 Preview Event: ${eventName}`, data);
        
        // Integración con analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                ...data,
                page_title: document.title,
                page_location: window.location.href
            });
        }
    }
    
    getDemoStats() {
        if (!this.generatedDemo) return null;
        
        return {
            htmlLength: this.generatedDemo.html?.length || 0,
            cssLength: this.generatedDemo.css?.length || 0,
            jsLength: this.generatedDemo.js?.length || 0,
            hasFallback: !!this.generatedDemo.fallback,
            generatedAt: this.generatedDemo.timestamp || new Date().toISOString()
        };
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.PreviewManager = new PreviewManager();
});