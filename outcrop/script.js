/**
 * Outcrop Silver Website - Redesign Prototype Logic
 */
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. MOBILE MENU TOGGLE
    const btnMobileMenu = document.getElementById('btn-mobile-menu');
    const mobileMenu = document.getElementById('mobile-menu');

    if (btnMobileMenu && mobileMenu) {
        btnMobileMenu.addEventListener('click', () => {
            btnMobileMenu.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            
            // Adjust hamburger button layout
            const spans = btnMobileMenu.querySelectorAll('span');
            if (btnMobileMenu.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(6px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(6px, -5px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }

    // 2. BACK TO TOP BUTTON
    const btnBackToTop = document.getElementById('btn-back-to-top');
    if (btnBackToTop) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                btnBackToTop.classList.add('visible');
            } else {
                btnBackToTop.classList.remove('visible');
            }
        });

        btnBackToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // 3. SHRINKING HEADER - UNIFIED ROBUST SCROLL TRIGGER
    const header = document.querySelector('.nav-header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 40) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // 4. STOCK & METAL TICKER SIMULATOR
    // Periodically simulates tiny changes in prices to represent "dynamic live feed"
    const animateStockTicker = () => {
        const stockPrices = {
            ocg: 0.24,
            ocgsf: 0.18,
            mrg: 0.16,
            silver: 28.45
        };

        const priceElements = {
            ocg: document.querySelector('.stock-price'),
            ocgsf: document.querySelectorAll('.stock-price')[1],
            mrg: document.querySelectorAll('.stock-price')[2],
            silver: document.querySelector('.silver-price')
        };

        const changeElements = {
            ocg: document.querySelector('.stock-change'),
            ocgsf: document.querySelectorAll('.stock-change')[1],
            mrg: document.querySelectorAll('.stock-change')[2],
            silver: document.querySelectorAll('.stock-change')[3]
        };

        setInterval(() => {
            // Pick a random index to change (0: TSX, 1: OTC, 2: FSE, 3: Silver Spot)
            const index = Math.floor(Math.random() * 4);
            let key, basePrice, prefix = '';
            
            if (index === 0) { key = 'ocg'; basePrice = stockPrices.ocg; prefix = 'C$'; }
            else if (index === 1) { key = 'ocgsf'; basePrice = stockPrices.ocgsf; prefix = '$'; }
            else if (index === 2) { key = 'mrg'; basePrice = stockPrices.mrg; prefix = '€'; }
            else { key = 'silver'; basePrice = stockPrices.silver; prefix = '$'; }

            const el = priceElements[key];
            const changeEl = changeElements[key];

            if (el && changeEl) {
                // Generate a small change (-0.5% to +0.8%)
                const changePct = (Math.random() * 1.3 - 0.5) / 100;
                const newPrice = basePrice * (1 + changePct);
                
                // Format price text
                el.textContent = `${prefix}${newPrice.toFixed(2)}${key === 'silver' ? '/Oz' : ''}`;
                
                // Format change percentage
                const finalPct = (changePct * 100).toFixed(2);
                if (parseFloat(finalPct) >= 0) {
                    changeEl.className = 'stock-change change-up';
                    changeEl.innerHTML = `<i class="fa-solid fa-caret-up"></i> +${finalPct}%`;
                } else {
                    changeEl.className = 'stock-change change-down';
                    changeEl.innerHTML = `<i class="fa-solid fa-caret-down"></i> ${finalPct}%`;
                }
            }
        }, 8000); // changes a value every 8 seconds
    };

    animateStockTicker();

    // 5. INTERNAL PAGES TAB SWITCHER
    const initializeTabs = () => {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        if (tabButtons.length === 0) return;

        const switchTab = (tabId) => {
            if (!tabId) return;

            // Remove active state from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to matching button and content block
            const targetBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
            const targetContent = document.getElementById(tabId);

            if (targetBtn && targetContent) {
                targetBtn.classList.add('active');
                targetContent.classList.add('active');
            }
        };

        // Click handler for tab buttons
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                switchTab(tabId);
                // Update URL hash without scrolling
                history.pushState(null, null, `#${tabId}`);
            });
        });

        // Initialize tab based on URL hash
        const handleHash = () => {
            const hash = window.location.hash.substring(1);
            if (hash) {
                switchTab(hash);
                
                // Scroll to tabs container if requested from another page/session
                const tabContainer = document.querySelector('.tabs-container');
                if (tabContainer && window.scrollY < 200) {
                    setTimeout(() => {
                        tabContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                }
            } else {
                // If no hash, activate first tab
                const firstTabId = tabButtons[0].getAttribute('data-tab');
                switchTab(firstTabId);
            }
        };

        window.addEventListener('hashchange', handleHash);
        // Run once on load
        handleHash();
    };

    initializeTabs();

    // 8. INTERACTIVE LEADERSHIP SHOWCASE FUNCTIONALITY
    const leadershipItems = document.querySelectorAll('.leadership-nav-item');
    const detailPhoto = document.getElementById('detail-photo');
    const detailName = document.getElementById('detail-name');
    const detailRole = document.getElementById('detail-role');
    const detailBio = document.getElementById('detail-bio');
    const detailView = document.getElementById('leadership-detail-view');

    if (leadershipItems.length > 0 && detailView) {
        leadershipItems.forEach(item => {
            item.addEventListener('click', () => {
                // Remove active class from all items
                leadershipItems.forEach(i => i.classList.remove('active'));
                // Add active class to clicked item
                item.classList.add('active');

                // Extract data attributes
                const name = item.getAttribute('data-name');
                const role = item.getAttribute('data-role');
                const img = item.getAttribute('data-img');
                const bio = item.getAttribute('data-bio');

                // Cross-fade animation: Fade out
                detailView.style.opacity = '0';

                setTimeout(() => {
                    // Update content
                    if (detailName) detailName.textContent = name;
                    if (detailRole) detailRole.textContent = role;
                    if (detailBio) detailBio.textContent = bio;
                    if (detailPhoto) {
                        if (img) {
                            detailPhoto.style.backgroundImage = `url('${img}')`;
                        } else {
                            detailPhoto.style.backgroundImage = 'none';
                        }
                    }

                    // Fade in
                    detailView.style.opacity = '1';
                }, 200);

                // Auto-scroll on mobile viewports
                if (window.innerWidth <= 992) {
                    detailView.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

    // 9. COLLAPSIBLE DATA TABLES TOGGLE
    const tableTriggers = document.querySelectorAll('.collapsible-table-trigger');
    tableTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const targetId = trigger.getAttribute('data-target');
            const targetDrawer = document.getElementById(targetId);
            
            if (targetDrawer) {
                const isOpen = targetDrawer.classList.contains('open');
                
                // Toggle active state
                if (isOpen) {
                    targetDrawer.classList.remove('open');
                    trigger.classList.remove('active');
                    
                    // Reset text
                    const textNode = trigger.querySelector('.trigger-text');
                    const labelType = trigger.getAttribute('data-label') || 'Table';
                    if (textNode) textNode.textContent = `View Detailed ${labelType}`;
                } else {
                    targetDrawer.classList.add('open');
                    trigger.classList.add('active');
                    
                    // Update text
                    const textNode = trigger.querySelector('.trigger-text');
                    const labelType = trigger.getAttribute('data-label') || 'Table';
                    if (textNode) textNode.textContent = `Hide Detailed ${labelType}`;
                    
                    // Scroll container into view after animation starts
                    setTimeout(() => {
                        targetDrawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }, 150);
                }
            }
        });
    });
});
