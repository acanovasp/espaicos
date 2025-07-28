// Stripe Checkout Result Handler
// Handles success and cancellation messages when returning from Stripe

document.addEventListener('DOMContentLoaded', function() {
    // Check URL parameters for checkout results
    const urlParams = new URLSearchParams(window.location.search);
    const checkoutStatus = urlParams.get('checkout');
    const sessionId = urlParams.get('session_id');

    console.log('Checkout handler loaded');
    console.log('URL params:', { checkoutStatus, sessionId });
    console.log('Current URL:', window.location.href);
    
    // Debug localStorage state
    console.log('=== LOCALSTORAGE DEBUG ===');
    console.log('All localStorage keys:', Object.keys(localStorage));
    console.log('localStorage length:', localStorage.length);
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        console.log(`localStorage[${key}]:`, localStorage.getItem(key));
    }
    console.log('Specific espaiCosFormData:', localStorage.getItem('espaiCosFormData'));
    console.log('=== END LOCALSTORAGE DEBUG ===');

    if (checkoutStatus === 'success' && sessionId) {
        console.log('Success flow triggered');
        showCheckoutSuccess();
        // Clean up URL
        cleanupUrl();
    } else if (checkoutStatus === 'cancelled') {
        console.log('Cancellation flow triggered');
        showCheckoutCancelled();
        // Clean up URL
        cleanupUrl();
    } else {
        console.log('No checkout status detected');
    }
});

// Global test function for manual localStorage testing
window.testLocalStorage = function() {
    console.log('=== MANUAL LOCALSTORAGE TEST ===');
    // Set test data
    localStorage.setItem('testKey', 'testValue');
    localStorage.setItem('espaiCosTest', JSON.stringify({test: 'data', timestamp: new Date().toISOString()}));
    
    // Retrieve test data
    console.log('Test key:', localStorage.getItem('testKey'));
    console.log('EspaiCos test:', localStorage.getItem('espaiCosTest'));
    console.log('Actual form data:', localStorage.getItem('espaiCosFormData'));
    
    // List all keys
    console.log('All keys:', Object.keys(localStorage));
    console.log('=== END MANUAL TEST ===');
};

function showCheckoutSuccess() {
    // Submit stored form data to Formspree
    submitStoredFormData();

    // Wait for language system to be ready
    const currentLang = window.currentLang || 'es';
    console.log('Current language for success message:', currentLang);

    // Create success message
    const successMessage = document.createElement('div');
    successMessage.className = 'checkout-message checkout-success';
    successMessage.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #B0FFD1;
        color: #82381A;
        padding: 15px 25px;
        z-index: 10000;
        font-weight: 500;
        max-width: 90%;
        text-align: center;
    `;

    // Get success text based on current language
    const successTexts = {
        'es': '¡Pago exitoso! Pronto recibirás un correo de confirmación.',
        'ca': 'Pagament exitós! Aviat rebràs un correu de confirmació.',
        'en': 'Payment successful! You will receive a confirmation email soon.'
    };
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
    // Clear stored form data on cancellation
    localStorage.removeItem('espaiCosFormData');

    // Create cancellation message
    const cancelMessage = document.createElement('div');
    cancelMessage.className = 'checkout-message checkout-cancelled';
    cancelMessage.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #F58869;
        color: #82381A;
        padding: 15px 25px;
        z-index: 10000;
        font-weight: 500;
        max-width: 90%;
        text-align: center;
    `;

    // Get cancellation text based on current language
    const cancelTexts = {
        'es': 'Pago cancelado. Puedes intentarlo de nuevo cuando quieras.',
        'ca': 'Pagament cancel·lat. Pots intentar-ho de nou quan vulguis.',
        'en': 'Payment cancelled. You can try again whenever you like.'
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

// Submit stored form data to Formspree after successful payment
async function submitStoredFormData() {
    console.log('=== Starting submitStoredFormData ===');
    try {
        // Get stored form data
        const storedData = localStorage.getItem('espaiCosFormData');
        console.log('Raw stored data:', storedData);
        
        if (!storedData) {
            console.log('No stored form data found');
            return;
        }

        const formData = JSON.parse(storedData);
        console.log('Parsed form data:', formData);
        
        // Create FormData object for submission
        const submitData = new FormData();
        for (const [key, value] of Object.entries(formData)) {
            console.log(`Adding to FormData: ${key} = ${value}`);
            submitData.append(key, value);
        }

        console.log('About to submit to Formspree...');
        
        // Submit to Formspree
        const response = await fetch('https://formspree.io/f/mwpbjape', {
            method: 'POST',
            body: submitData,
            headers: {
                'Accept': 'application/json'
            }
        });

        console.log('Formspree response status:', response.status);
        console.log('Formspree response ok:', response.ok);

        if (response.ok) {
            console.log('✅ Form successfully submitted to Formspree');
            // Clear stored data after successful submission
            localStorage.removeItem('espaiCosFormData');
            console.log('✅ Cleared localStorage');
            
            // Also add email to MailerLite for marketing purposes
            await addEmailToMailerLite(formData);
        } else {
            const responseText = await response.text();
            console.error('❌ Failed to submit form to Formspree:', response.status, responseText);
        }
    } catch (error) {
        console.error('❌ Error submitting form to Formspree:', error);
    }
    console.log('=== End submitStoredFormData ===');
}

// Add contact form email to MailerLite for marketing purposes
async function addEmailToMailerLite(formData) {
    console.log('📧 Adding email to MailerLite...');
    
    try {
        const mailerliteData = {
            email: formData.email,
            language: window.currentLang || 'es',
            source: 'contact_form',
            name: formData.name,
            phone: formData.tel,
            plan: formData.plan
        };
        
        console.log('MailerLite payload:', mailerliteData);
        
        const response = await fetch('/api/newsletter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(mailerliteData)
        });
        
        const result = await response.json();
        console.log('MailerLite response:', result);
        
        if (response.ok) {
            console.log('✅ Email successfully added to MailerLite');
        } else if (response.status === 409) {
            console.log('ℹ️ Email already exists in MailerLite (expected for repeat customers)');
        } else {
            console.warn('⚠️ Failed to add email to MailerLite:', result.error);
        }
    } catch (error) {
        console.error('❌ Error adding email to MailerLite:', error);
        // Don't throw error - this is optional enhancement, shouldn't break the main flow
    }
} 