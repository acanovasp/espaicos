// Stripe Checkout Result Handler
// Handles success and cancellation messages when returning from Stripe

document.addEventListener('DOMContentLoaded', function() {
    // Check URL parameters for checkout results
    const urlParams = new URLSearchParams(window.location.search);
    const checkoutStatus = urlParams.get('checkout');
    const sessionId = urlParams.get('session_id');

    if (checkoutStatus === 'success' && sessionId) {
        showCheckoutSuccess();
        // Clean up URL
        cleanupUrl();
    } else if (checkoutStatus === 'cancelled') {
        showCheckoutCancelled();
        // Clean up URL
        cleanupUrl();
    }
});

function showCheckoutSuccess() {
    // Create success message
    const successMessage = document.createElement('div');
    successMessage.className = 'checkout-message checkout-success';
    successMessage.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--green-color, #4CAF50);
        color: var(--brown-color: #82381A;);
        padding: 15px 25px;
        border-radius: 0px;
        z-index: 10000;
        max-width: 90%;
        text-align: center;
    `;

    // Get success text based on current language
    const successTexts = {
        'es': '¡Bienvenido a EspaiCos! Tu suscripción está activa. Te enviaremos los detalles por correo.',
        'ca': 'Benvingut a EspaiCos! La teva subscripció està activa. T\'enviarem els detalls per correu.',
        'en': 'Welcome to EspaiCos! Your subscription is active. We\'ll email you the details.'
    };
    const currentLang = window.currentLang || 'es';
    successMessage.textContent = successTexts[currentLang] || successTexts['es'];

    // Add to page
    document.body.appendChild(successMessage);

    // Auto-remove after 8 seconds
    setTimeout(() => {
        if (successMessage.parentNode) {
            successMessage.remove();
        }
    }, 8000);

    // Scroll to top to make sure message is visible
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showCheckoutCancelled() {
    // Create cancellation message
    const cancelMessage = document.createElement('div');
    cancelMessage.className = 'checkout-message checkout-cancelled';
    cancelMessage.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--brown-color, #8B4513);
        color: var(--beige-color: #F7F7D2;);
        padding: 15px 25px;
        z-index: 10000;
        font-weight: 500;
        max-width: 90%;
        text-align: center;
    `;

    // Get cancellation text based on current language
    const cancelTexts = {
        'es': 'Pago cancelado. Tu información está guardada y puedes completar la suscripción cuando quieras.',
        'ca': 'Pagament cancel·lat. La teva informació està guardada i pots completar la subscripció quan vulguis.',
        'en': 'Payment canceled. Your information is saved and you can complete your subscription anytime.'
    };
    const currentLang = window.currentLang || 'es';
    cancelMessage.textContent = cancelTexts[currentLang] || cancelTexts['es'];

    // Add to page
    document.body.appendChild(cancelMessage);

    // Auto-remove after 6 seconds
    setTimeout(() => {
        if (cancelMessage.parentNode) {
            cancelMessage.remove();
        }
    }, 6000);

    // Scroll to top to make sure message is visible
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cleanupUrl() {
    // Remove checkout parameters from URL without page reload
    const url = new URL(window.location);
    url.searchParams.delete('checkout');
    url.searchParams.delete('session_id');
    window.history.replaceState({}, document.title, url.toString());
} 