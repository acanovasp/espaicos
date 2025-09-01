// Language switcher functionality
let currentLang = 'es'; // Default language
let translations = {};

// Make current language and translations available globally
window.currentLang = currentLang;
window.currentTranslations = translations;

// Load translations
async function loadTranslations(lang) {
    try {
        // Add cache-busting parameter to force fresh load
        const cacheBuster = new Date().getTime();
        const response = await fetch(`./assets/translations/${lang}.json?v=${cacheBuster}`);
        
        console.log(`🔍 Loading ${lang} translations...`, response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        translations[lang] = data;
        
        // Debug: Log specific content we're testing
        if (lang === 'es') {
            console.log('🧪 Spanish contemporary title:', data.classes?.contemporary?.title);
            console.log('🧪 Spanish classical title:', data.classes?.classical?.title);
        }
        
        return data;
    } catch (error) {
        console.error(`❌ Error loading ${lang} translations:`, error);
        translations[lang] = {};
        return {};
    }
}

// Initialize translations
async function initTranslations() {
    const results = await Promise.allSettled([
        loadTranslations('ca'),
        loadTranslations('es'),
        loadTranslations('en')
    ]);
    
    // Check if we have at least Spanish translations
    if (!translations.es || Object.keys(translations.es).length === 0) {
        console.error('Failed to load Spanish translations - using fallback');
        translations.es = {
            "home": { "title": "Espai Cos es un lugar donde poder celebrar, redescubrir y reinventar el cuerpo a través de la formación en danza y la creación artística." },
            "about": { "p1": "Un punto de encuentro en Calvià..." }
        };
    }
    
    // Update global reference
    window.currentTranslations = translations;
}

// Update text content with animation
function updateTextContent() {
    console.log('🔄 Updating text content for language:', currentLang);
    if (!translations[currentLang]) {
        console.error('❌ No translations found for:', currentLang);
        return;
    }
    console.log('✅ Found translations for:', currentLang);
    
    // Get all elements with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]');
    
    // Separate visible and hidden elements
    const visibleElements = [];
    const hiddenElements = [];
    
    elements.forEach(element => {
        const computedStyle = window.getComputedStyle(element);
        const isHidden = computedStyle.opacity === '0' || 
                        computedStyle.visibility === 'hidden' || 
                        element.closest('.overlay-menu:not(.active)') !== null;
        
        if (isHidden) {
            hiddenElements.push(element);
        } else {
            visibleElements.push(element);
        }
    });
    
    // Update hidden elements immediately (no animation needed)
    hiddenElements.forEach((element) => {
        updateElementContent(element);
    });
    
    // Animate visible elements with direct style manipulation
    if (visibleElements.length > 0) {
        // Store original opacity values and start fade-out
        const originalOpacities = new Map();
        
        visibleElements.forEach(element => {
            const currentOpacity = window.getComputedStyle(element).opacity;
            originalOpacities.set(element, currentOpacity);
            
            // Force transition and fade out
            element.style.transition = 'opacity 0.2s ease-in-out';
            element.style.opacity = '0';
        });
        
        // Wait for fade-out to complete, then update content and fade back in
        setTimeout(() => {
            // Update content while invisible
            visibleElements.forEach((element) => {
                updateElementContent(element);
            });
            
            // Small delay to ensure content is updated, then fade back in
            setTimeout(() => {
                visibleElements.forEach(element => {
                    const originalOpacity = originalOpacities.get(element);
                    element.style.opacity = originalOpacity;
                    
                    // Clean up inline styles after animation
                    setTimeout(() => {
                        element.style.transition = '';
                        element.style.opacity = '';
                    }, 200);
                });
            }, 50);
            
        }, 200); // Wait for fade-out transition to complete
    }
}

// Helper function to update individual element content
function updateElementContent(element) {
    const keys = element.getAttribute('data-i18n').split('.');
    let value = translations[currentLang];
    
    // Navigate through the translation object
    for (const key of keys) {
        if (value && value[key] !== undefined) {
            value = value[key];
        } else {
            return;
        }
    }
    
    // Update element content
    if (Array.isArray(value)) {
        // Handle arrays (like space features)
        element.innerHTML = value.map(item => `<p>${item}</p>`).join('');
    } else {
        element.textContent = value;
    }
}

// Switch language
async function switchLanguage(lang) {
    if (currentLang === lang) {
        return;
    }
    
    currentLang = lang;
    window.currentLang = lang; // Update global reference
    
    // Update active state of language buttons
    document.querySelectorAll('.language-selector button').forEach(button => {
        button.classList.remove('active');
        const buttonLang = getLanguageFromButton(button.textContent);
        if (buttonLang === lang) {
            button.classList.add('active');
        }
    });
    
    // Update text content with animation
    updateTextContent();
    
    // Save language preference
    localStorage.setItem('preferredLanguage', lang);
}

// Get language code from button text
function getLanguageFromButton(buttonText) {
    const langMap = {
        'català': 'ca',
        'español': 'es',
        'english': 'en'
    };
    return langMap[buttonText.toLowerCase()] || buttonText.toLowerCase();
}

// Initialize language switcher
document.addEventListener('DOMContentLoaded', async () => {
    // Load translations
    await initTranslations();
    
    // Debug: Check if Spanish translations loaded correctly
    console.log('🌍 Spanish translations loaded:', translations.es ? 'YES' : 'NO');
    console.log('🌍 Available translations:', Object.keys(translations));
    
    // Set initial language from localStorage or default to Spanish
    const savedLang = localStorage.getItem('preferredLanguage') || 'es';
    console.log('🌍 Setting initial language to:', savedLang);
    await switchLanguage(savedLang);
    
    // Add click handlers to language buttons
    const buttons = document.querySelectorAll('.language-selector button');
    
    buttons.forEach((button) => {
        button.addEventListener('click', () => {
            const lang = getLanguageFromButton(button.textContent);
            switchLanguage(lang);
        });
    });
}); 