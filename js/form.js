// Form validation for Formspree integration

class FormValidator {
    constructor(formElement) {
        this.form = formElement;
        this.originalButtonText = '';
        this.validationTimers = new Map(); // Store timers for debounced validation
        this.init();
    }

    init() {
        // Store original button text for later restoration
        const submitButton = this.form.querySelector('button[type="submit"]');
        if (submitButton) {
            this.originalButtonText = submitButton.textContent;
        }
        
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.setupInputValidation();
    }

    setupInputValidation() {
        const inputs = this.form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            // Always validate immediately on blur (when user leaves the field)
            input.addEventListener('blur', () => this.validateField(input));
            
            // For phone and email fields, use debounced validation on input
            if (input.type === 'tel' || input.type === 'email') {
                input.addEventListener('input', () => this.validateFieldDebounced(input, 1500)); // 1.5 second delay
            } else {
                // For other fields, validate immediately on input
                input.addEventListener('input', () => this.validateField(input));
            }
        });
    }

    validateFieldDebounced(field, delay = 1500) {
        // Clear existing timer for this field
        if (this.validationTimers.has(field)) {
            clearTimeout(this.validationTimers.get(field));
        }
        
        // Clear any existing error styling while typing for phone and email fields
        if (field.type === 'tel' || field.type === 'email') {
            field.classList.remove('error');
            const existingError = field.parentNode.querySelector('.field-error');
            if (existingError) {
                existingError.remove();
            }
        }
        
        // Set new timer to validate after delay
        const timer = setTimeout(() => {
            this.validateField(field);
            this.validationTimers.delete(field);
        }, delay);
        
        this.validationTimers.set(field, timer);
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Required field validation
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }

        // Email validation
        if (field.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
        }

        // Phone validation - accepts international numbers with or without country code
        if (field.type === 'tel' && value) {
            // Remove spaces, dashes, and parentheses for validation
            const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
            
            // International phone patterns:
            // - With country code: + followed by 7-15 digits total
            // - Without country code: 6-15 digits
            const phoneRegex = /^(\+\d{7,15}|\d{6,15})$/;
            
            if (!phoneRegex.test(cleanPhone)) {
                isValid = false;
                errorMessage = 'Please enter a valid phone number';
            }
        }

        this.updateFieldStatus(field, isValid, errorMessage);
        return isValid;
    }

    updateFieldStatus(field, isValid, errorMessage) {
        // Remove existing error styling
        field.classList.remove('error');
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }

        // Add error styling if invalid
        if (!isValid) {
            field.classList.add('error');
            const errorElement = document.createElement('span');
            errorElement.className = 'field-error';
            errorElement.textContent = errorMessage;
            errorElement.style.color = 'var(--brown-color)';
            errorElement.style.fontSize = '0.8rem';
            errorElement.style.marginTop = '0.25rem';
            errorElement.style.display = 'block';
            field.parentNode.appendChild(errorElement);
        }
    }

    async handleSubmit(e) {
        e.preventDefault(); // Always prevent default to handle with AJAX
        
        // Clear any pending validation timers
        this.validationTimers.forEach(timer => clearTimeout(timer));
        this.validationTimers.clear();
        
        // Clear any existing success/error messages
        this.clearMessages();
        
        const inputs = this.form.querySelectorAll('input, textarea, select');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        if (!isValid) {
            this.showError('Please correct the errors above before submitting.');
            return;
        }

        // Show loading state
        this.showLoading();

        try {
            // Submit to Formspree via AJAX
            const formData = new FormData(this.form);
            const response = await fetch(this.form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                this.showSuccess();
            } else {
                throw new Error('Form submission failed');
            }
        } catch (error) {
            this.showError('An error occurred. Please try again.');
            this.resetButton();
        }
    }

    clearMessages() {
        const existingMessages = this.form.querySelectorAll('.form-message');
        existingMessages.forEach(msg => msg.remove());
    }

    showLoading() {
        const submitButton = this.form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            
            // Get loading text based on current language or fallback
            const loadingTexts = {
                'es': 'Enviando...',
                'ca': 'Enviant...',
                'en': 'Sending...'
            };
            const currentLang = window.currentLang || 'es';
            submitButton.textContent = loadingTexts[currentLang] || loadingTexts['es'];
        }
    }

    showSuccess() {
        const submitButton = this.form.querySelector('button[type="submit"]');
        if (submitButton) {
            // Get success text based on current language or fallback
            const successTexts = {
                'es': '¡Gracias! Formulario enviado',
                'ca': 'Gràcies! Formulari enviat',
                'en': 'Thank you! Form submitted'
            };
            const currentLang = window.currentLang || 'es';
            submitButton.textContent = successTexts[currentLang] || successTexts['es'];
            submitButton.style.backgroundColor = 'var(--green-color)';
            submitButton.style.borderColor = 'var(--green-color)';
            submitButton.style.color = 'var(--brown-color)';
        }

        // Reset form after a delay
        setTimeout(() => {
            this.form.reset();
            this.resetButton();
        }, 3000);
    }

    resetButton() {
        const submitButton = this.form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
            
            // Get submit text in current language
            const submitTexts = {
                'es': 'Enviar',
                'ca': 'Enviar', 
                'en': 'Submit'
            };
            const currentLang = window.currentLang || 'es';
            submitButton.textContent = submitTexts[currentLang] || submitTexts['es'];
            
            submitButton.style.backgroundColor = '';
            submitButton.style.borderColor = '';
            submitButton.style.color = '';
        }
    }

    showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'form-message error-message';
        errorElement.textContent = message;
        errorElement.style.cssText = `
            color: var(--brown-color);
            background-color: #f8d7da;
            border: 1px solid var(--brown-color);
            padding: 0.75rem;
            margin-top: 1rem;
            border-radius: 4px;
            grid-column: 1 / -1;
        `;
        this.form.appendChild(errorElement);
        
        // Auto-hide error after 5 seconds
        setTimeout(() => {
            errorElement.remove();
        }, 5000);
    }
}

// Initialize form validation for contact forms only
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.querySelector('#contact-form');
    if (contactForm) {
        new FormValidator(contactForm);
    }
}); 