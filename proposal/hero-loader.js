/**
 * Hero Loader — loads hero sections dynamically from site.json
 * Detects current page by URL pathname and renders the matching hero.
 * Leaves the HTML <section class="hero-video-section"> empty; this fills it.
 */
(async function() {
    // Determine current page from URL
    const path = window.location.pathname;
    const pageMap = {
        'index.html': 'home',
        '/': 'home',
        'corporate.html': 'corporate',
        'mocoa.html': 'mocoa',
        'news.html': 'news',
        'investors.html': 'investors'
    };
    const pageName = Object.keys(pageMap).find(k => path.endsWith(k))
        ? pageMap[Object.keys(pageMap).find(k => path.endsWith(k))]
        : 'home';

    try {
        const res = await fetch('data/site.json');
        const data = await res.json();

        // Look for the hero matching this page
        const hero = (data.heroes || []).find(h => h.page === pageName);
        if (!hero) return;

        const section = document.querySelector('.hero-video-section');
        if (!section) return;

        // Clear existing content
        section.innerHTML = '';

        // Build the wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'hero-video-wrapper';

        // Apply custom aspect-ratio if set
        if (hero.ratio) {
            wrapper.style.aspectRatio = hero.ratio;
        }

        if (hero.type === 'video') {
            // Video element
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
            // Image element
            const img = document.createElement('img');
            img.src = hero.media;
            img.alt = hero.alt || '';
            img.className = 'hero-video-bg' + (hero.type === 'image' ? ' ken-burns' : '');
            wrapper.appendChild(img);
        }

        // Overlay and text
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

    } catch (e) {
        console.warn('Hero loader: could not load site.json');
    }
})();
