// Main JavaScript functionality

// Browser detection for logo display
function detectBrowser() {
    const userAgent = navigator.userAgent;
    const isChrome = /Chrome/.test(userAgent) && !/Edge/.test(userAgent);
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
    
    if (isSafari) {
        document.body.classList.add('is-safari');
        console.log('Safari detected - using static SVG logo');
    } else if (isChrome) {
        document.body.classList.add('is-chrome');  
        console.log('Chrome/Chromium detected - using WebM video logo');
    } else {
        // Default to Chrome behavior for other browsers
        document.body.classList.add('is-chrome');
        console.log('Other browser detected - defaulting to WebM video logo');
    }
}

// Run browser detection immediately
detectBrowser();

document.addEventListener('DOMContentLoaded', () => {
    // Navigation menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const menuIcon = document.querySelector('.menu-icon');
    const overlayMenu = document.querySelector('.overlay-menu');
    const closeMenu = document.querySelector('.close-menu');

    // Random logo background color on hover/touch
    const logo = document.querySelector('.logo'); // This will select the first .logo element
    const logoInMenu = document.querySelector('.menu-logo');
    
    // Get all logo elements for color changing
    const chromeDesktopLogo = document.querySelector('.chrome-logo');
    const safariDesktopLogo = document.querySelector('.safari-logo'); 
    const mobileLogo = document.querySelector('.mobile-logo');
    const allLogos = [chromeDesktopLogo, safariDesktopLogo, mobileLogo, logoInMenu].filter(Boolean); // Remove null elements
    
    const colors = [
        'var(--blue-color)',
        'var(--green-color)',
        'var(--orange-color)',
        'var(--purple-color)'
    ];
    
    // Function to select random color
    const getRandomColor = () => {
        return colors[Math.floor(Math.random() * colors.length)];
    };
    
    // Track previous color to avoid repeats
    let previousColor = '';
    let colorTimeout = null;
    
    // Function to change logo color
    const changeLogoColor = (logoElement) => {
        let newColor = getRandomColor();
        // Prevent the same color twice in a row
        while (newColor === previousColor) {
            newColor = getRandomColor();
        }
        previousColor = newColor;
        logoElement.style.backgroundColor = newColor;
        
        // Clear any existing timeout
        if (colorTimeout) {
            clearTimeout(colorTimeout);
        }
        
        // Set timeout to revert color after 2 seconds (for mobile)
        colorTimeout = setTimeout(() => {
            logoElement.style.backgroundColor = 'transparent';
        }, 2000);
    };
    
    // Function to reset logo color immediately (for desktop hover out)
    const resetLogoColor = (logoElement) => {
        if (colorTimeout) {
            clearTimeout(colorTimeout);
            colorTimeout = null;
        }
        logoElement.style.backgroundColor = 'transparent';
    };
    
    // Add event listeners to both logos
    allLogos.forEach(logoElement => {
        if (logoElement) {
            // Desktop hover events
            logoElement.addEventListener('mouseenter', () => {
                changeLogoColor(logoElement);
            });
            
            logoElement.addEventListener('mouseleave', () => {
                resetLogoColor(logoElement);
            });
            
            // Mobile touch events
            logoElement.addEventListener('touchstart', (e) => {
                e.preventDefault(); // Prevent scrolling on touch
                changeLogoColor(logoElement);
            }, { passive: false });
            
            // Click events (works for both desktop and mobile as fallback)
            logoElement.addEventListener('click', (e) => {
                e.preventDefault();
                changeLogoColor(logoElement);
            });
        }
    });

    if (menuToggle && overlayMenu && menuIcon) {
        menuToggle.addEventListener('click', () => {
            // Add squished class to animate the icon
            menuIcon.classList.add('squished');
            
            // Wait for animation to complete before showing menu
            setTimeout(() => {
                // Find the currently visible section
                const sections = document.querySelectorAll('section[data-bgcolor]');
                let currentSection = null;
                
                sections.forEach(section => {
                    const rect = section.getBoundingClientRect();
                    // Check if section is mostly visible in the viewport
                    if (rect.top < window.innerHeight/2 && rect.bottom > window.innerHeight/2) {
                        currentSection = section;
                    }
                });
                
                if (currentSection) {
                    // Get the data-bgcolor attribute from the current section
                    const bgColor = currentSection.getAttribute('data-bgcolor');
                    // Apply that color to the overlay menu
                    overlayMenu.style.backgroundColor = bgColor;
                }
                
                // Show the menu
                overlayMenu.classList.add('active');
                
                // Reset icon after menu is open
                setTimeout(() => {
                    menuIcon.classList.remove('squished');
                }, 300);
            }, 300); // Match this to the CSS transition duration
        });
    }

    if (closeMenu && overlayMenu) {
        closeMenu.addEventListener('click', () => {
            overlayMenu.classList.remove('active');
        });
    }

    // Close menu when clicking a navigation link
    const menuLinks = document.querySelectorAll('.menu-navigation a');
    menuLinks.forEach(link => {
        link.addEventListener('click', () => {
            overlayMenu.classList.remove('active');
        });
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Hide back-to-top button when footer is visible
    const backToTopBtn = document.querySelector('.back-to-top');
    const footer = document.querySelector('body > .footer'); // Only target the main footer, not the one in overlay
    
    if (backToTopBtn && footer) {
        const checkFooterVisibility = () => {
            // Don't hide button when overlay is active
            if (document.querySelector('.overlay-menu.active')) {
                backToTopBtn.style.opacity = '0'; // Hide when overlay is active
                backToTopBtn.style.pointerEvents = 'none';
                return;
            }
            
            const footerRect = footer.getBoundingClientRect();
            // If footer is in viewport
            if (footerRect.top < window.innerHeight) {
                backToTopBtn.style.opacity = '0';
                backToTopBtn.style.pointerEvents = 'none'; // Disable interactions
            } else {
                backToTopBtn.style.opacity = '1';
                backToTopBtn.style.pointerEvents = 'auto'; // Enable interactions
            }
        };
        
        // Check on scroll
        window.addEventListener('scroll', checkFooterVisibility, { passive: true });
        // Initial check
        checkFooterVisibility();
        
        // Also check when overlay menu is toggled
        if (menuToggle) {
            menuToggle.addEventListener('click', checkFooterVisibility);
        }
        if (closeMenu) {
            closeMenu.addEventListener('click', checkFooterVisibility);
        }
    }

    // Initialize any animations or effects
    initializeAnimations();
});

function initializeAnimations() {
    // Add animation classes when elements come into view
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    });

    animatedElements.forEach(element => {
        observer.observe(element);
    });
} 

document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('section[data-bgcolor]');
    const body = document.body;
    let ticking = false;
  
    function changeBgOnScroll() {
        let found = false;
        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            // More aggressive detection: check if section is in viewport center area
            const centerY = window.innerHeight / 2;
            if (rect.top <= centerY && rect.bottom >= centerY && !found) {
                const color = section.getAttribute('data-bgcolor');
                body.style.backgroundColor = color;
                found = true;
            }
        });
        ticking = false;
    }

    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(changeBgOnScroll);
            ticking = true;
        }
    }
  
    // Multiple event listeners for better mobile support
    window.addEventListener('scroll', requestTick, { passive: true });
    
    // Add touch-specific events for mobile
    window.addEventListener('touchmove', requestTick, { passive: true });
    window.addEventListener('touchend', () => {
        // Small delay to catch final position after touch scrolling
        setTimeout(changeBgOnScroll, 100);
    }, { passive: true });
    
    // Intersection Observer as backup for mobile
    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -20% 0px', // Only trigger when section is in center 60% of viewport
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const color = entry.target.getAttribute('data-bgcolor');
                body.style.backgroundColor = color;
            }
        });
    }, observerOptions);
    
    // Observe all sections with data-bgcolor
    sections.forEach(section => {
        observer.observe(section);
    });
    
    changeBgOnScroll(); // Set initial color
});

  document.addEventListener('DOMContentLoaded', function() {
    const forms = document.querySelectorAll('.newsletter-form');
    
    forms.forEach(form => {
        const input = form.querySelector('input[type="text"]');
        const button = form.querySelector('button');
        const error = form.querySelector('.newsletter-error');
        const success = form.querySelector('.newsletter-success');

        if (!input || !button || !error || !success) return;

        // Prevent browser's default validation messages
        input.setAttribute('novalidate', true);
        input.addEventListener('invalid', function(e) {
            e.preventDefault(); // Prevent browser's default validation popup
        }, true);

        // Hide the button initially
        button.style.display = 'none';
        error.style.display = 'none';
        success.style.display = 'none';

        // Show the button when the user types something
        input.addEventListener('input', function() {
            // Remove any validation styling from browser
            this.setCustomValidity('');
            
            if (input.value.trim().length > 0) {
                // Reset button to original state when user starts typing again
                button.disabled = false;
                const buttonTexts = {
                    'es': 'Suscribirte',
                    'ca': "Subscriure's",
                    'en': 'Subscribe'
                };
                const currentLang = window.currentLang || 'es';
                button.textContent = buttonTexts[currentLang] || buttonTexts['es'];
                
                button.style.display = '';
                error.style.display = 'none';
                success.style.display = 'none';
            } else {
                button.style.display = 'none';
                error.style.display = 'none';
                success.style.display = 'none';
            }
        });

        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Custom email validation regex
            const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
            if (!input.value || !emailPattern.test(input.value.trim())) {
                // Get translation from translation system if available
                const errorMsg = window.currentTranslations?.footer?.newsletter_error || 'Por favor, introduce un email válido.';
                error.textContent = errorMsg;
                error.style.display = 'block';
                success.style.display = 'none';
                input.focus();
                return;
            }

            // Show loading state
            const originalButtonText = button.textContent;
            const loadingTexts = {
                'es': 'Enviando...',
                'ca': 'Enviant...',
                'en': 'Sending...'
            };
            const currentLang = window.currentLang || 'es';
            button.textContent = loadingTexts[currentLang] || loadingTexts['es'];
            button.disabled = true;
                error.style.display = 'none';
            success.style.display = 'none';

            try {
                // Submit to our secure API endpoint
                const response = await fetch('/api/newsletter', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email: input.value.trim(),
                        language: currentLang || 'es',
                        source: 'newsletter'
                    })
                });

                const responseData = await response.json();
                
                if (response.ok && responseData.success) {
                    // Success
                const successMsg = window.currentTranslations?.footer?.newsletter_success || '¡Gracias por suscribirte!';
                success.textContent = successMsg;
                success.style.display = 'block';
                form.reset();
                button.style.display = 'none';
                        
                setTimeout(() => {
                    success.style.display = 'none';
                    }, 3000);
                } else {
                    // Handle specific error messages from our API
                    let errorMessage;
                    if (response.status === 409) {
                        // Email already subscribed
                        errorMessage = window.currentTranslations?.footer?.newsletter_error_duplicate || 'Ya estás suscrito a nuestro newsletter.';
                    } else {
                        // General error
                        errorMessage = responseData.error || 'Error al suscribirse. Inténtalo de nuevo.';
                    }
                    throw new Error(errorMessage);
                }
            } catch (error) {
                // Error handling
                const errorMsg = error.message || window.currentTranslations?.footer?.newsletter_error_server || 'Error al suscribirse. Inténtalo de nuevo.';
                error.textContent = errorMsg;
                error.style.display = 'block';
                
                // Reset button
                button.textContent = originalButtonText;
                button.disabled = false;
                button.style.display = '';
            }
        });
    });
});

// Video logo control for play-once behavior (Chrome/Chromium desktop only)
document.addEventListener('DOMContentLoaded', function() {
    const logoVideo = document.querySelector('.chrome-logo');
    
    // Only control video on desktop Chrome/Chromium browsers
    if (logoVideo && logoVideo.tagName === 'VIDEO' && window.innerWidth > 768 && document.body.classList.contains('is-chrome')) {
        console.log('🎬 Setting up Chrome/Chromium desktop logo video play-once behavior');
        
        // Ensure video is paused initially
        logoVideo.pause();
        logoVideo.currentTime = 0;
        
        // Play video once with a 2-second delay (similar to CSS animation-delay)
        setTimeout(() => {
            logoVideo.play().catch(error => {
                console.warn('⚠️ Video autoplay failed (browser policy):', error);
                // Fallback: play on first user interaction
                document.addEventListener('click', () => {
                    if (logoVideo.paused) {
                        logoVideo.play();
                    }
                }, { once: true });
            });
        }, 500);
        
        // Ensure video stops after playing once
        logoVideo.addEventListener('ended', () => {
            console.log('✅ Desktop logo animation completed');
            logoVideo.pause();
        });
    } else if (window.innerWidth <= 768) {
        console.log('📱 Mobile detected - using static logo image');
    } else if (document.body.classList.contains('is-safari')) {
        console.log('🧭 Safari detected - using static SVG logo on desktop');
    }
});

// Scroll-triggered animations for schedule section
document.addEventListener('DOMContentLoaded', function() {
    const scheduleSection = document.querySelector('#schedule-section');
    const scheduleClasses = document.querySelectorAll('.schedule-class');
    
    if (!scheduleSection || scheduleClasses.length === 0) {
        return;
    }
    
    console.log('🎬 Setting up scroll animations for', scheduleClasses.length, 'schedule items');
    
    // Create intersection observer for the schedule section
    const observerOptions = {
        root: null,
        rootMargin: '-10% 0px -10% 0px', // Trigger when 10% of element is visible
        threshold: 0.3 // Trigger when 30% of element is visible
    };
    
    const scheduleObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                console.log('✨ Schedule section is visible - triggering animations');
                
                // Add animation class to all schedule items
                scheduleClasses.forEach((item, index) => {
                    setTimeout(() => {
                        item.classList.add('animate-in');
                        console.log(`🎯 Animating schedule item ${index + 1}`);
                    }, index * 150); // Stagger animations by 150ms
                });
                
                // Stop observing after animation triggers
                scheduleObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Start observing the schedule section
    scheduleObserver.observe(scheduleSection);
    
    // Optional: Reset animation if user scrolls back up (uncomment if desired)
    /*
    const resetObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting && entry.boundingClientRect.bottom < 0) {
                // User scrolled past the section, reset for next time
                scheduleClasses.forEach(item => {
                    item.classList.remove('animate-in');
                });
                scheduleObserver.observe(scheduleSection);
            }
        });
    }, { threshold: 0 });
    
    resetObserver.observe(scheduleSection);
    */
});