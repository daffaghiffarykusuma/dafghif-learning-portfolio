document.addEventListener('DOMContentLoaded', (event) => {
    const body = document.body;
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('header nav'); // Target the nav element directly
    const navLinks = document.querySelectorAll('header nav ul li a');
    const modalCloseButtons = document.querySelectorAll('.modal .close');
    const projectItems = document.querySelectorAll('.project'); // Assuming projects trigger modals

    let activeProjectModal = null;
    let windowClickEventHandler = null; // Store the handler reference

    // --- Navigation ---

    // Mobile Menu Toggle
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
            // Optional: Toggle ARIA attribute for accessibility
            const isExpanded = nav.classList.contains('active');
            menuToggle.setAttribute('aria-expanded', isExpanded);
        });
    }

    // Highlight current page link
    const currentPage = window.location.pathname.split('/').pop() || 'index.html'; // Get current filename
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href').split('/').pop() || 'index.html';
        if (linkPage === currentPage) {
            link.parentElement.classList.add('current');
        } else {
            link.parentElement.classList.remove('current'); // Ensure others are not marked current
        }

        // Close mobile menu on link click (for multi-page navigation)
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
            // Remove the specific window click listener
            if (windowClickEventHandler) {
                window.removeEventListener("click", windowClickEventHandler);
                windowClickEventHandler = null;
            }
            // Optional: Re-enable body scroll if it was disabled
            // document.body.style.overflow = '';
        }
    }

    // Add click listener to project items to open modals
    projectItems.forEach(project => {
        project.addEventListener('click', () => {
            const targetModalId = project.dataset.target; // e.g., "#modal-project-1"
            if (targetModalId) {
                const targetModalEl = document.querySelector(targetModalId);
                if (targetModalEl) {
                    // Close any previously active modal first
                    closeActiveModal();

                    targetModalEl.style.display = "block";
                    activeProjectModal = targetModalEl;
                    // Optional: Disable body scroll while modal is open
                    // document.body.style.overflow = 'hidden';

                    // Add window click listener specifically for this modal instance
                    windowClickEventHandler = function(e) {
                        // Close if clicking outside the modal content, but not on the trigger itself
                        if (e.target === targetModalEl) {
                             closeActiveModal();
                        }
                    };
                    window.addEventListener("click", windowClickEventHandler);

                    // Set external links in modal to open in new tab
                    targetModalEl.querySelectorAll('a[href^="http"], a[href^="https"]').forEach(link => {
                         if (!link.hasAttribute('data-no-blank')) { // Check for override attribute
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

    // Add click listener to all modal close buttons
    modalCloseButtons.forEach((button) => {
        button.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevent the window click listener from firing
            closeActiveModal();
        });
    });

    // Close modal on Escape key press
    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape" && activeProjectModal) {
            closeActiveModal();
        }
    });


    // --- PDF Viewer Modal Functionality ---
    const pdfModal = document.getElementById('pdf-modal');
    const pdfModalTitle = document.getElementById('pdf-modal-title');
    const pdfIframe = document.getElementById('pdf-iframe');
    const pdfModalCloseButton = pdfModal?.querySelector('.js-close-modal'); // Use optional chaining
    const viewDetailsButtons = document.querySelectorAll('.view-details-button');

    let activePdfModal = null; // Separate state for PDF modal
    let pdfWindowClickEventHandler = null; // Separate handler

    function closePdfModal() {
        if (activePdfModal) {
            activePdfModal.style.display = "none";
            pdfIframe.src = ""; // Clear iframe src to stop loading/potential background activity
            activePdfModal = null;
            if (pdfWindowClickEventHandler) {
                window.removeEventListener("click", pdfWindowClickEventHandler);
                pdfWindowClickEventHandler = null;
            }
            // Optional: Re-enable body scroll if needed
            // document.body.style.overflow = '';
        }
    }

    if (pdfModal && pdfModalCloseButton && viewDetailsButtons.length > 0) {
        viewDetailsButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default button action
                e.stopPropagation(); // Stop event from bubbling up (e.g., to project card click)

                const pdfPath = button.dataset.pdf;
                if (!pdfPath) {
                    console.warn('View Details button clicked has no data-pdf attribute.');
                    return;
                }

                // Try to find the project title from the card content
                const cardContent = button.closest('.card-content');
                const projectTitleElement = cardContent?.querySelector('h4');
                const projectTitle = projectTitleElement ? projectTitleElement.textContent : 'Project Details';

                // Close any other active modals (both project and PDF)
                closeActiveModal();
                closePdfModal();

                // Update modal content
                pdfModalTitle.textContent = projectTitle;
                // Append parameters to discourage downloading/toolbar display
                pdfIframe.src = `${pdfPath}#toolbar=0&navpanes=0&scrollbar=0`;

                // Show the modal
                pdfModal.style.display = 'block';
                activePdfModal = pdfModal;
                // Optional: Disable body scroll
                // document.body.style.overflow = 'hidden';

                // Add window click listener for closing when clicking outside
                pdfWindowClickEventHandler = function(event) {
                    if (event.target === pdfModal) {
                        closePdfModal();
                    }
                };
                // Use setTimeout to avoid immediate closing if the click originated on the button
                setTimeout(() => {
                    window.addEventListener('click', pdfWindowClickEventHandler);
                }, 0);
            });
        });

        // Close button listener
        pdfModalCloseButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closePdfModal();
        });

    } else {
         if (!pdfModal) console.warn("PDF Modal element (#pdf-modal) not found.");
         if (!pdfModalCloseButton) console.warn("PDF Modal close button (.js-close-modal) not found within #pdf-modal.");
         // No warning for buttons if none are expected yet
    }

     // Add Escape key listener for PDF modal (ensure it doesn't conflict if both modals could be open)
     document.addEventListener('keydown', (e) => {
        if (e.key === "Escape" && activePdfModal) { // Check specifically for active PDF modal
            closePdfModal();
        }
    });


    // --- Dark Mode Toggle (Optional - currently commented out) ---
    /*
    const darkModeToggle = document.getElementById('dark-mode-toggle'); // Assuming you add a button with this ID
    if (darkModeToggle) {
        // Check for saved preference
        if (localStorage.getItem('darkMode') === 'enabled') {
            body.classList.add('dark-mode');
        }

        darkModeToggle.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            // Save preference
            if (body.classList.contains('dark-mode')) {
                localStorage.setItem('darkMode', 'enabled');
            } else {
                localStorage.removeItem('darkMode');
            }
        });
    }
    */

});