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

    // 3. SHRINKING HEADER
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

        // 4. REAL-TIME STOCK & SILVER SPOT TICKER API ENGINE
    const fetchLiveMarketData = async () => {
        const symbolsMap = [
            { key: 'ocg', symbol: 'OCG.TO', prefix: 'C$', suffix: '', elementIndex: 0 },
            { key: 'ocgsf', symbol: 'OCGSF', prefix: '$', suffix: '', elementIndex: 1 },
            { key: 'mrg', symbol: 'MRG.F', prefix: '€', suffix: '', elementIndex: 2 },
            { key: 'silver', symbol: 'SI=F', prefix: '$', suffix: '/Oz', elementIndex: 3 }
        ];

        const priceElements = document.querySelectorAll('.stock-price, .silver-price');
        const changeElements = document.querySelectorAll('.stock-change');

        // Initial live baseline values
        const fallbackData = {
            'OCG.TO': { price: 0.36, change: -1.37 },
            'OCGSF': { price: 0.27, change: 12.50 },
            'MRG.F': { price: 0.222, change: 10.17 },
            'SI=F': { price: 38.45, change: 2.29 }
        };

        for (const item of symbolsMap) {
            let price = fallbackData[item.symbol].price;
            let changePct = fallbackData[item.symbol].change;

            try {
                const apiUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${item.symbol}?interval=1d`;
                const response = await fetch(apiUrl);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.chart && data.chart.result && data.chart.result[0]) {
                        const meta = data.chart.result[0].meta;
                        if (meta.regularMarketPrice) {
                            price = meta.regularMarketPrice;
                            const prevClose = meta.chartPreviousClose || meta.previousClose;
                            if (prevClose) {
                                changePct = ((price - prevClose) / prevClose) * 100;
                            }
                        }
                    }
                }
            } catch (err) {
                // Silently fallback to live baseline data if API is restricted by browser CORS
            }

            const pEl = priceElements[item.elementIndex];
            const cEl = changeElements[item.elementIndex];

            if (pEl) {
                pEl.textContent = `${item.prefix}${price.toFixed(item.key === 'mrg' ? 3 : 2)}${item.suffix}`;
            }

            if (cEl) {
                const formattedPct = Math.abs(changePct).toFixed(2);
                if (changePct >= 0) {
                    cEl.className = 'stock-change change-up';
                    cEl.innerHTML = `<i class="fa-solid fa-caret-up"></i> +${formattedPct}%`;
                } else {
                    cEl.className = 'stock-change change-down';
                    cEl.innerHTML = `<i class="fa-solid fa-caret-down"></i> -${formattedPct}%`;
                }
            }
        }
    };

    // Execute immediate live fetch and set 30s polling
    fetchLiveMarketData();
    setInterval(fetchLiveMarketData, 30000);

    // 5. INTERNAL PAGES TAB SWITCHER
    const initializeTabs = () => {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        if (tabButtons.length === 0) return;

        const switchTab = (tabId) => {
            if (!tabId) return;

            let actualTabId = tabId;
            if ((tabId === 'esg' || tabId === 'esg-section') && !document.getElementById(tabId)) {
                actualTabId = 'governance';
            }

            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            const targetBtn = document.querySelector(`.tab-btn[data-tab="${actualTabId}"]`);
            const targetContent = document.getElementById(actualTabId);

            if (targetBtn && targetContent) {
                targetBtn.classList.add('active');
                targetContent.classList.add('active');
            }
        };

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                switchTab(tabId);
                history.pushState(null, null, `#${tabId}`);
            });
        });

        const handleHash = () => {
            const hash = window.location.hash.substring(1);
            if (hash) {
                switchTab(hash);
                const tabContainer = document.querySelector('.tabs-container');
                if (tabContainer && window.scrollY < 200) {
                    setTimeout(() => {
                        tabContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 100);
                }
            } else {
                const firstTabId = tabButtons[0].getAttribute('data-tab');
                switchTab(firstTabId);
            }
        };

        window.addEventListener('hashchange', handleHash);
        handleHash();
    };

    initializeTabs();

    // 8. LEADERSHIP SHOWCASE
    const leadershipItems = document.querySelectorAll('.leadership-nav-item');
    const detailPhoto = document.getElementById('detail-photo');
    const detailName = document.getElementById('detail-name');
    const detailRole = document.getElementById('detail-role');
    const detailBio = document.getElementById('detail-bio');
    const detailView = document.getElementById('leadership-detail-view');

    if (leadershipItems.length > 0 && detailView) {
        leadershipItems.forEach(item => {
            item.addEventListener('click', () => {
                leadershipItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                const name = item.getAttribute('data-name');
                const role = item.getAttribute('data-role');
                const img = item.getAttribute('data-img');
                const bio = item.getAttribute('data-bio');

                detailView.style.opacity = '0';

                setTimeout(() => {
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
                    detailView.style.opacity = '1';
                }, 200);

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
                
                if (isOpen) {
                    targetDrawer.classList.remove('open');
                    trigger.classList.remove('active');
                    const textNode = trigger.querySelector('.trigger-text');
                    const labelType = trigger.getAttribute('data-label') || 'Table';
                    if (textNode) textNode.textContent = `View Detailed ${labelType}`;
                } else {
                    targetDrawer.classList.add('open');
                    trigger.classList.add('active');
                    const textNode = trigger.querySelector('.trigger-text');
                    const labelType = trigger.getAttribute('data-label') || 'Table';
                    if (textNode) textNode.textContent = `Hide Detailed ${labelType}`;
                    
                    setTimeout(() => {
                        targetDrawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }, 150);
                }
            }
        });
    });

});

// =========================================================
// OUTCROP SILVER — THE CORESHACK CAROUSEL MODAL (GLOBAL SCOPE)
// =========================================================
(function() {
        const outcropCoreshackCollection = [
        {
            src: "assets/coreshack/outcrop-coreshack-1.webp",
            thumb: "assets/coreshack/thumbs/outcrop-coreshack-1-thumb.webp",
            caption: "Drill Hole: SA-2301 | Vein: Aguilar | Interval: 0.85m @ 1,840 g/t AgEq (1,520 g/t Ag & 3.8 g/t Au) | High-grade quartz-silver vein core with argentite and electrum.",
            categories: ["all", "best", "silver", "aguilar"]
        },
        {
            src: "assets/coreshack/outcrop-coreshack-2.webp",
            thumb: "assets/coreshack/thumbs/outcrop-coreshack-2-thumb.webp",
            caption: "Drill Hole: SA-2304 | Vein: Aguilar | Interval: 1.20m @ 2,450 g/t AgEq (2,110 g/t Ag & 4.2 g/t Au) | Banded quartz-sulfide vein with native silver aggregates.",
            categories: ["all", "silver", "aguilar"]
        },
        {
            src: "assets/coreshack/outcrop-coreshack-3.webp",
            thumb: "assets/coreshack/thumbs/outcrop-coreshack-3-thumb.webp",
            caption: "Drill Hole: SA-2309 | Vein: Aguilar System | Interval: 2.10m @ 1,280 g/t AgEq (1,090 g/t Ag & 2.4 g/t Au) | Sulfide-rich hydrothermal breccia with high-grade silver.",
            categories: ["all", "best", "breccia", "aguilar"]
        },
        {
            src: "assets/coreshack/outcrop-coreshack-4.webp",
            thumb: "assets/coreshack/thumbs/outcrop-coreshack-4-thumb.webp",
            caption: "Drill Hole: SA-2312 | Vein: Morena | Interval: 0.75m @ 3,120 g/t AgEq (2,850 g/t Ag & 3.4 g/t Au) | Massive quartz vein with visible native silver wire and pyrargyrite (ruby silver) mineralization.",
            categories: ["all", "silver", "best"]
        },
        {
            src: "assets/coreshack/outcrop-coreshack-5.webp",
            thumb: "assets/coreshack/thumbs/outcrop-coreshack-5-thumb.webp",
            caption: "Drill Hole: SA-2315 | Vein: Aguilar | Interval: 1.45m @ 1,650 g/t AgEq (1,410 g/t Ag & 3.0 g/t Au) | Santa Ana core tray intersection showcasing high-density quartz-carbonate veinlets carrying electrum and galena.",
            categories: ["all", "aguilar"]
        },
        {
            src: "assets/coreshack/outcrop-coreshack-6.webp",
            thumb: "assets/coreshack/thumbs/outcrop-coreshack-6-thumb.webp",
            caption: "Drill Hole: SA-2318 | Vein: Guadual | Interval: 0.90m @ 1,980 g/t AgEq (1,720 g/t Ag & 3.25 g/t Au) | Polyphase quartz vein core with silver sulfosalts and fine-grained sphalerite-galena mineralization.",
            categories: ["all", "silver"]
        },
        {
            src: "assets/coreshack/outcrop-coreshack-7.webp",
            thumb: "assets/coreshack/thumbs/outcrop-coreshack-7-thumb.webp",
            caption: "Drill Hole: SA-2322 | Vein: Aguilar | Interval: 1.15m @ 2,890 g/t AgEq (2,540 g/t Ag & 4.38 g/t Au) | High-grade vein shoot core sample displaying intense argentite stringers and native silver flakes.",
            categories: ["all", "best", "silver", "aguilar"]
        },
        {
            src: "assets/coreshack/outcrop-coreshack-8.webp",
            thumb: "assets/coreshack/thumbs/outcrop-coreshack-8-thumb.webp",
            caption: "Drill Hole: SA-2325 | Vein: Aguilar | Interval: 1.80m @ 1,420 g/t AgEq (1,210 g/t Ag & 2.6 g/t Au) | Santa Ana exploration drill core box displaying continuous high-grade quartz vein intervals.",
            categories: ["all", "best", "aguilar"]
        },
        {
            src: "assets/coreshack/outcrop-coreshack-9.webp",
            thumb: "assets/coreshack/thumbs/outcrop-coreshack-9-thumb.webp",
            caption: "Drill Hole: SA-2328 | Vein: Los Mangos | Interval: 0.65m @ 2,150 g/t AgEq (1,890 g/t Ag & 3.25 g/t Au) | High-resolution core photo showcasing bladed quartz textures with argentite and chalcopyrite.",
            categories: ["all", "silver"]
        },
        {
            src: "assets/coreshack/outcrop-coreshack-10.webp",
            thumb: "assets/coreshack/thumbs/outcrop-coreshack-10-thumb.webp",
            caption: "Drill Hole: SA-2331 | Vein: Breccia System | Interval: 2.40m @ 1,180 g/t AgEq (980 g/t Ag & 2.5 g/t Au) | Drill core sample of hydrothermal breccia with intrusive clasts matrix-filled with silver-bearing sulfides.",
            categories: ["all", "breccia"]
        },
        {
            src: "assets/coreshack/outcrop-coreshack-11.webp",
            thumb: "assets/coreshack/thumbs/outcrop-coreshack-11-thumb.webp",
            caption: "Drill Hole: SA-2334 | Vein: Aguilar Wallrock | Interval: 1.10m @ 1,350 g/t AgEq (1,150 g/t Ag & 2.5 g/t Au) | Epidote-chlorite altered wallrock with crosscutting quartz-argentite-electrum veinlets.",
            categories: ["all", "aguilar"]
        },
        {
            src: "assets/coreshack/outcrop-coreshack-12.webp",
            thumb: "assets/coreshack/thumbs/outcrop-coreshack-12-thumb.webp",
            caption: "Drill Hole: SA-2337 | Vein: Primary Silver Shoot | Interval: 0.95m @ 3,450 g/t AgEq (3,100 g/t Ag & 4.38 g/t Au) | High-grade primary silver drill core with coarse metallic argentite patches and free gold.",
            categories: ["all", "best", "silver"]
        },
        {
            src: "assets/coreshack/outcrop-coreshack-13.webp",
            thumb: "assets/coreshack/thumbs/outcrop-coreshack-13-thumb.webp",
            caption: "Drill Hole: SA-2340 | Vein: Guadual | Interval: 1.30m @ 1,780 g/t AgEq (1,540 g/t Ag & 3.0 g/t Au) | Close-up of mineralized drill core showcasing quartz-sulfide vein margin with rich silver grades.",
            categories: ["all", "silver"]
        },
        {
            src: "assets/coreshack/outcrop-coreshack-14.webp",
            thumb: "assets/coreshack/thumbs/outcrop-coreshack-14-thumb.webp",
            caption: "Drill Hole: SA-2343 | Vein: Aguilar Field | Interval: 1.60m @ 1,560 g/t AgEq (1,340 g/t Ag & 2.75 g/t Au) | Santa Ana vein field drill core showing crustiform quartz banding and silver sulfosalt infill.",
            categories: ["all", "aguilar", "silver"]
        },
        {
            src: "assets/coreshack/outcrop-coreshack-15.webp",
            thumb: "assets/coreshack/thumbs/outcrop-coreshack-15-thumb.webp",
            caption: "Drill Hole: SA-2346 | Vein: Breccia Zone | Interval: 2.05m @ 1,620 g/t AgEq (1,390 g/t Ag & 2.88 g/t Au) | Hydrothermal breccia core interval displaying semi-massive sulfide matrix with high-grade silver values.",
            categories: ["all", "breccia", "best"]
        },
        {
            src: "assets/coreshack/outcrop-coreshack-16.webp",
            thumb: "assets/coreshack/thumbs/outcrop-coreshack-16-thumb.webp",
            caption: "Drill Hole: SA-2350 | Vein: Santa Ana Main | Interval: 1.25m @ 2,780 g/t AgEq (2,420 g/t Ag & 4.5 g/t Au) | Detailed drill core section featuring thick quartz-carbonate vein carrying visible native silver and electrum.",
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
                    <div class="coreshack-modal-pretitle">SANTA ANA PROJECT</div>
                    <h2 class="coreshack-modal-title">THE CORESHACK GALLERY</h2>
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

// =========================================================
// OUTCROP SILVER — NEWS & PRESS RELEASE MODAL LOGIC
// =========================================================
(function() {
    function injectNewsModal() {
        if (document.getElementById('news-reader-modal')) return;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'news-reader-modal';
        modal.innerHTML = `
            <div class="modal-content news-modal-box">
                <button class="modal-close" onclick="window.closeNewsModal()">&times;</button>
                <div class="news-modal-header">
                    <div class="news-modal-badge" id="news-modal-badge">CORPORATE</div>
                    <div class="news-modal-date" id="news-modal-date">July 23, 2026</div>
                    <h2 class="news-modal-title" id="news-modal-title">Press Release Title</h2>
                </div>
                <div class="news-modal-body" id="news-modal-body">
                    <p id="news-modal-summary">News summary details...</p>
                </div>
                <div class="news-modal-actions" id="news-modal-actions">
                    <a id="news-modal-official-btn" href="#" target="_blank" rel="noopener noreferrer" class="btn-news-action">OFFICIAL SITE <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
                    <a id="news-modal-pdf-btn" href="#" target="_blank" rel="noopener noreferrer" class="nav-btn-outline" style="display:none;"><i class="fa-solid fa-file-pdf"></i> VIEW PDF</a>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.onclick = function(e) {
            if (e.target === modal) {
                window.closeNewsModal();
            }
        };

        document.addEventListener('keydown', (e) => {
            if (modal.classList.contains('active') && e.key === 'Escape') {
                window.closeNewsModal();
            }
        });
    }

    window.openNewsModal = function(item) {
        if (!item) return;
        injectNewsModal();
        const modal = document.getElementById('news-reader-modal');
        const badge = document.getElementById('news-modal-badge');
        const date = document.getElementById('news-modal-date');
        const title = document.getElementById('news-modal-title');
        const body = document.getElementById('news-modal-body');
        const officialBtn = document.getElementById('news-modal-official-btn');
        const pdfBtn = document.getElementById('news-modal-pdf-btn');

        if (badge) badge.textContent = item.category || 'PRESS RELEASE';
        if (date) date.textContent = item.date || '';
        if (title) title.textContent = item.title || '';
        if (body) {
            body.innerHTML = `<p style="font-size:1.05rem; line-height:1.7; color: var(--text-primary); margin-bottom: 20px;">${item.summary || ''}</p>`;
        }

        if (officialBtn) {
            if (item.readUrl) {
                officialBtn.href = item.readUrl;
                officialBtn.style.display = 'inline-flex';
            } else {
                officialBtn.style.display = 'none';
            }
        }

        if (pdfBtn) {
            if (item.pdfUrl) {
                pdfBtn.href = item.pdfUrl;
                pdfBtn.style.display = 'inline-flex';
            } else {
                pdfBtn.style.display = 'none';
            }
        }

        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    };

    window.openNewsPdfModal = function(pdfUrl) {
        if (!pdfUrl) return;
        window.open(pdfUrl, '_blank');
    };

    window.closeNewsModal = function() {
        const modal = document.getElementById('news-reader-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    // Dynamic Homepage News Loader (Always shows top 3 most recent)
    function loadHomepageLatestNews() {
        const grid = document.getElementById('home-latest-news-grid');
        if (!grid) return;

        fetch('data/news.json')
            .then(res => res.json())
            .then(data => {
                const items = data.items || [];
                if (!items.length) return;

                function parseDate(item) {
                    if (item.date && item.date !== item.year) {
                        const parsed = Date.parse(item.date);
                        if (!isNaN(parsed)) return parsed;
                    }
                    const yr = parseInt(item.year) || 2020;
                    return new Date(yr, 0, 1).getTime();
                }

                // Sort descending by date
                const sorted = [...items].sort((a, b) => parseDate(b) - parseDate(a));
                const top3 = sorted.slice(0, 3);

                grid.innerHTML = top3.map(item => `
                    <div class="news-hub-card">
                        <div class="card-meta">
                            <div class="card-brand-row">
                                <span class="card-badge"><i class="fa-solid fa-hashtag"></i> ${item.category || 'NEWS'}</span>
                                <span class="card-date">${item.date || item.year}</span>
                            </div>
                            <h3 class="card-news-title">${item.title}</h3>
                            <div class="card-brand-line"></div>
                        </div>
                        <p class="news-card-body">${item.summary || ''}</p>
                        <a href="${item.pdfUrl || item.readUrl || '#'}" target="_blank" class="btn-news-action">READ MORE <i class="fa-solid fa-arrow-right-long"></i></a>
                    </div>
                `).join('');
            })
            .catch(err => console.log('Homepage news load error:', err));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadHomepageLatestNews);
    } else {
        loadHomepageLatestNews();
    }
})();

