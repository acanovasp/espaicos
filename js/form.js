// Form validation for Formspree integration

class FormValidator {
    constructor(formElement) {
        this.form = formElement;
        this.originalButtonText = '';
        this.validationTimers = new Map(); // Store timers for debounced validation
        this.currentStep = 1;
        this.maxStep = 2;
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
        this.setupStepNavigation();
    }

        setupInputValidation() {
        const inputs = this.form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            // Always validate immediately on blur (when user leaves the field)
            input.addEventListener('blur', () => this.validateField(input));
            
            // For phone and email fields, use debounced validation on input
            if (input.type === 'tel' || input.type === 'email') {
                input.addEventListener('input', () => this.validateFieldDebounced(input, 1500)); // 1.5 second delay
            } else if (input.type === 'radio') {
                // For radio buttons, clear errors when selection changes
                input.addEventListener('change', () => this.clearRadioGroupError(input.name));
            } else {
                // For other fields, validate immediately on input
                input.addEventListener('input', () => this.validateField(input));
            }
        });
    }

    setupStepNavigation() {
        const nextButton = document.getElementById('next-step');
        const prevButton = document.getElementById('prev-step');
        
        if (nextButton) {
            nextButton.addEventListener('click', () => this.nextStep());
        }
        
        if (prevButton) {
            prevButton.addEventListener('click', () => this.prevStep());
        }
    }

    nextStep() {
        // Validate current step before proceeding
        if (!this.validateCurrentStep()) {
            return;
        }

        if (this.currentStep < this.maxStep) {
            this.currentStep++;
            this.showStep(this.currentStep);
        }
    }

    prevStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.showStep(this.currentStep);
        }
    }

    showStep(stepNumber) {
        // Hide all steps
        const steps = this.form.querySelectorAll('.form-step');
        steps.forEach(step => {
            step.style.display = 'none';
        });

        // Show current step
        const currentStepElement = document.getElementById(`step-${stepNumber}`);
        if (currentStepElement) {
            currentStepElement.style.display = 'grid';
        }

        // Update step indicator
        const stepIndicators = document.querySelectorAll('.step');
        stepIndicators.forEach((indicator, index) => {
            const stepIndex = index + 1;
            
            // Remove all classes first
            indicator.classList.remove('active', 'completed');
            
            if (stepIndex === stepNumber) {
                // Current step
                indicator.classList.add('active');
            } else if (stepIndex < stepNumber) {
                // Completed steps
                indicator.classList.add('completed');
            }
            // Future steps get no class (default opacity)
        });

        // Update navigation buttons
        this.updateNavigationButtons();
    }

    updateNavigationButtons() {
        const nextButton = document.getElementById('next-step');
        const prevButton = document.getElementById('prev-step');
        const submitButton = document.getElementById('submit-form');

        if (this.currentStep === 1) {
            // First step: show Next button, hide Back and Submit
            if (nextButton) nextButton.style.display = 'block';
            if (prevButton) prevButton.style.display = 'none';
            if (submitButton) submitButton.style.display = 'none';
        } else if (this.currentStep === this.maxStep) {
            // Last step: show Submit and Back buttons, hide Next
            if (nextButton) nextButton.style.display = 'none';
            if (prevButton) prevButton.style.display = 'block';
            if (submitButton) submitButton.style.display = 'block';
        } else {
            // Middle steps: show Next and Back buttons, hide Submit
            if (nextButton) nextButton.style.display = 'block';
            if (prevButton) prevButton.style.display = 'block';
            if (submitButton) submitButton.style.display = 'none';
        }
    }

    validateCurrentStep() {
        const currentStepElement = document.getElementById(`step-${this.currentStep}`);
        if (!currentStepElement) return true;

        const inputs = currentStepElement.querySelectorAll('input, textarea, select');
        let isValid = true;
        const radioGroups = new Set();

        inputs.forEach(input => {
            // Handle radio buttons separately by group
            if (input.type === 'radio') {
                radioGroups.add(input.name);
            } else {
                // Validate other input types normally
                if (!this.validateField(input)) {
                    isValid = false;
                }
            }
        });

        // Validate radio button groups
        radioGroups.forEach(groupName => {
            if (!this.validateRadioGroup(currentStepElement, groupName)) {
                isValid = false;
            }
        });

        if (!isValid) {
            this.showError('Please correct the errors above before continuing.');
        }

        return isValid;
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

    validateRadioGroup(container, groupName) {
        const radioButtons = container.querySelectorAll(`input[type="radio"][name="${groupName}"]`);
        const isGroupRequired = Array.from(radioButtons).some(radio => radio.hasAttribute('required'));
        
        if (!isGroupRequired) return true;
        
        const isSelected = Array.from(radioButtons).some(radio => radio.checked);
        
        // Find the radio group container for error display
        const firstRadio = radioButtons[0];
        const radioGroupContainer = firstRadio.closest('.custom-radio-group');
        
        // Remove existing error styling
        if (radioGroupContainer) {
            radioGroupContainer.classList.remove('error');
            const existingError = radioGroupContainer.querySelector('.field-error');
            if (existingError) {
                existingError.remove();
            }
        }
        
        if (!isSelected) {
            // Add error styling to the radio group
            if (radioGroupContainer) {
                radioGroupContainer.classList.add('error');
                const errorDiv = document.createElement('div');
                errorDiv.className = 'field-error';
                errorDiv.textContent = 'Please select an option';
                radioGroupContainer.appendChild(errorDiv);
            }
            return false;
        }
        
        return true;
    }

    clearRadioGroupError(groupName) {
        const radioGroup = this.form.querySelector(`input[type="radio"][name="${groupName}"]`);
        if (radioGroup) {
            const radioGroupContainer = radioGroup.closest('.custom-radio-group');
            if (radioGroupContainer) {
                radioGroupContainer.classList.remove('error');
                const existingError = radioGroupContainer.querySelector('.field-error');
                if (existingError) {
                    existingError.remove();
                }
            }
        }
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
        
        // Validate all steps
        let isValid = true;
        for (let step = 1; step <= this.maxStep; step++) {
            const currentStep = this.currentStep;
            this.currentStep = step;
            if (!this.validateCurrentStep()) {
                isValid = false;
                // Go back to the first invalid step
                this.showStep(step);
                break;
            }
            this.currentStep = currentStep;
        }

        // Check if a plan is selected
        const selectedPlan = this.form.querySelector('input[name="plan"]:checked');
        if (!selectedPlan) {
            isValid = false;
            this.showError('Please select a plan before submitting.');
            this.showStep(2); // Go to plan selection step
        }

        if (!isValid) {
            return;
        }

        // Show loading state
        this.showLoading();

        try {
            // Create Stripe checkout session
            await this.createStripeCheckout(selectedPlan);
        } catch (error) {
            console.error('Stripe checkout error:', error);
            this.showError('An error occurred. Please try again.');
            this.resetButton();
        }
    }

    clearMessages() {
        const existingMessages = this.form.querySelectorAll('.form-message');
        existingMessages.forEach(msg => msg.remove());
    }

    async createStripeCheckout(selectedPlan) {
        // Get form data
        const formData = new FormData(this.form);
        const planValue = selectedPlan.value;
        
        // Check if Stripe config is available
        if (!window.STRIPE_CONFIG || !window.STRIPE_CONFIG.priceIds) {
            throw new Error('Stripe configuration not found');
        }

        // Get the Stripe price ID for the selected plan
        const priceId = window.STRIPE_CONFIG.priceIds[planValue];
        if (!priceId || priceId.includes('REPLACE_WITH')) {
            throw new Error('Stripe price ID not configured for this plan');
        }

        // Prepare checkout data
        const checkoutData = {
            priceId: priceId,
            customerEmail: formData.get('email'),
            customerName: formData.get('name'),
            customerPhone: formData.get('phone'),
            classInterest: formData.get('class_interest'),
            language: window.currentLang || 'es'
        };

        // Call our API to create checkout session
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(checkoutData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to create checkout session');
        }

        // Redirect to Stripe checkout
        window.location.href = result.url;
    }

        showLoading() {
        const submitButton = document.getElementById('submit-form');
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
        const submitButton = document.getElementById('submit-form');
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
            submitButton.style.borderColor = 'var(--brown-color)';
            submitButton.style.color = 'var(--brown-color)';
        }

        // Reset form after a delay
        setTimeout(() => {
            this.form.reset();
            this.resetForm();
        }, 3000);
    }

    resetButton() {
        const submitButton = document.getElementById('submit-form');
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

    resetForm() {
        // Reset to first step
        this.currentStep = 1;
        this.showStep(1);
        this.resetButton();
        
        // Clear any error messages
        this.clearMessages();
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