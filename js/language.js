// Language switcher functionality
let currentLang = 'es'; // Default language
let translations = {};

// Make current language and translations available globally
window.currentLang = currentLang;
window.currentTranslations = translations;

// Load translations
async function loadTranslations(lang) {
    try {
        const response = await fetch(`./assets/translations/${lang}.json`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        translations[lang] = data;
        return data;
    } catch (error) {
        console.error(`Error loading ${lang} translations:`, error);
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
    if (!translations[currentLang]) {
        return;
    }
    
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
    const translationKey = keys.join('.');
    let value = translations[currentLang];
    
    // Navigate through the translation object
    for (const key of keys) {
        if (value && value[key] !== undefined) {
            value = value[key];
        } else {
            console.warn(`🚫 Translation missing for ${translationKey} in ${currentLang}`);
            return;
        }
    }
    
    // Update element content
    if (Array.isArray(value)) {
        // Handle arrays (like space features)
        element.innerHTML = value.map(item => `<p>${item}</p>`).join('');
        console.log(`📝 Updated array content for ${translationKey}:`, value);
    } else {
        const oldText = element.textContent;
        element.textContent = value;
        console.log(`📝 Updated ${translationKey}: "${oldText}" → "${value}"`);
    }
}

// Switch language
async function switchLanguage(lang) {
    console.log(`🔄 switchLanguage called: ${lang}, currentLang: ${currentLang}`);
    
    if (currentLang === lang) {
        console.log('⏭️ Skipping language switch - already active');
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
    console.log(`🔄 Updating content for language: ${lang}`);
    updateTextContent();
    
    // Save language preference
    localStorage.setItem('preferredLanguage', lang);
    console.log(`✅ Language switched to: ${lang}`);
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
    console.log('🌐 Language system initializing...');
    
    // Load translations
    await initTranslations();
    
    // Debug: Check if Spanish translations loaded correctly
    console.log('🌐 Loaded translations:', Object.keys(translations));
    console.log('🇪🇸 Spanish translations loaded:', !!translations.es && Object.keys(translations.es).length > 0);
    if (translations.es) {
        console.log('🇪🇸 Spanish translation keys:', Object.keys(translations.es));
    }
    
    // Set initial language from localStorage or default to Spanish
    const savedLang = localStorage.getItem('preferredLanguage') || 'es';
    console.log('🔄 Initializing with language:', savedLang);
    
    // Force initial content update by temporarily setting currentLang to different value
    const originalLang = currentLang;
    currentLang = 'temp'; // Temporary value to force update
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