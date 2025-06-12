// Stripe payment integration

class StripePayment {
    constructor() {
        this.stripe = null;
        this.elements = null;
        this.card = null;
        this.init();
    }

    async init() {
        try {
            // Initialize Stripe with your publishable key
            this.stripe = Stripe('your_publishable_key');
            this.elements = this.stripe.elements();

            // Create card element
            this.card = this.elements.create('card', {
                style: {
                    base: {
                        fontSize: '16px',
                        color: '#32325d',
                        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                        fontSmoothing: 'antialiased',
                        '::placeholder': {
                            color: '#aab7c4'
                        }
                    },
                    invalid: {
                        color: '#fa755a',
                        iconColor: '#fa755a'
                    }
                }
            });

            // Mount card element
            const cardElement = document.getElementById('card-element');
            if (cardElement) {
                this.card.mount('#card-element');
                this.setupEventListeners();
            }
        } catch (error) {
            console.error('Error initializing Stripe:', error);
        }
    }

    setupEventListeners() {
        // Handle real-time validation errors
        this.card.addEventListener('change', (event) => {
            const displayError = document.getElementById('card-errors');
            if (event.error) {
                displayError.textContent = event.error.message;
            } else {
                displayError.textContent = '';
            }
        });

        // Handle form submission
        const form = document.getElementById('payment-form');
        if (form) {
            form.addEventListener('submit', (event) => this.handleSubmit(event));
        }
    }

    async handleSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');
        
        // Disable submit button to prevent double submission
        submitButton.disabled = true;

        try {
            const { paymentMethod, error } = await this.stripe.createPaymentMethod({
                type: 'card',
                card: this.card,
            });

            if (error) {
                this.handleError(error);
            } else {
                await this.processPayment(paymentMethod);
            }
        } catch (error) {
            this.handleError(error);
        } finally {
            submitButton.disabled = false;
        }
    }

    async processPayment(paymentMethod) {
        try {
            const response = await fetch('/api/create-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    payment_method_id: paymentMethod.id,
                    amount: this.getAmount(),
                    currency: 'usd'
                })
            });

            const result = await response.json();

            if (result.error) {
                this.handleError(result.error);
            } else {
                this.handleSuccess(result);
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    getAmount() {
        // Get amount from form or data attribute
        const amountElement = document.getElementById('payment-amount');
        return amountElement ? amountElement.value : 0;
    }

    handleError(error) {
        const errorElement = document.getElementById('card-errors');
        errorElement.textContent = error.message;
    }

    handleSuccess(result) {
        // Show success message
        const successElement = document.getElementById('payment-success');
        successElement.textContent = 'Payment successful!';
        successElement.style.display = 'block';

        // Reset form
        const form = document.getElementById('payment-form');
        form.reset();
        this.card.clear();
    }
}

// Initialize Stripe payment when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new StripePayment();
}); 