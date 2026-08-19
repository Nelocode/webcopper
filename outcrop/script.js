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

// =========================================================
// OUTCROP SILVER — THE CORESHACK CAROUSEL MODAL (GLOBAL SCOPE)
// =========================================================
(function() {
    const outcropCoreshackCollection = [
        {
            src: "assets/coreshack/outcrop-coreshack-1.jpg",
            thumb: "assets/coreshack/thumbs/outcrop-coreshack-1-thumb.jpg",
            caption: "High-grade silver-gold quartz vein core with abundant coarse argentite (silver sulfide) and electrum from Santa Ana drilling.",
            categories: ["all", "best", "silver", "aguilar"]
        },
        {
            src: "assets/coreshack/outcrop-coreshack-2.jpg",
            thumb: "assets/coreshack/thumbs/outcrop-coreshack-2-thumb.jpg",
            caption: "Banded quartz-sulfide vein showing prominent native silver aggregates and freibergite in Santa Ana drill core.",
            categories: ["all", "silver", "aguilar"]
        },
        {
            src: "assets/coreshack/outcrop-coreshack-3.jpg",
            thumb: "assets/coreshack/thumbs/outcrop-coreshack-3-thumb.jpg",
            caption: "Sulfide-rich hydrothermal breccia containing high-grade silver mineralization along the Aguilar vein system.",
            categories: ["all", "best", "breccia", "aguilar"]
        },
        {
            src: "assets/coreshack/outcrop-coreshack-4.jpg",
            thumb: "assets/coreshack/thumbs/outcrop-coreshack-4-thumb.jpg",
            caption: "Massive quartz vein with visible native silver wire and pyrargyrite (ruby silver) mineralization.",
            categories: ["all", "silver", "best"]
        },
        {
            src: "assets/coreshack/outcrop-coreshack-5.jpg",
            thumb: "assets/coreshack/thumbs/outcrop-coreshack-5-thumb.jpg",
            caption: "Santa Ana core tray intersection showcasing high-density quartz-carbonate veinlets carrying electrum and galena.",
            categories: ["all", "aguilar"]
        },
        {
            src: "assets/coreshack/outcrop-coreshack-6.jpg",
            thumb: "assets/coreshack/thumbs/outcrop-coreshack-6-thumb.jpg",
            caption: "Polyphase quartz vein core with silver sulfosalts and fine-grained sphalerite-galena mineralization.",
            categories: ["all", "silver"]
        },
        {
            src: "assets/coreshack/outcrop-coreshack-7.jpg",
            thumb: "assets/coreshack/thumbs/outcrop-coreshack-7-thumb.jpg",
            caption: "High-grade vein shoot core sample displaying intense argentite stringers and native silver flakes.",
            categories: ["all", "best", "silver", "aguilar"]
        },
        {
            src: "assets/coreshack/outcrop-coreshack-8.jpg",
            thumb: "assets/coreshack/thumbs/outcrop-coreshack-8-thumb.jpg",
            caption: "Santa Ana exploration drill core box displaying continuous high-grade quartz vein intervals.",
            categories: ["all", "best", "aguilar"]
        },
        {
            src: "assets/coreshack/outcrop-coreshack-9.jpg",
            thumb: "assets/coreshack/thumbs/outcrop-coreshack-9-thumb.jpg",
            caption: "High-resolution core photo showcasing bladed quartz textures with argentite and chalcopyrite.",
            categories: ["all", "silver"]
        },
        {
            src: "assets/coreshack/outcrop-coreshack-10.jpg",
            thumb: "assets/coreshack/thumbs/outcrop-coreshack-10-thumb.jpg",
            caption: "Drill core sample of hydrothermal breccia with intrusive clasts matrix-filled with silver-bearing sulfides.",
            categories: ["all", "breccia"]
        },
        {
            src: "assets/coreshack/outcrop-coreshack-11.jpg",
            thumb: "assets/coreshack/thumbs/outcrop-coreshack-11-thumb.jpg",
            caption: "Epidote-chlorite altered wallrock with crosscutting quartz-argentite-electrum veinlets.",
            categories: ["all", "aguilar"]
        },
        {
            src: "assets/coreshack/outcrop-coreshack-12.jpg",
            thumb: "assets/coreshack/thumbs/outcrop-coreshack-12-thumb.jpg",
            caption: "High-grade primary silver drill core with coarse metallic argentite patches and free gold.",
            categories: ["all", "best", "silver"]
        },
        {
            src: "assets/coreshack/outcrop-coreshack-13.jpg",
            thumb: "assets/coreshack/thumbs/outcrop-coreshack-13-thumb.jpg",
            caption: "Close-up of mineralized drill core showcasing quartz-sulfide vein margin with rich silver grades.",
            categories: ["all", "silver"]
        },
        {
            src: "assets/coreshack/outcrop-coreshack-14.jpg",
            thumb: "assets/coreshack/thumbs/outcrop-coreshack-14-thumb.jpg",
            caption: "Santa Ana vein field drill core showing crustiform quartz banding and silver sulfosalt infill.",
            categories: ["all", "aguilar", "silver"]
        },
        {
            src: "assets/coreshack/outcrop-coreshack-15.jpg",
            thumb: "assets/coreshack/thumbs/outcrop-coreshack-15-thumb.jpg",
            caption: "Hydrothermal breccia core interval displaying semi-massive sulfide matrix with high-grade silver values.",
            categories: ["all", "breccia", "best"]
        },
        {
            src: "assets/coreshack/outcrop-coreshack-16.jpg",
            thumb: "assets/coreshack/thumbs/outcrop-coreshack-16-thumb.jpg",
            caption: "Detailed drill core section featuring thick quartz-carbonate vein carrying visible native silver and electrum.",
            categories: ["all", "best", "silver"]
        }
    ];

    let currentOutcropFilter = 'all';
    let activeOutcropCoreshackImages = [...outcropCoreshackCollection];
    let outcropCoreshackActiveIndex = 0;

    function renderCoreshackThumbs() {
        return activeOutcropCoreshackImages.map((item, i) => `
            <div class="coreshack-thumb ${i === outcropCoreshackActiveIndex ? 'active' : ''}" data-index="${i}" onclick="window.coreshackSetSlide(${i})">
                <img src="${item.thumb}" alt="Thumb ${i + 1}">
            </div>
        `).join('');
    }

    function injectOutcropCoreshackModal() {
        if (document.getElementById('coreshack-carousel-modal')) return;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'coreshack-carousel-modal';
        modal.innerHTML = `
            <div class="modal-content coreshack-modal-box">
                <button class="modal-close" onclick="window.closeCoreshackCarouselModal()">&times;</button>
                
                <div class="coreshack-modal-header">
                    <div class="coreshack-modal-pretitle">Santa Ana Silver-Gold Project</div>
                    <h2 class="coreshack-modal-title">The Coreshack Gallery</h2>
                </div>
                
                <div class="coreshack-filters">
                    <button class="coreshack-filter-btn active" data-filter="all" onclick="window.coreshackFilter('all')">All Core Samples</button>
                    <button class="coreshack-filter-btn" data-filter="best" onclick="window.coreshackFilter('best')">High-Grade Highlights ⭐</button>
                    <button class="coreshack-filter-btn" data-filter="silver" onclick="window.coreshackFilter('silver')">Primary Silver Veins</button>
                    <button class="coreshack-filter-btn" data-filter="aguilar" onclick="window.coreshackFilter('aguilar')">Aguilar System</button>
                    <button class="coreshack-filter-btn" data-filter="breccia" onclick="window.coreshackFilter('breccia')">Breccias</button>
                </div>

                <div id="coreshack-caption-bar" class="coreshack-caption-bar">
                    <div class="coreshack-caption-text"><strong>Core Box #1:</strong> ${activeOutcropCoreshackImages[0].caption}</div>
                    <div class="coreshack-caption-counter">(1 of ${activeOutcropCoreshackImages.length} in view)</div>
                </div>
                
                <div class="coreshack-carousel-container">
                    <img id="coreshack-active-img" src="${activeOutcropCoreshackImages[0].src}" alt="Outcrop Silver Drill Core">
                    <button class="carousel-nav-btn prev" onclick="event.stopPropagation(); window.coreshackPrevSlide()">
                        <i class="fa-solid fa-chevron-left"></i>
                    </button>
                    <button class="carousel-nav-btn next" onclick="event.stopPropagation(); window.coreshackNextSlide()">
                        <i class="fa-solid fa-chevron-right"></i>
                    </button>
                </div>
                
                <div class="coreshack-thumbnails-wrapper" id="coreshack-thumbs-container">
                    ${renderCoreshackThumbs()}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.onclick = function(e) {
            if (e.target === modal) {
                window.closeCoreshackCarouselModal();
            }
        };

        document.addEventListener('keydown', (e) => {
            if (modal.classList.contains('active')) {
                if (e.key === 'Escape') {
                    window.closeCoreshackCarouselModal();
                } else if (e.key === 'ArrowRight') {
                    window.coreshackNextSlide();
                } else if (e.key === 'ArrowLeft') {
                    window.coreshackPrevSlide();
                }
            }
        });
    }

    window.openCoreshackCarouselModal = function(startIndex = 0) {
        injectOutcropCoreshackModal();
        const modal = document.getElementById('coreshack-carousel-modal');
        if (modal) {
            window.coreshackSetSlide(startIndex);
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    };

    window.closeCoreshackCarouselModal = function() {
        const modal = document.getElementById('coreshack-carousel-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    window.coreshackSetSlide = function(index) {
        if (!activeOutcropCoreshackImages.length) return;
        outcropCoreshackActiveIndex = (index + activeOutcropCoreshackImages.length) % activeOutcropCoreshackImages.length;
        
        const activeImg = document.getElementById('coreshack-active-img');
        const captionBar = document.getElementById('coreshack-caption-bar');
        const currentItem = activeOutcropCoreshackImages[outcropCoreshackActiveIndex];

        if (activeImg) {
            activeImg.style.opacity = '0';
            setTimeout(() => {
                activeImg.src = currentItem.src;
                activeImg.style.opacity = '1';
            }, 120);
        }

        if (captionBar) {
            captionBar.innerHTML = `<div class="coreshack-caption-text"><strong>Core Box #${outcropCoreshackActiveIndex + 1}:</strong> ${currentItem.caption}</div><div class="coreshack-caption-counter">(${outcropCoreshackActiveIndex + 1} of ${activeOutcropCoreshackImages.length} in view)</div>`;
        }

        const thumbs = document.querySelectorAll('.coreshack-thumb');
        thumbs.forEach((t, i) => {
            if (i === outcropCoreshackActiveIndex) {
                t.classList.add('active');
                t.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            } else {
                t.classList.remove('active');
            }
        });
    };

    window.coreshackNextSlide = function() {
        window.coreshackSetSlide(outcropCoreshackActiveIndex + 1);
    };

    window.coreshackPrevSlide = function() {
        window.coreshackSetSlide(outcropCoreshackActiveIndex - 1);
    };

    window.coreshackFilter = function(filter) {
        currentOutcropFilter = filter;
        if (filter === 'all') {
            activeOutcropCoreshackImages = [...outcropCoreshackCollection];
        } else {
            activeOutcropCoreshackImages = outcropCoreshackCollection.filter(img => img.categories.includes(filter));
        }
        
        const filterBtns = document.querySelectorAll('.coreshack-filter-btn');
        filterBtns.forEach(btn => {
            if (btn.getAttribute('data-filter') === filter) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        const thumbsContainer = document.getElementById('coreshack-thumbs-container');
        if (thumbsContainer) {
            thumbsContainer.innerHTML = renderCoreshackThumbs();
        }

        window.coreshackSetSlide(0);
    };
})();
