// Form validation and submission handling

class FormValidator {
    constructor(formElement) {
        this.form = formElement;
        this.errors = [];
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.setupInputValidation();
    }

    setupInputValidation() {
        const inputs = this.form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.validateField(input));
        });
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

        // Phone validation
        if (field.type === 'tel' && value) {
            const phoneRegex = /^\+?[\d\s-]{10,}$/;
            if (!phoneRegex.test(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid phone number';
            }
        }

        this.updateFieldStatus(field, isValid, errorMessage);
        return isValid;
    }

    updateFieldStatus(field, isValid, errorMessage) {
        const errorElement = field.parentElement.querySelector('.error-message');
        
        if (!isValid) {
            field.classList.add('invalid');
            if (!errorElement) {
                const error = document.createElement('div');
                error.className = 'error-message';
                error.textContent = errorMessage;
                field.parentElement.appendChild(error);
            } else {
                errorElement.textContent = errorMessage;
            }
        } else {
            field.classList.remove('invalid');
            if (errorElement) {
                errorElement.remove();
            }
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        this.errors = [];

        const inputs = this.form.querySelectorAll('input, textarea, select');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });

        if (isValid) {
            try {
                const formData = new FormData(this.form);
                const response = await this.submitForm(formData);
                this.handleSuccess(response);
            } catch (error) {
                this.handleError(error);
            }
        }
    }

    async submitForm(formData) {
        // Replace with your actual form submission endpoint
        const response = await fetch('/api/submit-form', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Form submission failed');
        }

        return response.json();
    }

    handleSuccess(response) {
        this.form.reset();
        // Show success message
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.textContent = 'Thank you for your submission!';
        this.form.appendChild(successMessage);
    }

    handleError(error) {
        // Show error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = 'An error occurred. Please try again.';
        this.form.appendChild(errorMessage);
    }
}

// Initialize form validation for all forms
document.addEventListener('DOMContentLoaded', () => {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => new FormValidator(form));
}); 