document.addEventListener('DOMContentLoaded', (event) => {
    const body = document.body;
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('header nav');
    const navLinks = document.querySelectorAll('header nav ul li a');
    const modalCloseButtons = document.querySelectorAll('.modal .close');
    const projectItems = document.querySelectorAll('.project');
    const serviceInquiryForms = document.querySelectorAll('.service-inquiry-form');

    let activeProjectModal = null;
    let windowClickEventHandler = null;

    // --- Navigation ---
    const servicePages = new Set(['services.html', 'custom-training.html', 'learning-powerpoint.html', 'mentoring.html']);
    const portfolioPages = new Set(['portfolio.html', 'case-entrepreneurship.html']);

    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
            const isExpanded = nav.classList.contains('active');
            menuToggle.setAttribute('aria-expanded', isExpanded);
        });
    }

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href').split('/').pop() || 'index.html';
        const parentItem = link.parentElement;
        const shouldHighlight = linkPage === currentPage || (servicePages.has(currentPage) && linkPage === 'services.html') || (portfolioPages.has(currentPage) && linkPage === 'portfolio.html');

        if (shouldHighlight) {
            parentItem.classList.add('current');
        } else {
            parentItem.classList.remove('current');
        }

        link.addEventListener('click', () => {
            if (nav && nav.classList.contains('active')) {
                nav.classList.remove('active');
                if (menuToggle) {
                    menuToggle.setAttribute('aria-expanded', 'false');
                }
            }
        });
    });

    // --- Modal Functionality ---
    function closeActiveModal() {
        if (activeProjectModal) {
            activeProjectModal.style.display = "none";
            activeProjectModal = null;
            if (windowClickEventHandler) {
                window.removeEventListener("click", windowClickEventHandler);
                windowClickEventHandler = null;
            }
        }
    }

    projectItems.forEach(project => {
        project.addEventListener('click', () => {
            const targetModalId = project.dataset.target;
            if (targetModalId) {
                const targetModalEl = document.querySelector(targetModalId);
                if (targetModalEl) {
                    closeActiveModal();

                    targetModalEl.style.display = "block";
                    activeProjectModal = targetModalEl;

                    windowClickEventHandler = function(e) {
                        if (e.target === targetModalEl) {
                             closeActiveModal();
                        }
                    };
                    window.addEventListener("click", windowClickEventHandler);

                    targetModalEl.querySelectorAll('a[href^="http"], a[href^="https"]').forEach(link => {
                         if (!link.hasAttribute('data-no-blank')) {
                            link.setAttribute('target', '_blank');
                            link.setAttribute('rel', 'noopener noreferrer');
                        }
                    });
                } else {
                    console.warn(`Modal with ID ${targetModalId} not found.`);
                }
            } else {
                 console.warn('Project item clicked has no data-target attribute.');
            }
        });
    });

    modalCloseButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeActiveModal();
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape" && activeProjectModal) {
            closeActiveModal();
        }
    });

    // --- PDF Viewer Modal Functionality ---
    const pdfModal = document.getElementById('pdf-modal');
    const pdfModalTitle = document.getElementById('pdf-modal-title');
    const pdfIframe = document.getElementById('pdf-iframe');
    const viewDetailsButtons = document.querySelectorAll('.view-details-button');

    let activePdfModal = null;

    function closePdfModal() {
        if (activePdfModal) {
            activePdfModal.style.display = "none";
            pdfIframe.src = "";
            activePdfModal = null;
        }
    }

    // Initialize PDF modal functionality if elements exist
    if (pdfModal && pdfModalTitle && pdfIframe && viewDetailsButtons.length > 0) {
        // Add click handlers for all view details buttons
        viewDetailsButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const pdfPath = button.dataset.pdf;
                if (!pdfPath) {
                    console.warn('View Details button clicked has no data-pdf attribute.');
                    return;
                }

                // Get project title
                const cardContent = button.closest('.card-content');
                const projectTitleElement = cardContent?.querySelector('h4');
                const projectTitle = projectTitleElement ? projectTitleElement.textContent : 'Project Details';

                // Close any other open modals first
                closeActiveModal();
                closePdfModal();

                // Set modal title and PDF source
                pdfModalTitle.textContent = projectTitle;
                
                // Add security parameters to prevent downloads while allowing viewing
                pdfIframe.src = pdfPath + '#toolbar=0&navpanes=0&scrollbar=0&view=FitH&zoom=page-width&statusbar=0&messages=0&pagemode=none';

                // Show the modal
                pdfModal.style.display = 'block';
                activePdfModal = pdfModal;

                // Scroll to top of modal to ensure it's visible
                setTimeout(() => {
                    // Scroll to top of page first, then scroll modal into view
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    setTimeout(() => {
                        pdfModal.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 300);
                }, 50);

                // Add escape key handler
                const escapeHandler = (event) => {
                    if (event.key === 'Escape') {
                        closePdfModal();
                        document.removeEventListener('keydown', escapeHandler);
                    }
                };
                document.addEventListener('keydown', escapeHandler);
            });
        });

        // Add close button functionality
        const closeButton = pdfModal.querySelector('.close-modal');
        if (closeButton) {
            closeButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                closePdfModal();
            });
        }

        // Add click outside to close functionality
        pdfModal.addEventListener('click', (e) => {
            if (e.target === pdfModal) {
                closePdfModal();
            }
        });

        console.log(`PDF Viewer initialized with ${viewDetailsButtons.length} buttons`);
    } else {
        if (!pdfModal) console.warn("PDF Modal element (#pdf-modal) not found.");
        if (!pdfModalTitle) console.warn("PDF Modal title element (#pdf-modal-title) not found.");
        if (!pdfIframe) console.warn("PDF iframe element (#pdf-iframe) not found.");
        if (viewDetailsButtons.length === 0) console.warn("No view details buttons found.");
    }

    // Global escape key handler
    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape") {
            closePdfModal();
        }
    });

    // --- Testimonial Slider ---
    const testimonialSliders = document.querySelectorAll('[data-testimonial-slider]');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    testimonialSliders.forEach(slider => {
        const track = slider.querySelector('[data-slider-track]');
        const slides = track ? Array.from(track.children) : [];
        const prevButton = slider.querySelector('[data-slider-prev]');
        const nextButton = slider.querySelector('[data-slider-next]');
        const dotsContainer = slider.querySelector('[data-slider-dots]');
        if (!track || slides.length === 0) {
            slider.classList.add('is-disabled');
            return;
        }

        let currentIndex = 0;
        let autoplayTimer = null;
        const autoplayEnabled = slider.dataset.autoplay === 'true' && !prefersReducedMotion;
        const interval = parseInt(slider.dataset.interval || '6500', 10);
        const dots = [];

        const updateAria = () => {
            slides.forEach((slide, index) => {
                slide.setAttribute('aria-hidden', index === currentIndex ? 'false' : 'true');
            });
            dots.forEach((dot, index) => {
                dot.setAttribute('aria-current', index === currentIndex ? 'true' : 'false');
            });
        };

        const goTo = (targetIndex, fromAutoplay = false) => {
            const slideCount = slides.length;
            currentIndex = (targetIndex + slideCount) % slideCount;
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
            updateAria();
            if (!fromAutoplay) {
                restartAutoplay();
            }
        };

        const startAutoplay = () => {
            if (!autoplayEnabled) return;
            stopAutoplay();
            autoplayTimer = window.setInterval(() => {
                goTo(currentIndex + 1, true);
            }, interval);
        };

        const stopAutoplay = () => {
            if (autoplayTimer) {
                window.clearInterval(autoplayTimer);
                autoplayTimer = null;
            }
        };

        const restartAutoplay = () => {
            if (!autoplayEnabled) return;
            stopAutoplay();
            startAutoplay();
        };

        if (dotsContainer) {
            slides.forEach((_slide, index) => {
                const dot = document.createElement('button');
                dot.type = 'button';
                dot.setAttribute('aria-label', `Show testimonial ${index + 1}`);
                dot.addEventListener('click', () => goTo(index));
                dotsContainer.appendChild(dot);
                dots.push(dot);
            });
        }

        prevButton?.addEventListener('click', () => goTo(currentIndex - 1));
        nextButton?.addEventListener('click', () => goTo(currentIndex + 1));

        slider.addEventListener('mouseenter', stopAutoplay);
        slider.addEventListener('mouseleave', startAutoplay);
        slider.addEventListener('focusin', stopAutoplay);
        slider.addEventListener('focusout', startAutoplay);

        updateAria();
        startAutoplay();
    });


    const testimonialToggle = document.querySelector('[data-toggle-testimonials]');
    const testimonialArchive = document.querySelector('[data-testimonial-archive]');

    if (testimonialToggle && testimonialArchive) {
        testimonialToggle.addEventListener('click', () => {
            const isHidden = testimonialArchive.hasAttribute('hidden');
            if (isHidden) {
                testimonialArchive.removeAttribute('hidden');
                testimonialToggle.textContent = 'Hide full testimonials';
                testimonialArchive.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                testimonialArchive.setAttribute('hidden', '');
                testimonialToggle.textContent = 'View full testimonials';
            }
        });
    }

    const SERVICE_INQUIRY_STORAGE_KEY = 'serviceInquiry';

    if (serviceInquiryForms && serviceInquiryForms.length > 0) {
        serviceInquiryForms.forEach(form => {
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                const formData = new FormData(form);
                const payload = {
                    service: form.dataset.service || formData.get('service') || '',
                    name: formData.get('name') || '',
                    email: formData.get('email') || '',
                    organisation: formData.get('organisation') || '',
                    timeline: formData.get('timeline') || '',
                    goal: formData.get('goal') || ''
                };

                try {
                    sessionStorage.setItem(SERVICE_INQUIRY_STORAGE_KEY, JSON.stringify(payload));
                } catch (error) {
                    console.warn('Unable to store inquiry context', error);
                }

                const target = form.getAttribute('action') || 'contact.html';
                window.location.href = target;
            });
        });
    }

    const currentParams = new URLSearchParams(window.location.search);
    const serviceFromQuery = currentParams.get('service');

    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        const nameField = contactForm.querySelector('#name');
        const emailField = contactForm.querySelector('#email');
        const organisationField = contactForm.querySelector('input[name="organisation"], #company');
        const messageField = contactForm.querySelector('#message');
        const serviceField = contactForm.querySelector('#service-interest');
        const banner = document.getElementById('contact-prefill-message');

        const storedValue = (() => {
            try {
                const raw = sessionStorage.getItem(SERVICE_INQUIRY_STORAGE_KEY);
                return raw ? JSON.parse(raw) : null;
            } catch (error) {
                console.warn('Unable to parse stored inquiry context', error);
                return null;
            }
        })();

        const setSelectValue = (value) => {
            if (!serviceField || !value) return;
            const normalized = value.toLowerCase();
            const mapping = new Map([
                ['custom-training', 'training'],
                ['training', 'training'],
                ['powerpoint', 'powerpoint'],
                ['learning-powerpoint', 'powerpoint'],
                ['mentoring', 'mentoring'],
                ['speaking', 'speaking']
            ]);
            const targetValue = mapping.get(normalized) || normalized;
            Array.from(serviceField.options).forEach(option => {
                option.selected = option.value === targetValue;
            });
        };

        const friendlyServiceName = (value) => {
            if (!value) return 'this project';
            const lookup = {
                'training': 'a custom training programme',
                'custom-training': 'a custom training programme',
                'powerpoint': 'a learning PowerPoint engagement',
                'learning-powerpoint': 'a learning PowerPoint engagement',
                'mentoring': 'a mentoring or speaking engagement',
                'speaking': 'an event speaking engagement'
            };
            const key = value.toLowerCase();
            return lookup[key] || value;
        };

        const applyPrefill = (data) => {
            if (!data) return;
            if (nameField && data.name) nameField.value = data.name;
            if (emailField && data.email) emailField.value = data.email;
            if (organisationField && data.organisation) organisationField.value = data.organisation;
            if (messageField && data.goal) {
                const trimmed = data.goal.trim();
                if (trimmed.length > 0) {
                    messageField.value = trimmed;
                }
            }
            setSelectValue(data.service || serviceFromQuery);
            if (banner) {
                banner.removeAttribute('hidden');
            }
            try {
                sessionStorage.removeItem(SERVICE_INQUIRY_STORAGE_KEY);
            } catch (error) {
                console.warn('Unable to clear stored inquiry context', error);
            }
        };

        if (storedValue) {
            applyPrefill(storedValue);
        } else if (serviceFromQuery) {
            setSelectValue(serviceFromQuery);
            if (messageField) {
                const readable = friendlyServiceName(serviceFromQuery);
                messageField.value = `Interested in ${readable}. Please share availability and next steps.`;
            }
        }
    }

    // --- Dark Mode Toggle (Optional - currently commented out) ---
    /*
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    if (darkModeToggle) {
        if (localStorage.getItem('darkMode') === 'enabled') {
            body.classList.add('dark-mode');
        }

        darkModeToggle.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            if (body.classList.contains('dark-mode')) {
                localStorage.setItem('darkMode', 'enabled');
            } else {
                localStorage.removeItem('darkMode');
            }
        });
    }
    */
});






