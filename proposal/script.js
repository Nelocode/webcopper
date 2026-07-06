document.addEventListener('DOMContentLoaded', () => {
    // Helper to format metric labels, supporting sublabels divided by |
    function formatMetricLabel(label) {
        if (label.includes('|')) {
            const parts = label.split('|');
            return `
                <span style="color: var(--copper-primary); font-weight: 700; text-transform: uppercase; display: block; letter-spacing: 0.05em;">${parts[0]}</span>
                <span style="color: var(--text-secondary); text-transform: none; display: block; font-weight: 400; font-size: 0.85em; margin-top: 4px; letter-spacing: 0;">${parts[1]}</span>
            `;
        }
        return `<span style="text-transform: uppercase; letter-spacing: 0.1em; color: var(--copper-primary); font-weight: 600;">${label}</span>`;
    }

    // ---------------------------------------------------------
    // 0. Live Ticker Bar Loader (Dynamic from site.json)
    // ---------------------------------------------------------
    function initTicker() {
        const tickerContainers = document.querySelectorAll('.ticker-stocks');
        if (tickerContainers.length === 0) return;

        fetch('data/site.json')
            .then(res => res.json())
            .then(data => {
                if (!data || !data.ticker) return;
                const t = data.ticker;
                
                const formatStock = (name, stock) => {
                    if (!stock) return '';
                    const color = stock.direction === 'up' ? '#4cd964' : '#ff3b30';
                    return `<span><strong>${name}</strong>: ${stock.symbol} ${stock.price} <span style="color: ${color};">${stock.change}</span></span>`;
                };

                const tsxvStr = formatStock('TSXV', t.TSXV);
                const otcStr = formatStock('OTC', t.OTC);
                const fseStr = formatStock('FSE', t.FSE);
                const cuStr = t.Cu ? `<span><strong>Cu</strong>: ${t.Cu.price}</span>` : '';

                const htmlContent = `${tsxvStr} ${otcStr} ${fseStr} ${cuStr}`;
                tickerContainers.forEach(container => {
                    container.innerHTML = htmlContent;
                });
            })
            .catch(err => console.warn('Ticker loader: could not load site.json', err));
    }
    initTicker();

    // ---------------------------------------------------------
    // 0.2. Corporate Page Dynamic Loader (Metrics, Values, ESG)
    // ---------------------------------------------------------
    function initCorporatePage() {
        const metricsDesc = document.getElementById('corporate-metrics-desc');
        const metricsContainer = document.getElementById('corporate-metrics-container');
        const esgGrid = document.getElementById('esg-grid');

        if (!metricsDesc && !esgGrid) return;

        fetch('data/site.json')
            .then(res => res.json())
            .then(data => {
                // 1. Metrics Banner
                if (metricsDesc && metricsContainer && data.metrics_banner && data.metrics_banner.corporate) {
                    const c = data.metrics_banner.corporate;
                    metricsDesc.innerHTML = c.description;
                    if (c.metrics) {
                        metricsContainer.innerHTML = c.metrics.map(m => `
                            <div class="metric-item" style="text-align: left;">
                                <div class="metric-val" style="font-family: var(--font-mono); font-size: 2.8rem; font-weight: 700; color: white; line-height: 1;">${m.value}</div>
                                <div class="metric-label" style="font-size: 0.75rem; margin-top: 8px; line-height: 1.4;">${formatMetricLabel(m.label)}</div>
                            </div>
                        `).join('');
                    }
                }



                // 3. ESG Cards
                if (esgGrid && data.esg_cards) {
                    const esgIcons = [
                        `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--copper-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
                        `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--copper-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="9" y1="22" x2="9" y2="16"></line><line x1="15" y1="22" x2="15" y2="16"></line><line x1="9" y1="16" x2="15" y2="16"></line><path d="M9 6h.01"></path><path d="M15 6h.01"></path><path d="M9 10h.01"></path><path d="M15 10h.01"></path></svg>`,
                        `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--copper-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.58-1 8a7 7 0 0 1-7 10Z"></path><path d="M9 22v-4"></path></svg>`,
                        `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--copper-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>`
                    ];
                    const leafFallback = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--copper-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.58-1 8a7 7 0 0 1-7 10Z"></path><path d="M9 22v-4"></path></svg>`;

                    esgGrid.innerHTML = data.esg_cards.map((card, index) => {
                        const icon = esgIcons[index] || leafFallback;
                        return `
                            <div class="esg-card fade-up" style="transition-delay: ${index * 0.1}s;">
                                <div class="esg-icon-box">
                                    ${icon}
                                </div>
                                <div class="esg-card-content">
                                    <h4 class="esg-card-title">${card.title}</h4>
                                    <p class="esg-card-desc">${card.body}</p>
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            })
            .catch(err => console.warn('Corporate page loader: could not load site.json', err));
    }
    initCorporatePage();

    // ---------------------------------------------------------
    // 0.3. Mocoa Page Dynamic Loader (Metrics)
    // ---------------------------------------------------------
    function initMocoaPage() {
        const metricsDesc = document.getElementById('mocoa-metrics-desc');
        const metricsContainer = document.getElementById('mocoa-metrics-container');

        if (!metricsDesc && !metricsContainer) return;

        fetch('data/site.json')
            .then(res => res.json())
            .then(data => {
                if (data.metrics_banner && data.metrics_banner.mocoa) {
                    const m = data.metrics_banner.mocoa;
                    if (metricsDesc) metricsDesc.innerHTML = m.description;
                    if (metricsContainer && m.metrics) {
                        metricsContainer.innerHTML = m.metrics.map(met => `
                            <div class="metric-item" style="text-align: left;">
                                <div class="metric-val" style="font-family: var(--font-mono); font-size: 2.8rem; font-weight: 700; color: white; line-height: 1;">${met.value}</div>
                                <div class="metric-label" style="font-size: 0.75rem; margin-top: 8px; line-height: 1.4;">${formatMetricLabel(met.label)}</div>
                            </div>
                        `).join('');
                    }
                }
            })
            .catch(err => console.warn('Mocoa page loader: could not load site.json', err));
    }
    initMocoaPage();

    // ---------------------------------------------------------
    // 0.4. Live Hero Section Loader (Dynamic from site.json)
    // ---------------------------------------------------------
    function initHero() {
        const section = document.querySelector('.hero-video-section');
        if (!section) return;

        const path = window.location.pathname;
        const cleanPath = path.toLowerCase().replace(/\/$/, '').split('/').pop().replace('.html', '');
        const pageName = (cleanPath === '' || cleanPath === 'index' || cleanPath === 'home') ? 'home' : cleanPath;

        fetch('data/site.json')
            .then(res => res.json())
            .then(data => {
                const hero = (data.heroes || []).find(h => h.page === pageName);
                if (!hero) return;

                section.innerHTML = '';

                const wrapper = document.createElement('div');
                wrapper.className = 'hero-video-wrapper';
                if (hero.ratio) {
                    wrapper.style.aspectRatio = hero.ratio;
                }

                if (hero.type === 'video') {
                    const video = document.createElement('video');
                    video.autoplay = true;
                    video.loop = true;
                    video.muted = true;
                    video.playsInline = true;
                    video.className = 'hero-video-bg';
                    const source = document.createElement('source');
                    source.src = hero.media;
                    source.type = 'video/mp4';
                    video.appendChild(source);
                    wrapper.appendChild(video);
                } else {
                    const img = document.createElement('img');
                    img.src = hero.media;
                    img.alt = hero.alt || '';
                    img.className = 'hero-video-bg ken-burns';
                    wrapper.appendChild(img);
                }

                const overlay = document.createElement('div');
                overlay.className = 'hero-video-overlay';

                const container = document.createElement('div');
                container.className = 'hero-text-container';

                if (hero.eyebrow) {
                    const eb = document.createElement('div');
                    eb.className = 'hero-eyebrow';
                    eb.innerHTML = hero.eyebrow;
                    container.appendChild(eb);
                }

                if (hero.title) {
                    const title = document.createElement(hero.title_tag || 'h1');
                    title.className = hero.title_class || 'hero-title';
                    title.innerHTML = hero.title;
                    container.appendChild(title);
                }

                overlay.appendChild(container);
                wrapper.appendChild(overlay);
                section.appendChild(wrapper);
            })
            .catch(err => console.warn('Hero loader: could not load site.json', err));
    }
    initHero();

    // ---------------------------------------------------------
    // 0.5. Live Split Section Cards Loader (Dynamic from site.json)
    // ---------------------------------------------------------
    function initSplitCards() {
        const splitContainer = document.querySelector('.split-cards-grid');
        if (!splitContainer) return;

        fetch('data/site.json')
            .then(res => res.json())
            .then(data => {
                const cards = data.split_cards || [];
                if (cards.length === 0) return;

                const classMap = {
                    'meet-the-team': 'meet-the-team-card',
                    'road-to-mocoa': 'video-portal-new',
                    'mocoa-deposit': 'geology-card span-full',
                    'copper-giant-way': 'copper-giant-way-card',
                    'making-of-giant': 'making-of-giant-card',
                    'coreshack': 'split-coreshack-card span-full'
                };

                splitContainer.innerHTML = cards.map(card => {
                    const cardClass = classMap[card.id] || 'meet-the-team-card';
                    const bgStyle = card.image ? `style="--card-bg: url('${card.image}')"` : '';
                    
                    let actionBtn = '';
                    let cardOnclick = '';
                    let cardStyle = '';
                    
                    if (card.link_type === 'modal') {
                        actionBtn = `<button class="btn-card-action" onclick="window.openCustomVideoModal('${card.link_href || ''}')">Dive in</button>`;
                    } else if (card.link_type === 'metrics-modal') {
                        actionBtn = `<button class="btn-card-action" onclick="event.stopPropagation(); window.openDepositMetricsModal()">Dive in</button>`;
                        cardOnclick = `onclick="window.openDepositMetricsModal()"`;
                        cardStyle = `style="cursor: pointer;"`;
                    } else if (card.link_type === 'coming-soon') {
                        actionBtn = `<button class="btn-card-action" style="cursor: default; pointer-events: none;">Coming Soon</button>`;
                        cardStyle = `style="cursor: default;"`;
                    } else if (card.link_type === 'coreshack-modal') {
                        actionBtn = `<button class="btn-card-action" onclick="event.stopPropagation(); window.openCoreshackCarouselModal()">Dive in</button>`;
                        cardOnclick = `onclick="window.openCoreshackCarouselModal()"`;
                        cardStyle = `style="cursor: pointer;"`;
                    } else if (card.link_type === 'external') {
                        actionBtn = `<button class="btn-card-action" onclick="event.stopPropagation(); window.open('${card.link_href || ''}', '_blank')">Dive in</button>`;
                        cardOnclick = `onclick="window.open('${card.link_href || ''}', '_blank')"`;
                        cardStyle = `style="cursor: pointer;"`;
                    } else {
                        actionBtn = `<button class="btn-card-action" onclick="window.location.href='${card.link_href || ''}'">Dive in</button>`;
                    }

                    // Merge bgStyle and cardStyle if both exist
                    let finalStyle = bgStyle;
                    if (cardStyle) {
                        if (bgStyle) {
                            finalStyle = bgStyle.replace('style="', 'style="cursor: pointer; ');
                        } else {
                            finalStyle = cardStyle;
                        }
                    }

                    return `
                        <div class="split-card text-centered ${cardClass}" ${finalStyle} ${cardOnclick}>
                            <div class="video-card-header">
                                <h3 class="card-title-main">${card.title}</h3>
                                <p class="card-subtitle-sub">${card.subtitle}</p>
                            </div>
                            ${actionBtn}
                        </div>
                    `;
                }).join('');
            })
            .catch(err => console.warn('Split cards loader: could not load site.json', err));
    }
    initSplitCards();



    // ---------------------------------------------------------
    // 0.6.5. Custom Pop-ups (YouTube Playlist, Mocoa360, Instagram)
    // ---------------------------------------------------------
    const playlistVideos = ['SdGeDEznMXg', 'B7XABIdWLOY', '0LLGecN0knM'];
    let currentPlaylistIndex = 1;

    window.openCustomVideoModal = function(url) {
        const videoModal = document.getElementById('video-modal');
        const ytIframe = document.getElementById('modal-youtube-iframe');
        if (videoModal && ytIframe) {
            videoModal.classList.add('active');
            
            // Check if it's the playlist url
            if (url.indexOf('list=PLcEfgyOkpXh3HnxXxdgWmOKnz_1fwQL_h') > -1) {
                currentPlaylistIndex = 1;
                const videoId = playlistVideos[currentPlaylistIndex - 1];
                ytIframe.src = `https://www.youtube.com/embed/${videoId}?list=PLcEfgyOkpXh3HnxXxdgWmOKnz_1fwQL_h&autoplay=1`;
                
                // Inject navigation arrows if not already present
                injectPlaylistArrows();
                
                // Show the arrows
                const leftArrow = document.getElementById('playlist-arrow-left');
                const rightArrow = document.getElementById('playlist-arrow-right');
                if (leftArrow) leftArrow.style.display = 'flex';
                if (rightArrow) rightArrow.style.display = 'flex';
            } else {
                ytIframe.src = url;
                
                // Hide the arrows
                const leftArrow = document.getElementById('playlist-arrow-left');
                const rightArrow = document.getElementById('playlist-arrow-right');
                if (leftArrow) leftArrow.style.display = 'none';
                if (rightArrow) rightArrow.style.display = 'none';
            }
        }
    };

    function injectPlaylistArrows() {
        if (document.getElementById('playlist-arrow-left')) return;
        
        const videoModal = document.getElementById('video-modal');
        if (!videoModal) return;

        const leftArrow = document.createElement('div');
        leftArrow.id = 'playlist-arrow-left';
        leftArrow.className = 'playlist-nav-arrow';
        leftArrow.innerHTML = '&#8592;'; // Left arrow code
        leftArrow.onclick = function(e) {
            e.stopPropagation();
            navigatePlaylist(-1);
        };

        const rightArrow = document.createElement('div');
        rightArrow.id = 'playlist-arrow-right';
        rightArrow.className = 'playlist-nav-arrow';
        rightArrow.innerHTML = '&#8594;'; // Right arrow code
        rightArrow.onclick = function(e) {
            e.stopPropagation();
            navigatePlaylist(1);
        };

        // Append to modal
        videoModal.appendChild(leftArrow);
        videoModal.appendChild(rightArrow);

        // Add CSS style dynamically
        const style = document.createElement('style');
        style.innerHTML = `
            .playlist-nav-arrow {
                position: fixed;
                top: 50%;
                transform: translateY(-50%);
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.08);
                border: 1px solid rgba(255, 255, 255, 0.15);
                color: #fff;
                font-size: 1.5rem;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s ease;
                z-index: 1010;
                user-select: none;
                backdrop-filter: blur(5px);
                -webkit-backdrop-filter: blur(5px);
            }
            .playlist-nav-arrow:hover {
                background: #fff;
                color: #000;
                transform: translateY(-50%) scale(1.08);
            }
            #playlist-arrow-left {
                left: 40px;
            }
            #playlist-arrow-right {
                right: 40px;
            }
            @media (max-width: 1024px) {
                #playlist-arrow-left {
                    left: 20px;
                }
                #playlist-arrow-right {
                    right: 20px;
                }
                .playlist-nav-arrow {
                    width: 44px;
                    height: 44px;
                    font-size: 1.25rem;
                }
            }
            @media (max-width: 768px) {
                #playlist-arrow-left {
                    left: 15px;
                }
                #playlist-arrow-right {
                    right: 15px;
                }
                .playlist-nav-arrow {
                    width: 38px;
                    height: 38px;
                    font-size: 1.1rem;
                }
            }
        `;
        videoModal.appendChild(style);
    }

    function navigatePlaylist(direction) {
        const ytIframe = document.getElementById('modal-youtube-iframe');
        if (!ytIframe) return;

        currentPlaylistIndex += direction;
        if (currentPlaylistIndex < 1) {
            currentPlaylistIndex = 3;
        } else if (currentPlaylistIndex > 3) {
            currentPlaylistIndex = 1;
        }

        const videoId = playlistVideos[currentPlaylistIndex - 1];
        ytIframe.src = `https://www.youtube.com/embed/${videoId}?list=PLcEfgyOkpXh3HnxXxdgWmOKnz_1fwQL_h&autoplay=1`;
    }

    // Mocoa 360 Pop-up Model
    function injectMocoa360Modal() {
        if (document.getElementById('mocoa360-modal')) return;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'mocoa360-modal';
        modal.innerHTML = `
            <div class="modal-content-video" style="max-width: 90vw; height: 85vh; border-radius: var(--radius-card); background: #000; border: 1px solid var(--border-glass); position: relative; margin: 20px; overflow: hidden; display: flex; flex-direction: column;">
                <button class="modal-close" style="position: absolute; top: 20px; right: 20px; z-index: 100;" onclick="closeMocoa360Modal()">&times;</button>
                
                <!-- Title Overlay -->
                <div style="padding: 18px 20px 0 20px; text-align: center; position: absolute; top: 0; left: 0; right: 0; z-index: 10; pointer-events: none;">
                    <h3 style="margin: 0; font-size: 1.4rem; text-transform: uppercase; color: white; letter-spacing: 0.05em; font-family: var(--font-primary); font-weight: 800;">The Mocoa Porphyry</h3>
                    <p style="margin: 3px 0 0 0; font-size: 0.75rem; color: var(--copper-primary); text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600; font-family: var(--font-mono);">Interactive 3D Model</p>
                </div>

                <!-- 3D frame and SVG panels overlay container -->
                <div style="flex: 1; position: relative; overflow: hidden;">
                    <iframe id="mocoa360-iframe-modal" style="width: 100%; height: 100%; border: none;" src="" title="Mocoa 360° Interactive Model" scrolling="no"></iframe>
                    
                    <!-- Panels -->
                    <div class="mocoa-360-overlay-container" style="display: flex; justify-content: space-between; align-items: flex-end; padding: 20px; box-sizing: border-box; position: absolute; inset: 0; pointer-events: none;">
                        <div class="mocoa-360-left-panel" style="width: 240px; max-width: 30vw; pointer-events: auto;">
                            <img src="Recurso 2.svg" alt="Inferred Mineral Resource Estimate" class="recurso-panel-img">
                        </div>
                        <div class="mocoa-360-right-panel" style="width: 210px; max-width: 28vw; pointer-events: auto;">
                            <img src="Recurso 3.svg" alt="Towers, Scale and Legend" class="recurso-panel-img">
                        </div>
                    </div>
                </div>
                
                <!-- Bottom metrics bar -->
                <div class="mocoa-360-bottom-bar" style="background: #0d0d0d; border-top: 1px solid var(--border-glass); padding: 10px 24px; z-index: 10; flex-shrink: 0; display: flex; align-items: center; justify-content: center; height: auto;">
                    <img src="Recurso 1.svg" alt="Mocoa Project Stage & Valuation Metrics" class="recurso-bottom-img" style="width: 100%; max-width: 680px; height: auto; display: block; margin: 0 auto;">
                </div>
            </div>
        `;
        modal.onclick = function(e) {
            if (e.target === modal) {
                closeMocoa360Modal();
            }
        };
        document.body.appendChild(modal);
    }

    window.openMocoa360Modal = function() {
        injectMocoa360Modal();
        const modal = document.getElementById('mocoa360-modal');
        const iframe = document.getElementById('mocoa360-iframe-modal');
        if (modal && iframe) {
            modal.classList.add('active');
            iframe.src = 'mocoa360/index.html?v=1.4';
        }
    };

    window.closeMocoa360Modal = function() {
        const modal = document.getElementById('mocoa360-modal');
        const iframe = document.getElementById('mocoa360-iframe-modal');
        if (modal && iframe) {
            modal.classList.remove('active');
            iframe.src = '';
        }
    };

    // Instagram Live Feed Pop-up
    function injectInstagramModal(postIds) {
        if (document.getElementById('instagram-modal')) return;

        // Ensure the official Instagram embed script is present
        if (!document.getElementById('instagram-embed-script')) {
            const script = document.createElement('script');
            script.id = 'instagram-embed-script';
            script.src = 'https://www.instagram.com/embed.js';
            script.async = true;
            document.body.appendChild(script);
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'instagram-modal';

        modal.innerHTML = `
            <button class="modal-close-btn" onclick="closeInstagramModal()">&times;</button>
            <div class="modal-content" style="max-width: 1080px; padding: 30px; background: #0c0c0c; border: 1px solid var(--border-glass); border-radius: var(--radius-card); position: relative; margin: 20px; width: 90%; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden;">
                <!-- Header -->
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 16px; flex-shrink: 0;">
                    <div style="display: flex; align-items: center; gap: 14px;">
                        <div style="width: 50px; height: 50px; border-radius: 50%; overflow: hidden; border: 2px solid var(--copper-primary); padding: 3px; background: #000; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                            <img src="assets/LOGO.svg" style="width: 100%; height: 100%; object-fit: contain;" alt="Copper Giant Logo">
                        </div>
                        <div style="text-align: left;">
                            <h3 style="margin: 0; font-size: 1.2rem; font-weight: 700; color: white;">@cu_giant</h3>
                            <p style="margin: 2px 0 0 0; font-size: 0.75rem; color: var(--text-secondary);">Copper Giant Resources Corp. on Instagram</p>
                        </div>
                    </div>
                    <a href="https://www.instagram.com/cu_giant/" target="_blank" rel="noopener noreferrer" class="btn-copper" style="padding: 8px 18px; font-size: 0.78rem; display: flex; align-items: center; gap: 6px; text-decoration: none; border-radius: 4px; font-weight: 600;">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                        Follow Profile
                    </a>
                </div>

                <!-- Scrollable Grid Container -->
                <div style="flex: 1; overflow-y: auto; padding-right: 6px;" class="instagram-embed-scroll">
                    <div class="instagram-embed-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; justify-items: center; padding: 10px 0; align-items: start;">
                        ${postIds.map(id => `
                            <div style="width: 100%; max-width: 320px; display: flex; justify-content: center;">
                                <blockquote class="instagram-media" data-instgrm-permalink="https://www.instagram.com/p/${id}/" data-instgrm-version="14" style="background:#FFF; border:0; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.3); margin:0; width:100%; min-width:320px;">
                                    <div style="padding:16px; text-align:center;">
                                        <a href="https://www.instagram.com/p/${id}/" target="_blank" style="color:#000; text-decoration:none; font-family:var(--font-primary); font-size:0.85rem; font-weight:600;">Loading post...</a>
                                    </div>
                                </blockquote>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        modal.onclick = function(e) {
            if (e.target === modal) {
                closeInstagramModal();
            }
        };

        // Add CSS styling dynamically for responsiveness
        const style = document.createElement('style');
        style.innerHTML = `
            @media (max-width: 900px) {
                .instagram-embed-grid {
                    grid-template-columns: repeat(2, 1fr) !important;
                }
            }
            @media (max-width: 600px) {
                .instagram-embed-grid {
                    grid-template-columns: repeat(1, 1fr) !important;
                }
            }
            /* Style scrollbar of embeds grid */
            .instagram-embed-scroll::-webkit-scrollbar {
                width: 6px;
            }
            .instagram-embed-scroll::-webkit-scrollbar-track {
                background: rgba(255,255,255,0.02);
                border-radius: 3px;
            }
            .instagram-embed-scroll::-webkit-scrollbar-thumb {
                background: rgba(255,255,255,0.15);
                border-radius: 3px;
            }
        `;
        modal.appendChild(style);
        document.body.appendChild(modal);
    }

    window.openInstagramModal = function() {
        fetch('data/site.json')
            .then(res => res.json())
            .then(data => {
                const postIds = data.instagram_post_ids || [];
                injectInstagramModal(postIds);
                const modal = document.getElementById('instagram-modal');
                if (modal) {
                    modal.classList.add('active');
                    if (window.instgrm) {
                        window.instgrm.Embeds.process();
                    }
                }
            })
            .catch(err => {
                console.warn('Could not load site.json for Instagram modal', err);
                injectInstagramModal(['C9m142xOSa_', 'C8n512kLOpQ', 'C7a982pLMzN']);
                const modal = document.getElementById('instagram-modal');
                if (modal) {
                    modal.classList.add('active');
                    if (window.instgrm) {
                        window.instgrm.Embeds.process();
                    }
                }
            });
    };

    window.closeInstagramModal = function() {
        const modal = document.getElementById('instagram-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    };





    // ---------------------------------------------------------
    // 0.7. Home News Hub Loader (Dynamic 6 items from news.json)
    // ---------------------------------------------------------
    function initHomeNews() {
        const newsGrid = document.querySelector('.news-hub-grid');
        if (!newsGrid) return;

        fetch('data/news.json')
            .then(res => res.json())
            .then(data => {
                const items = data.items || [];
                const recentItems = items.slice(0, 6);
                window.homeNewsItems = recentItems; // Store globally

                newsGrid.innerHTML = recentItems.map((item, index) => {
                    const dateStr = item.date.toUpperCase();

                    return `
                        <div class="news-hub-card">
                            <div class="card-brand-lockup">
                                <div class="card-brand-title-row" style="cursor: pointer;" onclick="window.openHomeNewsModal(${index})">
                                    <img src="assets/LOGO2.svg" alt="Arrow" class="card-brand-arrow">
                                    <h4 class="card-news-title">${item.title}</h4>
                                </div>
                                <div class="card-brand-line"></div>
                                <div class="card-brand-date">${dateStr}</div>
                            </div>
                            <p class="news-card-body">${item.summary}</p>
                            <button class="btn-rect btn-rect-primary" onclick="window.openHomeNewsModal(${index})">READ MORE</button>
                        </div>
                    `;
                }).join('');
            })
            .catch(err => console.warn('Home news loader: could not load news.json', err));
    }
    initHomeNews();

    window.openHomeNewsModal = function(index) {
        if (window.homeNewsItems && window.homeNewsItems[index]) {
            window.openNewsModal(window.homeNewsItems[index]);
        }
    };

    // ---------------------------------------------------------
    // 1. Mobile Menu Toggle (Illustrator Proposal Custom)
    // ---------------------------------------------------------
    const mobileMenuToggle = document.getElementById('btn-mobile-menu');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', () => {
            mobileMenuToggle.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            
            // Toggle hamburger design
            const spans = mobileMenuToggle.querySelectorAll('span');
            if (mobileMenuToggle.classList.contains('active')) {
                spans[0].style.transform = 'translateY(6px) rotate(45deg)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'translateY(-6px) rotate(-45deg)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });

        // Close menu when navigation links are clicked
        mobileMenu.querySelectorAll('.mobile-link').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenuToggle.classList.remove('active');
                mobileMenu.classList.remove('active');
                mobileMenuToggle.querySelectorAll('span').forEach(span => span.style.transform = 'none');
                mobileMenuToggle.querySelector('span:nth-child(2)').style.opacity = '1';
            });
        });
    }

    // ---------------------------------------------------------
    // 2. Video Modal Logic (Illustrator Proposal Custom - index.html)
    // ---------------------------------------------------------
    const videoModal = document.getElementById('video-modal');
    const ytIframe = document.getElementById('modal-youtube-iframe');
    const ytUrl = "https://www.youtube.com/embed/-LWD7kVmmrs?autoplay=1&rel=0";

    window.openVideoModal = function() {
        if (videoModal && ytIframe) {
            videoModal.classList.add('active');
            ytIframe.src = ytUrl;
        }
    };

    window.closeVideoModal = function(e) {
        if (e) {
            // Prevent close when clicking inside the video itself or on the arrows
            if (e.target.closest('.modal-content-video') && !e.target.classList.contains('modal-close-btn')) {
                return;
            }
            if (e.target.closest('.playlist-nav-arrow')) {
                return;
            }
        }
        if (videoModal && ytIframe) {
            videoModal.classList.remove('active');
            ytIframe.src = ""; // Stops the video
            
            // Hide the arrows
            const leftArrow = document.getElementById('playlist-arrow-left');
            const rightArrow = document.getElementById('playlist-arrow-right');
            if (leftArrow) leftArrow.style.display = 'none';
            if (rightArrow) rightArrow.style.display = 'none';
        }
    };

    // Escape key closes modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeVideoModal();
            if (window.closeMocoa360Modal) window.closeMocoa360Modal();
            if (window.closeInstagramModal) window.closeInstagramModal();
        }
    });

    // ---------------------------------------------------------
    // 3. News Hub Grid Scroll (for mobile/tablet touch viewports)
    // ---------------------------------------------------------
    const newsGrid = document.querySelector('.news-hub-grid');
    const leftArrow = document.querySelector('.news-arrows-container button:first-child');
    const rightArrow = document.querySelector('.news-arrows-container button:last-child');

    if (newsGrid && leftArrow && rightArrow) {
        // Simple click-scroll for mobile swipe behavior
        leftArrow.addEventListener('click', () => {
            const card = newsGrid.querySelector('.news-hub-card');
            const cardWidth = card ? card.clientWidth : 380;
            newsGrid.scrollBy({
                left: -cardWidth - 24,
                behavior: 'smooth'
            });
        });

        rightArrow.addEventListener('click', () => {
            const card = newsGrid.querySelector('.news-hub-card');
            const cardWidth = card ? card.clientWidth : 380;
            newsGrid.scrollBy({
                left: cardWidth + 24,
                behavior: 'smooth'
            });
        });
    }



    // ---------------------------------------------------------
    // 5. Header Scroll Background Toggle
    // ---------------------------------------------------------
    const headerGroupEl = document.querySelector('.top-header-group');
    if (headerGroupEl) {
        function checkScroll() {
            if (window.scrollY > 10) {
                headerGroupEl.classList.add('scrolled');
            } else {
                headerGroupEl.classList.remove('scrolled');
            }
        }
        window.addEventListener('scroll', checkScroll);
        checkScroll(); // Run on initial load
    }

    // =========================================================
    // PORTED INTERACTIVE LOGIC FROM BASE SITE
    // =========================================================

    // Back to Top button
    const backToTopBtn = document.getElementById('btn-back-to-top');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Intersection Observer for fade-ups
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-up').forEach((el) => {
        observer.observe(el);
    });

    // Automatically observe any dynamically added .fade-up elements
    const dynamicObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.classList.contains('fade-up')) {
                        observer.observe(node);
                    }
                    node.querySelectorAll('.fade-up').forEach(el => {
                        observer.observe(el);
                    });
                }
            });
        });
    });
    dynamicObserver.observe(document.body, { childList: true, subtree: true });
    
    // Trigger initial fade up for hero
    const heroContent = document.querySelector('.hero-content');
    if (heroContent) {
        setTimeout(() => {
            heroContent.classList.add('visible');
        }, 100);
    }

    // Sub-navigation scrollspy
    const subNavLinks = document.querySelectorAll('.sub-nav-links a[href^="#"]');
    if (subNavLinks.length > 0) {
        const sections = Array.from(subNavLinks).map(link => {
            const id = link.getAttribute('href');
            if (!id || id === '#' || id.trim() === '' || !id.startsWith('#')) return null;
            try {
                return document.querySelector(id);
            } catch (err) {
                console.warn(`Invalid scrollspy selector: ${id}`, err);
                return null;
            }
        }).filter(section => section !== null);

        function updateScrollspy() {
            let activeSection = null;
            const scrollPos = window.scrollY + 160; // offset for main nav + sub-nav + buffer

            sections.forEach(section => {
                const top = section.offsetTop;
                const height = section.offsetHeight;
                if (scrollPos >= top && scrollPos < top + height) {
                    activeSection = section;
                }
            });

            if (!activeSection && sections.length > 0) {
                if (window.scrollY < sections[0].offsetTop) {
                    activeSection = sections[0];
                } else if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 50) {
                    activeSection = sections[sections.length - 1];
                }
            }

            if (activeSection) {
                const id = activeSection.getAttribute('id');
                subNavLinks.forEach(link => {
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                });
            }
        }

        window.addEventListener('scroll', updateScrollspy);
        window.addEventListener('resize', updateScrollspy);
        window.addEventListener('load', updateScrollspy);
        setTimeout(updateScrollspy, 300);
        updateScrollspy();
    }

    // Get Updates Modal Functionality
    const modal = document.getElementById('updates-modal');
    const modalFormState = document.getElementById('modal-form-state');
    const modalSuccessState = document.getElementById('modal-success-state');

    window.openUpdatesModal = function() {
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            if (modalFormState) modalFormState.style.display = 'block';
            if (modalSuccessState) modalSuccessState.style.display = 'none';
            const form = document.getElementById('mc-embedded-subscribe-form') || document.getElementById('newsletter-modal-form');
            if (form) form.reset();
        }
    };

    window.closeUpdatesModal = function() {
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    window.showModalSuccess = function() {
        if (modalFormState) modalFormState.style.display = 'none';
        if (modalSuccessState) modalSuccessState.style.display = 'flex';
    };

    // Attach click listeners to any "Get Updates" button/trigger
    document.querySelectorAll('.btn-nav-updates, .trigger-updates-modal, .nav-links-right a[href*="newsletter"], .footer-column a[href*="newsletter"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            // Close mobile menu if active
            if (mobileMenuToggle && mobileMenu) {
                mobileMenuToggle.classList.remove('active');
                mobileMenu.classList.remove('active');
            }
            window.openUpdatesModal();
        });
    });

    const btnCloseModal = document.getElementById('btn-close-modal');
    if (btnCloseModal) {
        btnCloseModal.addEventListener('click', window.closeUpdatesModal);
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                window.closeUpdatesModal();
            }
        });
    }

    // Team Bio Modal Functionality
    const teamModal = document.getElementById('team-modal');
    const teamModalName = document.getElementById('team-modal-name');
    const teamModalRole = document.getElementById('team-modal-role');
    const teamModalBio = document.getElementById('team-modal-bio');
    const teamModalPhotoContainer = document.querySelector('.team-modal-photo-container');
    const teamModalPlaceholder = document.querySelector('.team-modal-placeholder');
    const btnCloseTeamModal = document.getElementById('btn-close-team-modal');

    window.openTeamModal = function(card) {
        if (!teamModal) return;

        const name = card.getAttribute('data-name');
        const role = card.getAttribute('data-role');
        const img = card.getAttribute('data-img');
        const bio = card.getAttribute('data-bio');

        if (teamModalName) teamModalName.textContent = name;
        if (teamModalRole) teamModalRole.textContent = role;
        if (teamModalBio) teamModalBio.textContent = bio;

        if (teamModalPhotoContainer) {
            if (img) {
                teamModalPhotoContainer.style.backgroundImage = `url('${img}')`;
                if (teamModalPlaceholder) teamModalPlaceholder.style.display = 'none';
            } else {
                teamModalPhotoContainer.style.backgroundImage = 'none';
                if (teamModalPlaceholder) {
                    const initials = name ? name.split(' ').map(n => n[0]).join('') : '';
                    const innerSpan = teamModalPlaceholder.querySelector('span');
                    if (innerSpan) innerSpan.textContent = initials;
                    teamModalPlaceholder.style.display = 'flex';
                }
            }
        }

        teamModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    window.closeTeamModal = function() {
        if (teamModal) {
            teamModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    document.addEventListener('click', (e) => {
        const card = e.target.closest('.team-card');
        if (card) {
            e.preventDefault();
            window.openTeamModal(card);
        }
    });

    if (btnCloseTeamModal) {
        btnCloseTeamModal.addEventListener('click', window.closeTeamModal);
    }

    if (teamModal) {
        teamModal.addEventListener('click', (e) => {
            if (e.target === teamModal) {
                window.closeTeamModal();
            }
        });
    }

    // Lightbox Modal for Photo Gallery, Coreshack, and Maps
    const lightboxModal = document.getElementById('gallery-lightbox-modal');
    const lightboxImg = document.getElementById('gallery-lightbox-img');
    const lightboxCaption = document.getElementById('gallery-lightbox-caption');
    const btnCloseLightbox = document.getElementById('btn-close-gallery-lightbox');
    const btnLightboxPrev = document.getElementById('btn-lightbox-prev');
    const btnLightboxNext = document.getElementById('btn-lightbox-next');

    let currentCollection = [];
    let currentIndex = 0;

    function openLightbox(collection, index) {
        currentCollection = collection;
        currentIndex = index;
        
        if (currentCollection && currentCollection.length > 0) {
            const item = currentCollection[currentIndex];
            if (lightboxImg) {
                lightboxImg.src = item.src;
                lightboxImg.alt = item.alt;
            }
            if (lightboxCaption) {
                lightboxCaption.textContent = item.caption;
            }
        }

        if (lightboxModal) {
            lightboxModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            if (lightboxImg) {
                lightboxImg.animate([
                    { opacity: 0, transform: 'scale(0.95)' },
                    { opacity: 1, transform: 'scale(1)' }
                ], {
                    duration: 300,
                    easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
                    fill: 'forwards'
                });
            }
        }
    }

    function closeLightbox() {
        if (lightboxModal) {
            lightboxModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    function updateLightbox(direction = 'next') {
        if (!currentCollection || currentCollection.length === 0) return;
        const item = currentCollection[currentIndex];
        if (!lightboxImg) return;

        const slideOutX = direction === 'next' ? '-20px' : '20px';
        const slideInX = direction === 'next' ? '20px' : '-20px';

        const fadeOut = lightboxImg.animate([
            { opacity: 1, transform: 'translateX(0) scale(1)' },
            { opacity: 0, transform: `translateX(${slideOutX}) scale(0.98)` }
        ], {
            duration: 150,
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
            fill: 'forwards'
        });

        fadeOut.onfinish = () => {
            lightboxImg.src = item.src;
            lightboxImg.alt = item.alt;
            if (lightboxCaption) {
                lightboxCaption.textContent = item.caption;
            }

            lightboxImg.animate([
                { opacity: 0, transform: `translateX(${slideInX}) scale(0.98)` },
                { opacity: 1, transform: 'translateX(0) scale(1)' }
            ], {
                duration: 250,
                easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
                fill: 'forwards'
            });
        };
    }

    if (btnLightboxPrev) {
        btnLightboxPrev.addEventListener('click', (e) => {
            e.stopPropagation();
            currentIndex = (currentIndex - 1 + currentCollection.length) % currentCollection.length;
            updateLightbox('prev');
        });
    }

    if (btnLightboxNext) {
        btnLightboxNext.addEventListener('click', (e) => {
            e.stopPropagation();
            currentIndex = (currentIndex + 1) % currentCollection.length;
            updateLightbox('next');
        });
    }

    if (btnCloseLightbox) {
        btnCloseLightbox.addEventListener('click', closeLightbox);
    }

    if (lightboxModal) {
        lightboxModal.addEventListener('click', (e) => {
            if (e.target === lightboxModal || e.target.classList.contains('lightbox-content')) {
                closeLightbox();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (lightboxModal && lightboxModal.classList.contains('active')) {
            if (e.key === 'ArrowLeft') {
                if (btnLightboxPrev) btnLightboxPrev.click();
            } else if (e.key === 'ArrowRight') {
                if (btnLightboxNext) btnLightboxNext.click();
            } else if (e.key === 'Escape') {
                closeLightbox();
            }
        }
    });

    const photoElements = document.querySelectorAll('[data-gallery-index]');
    photoElements.forEach((el) => {
        el.addEventListener('click', () => {
            const visiblePhotos = [];
            let clickedIndexInVisible = 0;
            let visibleIdx = 0;
            photoElements.forEach((otherEl) => {
                if (otherEl.style.display !== 'none' && !otherEl.classList.contains('hidden')) {
                    const img = otherEl.querySelector('img');
                    if (img) {
                        visiblePhotos.push({
                            src: img.getAttribute('src') || '',
                            alt: img.getAttribute('alt') || '',
                            caption: img.getAttribute('alt') || ''
                        });
                        if (otherEl === el) {
                            clickedIndexInVisible = visibleIdx;
                        }
                        visibleIdx++;
                    }
                }
            });
            openLightbox(visiblePhotos, clickedIndexInVisible);
        });
    });

    const coreElements = document.querySelectorAll('[data-core-index]');
    const coreCollection = [];
    coreElements.forEach((el, idx) => {
        const img = el.querySelector('img');
        if (img) {
            coreCollection.push({
                src: img.getAttribute('src') || '',
                alt: img.getAttribute('alt') || '',
                caption: img.getAttribute('alt') || ''
            });
            el.addEventListener('click', () => {
                openLightbox(coreCollection, idx);
            });
        }
    });

    const mapElements = document.querySelectorAll('[data-map-index]');
    const mapCollection = [];
    mapElements.forEach((el, idx) => {
        const img = el.querySelector('img');
        if (img) {
            mapCollection.push({
                src: img.getAttribute('src') || '',
                alt: img.getAttribute('alt') || '',
                caption: img.getAttribute('alt') || ''
            });
            el.addEventListener('click', () => {
                openLightbox(mapCollection, idx);
            });
        }
    });

    // Gallery Video Modal (used for news.html and mocoa.html)
    const galleryVideoModal = document.getElementById('gallery-video-modal');
    const galleryVideoIframe = document.getElementById('gallery-video-iframe');
    const btnCloseGalleryVideo = document.getElementById('btn-close-gallery-video');

    function openGalleryVideoModal(videoSrc) {
        if (galleryVideoIframe) {
            const src = videoSrc || "https://www.youtube.com/embed/5V9uYvN2_Xg";
            galleryVideoIframe.src = src.includes('?') ? `${src}&autoplay=1` : `${src}?autoplay=1`;
        }
        if (galleryVideoModal) {
            galleryVideoModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeGalleryVideoModal() {
        if (galleryVideoModal) {
            galleryVideoModal.classList.remove('active');
            document.body.style.overflow = '';
        }
        if (galleryVideoIframe) {
            galleryVideoIframe.src = "";
        }
    }

    document.querySelectorAll('[data-video-index]').forEach(el => {
        el.addEventListener('click', () => {
            openGalleryVideoModal();
        });
    });

    document.querySelectorAll('.video-card').forEach(el => {
        el.addEventListener('click', () => {
            const videoSrc = el.getAttribute('data-video-src');
            openGalleryVideoModal(videoSrc);
        });
    });

    if (btnCloseGalleryVideo) {
        btnCloseGalleryVideo.addEventListener('click', closeGalleryVideoModal);
    }

    if (galleryVideoModal) {
        galleryVideoModal.addEventListener('click', (e) => {
            if (e.target === galleryVideoModal) {
                closeGalleryVideoModal();
            }
        });
    }

    // Scroll Carousel utility
    window.scrollCarousel = function(carouselId, direction) {
        const carousel = document.getElementById(carouselId);
        if (!carousel) return;
        
        const scrollAmount = carousel.clientWidth * 0.8;
        if (direction === 'left') {
            carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        } else {
            carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    function updateProgress(carousel, progressBar) {
        if (!carousel || !progressBar) return;
        const maxScroll = carousel.scrollWidth - carousel.clientWidth;
        if (maxScroll <= 0) {
            progressBar.style.width = '0%';
            return;
        }
        const percentage = (carousel.scrollLeft / maxScroll) * 100;
        progressBar.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
    }

    const vCarousel = document.getElementById('videos-carousel');
    const vProgress = document.getElementById('videos-carousel-progress');
    if (vCarousel && vProgress) {
        vCarousel.addEventListener('scroll', () => updateProgress(vCarousel, vProgress));
        updateProgress(vCarousel, vProgress);
        window.addEventListener('resize', () => updateProgress(vCarousel, vProgress));
    }

    const pCarousel = document.getElementById('photos-carousel');
    const pProgress = document.getElementById('photos-carousel-progress');
    if (pCarousel && pProgress) {
        pCarousel.addEventListener('scroll', () => updateProgress(pCarousel, pProgress));
        updateProgress(pCarousel, pProgress);
        window.addEventListener('resize', () => updateProgress(pCarousel, pProgress));
    }

    // Segmented Control Tabs (Generic multi-instance)
    const tabControls = document.querySelectorAll('.segmented-control');
    tabControls.forEach(control => {
        const buttons = control.querySelectorAll('.tab-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const targetId = btn.getAttribute('data-target');
                if (targetId) {
                    const targetWrapper = document.getElementById(targetId);
                    if (targetWrapper) {
                        const contentClass = btn.getAttribute('data-content-class') || 'gallery-tab-content';
                        document.querySelectorAll('.' + contentClass).forEach(content => {
                            content.style.display = 'none';
                        });
                        targetWrapper.style.display = 'block';
                        
                        const childCarousel = targetWrapper.querySelector('.gallery-carousel');
                        const childProgress = targetWrapper.querySelector('.carousel-progress-bar');
                        if (childCarousel && childProgress) {
                            setTimeout(() => {
                                updateProgress(childCarousel, childProgress);
                            }, 50);
                        }
                    }
                }
            });
        });
    });

    // Interactive Donut Chart for Investors page
    (function initDonutChart() {
        const segments = document.querySelectorAll('.donut-segment');
        const centerTitle = document.getElementById('donut-center-title');
        const centerValue = document.getElementById('donut-center-value');
        const legendRows = document.querySelectorAll('.legend-row');

        if (!segments.length || !centerTitle || !centerValue) return;

        const segmentData = {
            common: { title: "Common Shares", value: "210.2M" },
            warrants: { title: "Warrants", value: "90.3M" },
            options: { title: "Options", value: "18.3M" },
            default: { title: "Fully Diluted", value: "318.9M" }
        };

        function updateCenter(type) {
            const data = segmentData[type] || segmentData.default;
            centerTitle.textContent = data.title;
            centerValue.textContent = data.value;

            legendRows.forEach(row => {
                const rowType = row.getAttribute('data-segment');
                if (rowType === type) {
                    row.classList.add('active');
                } else {
                    row.classList.remove('active');
                }
            });
        }

        segments.forEach(segment => {
            const type = segment.getAttribute('data-segment');
            segment.addEventListener('mouseenter', () => updateCenter(type));
            segment.addEventListener('mouseleave', () => updateCenter('default'));
        });

        legendRows.forEach(row => {
            const type = row.getAttribute('data-segment');
            row.addEventListener('mouseenter', () => {
                updateCenter(type);
                segments.forEach(seg => {
                    const segType = seg.getAttribute('data-segment');
                    if (segType === type) {
                        seg.style.strokeWidth = '30px';
                        seg.style.filter = 'drop-shadow(0 0 12px var(--copper-glow))';
                    } else {
                        seg.style.opacity = '0.4';
                    }
                });
            });
            row.addEventListener('mouseleave', () => {
                updateCenter('default');
                segments.forEach(seg => {
                    seg.style.strokeWidth = '';
                    seg.style.filter = '';
                    seg.style.opacity = '';
                });
            });
        });
    })();

    // Animate Shareholder Distribution Progress Bars on Scroll
    (function initShareholderProgress() {
        const fillBars = document.querySelectorAll('.shareholder-bar-fill');
        if (!fillBars.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const bar = entry.target;
                    const pct = bar.getAttribute('data-percent');
                    if (pct) {
                        bar.style.width = pct + '%';
                    }
                    observer.unobserve(bar);
                }
            });
        }, { threshold: 0.1 });

        fillBars.forEach(bar => {
            observer.observe(bar);
        });
    })();

    // Corporate Calendar Event Filtering & Pagination
    (function initEventsPagination() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        const eventCards = document.querySelectorAll('.event-card');
        const paginationContainer = document.getElementById('events-pagination');

        if (!eventCards.length) return;

        const pageSize = 3;
        let currentFilter = 'all';
        let currentPage = 1;

        function updateEvents() {
            const matchingCards = Array.from(eventCards).filter(card => {
                const eventType = card.getAttribute('data-event-type');
                return currentFilter === 'all' || eventType === currentFilter;
            });

            const totalEvents = matchingCards.length;
            const totalPages = Math.ceil(totalEvents / pageSize);

            if (currentPage > totalPages) currentPage = Math.max(1, totalPages);

            const startIndex = (currentPage - 1) * pageSize;
            const endIndex = startIndex + pageSize;

            eventCards.forEach(card => {
                card.style.display = 'none';
            });

            matchingCards.forEach((card, index) => {
                if (index >= startIndex && index < endIndex) {
                    card.style.display = 'flex';
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(10px)';
                    requestAnimationFrame(() => {
                        card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    });
                }
            });

            if (!paginationContainer) return;
            paginationContainer.innerHTML = '';

            if (totalPages <= 1) {
                return;
            }

            const prevBtn = document.createElement('button');
            prevBtn.className = 'page-btn page-arrow';
            prevBtn.disabled = currentPage === 1;
            prevBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            `;
            prevBtn.addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    updateEvents();
                    const sectionEl = document.getElementById('events');
                    if (sectionEl) sectionEl.scrollIntoView({ behavior: 'smooth' });
                }
            });
            paginationContainer.appendChild(prevBtn);

            for (let i = 1; i <= totalPages; i++) {
                const numBtn = document.createElement('button');
                numBtn.className = `page-btn ${currentPage === i ? 'active' : ''}`;
                numBtn.textContent = i;
                numBtn.addEventListener('click', () => {
                    if (currentPage !== i) {
                        currentPage = i;
                        updateEvents();
                        const sectionEl = document.getElementById('events');
                        if (sectionEl) sectionEl.scrollIntoView({ behavior: 'smooth' });
                    }
                });
                paginationContainer.appendChild(numBtn);
            }

            const nextBtn = document.createElement('button');
            nextBtn.className = 'page-btn page-arrow';
            nextBtn.disabled = currentPage === totalPages;
            nextBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            `;
            nextBtn.addEventListener('click', () => {
                if (currentPage < totalPages) {
                    currentPage++;
                    updateEvents();
                    const sectionEl = document.getElementById('events');
                    if (sectionEl) sectionEl.scrollIntoView({ behavior: 'smooth' });
                }
            });
            paginationContainer.appendChild(nextBtn);
        }

        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.getAttribute('data-filter');
                currentPage = 1;
                updateEvents();
            });
        });

        updateEvents();
    })();

    // Content Gallery Photo & Video Filtering with Load More
    // --- Photos Gallery ---
    const photosGrid = document.getElementById('photos-grid');
    const photoCards = document.querySelectorAll('.photo-card');
    const photoFilters = document.querySelectorAll('#gallery-photos-wrapper .filter-pill');
    const photoLoadMoreContainer = document.getElementById('load-more-container');

    let currentPhotoFilter = 'all';
    let visiblePhotosCount = 12;
    const photosPerPage = 12;

    function updatePhotosGallery() {
        if (!photosGrid) return;
        
        let matchingPhotos = [];
        photoCards.forEach(card => {
            const category = card.getAttribute('data-category');
            if (currentPhotoFilter === 'all' || category === currentPhotoFilter) {
                matchingPhotos.push(card);
            } else {
                card.classList.add('hidden');
                card.classList.remove('fade-in');
            }
        });

        matchingPhotos.forEach((card, idx) => {
            if (idx < visiblePhotosCount) {
                card.classList.remove('hidden');
                card.classList.add('fade-in');
            } else {
                card.classList.add('hidden');
                card.classList.remove('fade-in');
            }
        });

        if (photoLoadMoreContainer) {
            if (matchingPhotos.length > visiblePhotosCount) {
                photoLoadMoreContainer.style.display = 'flex';
            } else {
                photoLoadMoreContainer.style.display = 'none';
            }
        }
    }

    photoFilters.forEach(pill => {
        pill.addEventListener('click', () => {
            photoFilters.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentPhotoFilter = pill.getAttribute('data-filter');
            visiblePhotosCount = photosPerPage;
            updatePhotosGallery();
        });
    });

    window.loadMorePhotos = function() {
        visiblePhotosCount += photosPerPage;
        updatePhotosGallery();
    };

    // --- Videos Gallery ---
    const videosGrid = document.getElementById('videos-grid');
    const videoCards = document.querySelectorAll('.video-card');
    const videoFilters = document.querySelectorAll('#gallery-videos-wrapper .filter-pill');
    const videoLoadMoreContainer = document.getElementById('video-load-more-container');

    let currentVideoFilter = 'all';
    let visibleVideosCount = 6;
    const videosPerPage = 6;

    function updateVideosGallery() {
        if (!videosGrid) return;

        let matchingVideos = [];
        videoCards.forEach(card => {
            const category = card.getAttribute('data-category');
            if (currentVideoFilter === 'all' || category === currentVideoFilter) {
                matchingVideos.push(card);
            } else {
                card.classList.add('hidden');
                card.classList.remove('fade-in');
            }
        });

        matchingVideos.forEach((card, idx) => {
            if (idx < visibleVideosCount) {
                card.classList.remove('hidden');
                card.classList.add('fade-in');
            } else {
                card.classList.add('hidden');
                card.classList.remove('fade-in');
            }
        });

        if (videoLoadMoreContainer) {
            if (matchingVideos.length > visibleVideosCount) {
                videoLoadMoreContainer.style.display = 'flex';
            } else {
                videoLoadMoreContainer.style.display = 'none';
            }
        }
    }

    videoFilters.forEach(pill => {
        pill.addEventListener('click', () => {
            videoFilters.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentVideoFilter = pill.getAttribute('data-filter');
            visibleVideosCount = videosPerPage;
            updateVideosGallery();
        });
    });

    window.loadMoreVideos = function() {
        visibleVideosCount += videosPerPage;
        updateVideosGallery();
    };

    // Press Releases Filter & Search
    function initPressFilters() {
        const pressFilters = document.querySelectorAll('.press-filters .filter-pill');
        const pressSearch = document.getElementById('press-search');
        const pressItems = document.querySelectorAll('.press-item');

        if (pressItems.length > 0 && (pressFilters.length > 0 || pressSearch)) {
            let activeCategory = 'all';
            let searchQuery = '';

            function filterPressReleases() {
                pressItems.forEach(item => {
                    const category = item.getAttribute('data-category');
                    const titleElement = item.querySelector('h3');
                    const descElement = item.querySelector('p');
                    const titleText = titleElement ? titleElement.textContent.toLowerCase() : '';
                    const descText = descElement ? descElement.textContent.toLowerCase() : '';
                    
                    const matchesCategory = (activeCategory === 'all' || category === activeCategory);
                    const matchesSearch = (titleText.includes(searchQuery) || (descText && descText.includes(searchQuery)));

                    if (matchesCategory && matchesSearch) {
                        item.style.display = 'flex';
                        item.style.opacity = '0';
                        item.style.transform = 'translateY(10px)';
                        item.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                        requestAnimationFrame(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'translateY(0)';
                        });
                    } else {
                        item.style.display = 'none';
                    }
                });
            }

            pressFilters.forEach(btn => {
                btn.addEventListener('click', () => {
                    pressFilters.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    activeCategory = btn.getAttribute('data-filter');
                    filterPressReleases();
                });
            });

            if (pressSearch) {
                pressSearch.addEventListener('input', (e) => {
                    searchQuery = e.target.value.toLowerCase().trim();
                    filterPressReleases();
                });
            }
        }
    }

    document.addEventListener('pressReleasesLoaded', initPressFilters);

    updatePhotosGallery();
    updateVideosGallery();

    // --- Corporate Presentation PDF Modal Functionality ---
    function initPresentationModal() {
        // Prevent duplicate injection
        if (document.getElementById('presentation-modal')) return;

        // Inject modal overlay HTML at the end of body
        const modalHTML = `
        <div class="modal-overlay" id="presentation-modal">
            <button class="modal-close-pdf" id="btn-close-presentation" aria-label="Close Presentation">&times;</button>
            <div class="modal-content-pdf">
                <iframe id="presentation-iframe" src="" style="width: 100%; height: 100%; border: none; border-radius: var(--radius-card);" title="Corporate Presentation"></iframe>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const presentationModal = document.getElementById('presentation-modal');
        const iframe = document.getElementById('presentation-iframe');
        const closeBtn = document.getElementById('btn-close-presentation');

        window.openPresentationModal = function(e) {
            if (e) e.preventDefault();
            // Lazy load the PDF only when opened
            if (iframe && !iframe.getAttribute('src')) {
                iframe.setAttribute('src', 'assets/corporate-presentation.pdf');
            }
            presentationModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        window.closePresentationModal = function() {
            presentationModal.classList.remove('active');
            document.body.style.overflow = '';
        };

        // Click on close button
        if (closeBtn) {
            closeBtn.addEventListener('click', window.closePresentationModal);
        }

        // Click on overlay background
        presentationModal.addEventListener('click', (e) => {
            if (e.target === presentationModal) {
                window.closePresentationModal();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && presentationModal.classList.contains('active')) {
                window.closePresentationModal();
            }
        });

        // Intercept header buttons and card clicks via event delegation
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a.nav-btn-solid[href*="presentation"], a[href*="investors.html#presentation"], a[href*="CGNT-Corporate-Presentation-MAY-2026.pdf"], a[href*="corporate-presentation.pdf"], a[href="#presentation"]');
            if (link) {
                // If mobile menu is open, close it first
                if (mobileMenuToggle && mobileMenu) {
                    mobileMenuToggle.classList.remove('active');
                    mobileMenu.classList.remove('active');
                }
                window.openPresentationModal(e);
            }
        });

    }

    // ---------------------------------------------------------
    // News Modal Implementation (Dynamic Injection & Overlay)
    // ---------------------------------------------------------
    function injectNewsModal() {
        if (document.getElementById('news-modal')) return;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'news-modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px; width: 90%; padding: 40px; border-bottom: 3px solid var(--copper-primary);">
                <button class="modal-close" style="position: absolute; top: 20px; right: 20px; font-size: 2rem; background: none; border: none; color: var(--text-secondary); cursor: pointer; transition: color var(--transition-fast);" onmouseover="this.style.color='#ffffff'" onmouseout="this.style.color='var(--text-secondary)'" onclick="window.closeNewsModal()">&times;</button>
                
                <div class="modal-scroll-area" style="overflow-y: auto; max-height: 55vh; padding-right: 15px; margin-top: 10px;">
                    <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 15px;">
                        <span id="news-modal-date" style="font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; color: var(--copper-primary); font-weight: 700;"></span>
                        <span id="news-modal-category" style="font-size: 0.75rem; background: var(--copper-primary); color: white; padding: 3px 8px; font-weight: 600; font-family: 'JetBrains Mono', monospace; text-transform: uppercase;"></span>
                    </div>
                    
                    <h2 id="news-modal-title" style="font-size: 1.8rem; line-height: 1.35; color: white; font-weight: 700; margin-bottom: 20px; letter-spacing: -0.01em; text-align: left;"></h2>
                    
                    <div style="height: 1px; background: rgba(255, 255, 255, 0.1); margin-bottom: 25px;"></div>
                    
                    <div id="news-modal-body" style="color: var(--text-secondary); line-height: 1.7; font-size: 1.05rem; display: flex; flex-direction: column; gap: 15px; text-align: left;">
                        <!-- Paragraphs will be inserted here -->
                    </div>
                </div>
                
                <div style="display: flex; gap: 16px; margin-top: 25px; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 20px; justify-content: flex-end;">
                    <a id="news-modal-pdf" href="" download target="_blank" rel="noopener noreferrer" class="btn-rect btn-rect-primary" style="display: none; padding: 12px 28px; font-size: 0.8rem; text-decoration: none;">DOWNLOAD PDF</a>
                    <button class="btn-rect" style="background: transparent; border: 1px solid rgba(255, 255, 255, 0.2); color: white; padding: 12px 28px; font-size: 0.8rem; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'" onclick="window.closeNewsModal()">CLOSE</button>
                </div>
            </div>
        `;
        
        modal.onclick = function(e) {
            if (e.target === modal) {
                window.closeNewsModal();
            }
        };

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                window.closeNewsModal();
            }
        });

        document.body.appendChild(modal);
    }

    window.openNewsModal = function(item) {
        injectNewsModal();
        const modal = document.getElementById('news-modal');
        const modalDate = document.getElementById('news-modal-date');
        const modalCategory = document.getElementById('news-modal-category');
        const modalTitle = document.getElementById('news-modal-title');
        const modalBody = document.getElementById('news-modal-body');
        const modalPdf = document.getElementById('news-modal-pdf');

        if (!modal) return;

        if (modalDate) modalDate.textContent = item.date.toUpperCase();
        if (modalCategory) modalCategory.textContent = item.category || 'PRESS RELEASE';
        if (modalTitle) modalTitle.textContent = item.title;

        // Build full content from summary and general template
        let bodyHtml = `<p><strong>${item.summary}</strong></p>`;
        bodyHtml += `<p>The Company plans to continue its systematic exploration and development programs throughout the upcoming quarters. Further updates will be provided as assays and technical reviews are completed. The results from this release have been verified by the Company's qualified persons in accordance with National Instrument 43-101 standards.</p>`;
        bodyHtml += `<p>Copper Giant Resources Corp. is a leading resource exploration company focused on the development of world-class copper-molybdenum porphyry systems in the Americas. With a commitment to environmental stewardship, local community development, and rigorous safety standards, the company is positioned to supply the essential materials required for the global clean energy transition.</p>`;
        bodyHtml += `<p style="margin-top: 15px;"><em>On Behalf of the Board of Directors,<br><strong>Ian Harris</strong><br>Chief Executive Officer</em></p>`;
        
        if (modalBody) modalBody.innerHTML = bodyHtml;

        if (modalPdf) {
            if (item.pdfUrl) {
                modalPdf.href = item.pdfUrl;
                modalPdf.style.display = 'inline-block';
            } else {
                modalPdf.style.display = 'none';
            }
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    // ---------------------------------------------------------
    // Deposit Metrics Modal Implementation (Dynamic Injection & Overlay)
    // ---------------------------------------------------------
    function injectDepositMetricsModal() {
        if (document.getElementById('deposit-metrics-modal')) return;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'deposit-metrics-modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 700px; width: 90%; padding: 40px; border-bottom: 3px solid var(--copper-primary); text-align: center; position: relative;">
                <button class="modal-close" style="position: absolute; top: 20px; right: 20px; font-size: 2rem; background: none; border: none; color: var(--text-secondary); cursor: pointer; transition: color var(--transition-fast);" onmouseover="this.style.color='#ffffff'" onmouseout="this.style.color='var(--text-secondary)'" onclick="window.closeDepositMetricsModal()">&times;</button>
                
                <div style="margin-top: 10px;">
                    <div style="font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; color: var(--copper-primary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">
                        Mocoa Deposit Resource
                    </div>
                    <h2 style="font-size: 2rem; line-height: 1.3; color: white; font-weight: 800; margin-bottom: 25px; letter-spacing: -0.01em;">
                        Mineral Resource Estimate
                    </h2>
                    
                    <div style="height: 1px; background: rgba(255, 255, 255, 0.1); margin-bottom: 30px;"></div>
                    
                    <!-- Metrics Grid -->
                    <div class="modal-metrics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 20px; margin-bottom: 35px;">
                        
                        <!-- Metric 1: Tonnes -->
                        <div class="metric-block" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); padding: 25px 20px; border-radius: var(--radius-card); transition: all 0.3s; cursor: default;">
                            <div style="font-size: 2.8rem; font-weight: 800; color: white; line-height: 1.1; margin-bottom: 12px; font-family: var(--font-sans); letter-spacing: -0.02em;">
                                1.12B
                            </div>
                            <div style="font-size: 0.75rem; font-family: 'JetBrains Mono', monospace; line-height: 1.4;">
                                <span style="color: var(--copper-primary); font-weight: 700; text-transform: uppercase; display: block; letter-spacing: 0.05em;">TONNES</span>
                                <span style="color: var(--text-secondary); text-transform: none; display: block; font-weight: 400; margin-top: 2px; letter-spacing: 0;">Inferred Resource</span>
                            </div>
                        </div>
                        
                        <!-- Metric 2: Lbs CuEq -->
                        <div class="metric-block" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); padding: 25px 20px; border-radius: var(--radius-card); transition: all 0.3s; cursor: default;">
                            <div style="font-size: 2.8rem; font-weight: 800; color: white; line-height: 1.1; margin-bottom: 12px; font-family: var(--font-sans); letter-spacing: -0.02em;">
                                12.7B
                            </div>
                            <div style="font-size: 0.75rem; font-family: 'JetBrains Mono', monospace; line-height: 1.4;">
                                <span style="color: var(--copper-primary); font-weight: 700; text-transform: uppercase; display: block; letter-spacing: 0.05em;">LBS CuEq</span>
                                <span style="visibility: hidden; display: block; margin-top: 2px;">&nbsp;</span>
                            </div>
                        </div>
                        
                        <!-- Metric 3: Grade -->
                        <div class="metric-block" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); padding: 25px 20px; border-radius: var(--radius-card); transition: all 0.3s; cursor: default;">
                            <div style="font-size: 2.8rem; font-weight: 800; color: white; line-height: 1.1; margin-bottom: 12px; font-family: var(--font-sans); letter-spacing: -0.02em;">
                                0.51%
                            </div>
                            <div style="font-size: 0.75rem; font-family: 'JetBrains Mono', monospace; line-height: 1.4;">
                                <span style="color: var(--copper-primary); font-weight: 700; text-transform: uppercase; display: block; letter-spacing: 0.05em;">CuEq</span>
                                <span style="visibility: hidden; display: block; margin-top: 2px;">&nbsp;</span>
                            </div>
                        </div>
                        
                    </div>
                    
                    <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.6; max-width: 580px; margin: 0 auto 20px auto; text-align: center;">
                        Note: The Mocoa copper-molybdenum porphyry deposit is one of the largest undeveloped copper resources in the Americas. Resources are reported in accordance with National Instrument 43-101 standards at a cut-off grade of 0.25% CuEq.
                    </p>
                </div>
                
                <div style="display: flex; gap: 16px; margin-top: 25px; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 25px; justify-content: center;">
                    <a href="mocoa.html#mineral-resource" class="btn-rect btn-rect-primary" style="padding: 12px 28px; font-size: 0.8rem; text-decoration: none;" onclick="window.closeDepositMetricsModal()">MORE DETAILS</a>
                    <button class="btn-rect" style="background: transparent; border: 1px solid rgba(255, 255, 255, 0.2); color: white; padding: 12px 28px; font-size: 0.8rem; cursor: pointer; transition: all 0.3s;" onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background='transparent'" onclick="window.closeDepositMetricsModal()">CLOSE</button>
                </div>
            </div>
        `;
        
        modal.onclick = function(e) {
            if (e.target === modal) {
                window.closeDepositMetricsModal();
            }
        };

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                window.closeDepositMetricsModal();
            }
        });

        // Add CSS style block dynamically for block hover effects inside modal
        if (!document.getElementById('modal-metrics-style')) {
            const style = document.createElement('style');
            style.id = 'modal-metrics-style';
            style.innerHTML = `
                .metric-block:hover {
                    border-color: var(--copper-primary) !important;
                    background: rgba(255, 85, 34, 0.05) !important;
                    box-shadow: 0 10px 30px rgba(255, 85, 34, 0.1);
                    transform: translateY(-2px);
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(modal);
    }

    window.openDepositMetricsModal = function() {
        injectDepositMetricsModal();
        const modal = document.getElementById('deposit-metrics-modal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    };

    window.closeDepositMetricsModal = function() {
        const modal = document.getElementById('deposit-metrics-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    // Coreshack Carousel Modal Implementation
    // ---------------------------------------------------------
    const coreshackCollection = [
        {
            src: "assets/coreshack/copper-giant-the-coreshack-1.webp",
            caption: "Hydrothermal breccia containing high-density chalcopyrite-pyrite stockwork matrix.",
            categories: ["all", "breccia"]
        },
        {
            src: "assets/coreshack/copper-giant-the-coreshack-2.webp",
            caption: "Dacite porphyry with significant disseminated chalcopyrite and secondary bornite.",
            categories: ["all", "copper"]
        },
        {
            src: "assets/coreshack/copper-giant-the-coreshack-3.webp",
            caption: "Porphyritic dacite showing quartz-molybdenite stockwork and potassic alteration.",
            categories: ["all", "moly"]
        },
        {
            src: "assets/coreshack/copper-giant-the-coreshack-4.webp",
            caption: "Intense molybdenite paint on shear planes with associated pyrite.",
            categories: ["all", "moly"]
        },
        {
            src: "assets/coreshack/copper-giant-the-coreshack-5.webp",
            caption: "Stunning bornite-chalcopyrite replacement in hydrothermal breccia (Best of the Best).",
            categories: ["all", "best", "copper", "breccia"]
        },
        {
            src: "assets/coreshack/copper-giant-the-coreshack-6.webp",
            caption: "Intense chalcopyrite dissemination in silicified dacite porphyry.",
            categories: ["all", "copper"]
        },
        {
            src: "assets/coreshack/copper-giant-the-coreshack-7.webp",
            caption: "Multi-directional stockwork of quartz-chalcopyrite veinlets in potassic alteration.",
            categories: ["all", "breccia"]
        },
        {
            src: "assets/coreshack/copper-giant-the-coreshack-8.webp",
            caption: "Stellar chalcopyrite veinlets cutting potassic alteration zone (Best of the Best).",
            categories: ["all", "best", "copper"]
        },
        {
            src: "assets/coreshack/copper-giant-the-coreshack-9.webp",
            caption: "Quartz-molybdenite-chalcopyrite vein showing classical symmetrical bands.",
            categories: ["all", "moly"]
        },
        {
            src: "assets/coreshack/copper-giant-the-coreshack-10.webp",
            caption: "High-grade molybdenite stockwork in silica-rich core section (Best of the Best).",
            categories: ["all", "best", "moly"]
        },
        {
            src: "assets/coreshack/copper-giant-the-coreshack-11.webp",
            caption: "Hydrothermal breccia with mineralized copper sulfide matrix.",
            categories: ["all", "breccia"]
        },
        {
            src: "assets/coreshack/copper-giant-the-coreshack-12.webp",
            caption: "Fine-grained disseminated bornite and chalcopyrite in dacite porphyry.",
            categories: ["all", "copper"]
        },
        {
            src: "assets/coreshack/copper-giant-the-coreshack-13.webp",
            caption: "Thick quartz-molybdenite vein with sericitic alteration halo.",
            categories: ["all", "moly"]
        },
        {
            src: "assets/coreshack/copper-giant-the-coreshack-14.webp",
            caption: "Dacite porphyry showing strong sericitic alteration with pyrite-chalcopyrite.",
            categories: ["all", "breccia"]
        },
        {
            src: "assets/coreshack/copper-giant-the-coreshack-15.webp",
            caption: "Hydrothermal breccia with massive chalcopyrite aggregates (Best of the Best).",
            categories: ["all", "best", "copper", "breccia"]
        },
        {
            src: "assets/coreshack/copper-giant-the-coreshack-16.webp",
            caption: "Stunning quartz-molybdenite veins showing excellent sulfide density (Best of the Best).",
            categories: ["all", "best", "moly"]
        },
        {
            src: "assets/coreshack/copper-giant-the-coreshack-17.webp",
            caption: "Chalcopyrite-bornite mineralization in core showing strong potassic alteration.",
            categories: ["all", "copper"]
        },
        {
            src: "assets/coreshack/copper-giant-the-coreshack-18.webp",
            caption: "Quartz-chalcopyrite stockwork cutting potassic altered dacite porphyry.",
            categories: ["all", "breccia"]
        },
        {
            src: "assets/coreshack/copper-giant-the-coreshack-19.webp",
            caption: "Molybdenite and minor chalcopyrite inside thick quartz veins.",
            categories: ["all", "moly"]
        },
        {
            src: "assets/coreshack/copper-giant-the-coreshack-20.webp",
            caption: "Hydrothermal breccia with quartz-sericite-pyrite-chalcopyrite matrix.",
            categories: ["all", "breccia"]
        },
        {
            src: "assets/coreshack/copper-giant-the-coreshack-21.webp",
            caption: "Outstanding high-grade bornite-chalcopyrite core box from target drill hole (Best of the Best).",
            categories: ["all", "best", "copper"]
        }
    ];

    let currentFilter = 'all';
    let currentCoreshackImages = [...coreshackCollection];
    let coreshackActiveIndex = 0;

    function injectCoreshackCarouselModal() {
        if (document.getElementById('coreshack-carousel-modal')) return;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'coreshack-carousel-modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 950px; width: 95%; padding: 35px 30px; border-bottom: 3px solid var(--copper-primary); position: relative; background: #0c0c0c;">
                <button class="modal-close" style="position: absolute; top: 15px; right: 15px; font-size: 2rem; background: none; border: none; color: var(--text-secondary); cursor: pointer; transition: color var(--transition-fast); z-index: 10;" onmouseover="this.style.color='#ffffff'" onmouseout="this.style.color='var(--text-secondary)'" onclick="window.closeCoreshackCarouselModal()">&times;</button>
                
                <div style="text-align: center; margin-bottom: 15px;">
                    <div style="font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; color: var(--copper-primary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 5px;">
                        Mocoa Project
                    </div>
                    <h2 style="font-size: 1.8rem; line-height: 1.2; color: white; font-weight: 800; margin: 0; letter-spacing: -0.01em;">
                        The Coreshack Gallery
                    </h2>
                </div>
                
                <!-- Filters Bar -->
                <div class="coreshack-filters" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-bottom: 18px; width: 100%;">
                    <button class="coreshack-filter-btn active" data-filter="all" onclick="window.coreshackFilter('all')">All</button>
                    <button class="coreshack-filter-btn" data-filter="best" onclick="window.coreshackFilter('best')">Best of the Best ⭐</button>
                    <button class="coreshack-filter-btn" data-filter="copper" onclick="window.coreshackFilter('copper')">High-Grade Copper</button>
                    <button class="coreshack-filter-btn" data-filter="moly" onclick="window.coreshackFilter('moly')">Molybdenite & Veins</button>
                    <button class="coreshack-filter-btn" data-filter="breccia" onclick="window.coreshackFilter('breccia')">Breccia & Stockworks</button>
                </div>

                <!-- Caption Bar (Top of Image) -->
                <div id="coreshack-caption-bar" style="background: #f5f5f5; border-left: 4px solid var(--copper-primary); padding: 12px 18px; margin-bottom: 18px; color: #111111; font-family: var(--font-primary); font-size: 0.95rem; font-weight: 500; text-align: left; line-height: 1.4; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                    Select a core photo to inspect geological details.
                </div>
                
                <!-- Main Carousel Container -->
                <div class="coreshack-carousel-container" style="position: relative; width: 100%; aspect-ratio: 16/9; background: #000; border-radius: var(--radius-card); overflow: hidden; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 0 50px rgba(0,0,0,0.8);">
                    <!-- Active Slide -->
                    <img id="coreshack-active-img" src="${currentCoreshackImages[0].src}" alt="The Coreshack" style="max-width: 100%; max-height: 100%; object-fit: contain; transition: opacity 0.3s ease;">
                    
                    <!-- Controls -->
                    <button class="carousel-nav-btn prev" onclick="event.stopPropagation(); window.coreshackPrevSlide()" style="position: absolute; left: 15px; background: rgba(0,0,0,0.65); border: 1px solid rgba(255,255,255,0.15); width: 45px; height: 45px; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s; z-index: 20; pointer-events: auto;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                    <button class="carousel-nav-btn next" onclick="event.stopPropagation(); window.coreshackNextSlide()" style="position: absolute; right: 15px; background: rgba(0,0,0,0.65); border: 1px solid rgba(255,255,255,0.15); width: 45px; height: 45px; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.3s; z-index: 20; pointer-events: auto;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                </div>
                
                <!-- Thumbnails strip -->
                <div class="coreshack-thumbnails-wrapper" style="margin-top: 15px; overflow-x: auto; display: flex; gap: 10px; padding: 5px 0 10px 0; scroll-behavior: smooth; -webkit-overflow-scrolling: touch;">
                    ${currentCoreshackImages.map((item, i) => `
                        <div class="coreshack-thumb ${i === 0 ? 'active' : ''}" data-index="${i}" onclick="window.coreshackSetSlide(${i})">
                            <img src="${item.src}" alt="Thumb ${i + 1}" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        modal.onclick = function(e) {
            if (e.target === modal) {
                window.closeCoreshackCarouselModal();
            }
        };

        // Close on Escape key or Nav with arrow keys
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

        // Add CSS style block dynamically for scrollbars and thumbnails
        if (!document.getElementById('modal-coreshack-style')) {
            const style = document.createElement('style');
            style.id = 'modal-coreshack-style';
            style.innerHTML = `
                .coreshack-thumbnails-wrapper::-webkit-scrollbar {
                    height: 6px;
                }
                .coreshack-thumbnails-wrapper::-webkit-scrollbar-track {
                    background: rgba(255,255,255,0.02);
                    border-radius: 3px;
                }
                .coreshack-thumbnails-wrapper::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.15);
                    border-radius: 3px;
                    transition: background 0.3s;
                }
                .coreshack-thumbnails-wrapper::-webkit-scrollbar-thumb:hover {
                    background: var(--copper-primary);
                }
                .coreshack-thumb {
                    width: 90px;
                    height: 52px;
                    flex-shrink: 0;
                    border-radius: 4px;
                    border: 2px solid transparent;
                    cursor: pointer;
                    overflow: hidden;
                    opacity: 0.4;
                    transition: all 0.25s ease;
                }
                .coreshack-thumb:hover {
                    opacity: 0.8;
                }
                .coreshack-thumb.active {
                    opacity: 1;
                    border-color: var(--copper-primary);
                    transform: scale(1.03);
                }
                .carousel-nav-btn {
                    opacity: 0.6;
                }
                .carousel-nav-btn:hover {
                    opacity: 1;
                    background: var(--copper-primary) !important;
                    border-color: var(--copper-primary) !important;
                    transform: scale(1.08);
                }
                .coreshack-filter-btn {
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 20px;
                    color: var(--text-secondary);
                    padding: 6px 16px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.25s ease;
                    font-family: var(--font-primary);
                }
                .coreshack-filter-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    border-color: rgba(255, 255, 255, 0.2);
                }
                .coreshack-filter-btn.active {
                    background: var(--copper-primary);
                    color: white;
                    border-color: var(--copper-primary);
                    box-shadow: 0 4px 12px rgba(255, 85, 34, 0.25);
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(modal);
    }

    window.openCoreshackCarouselModal = function() {
        injectCoreshackCarouselModal();
        const modal = document.getElementById('coreshack-carousel-modal');
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            window.coreshackFilter('all');
        }
    };

    window.closeCoreshackCarouselModal = function() {
        const modal = document.getElementById('coreshack-carousel-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };

    window.coreshackFilter = function(category) {
        currentFilter = category;
        currentCoreshackImages = coreshackCollection.filter(item => item.categories.includes(category));
        
        // Update filter buttons UI
        const filterBtns = document.querySelectorAll('.coreshack-filter-btn');
        filterBtns.forEach(btn => {
            if (btn.getAttribute('data-filter') === category) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Re-inject thumbnails
        const thumbsWrapper = document.querySelector('.coreshack-thumbnails-wrapper');
        if (thumbsWrapper) {
            thumbsWrapper.innerHTML = currentCoreshackImages.map((item, i) => `
                <div class="coreshack-thumb ${i === 0 ? 'active' : ''}" data-index="${i}" onclick="window.coreshackSetSlide(${i})">
                    <img src="${item.src}" alt="Thumb ${i + 1}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
            `).join('');
        }
        
        // Reset to first slide in filtered set
        window.coreshackSetSlide(0);
    };

    window.coreshackSetSlide = function(index) {
        if (currentCoreshackImages.length === 0) return;
        coreshackActiveIndex = index;
        const img = document.getElementById('coreshack-active-img');
        const caption = document.getElementById('coreshack-caption-bar');
        
        if (img) {
            img.style.opacity = '0.3';
            setTimeout(() => {
                img.src = currentCoreshackImages[index].src;
                img.style.opacity = '1';
            }, 150);
        }
        if (caption) {
            const currentItem = currentCoreshackImages[index];
            const originalIndex = coreshackCollection.indexOf(currentItem) + 1;
            caption.innerHTML = `<strong>Core Box #${originalIndex}</strong>: ${currentItem.caption} <span style="float: right; font-size: 0.8rem; color: #555555; font-family: monospace;">(${index + 1} of ${currentCoreshackImages.length} in view)</span>`;
        }
        
        // Update thumbnails
        const thumbs = document.querySelectorAll('.coreshack-thumb');
        thumbs.forEach((thumb, idx) => {
            if (idx === index) {
                thumb.classList.add('active');
                // Scroll thumbnail into view
                thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            } else {
                thumb.classList.remove('active');
            }
        });
    };

    window.coreshackNextSlide = function() {
        if (currentCoreshackImages.length === 0) return;
        const nextIndex = (coreshackActiveIndex + 1) % currentCoreshackImages.length;
        window.coreshackSetSlide(nextIndex);
    };

    window.coreshackPrevSlide = function() {
        if (currentCoreshackImages.length === 0) return;
        const prevIndex = (coreshackActiveIndex - 1 + currentCoreshackImages.length) % currentCoreshackImages.length;
        window.coreshackSetSlide(prevIndex);
    };

    // Auto-open modal if hash matches #coreshack
    if (window.location.hash === '#coreshack') {
        setTimeout(() => {
            window.openCoreshackCarouselModal();
        }, 500);
    }

    initPresentationModal();
});
